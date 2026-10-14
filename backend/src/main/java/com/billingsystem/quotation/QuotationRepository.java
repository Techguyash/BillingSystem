package com.billingsystem.quotation;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuotationRepository extends JpaRepository<Quotation, UUID> {
  List<Quotation> findTop100ByBusinessIdOrderByCreatedAtDesc(UUID businessId);

  Optional<Quotation> findByBusinessIdAndId(UUID businessId, UUID id);

  long countByBusinessId(UUID businessId);
}
