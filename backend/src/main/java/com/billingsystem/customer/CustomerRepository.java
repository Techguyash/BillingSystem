package com.billingsystem.customer;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {
  List<Customer> findByBusinessIdOrderByCreatedAtDesc(UUID businessId);

  List<Customer>
      findByBusinessIdAndNameContainingIgnoreCaseOrBusinessIdAndPhoneContainingIgnoreCase(
          UUID businessId1, String name, UUID businessId2, String phone);

  Optional<Customer> findByBusinessIdAndId(UUID businessId, UUID id);
}
