package com.billingsystem.taxrate;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaxRateRepository extends JpaRepository<TaxRate, UUID> {
  List<TaxRate> findByBusinessIdOrderByPercentAsc(UUID businessId);

  Optional<TaxRate> findByBusinessIdAndId(UUID businessId, UUID id);

  long countByBusinessId(UUID businessId);
}
