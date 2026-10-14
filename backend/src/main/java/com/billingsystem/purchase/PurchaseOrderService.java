package com.billingsystem.purchase;

import com.billingsystem.product.Product;
import com.billingsystem.product.ProductRepository;
import com.billingsystem.purchase.dto.CreatePurchaseItemRequest;
import com.billingsystem.purchase.dto.CreatePurchaseOrderRequest;
import com.billingsystem.purchase.dto.RecordSupplierPaymentRequest;
import com.billingsystem.returns.DebitNote;
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
  private static final BigDecimal PAID_EPSILON = new BigDecimal("0.01");

  private final PurchaseOrderRepository purchaseOrderRepository;
  private final ProductRepository productRepository;
  private final SupplierRepository supplierRepository;
  private final SupplierPaymentRepository supplierPaymentRepository;

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
      if (product.isComposite()) {
        throw new IllegalArgumentException(
            "\"" + product.getName() + "\" is a bundle — purchase its individual components instead");
      }

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

  @Transactional
  public PurchaseOrder recordPayment(
      UUID businessId, UUID purchaseOrderId, UUID userId, RecordSupplierPaymentRequest dto) {
    PurchaseOrder purchase = findOne(businessId, purchaseOrderId);
    if (purchase.getSupplierId() == null) {
      throw new IllegalArgumentException("This purchase has no supplier to pay");
    }

    BigDecimal alreadyPaid =
        purchase.getPayments().stream()
            .map(SupplierPayment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal balanceDue = getEffectiveAmountOwed(purchase).subtract(alreadyPaid);

    if (dto.getAmount().compareTo(balanceDue.add(PAID_EPSILON)) > 0) {
      throw new IllegalArgumentException(
          "Payment of "
              + dto.getAmount()
              + " exceeds the remaining balance of "
              + balanceDue.setScale(2, RoundingMode.HALF_UP));
    }

    SupplierPayment payment = new SupplierPayment();
    payment.setBusinessId(businessId);
    payment.setPurchaseOrderId(purchaseOrderId);
    payment.setSupplierId(purchase.getSupplierId());
    payment.setAmount(dto.getAmount());
    payment.setMethod(dto.getMethod());
    payment.setPaidByUserId(userId);
    payment.setNotes(dto.getNotes());
    supplierPaymentRepository.save(payment);
    purchase.getPayments().add(payment);

    return purchase;
  }

  /** What's actually owed to the supplier net of returns — total minus every debit note issued against this purchase. */
  private BigDecimal getEffectiveAmountOwed(PurchaseOrder purchase) {
    BigDecimal returned =
        purchase.getDebitNotes().stream().map(DebitNote::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    return purchase.getTotalAmount().subtract(returned).max(BigDecimal.ZERO);
  }
}
