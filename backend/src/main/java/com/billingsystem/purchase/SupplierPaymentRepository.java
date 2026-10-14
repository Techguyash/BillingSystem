package com.billingsystem.purchase;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupplierPaymentRepository extends JpaRepository<SupplierPayment, UUID> {
  List<SupplierPayment> findByBusinessIdAndSupplierIdOrderByCreatedAtAsc(UUID businessId, UUID supplierId);
}
