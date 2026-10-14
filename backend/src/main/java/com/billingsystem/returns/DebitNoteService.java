package com.billingsystem.returns;

import com.billingsystem.product.Product;
import com.billingsystem.product.ProductRepository;
import com.billingsystem.purchase.PurchaseOrder;
import com.billingsystem.purchase.PurchaseOrderItem;
import com.billingsystem.purchase.PurchaseOrderRepository;
import com.billingsystem.returns.dto.CreateDebitNoteRequest;
import com.billingsystem.returns.dto.DebitNoteItemRequest;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DebitNoteService {

  private static final BigDecimal HUNDRED = new BigDecimal("100");

  private final DebitNoteRepository debitNoteRepository;
  private final PurchaseOrderRepository purchaseOrderRepository;
  private final ProductRepository productRepository;

  public List<DebitNote> findAll(UUID businessId) {
    return debitNoteRepository.findByBusinessIdOrderByCreatedAtDesc(businessId);
  }

  public List<DebitNote> findByPurchaseOrder(UUID businessId, UUID purchaseOrderId) {
    return debitNoteRepository.findByBusinessIdAndPurchaseOrderId(businessId, purchaseOrderId);
  }

  public DebitNote findOne(UUID businessId, UUID id) {
    return debitNoteRepository
        .findByBusinessIdAndId(businessId, id)
        .orElseThrow(EntityNotFoundException::new);
  }

  @Transactional
  public DebitNote create(UUID businessId, UUID userId, CreateDebitNoteRequest dto) {
    PurchaseOrder purchaseOrder =
        purchaseOrderRepository
            .findByBusinessIdAndId(businessId, dto.getPurchaseOrderId())
            .orElseThrow(() -> new IllegalArgumentException("Purchase order not found"));

    Map<UUID, PurchaseOrderItem> itemsById =
        purchaseOrder.getItems().stream().collect(Collectors.toMap(PurchaseOrderItem::getId, i -> i));

    Map<UUID, BigDecimal> alreadyReturned =
        debitNoteRepository.findByBusinessIdAndPurchaseOrderId(businessId, purchaseOrder.getId()).stream()
            .flatMap(dn -> dn.getItems().stream())
            .collect(
                Collectors.groupingBy(
                    DebitNoteItem::getPurchaseOrderItemId,
                    Collectors.reducing(BigDecimal.ZERO, DebitNoteItem::getQuantity, BigDecimal::add)));

    DebitNote debitNote = new DebitNote();
    debitNote.setBusinessId(businessId);
    debitNote.setPurchaseOrderId(purchaseOrder.getId());
    debitNote.setSupplierId(purchaseOrder.getSupplierId());
    debitNote.setCreatedByUserId(userId);
    debitNote.setReason(dto.getReason());

    BigDecimal subtotal = BigDecimal.ZERO;
    BigDecimal taxTotal = BigDecimal.ZERO;

    for (DebitNoteItemRequest line : dto.getItems()) {
      PurchaseOrderItem purchaseItem = itemsById.get(line.getPurchaseOrderItemId());
      if (purchaseItem == null) {
        throw new IllegalArgumentException(
            "Purchase order line " + line.getPurchaseOrderItemId() + " not found");
      }

      BigDecimal returned = alreadyReturned.getOrDefault(purchaseItem.getId(), BigDecimal.ZERO);
      BigDecimal remaining = purchaseItem.getQuantity().subtract(returned);
      if (line.getQuantity().compareTo(remaining) > 0) {
        throw new IllegalArgumentException(
            "Cannot return "
                + line.getQuantity()
                + " of \""
                + purchaseItem.getProductName()
                + "\" — only "
                + remaining
                + " left to return");
      }

      Product product = productRepository.findById(purchaseItem.getProductId()).orElseThrow();
      if (product.getStockQty().compareTo(line.getQuantity()) < 0) {
        throw new IllegalArgumentException(
            "Cannot return "
                + line.getQuantity()
                + " of \""
                + purchaseItem.getProductName()
                + "\" — only "
                + product.getStockQty()
                + " currently in stock (some may have already been sold)");
      }

      BigDecimal lineSubtotal = purchaseItem.getUnitCost().multiply(line.getQuantity());
      BigDecimal lineTax =
          lineSubtotal.multiply(purchaseItem.getTaxRatePercent()).divide(HUNDRED, 2, RoundingMode.HALF_UP);
      BigDecimal lineTotal = lineSubtotal.add(lineTax);

      subtotal = subtotal.add(lineSubtotal);
      taxTotal = taxTotal.add(lineTax);

      DebitNoteItem item = new DebitNoteItem();
      item.setDebitNote(debitNote);
      item.setPurchaseOrderItemId(purchaseItem.getId());
      item.setProductId(purchaseItem.getProductId());
      item.setProductName(purchaseItem.getProductName());
      item.setQuantity(line.getQuantity());
      item.setUnitCost(purchaseItem.getUnitCost());
      item.setTaxRatePercent(purchaseItem.getTaxRatePercent());
      item.setLineTotal(lineTotal);
      debitNote.getItems().add(item);

      product.setStockQty(product.getStockQty().subtract(line.getQuantity()));
      productRepository.save(product);
    }

    long count = debitNoteRepository.countByBusinessId(businessId);
    debitNote.setDebitNoteNumber("DN-" + String.format("%04d", count + 1));
    debitNote.setSubtotal(subtotal);
    debitNote.setTaxTotal(taxTotal);
    debitNote.setTotalAmount(subtotal.add(taxTotal));

    return debitNoteRepository.save(debitNote);
  }
}
