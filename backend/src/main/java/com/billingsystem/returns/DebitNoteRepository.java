package com.billingsystem.returns;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DebitNoteRepository extends JpaRepository<DebitNote, UUID> {
  List<DebitNote> findByBusinessIdOrderByCreatedAtDesc(UUID businessId);

  List<DebitNote> findByBusinessIdAndPurchaseOrderId(UUID businessId, UUID purchaseOrderId);

  List<DebitNote> findByBusinessIdAndSupplierIdOrderByCreatedAtAsc(UUID businessId, UUID supplierId);

  Optional<DebitNote> findByBusinessIdAndId(UUID businessId, UUID id);

  long countByBusinessId(UUID businessId);
}
