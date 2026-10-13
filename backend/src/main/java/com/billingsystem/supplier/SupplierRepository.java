package com.billingsystem.supplier;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierRepository extends JpaRepository<Supplier, UUID> {
  List<Supplier> findByBusinessIdOrderByCreatedAtDesc(UUID businessId);

  List<Supplier>
      findByBusinessIdAndNameContainingIgnoreCaseOrBusinessIdAndPhoneContainingIgnoreCase(
          UUID businessId1, String name, UUID businessId2, String phone);

  Optional<Supplier> findByBusinessIdAndId(UUID businessId, UUID id);
}
