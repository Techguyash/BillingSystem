package com.billingsystem.customfield;

import com.billingsystem.customfield.dto.FieldDefinitionRequest;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FieldDefinitionService {

  private final FieldDefinitionRepository fieldDefinitionRepository;

  public List<FieldDefinition> findAll(UUID businessId, String entityType) {
    if (entityType == null || entityType.isBlank()) {
      return fieldDefinitionRepository.findByBusinessIdOrderBySortOrderAsc(businessId);
    }
    return fieldDefinitionRepository.findByBusinessIdAndEntityTypeOrderBySortOrderAsc(
        businessId, entityType);
  }

  public FieldDefinition create(UUID businessId, FieldDefinitionRequest dto) {
    if ("select".equals(dto.getFieldType()) && (dto.getOptions() == null || dto.getOptions().isEmpty())) {
      throw new IllegalArgumentException("Select fields need at least one option");
    }
    if (fieldDefinitionRepository.existsByBusinessIdAndEntityTypeAndFieldKey(
        businessId, dto.getEntityType(), dto.getFieldKey())) {
      throw new IllegalArgumentException(
          "A " + dto.getEntityType() + " field with key \"" + dto.getFieldKey() + "\" already exists");
    }
    // Different field keys can still collide on a human-readable label
    // (e.g. two "Size" fields created separately) — confusing in the form
    // since there'd be no way to tell them apart visually.
    if (fieldDefinitionRepository.existsByBusinessIdAndEntityTypeAndLabelIgnoreCase(
        businessId, dto.getEntityType(), dto.getLabel())) {
      throw new IllegalArgumentException(
          "A " + dto.getEntityType() + " field labeled \"" + dto.getLabel() + "\" already exists");
    }

    FieldDefinition field = new FieldDefinition();
    field.setBusinessId(businessId);
    field.setEntityType(dto.getEntityType());
    field.setFieldKey(dto.getFieldKey());
    field.setLabel(dto.getLabel());
    field.setFieldType(dto.getFieldType());
    field.setOptions(dto.getOptions());
    if (dto.getIsRequired() != null) field.setRequired(dto.getIsRequired());
    if (dto.getSortOrder() != null) field.setSortOrder(dto.getSortOrder());
    return fieldDefinitionRepository.save(field);
  }

  public FieldDefinition update(UUID businessId, UUID id, FieldDefinitionRequest dto) {
    FieldDefinition field = findOne(businessId, id);
    if (dto.getLabel() != null) field.setLabel(dto.getLabel());
    if (dto.getOptions() != null) field.setOptions(dto.getOptions());
    if (dto.getIsRequired() != null) field.setRequired(dto.getIsRequired());
    if (dto.getSortOrder() != null) field.setSortOrder(dto.getSortOrder());
    // entityType/fieldKey/fieldType are immutable after creation — changing
    // them would silently orphan existing values already stored under the
    // old key across every record of that type.
    return fieldDefinitionRepository.save(field);
  }

  public void remove(UUID businessId, UUID id) {
    FieldDefinition field = findOne(businessId, id);
    fieldDefinitionRepository.delete(field);
  }

  private FieldDefinition findOne(UUID businessId, UUID id) {
    return fieldDefinitionRepository
        .findByBusinessIdAndId(businessId, id)
        .orElseThrow(EntityNotFoundException::new);
  }
}
