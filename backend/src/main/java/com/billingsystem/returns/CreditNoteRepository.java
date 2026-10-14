package com.billingsystem.returns;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CreditNoteRepository extends JpaRepository<CreditNote, UUID> {
  List<CreditNote> findByBusinessIdOrderByCreatedAtDesc(UUID businessId);

  List<CreditNote> findByBusinessIdAndInvoiceId(UUID businessId, UUID invoiceId);

  List<CreditNote> findByBusinessIdAndCustomerIdOrderByCreatedAtAsc(UUID businessId, UUID customerId);

  Optional<CreditNote> findByBusinessIdAndId(UUID businessId, UUID id);

  long countByBusinessId(UUID businessId);
}
