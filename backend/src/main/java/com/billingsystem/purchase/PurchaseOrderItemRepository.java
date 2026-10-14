package com.billingsystem.purchase;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PurchaseOrderItemRepository extends JpaRepository<PurchaseOrderItem, UUID> {

  // JOIN FETCH so the purchase order + its supplier are loaded in the same
  // query — avoids a LazyInitializationException when the caller reads
  // `item.getPurchaseOrder()` outside of a transaction (e.g. a plain
  // read-only service method).
  @Query(
      "SELECT i FROM PurchaseOrderItem i "
          + "JOIN FETCH i.purchaseOrder po "
          + "LEFT JOIN FETCH po.supplier "
          + "WHERE i.productId = :productId AND po.businessId = :businessId "
          + "ORDER BY po.createdAt DESC")
  List<PurchaseOrderItem> findByProductIdWithPurchaseOrder(
      @Param("businessId") UUID businessId, @Param("productId") UUID productId);
}
