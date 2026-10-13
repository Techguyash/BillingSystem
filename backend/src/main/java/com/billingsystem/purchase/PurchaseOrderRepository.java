package com.billingsystem.purchase;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {
  List<PurchaseOrder> findTop100ByBusinessIdOrderByCreatedAtDesc(UUID businessId);

  Optional<PurchaseOrder> findByBusinessIdAndId(UUID businessId, UUID id);

  long countByBusinessId(UUID businessId);
}
