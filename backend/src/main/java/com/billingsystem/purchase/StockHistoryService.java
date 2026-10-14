package com.billingsystem.purchase;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Powers the "stock refill history" timeline on a product's detail view —
 * merges every purchase (stock in, with supplier + cost at the time) and
 * every manual stock adjustment for that product into one chronological
 * feed.
 */
@Service
@RequiredArgsConstructor
public class StockHistoryService {

  private final PurchaseOrderItemRepository purchaseOrderItemRepository;
  private final StockAdjustmentRepository stockAdjustmentRepository;

  public List<StockHistoryEntry> getHistory(UUID businessId, UUID productId) {
    List<StockHistoryEntry> entries = new ArrayList<>();

    for (PurchaseOrderItem item : purchaseOrderItemRepository.findByProductIdWithPurchaseOrder(businessId, productId)) {
      PurchaseOrder po = item.getPurchaseOrder();
      entries.add(
          new StockHistoryEntry(
              po.getCreatedAt(),
              "purchase",
              item.getQuantity(),
              item.getUnitCost(),
              po.getSupplier() != null ? po.getSupplier().getName() : null,
              null,
              po.getPurchaseNumber()));
    }

    for (StockAdjustment adj :
        stockAdjustmentRepository.findByBusinessIdAndProductIdOrderByCreatedAtDesc(businessId, productId)) {
      entries.add(
          new StockHistoryEntry(
              adj.getCreatedAt(), "adjustment", adj.getQuantityDelta(), null, null, adj.getReason(), null));
    }

    return entries.stream().sorted(Comparator.comparing(StockHistoryEntry::date).reversed()).toList();
  }

  public record StockHistoryEntry(
      Instant date,
      String type,
      BigDecimal quantityDelta,
      BigDecimal unitCost,
      String supplierName,
      String reason,
      String reference) {}
}
