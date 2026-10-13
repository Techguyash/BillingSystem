package com.billingsystem.purchase;

import com.billingsystem.product.Product;
import com.billingsystem.product.ProductRepository;
import com.billingsystem.purchase.dto.CreatePurchaseItemRequest;
import com.billingsystem.purchase.dto.CreatePurchaseOrderRequest;
import com.billingsystem.supplier.SupplierRepository;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

  private static final BigDecimal HUNDRED = new BigDecimal("100");

  private final PurchaseOrderRepository purchaseOrderRepository;
  private final ProductRepository productRepository;
  private final SupplierRepository supplierRepository;

  public List<PurchaseOrder> findAll(UUID businessId) {
    return purchaseOrderRepository.findTop100ByBusinessIdOrderByCreatedAtDesc(businessId);
  }

  public PurchaseOrder findOne(UUID businessId, UUID id) {
    return purchaseOrderRepository
        .findByBusinessIdAndId(businessId, id)
        .orElseThrow(EntityNotFoundException::new);
  }

  @Transactional
  public PurchaseOrder create(UUID businessId, UUID userId, CreatePurchaseOrderRequest dto) {
    if (dto.getSupplierId() != null) {
      supplierRepository
          .findById(dto.getSupplierId())
          .filter(s -> s.getBusinessId().equals(businessId))
          .orElseThrow(() -> new IllegalArgumentException("Invalid supplier"));
    }

    PurchaseOrder purchase = new PurchaseOrder();
    purchase.setBusinessId(businessId);
    purchase.setSupplierId(dto.getSupplierId());
    purchase.setCreatedByUserId(userId);
    purchase.setSupplierInvoiceNumber(dto.getSupplierInvoiceNumber());
    purchase.setNotes(dto.getNotes());

    BigDecimal subtotal = BigDecimal.ZERO;
    BigDecimal taxTotal = BigDecimal.ZERO;

    for (CreatePurchaseItemRequest line : dto.getItems()) {
      Product product =
          productRepository
              .findById(line.getProductId())
              .filter(p -> p.getBusinessId().equals(businessId))
              .orElseThrow(
                  () ->
                      new IllegalArgumentException(
                          "Product " + line.getProductId() + " not found"));

      BigDecimal taxRatePercent =
          line.getTaxRatePercent() != null ? line.getTaxRatePercent() : product.getTaxRatePercent();
      BigDecimal lineSubtotal = line.getUnitCost().multiply(line.getQuantity());
      BigDecimal lineTax =
          lineSubtotal.multiply(taxRatePercent).divide(HUNDRED, 2, RoundingMode.HALF_UP);
      BigDecimal lineTotal = lineSubtotal.add(lineTax);

      subtotal = subtotal.add(lineSubtotal);
      taxTotal = taxTotal.add(lineTax);

      PurchaseOrderItem item = new PurchaseOrderItem();
      item.setPurchaseOrder(purchase);
      item.setProductId(product.getId());
      item.setProductName(product.getName());
      item.setQuantity(line.getQuantity());
      item.setUnitCost(line.getUnitCost());
      item.setTaxRatePercent(taxRatePercent);
      item.setLineTotal(lineTotal);
      purchase.getItems().add(item);

      // Receiving stock: increase quantity and refresh cost price to the
      // latest purchase cost (simple weighted-nothing approach — good
      // enough for a single-location install; revisit with proper moving
      // average costing if/when multi-branch purchasing lands).
      product.setStockQty(product.getStockQty().add(line.getQuantity()));
      product.setCostPrice(line.getUnitCost());
      productRepository.save(product);
    }

    long count = purchaseOrderRepository.countByBusinessId(businessId);
    purchase.setPurchaseNumber("PO-" + String.format("%04d", count + 1));
    purchase.setSubtotal(subtotal);
    purchase.setTaxTotal(taxTotal);
    purchase.setTotalAmount(subtotal.add(taxTotal));

    return purchaseOrderRepository.save(purchase);
  }
}
