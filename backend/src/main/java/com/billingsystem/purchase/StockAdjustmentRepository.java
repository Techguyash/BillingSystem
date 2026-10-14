package com.billingsystem.purchase;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockAdjustmentRepository extends JpaRepository<StockAdjustment, UUID> {
  List<StockAdjustment> findTop100ByBusinessIdOrderByCreatedAtDesc(UUID businessId);

  List<StockAdjustment> findByBusinessIdAndProductIdOrderByCreatedAtDesc(UUID businessId, UUID productId);
}
