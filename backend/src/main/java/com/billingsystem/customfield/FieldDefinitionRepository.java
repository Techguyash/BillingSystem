package com.billingsystem.customfield;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FieldDefinitionRepository extends JpaRepository<FieldDefinition, UUID> {
  List<FieldDefinition> findByBusinessIdOrderBySortOrderAsc(UUID businessId);

  List<FieldDefinition> findByBusinessIdAndEntityTypeOrderBySortOrderAsc(
      UUID businessId, String entityType);

  Optional<FieldDefinition> findByBusinessIdAndId(UUID businessId, UUID id);

  boolean existsByBusinessIdAndEntityTypeAndFieldKey(
      UUID businessId, String entityType, String fieldKey);

  boolean existsByBusinessIdAndEntityTypeAndLabelIgnoreCase(
      UUID businessId, String entityType, String label);
}
