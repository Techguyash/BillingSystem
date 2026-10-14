package com.billingsystem.invoice;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
  List<Invoice> findTop100ByBusinessIdOrderByCreatedAtDesc(UUID businessId);

  Optional<Invoice> findByBusinessIdAndId(UUID businessId, UUID id);

  long countByBusinessId(UUID businessId);

  List<Invoice> findByBusinessIdAndCreatedAtGreaterThanEqualAndStatusNot(
      UUID businessId, Instant startOfDay, String excludedStatus);

  List<Invoice> findByBusinessIdAndCreatedAtBetweenAndStatusNot(
      UUID businessId, Instant from, Instant to, String excludedStatus);

  List<Invoice> findTop5ByBusinessIdAndInvoiceNumberContainingIgnoreCaseOrderByCreatedAtDesc(
      UUID businessId, String invoiceNumber);

  List<Invoice> findByBusinessIdAndCustomerIdOrderByCreatedAtAsc(UUID businessId, UUID customerId);

  List<Invoice> findByBusinessIdAndStatusIn(UUID businessId, List<String> statuses);
}
