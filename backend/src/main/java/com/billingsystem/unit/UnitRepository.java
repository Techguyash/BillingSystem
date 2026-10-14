package com.billingsystem.unit;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UnitRepository extends JpaRepository<Unit, UUID> {
  List<Unit> findByBusinessIdOrderByNameAsc(UUID businessId);

  Optional<Unit> findByBusinessIdAndId(UUID businessId, UUID id);

  boolean existsByBusinessIdAndAbbreviationIgnoreCase(UUID businessId, String abbreviation);

  long countByBusinessId(UUID businessId);
}
