package com.billingsystem.customfield;

import com.billingsystem.common.TenantBaseEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.List;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * A business-defined extra field on Product/Customer/Supplier records (e.g.
 * "Size", "Batch Number", "Warranty Period"). Values are stored in the
 * target entity's own `customFields` jsonb column, keyed by `fieldKey`; this
 * table only holds the schema (what fields exist, their type, whether
 * they're required) so forms can render them dynamically.
 */
@Entity
@Table(
    name = "field_definitions",
    uniqueConstraints =
        @UniqueConstraint(columnNames = {"business_id", "entity_type", "field_key"}))
@Getter
@Setter
public class FieldDefinition extends TenantBaseEntity {

  /** "product" | "customer" | "supplier" */
  @Column(name = "entity_type", nullable = false)
  private String entityType;

  /** Machine key used inside the target entity's customFields map. */
  @Column(name = "field_key", nullable = false)
  private String fieldKey;

  @Column(nullable = false)
  private String label;

  /** "text" | "number" | "boolean" | "date" | "select" */
  @Column(name = "field_type", nullable = false)
  private String fieldType;

  /** Choices for "select" fields; null/empty for other types. */
  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb")
  private List<String> options;

  // See Product.java for why this needs a hand-written getter.
  @Getter(AccessLevel.NONE)
  @Column(nullable = false)
  private boolean isRequired = false;

  @JsonProperty("isRequired")
  public boolean isRequired() {
    return isRequired;
  }

  @Column(name = "sort_order", nullable = false)
  private int sortOrder = 0;
}
