package com.billingsystem.product;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, UUID> {
  List<Product> findByBusinessIdOrderByCreatedAtDesc(UUID businessId);

  @Query(
      "select p from Product p where p.businessId = :businessId and ("
          + "lower(p.name) like lower(concat('%', :search, '%')) or "
          + "lower(p.sku) like lower(concat('%', :search, '%')) or "
          + "lower(p.barcode) like lower(concat('%', :search, '%')))")
  List<Product> search(@Param("businessId") UUID businessId, @Param("search") String search);

  Optional<Product> findByBusinessIdAndId(UUID businessId, UUID id);

  long countByBusinessIdAndIsActiveTrue(UUID businessId);

  List<Product> findByBusinessIdAndIsActiveTrue(UUID businessId);
}
