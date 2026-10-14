package com.billingsystem.unit;

import com.billingsystem.common.TenantBaseEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

/**
 * A unit of measure a business sells/stocks products in (e.g. "Kg", "Liter",
 * "pcs"). Ships with a seeded default set, but businesses can add their own
 * (e.g. "Dozen", "Bundle") from Settings — same pattern as FieldDefinition.
 */
@Entity
@Table(
    name = "units",
    uniqueConstraints = @UniqueConstraint(columnNames = {"business_id", "abbreviation"}))
@Getter
@Setter
public class Unit extends TenantBaseEntity {

  @Column(nullable = false)
  private String name;

  /** Short code stored on Product.unit, e.g. "kg", "pcs". */
  @Column(nullable = false)
  private String abbreviation;

  // See Product.java (same codebase) for why boolean getters need to be
  // hand-written to avoid Jackson emitting both "isSystem" and "system".
  @Getter(AccessLevel.NONE)
  @Column(name = "is_system", nullable = false)
  private boolean isSystem = false;

  @JsonProperty("isSystem")
  public boolean isSystem() {
    return isSystem;
  }
}
