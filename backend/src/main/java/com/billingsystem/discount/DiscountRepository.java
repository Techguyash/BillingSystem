package com.billingsystem.discount;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscountRepository extends JpaRepository<Discount, UUID> {
  List<Discount> findByBusinessIdOrderByCreatedAtDesc(UUID businessId);

  Optional<Discount> findByBusinessIdAndId(UUID businessId, UUID id);
}
