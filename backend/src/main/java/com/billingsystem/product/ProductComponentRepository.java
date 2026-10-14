package com.billingsystem.product;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductComponentRepository extends JpaRepository<ProductComponent, UUID> {
  List<ProductComponent> findByBundleProductId(UUID bundleProductId);
}
