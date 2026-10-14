package com.billingsystem.audit;

import com.billingsystem.common.TenantBaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * An immutable record of a mutating action — who did what, when. Rows are
 * only ever inserted, never updated or deleted, so this stays a trustworthy
 * trail even if the acting user is later removed.
 */
@Entity
@Table(name = "audit_logs")
@Getter
@Setter
public class AuditLog extends TenantBaseEntity {

  @Column(name = "user_id")
  private UUID userId;

  /** Snapshot so the log still reads sensibly after a user is deactivated/renamed. */
  @Column(name = "user_name")
  private String userName;

  /** e.g. "invoice.create", "product.update" — matches the permission-key naming style. */
  @Column(nullable = false)
  private String action;

  /** e.g. "Invoice", "Product" — human-readable entity kind. */
  @Column(name = "entity_type", nullable = false)
  private String entityType;

  @Column(name = "entity_id")
  private UUID entityId;

  @Column(columnDefinition = "text")
  private String description;
}
