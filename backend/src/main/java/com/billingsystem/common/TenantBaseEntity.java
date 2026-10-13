package com.billingsystem.common;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * Base for every entity that belongs to a business (products, invoices,
 * users, roles, etc). Today there is exactly one Business row per install,
 * but keeping this column everywhere means enabling multi-tenancy later is
 * a migration + query-scoping change, not a rewrite of every table.
 */
@MappedSuperclass
@Getter
@Setter
public abstract class TenantBaseEntity extends BaseEntity {

  @Column(name = "business_id", nullable = false)
  private UUID businessId;
}
