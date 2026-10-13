package com.billingsystem.role;

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

@Entity
@Table(
    name = "roles",
    uniqueConstraints = @UniqueConstraint(columnNames = {"business_id", "name"}))
@Getter
@Setter
public class Role extends TenantBaseEntity {

  @Column(nullable = false)
  private String name;

  /** e.g. ["invoice.create", "inventory.adjust_stock"] — composable per business. */
  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb", nullable = false)
  private List<String> permissions;

  // See Product.java for why this needs a hand-written getter.
  @Getter(AccessLevel.NONE)
  @Column(name = "is_system", nullable = false)
  private boolean isSystem = false;

  @JsonProperty("isSystem")
  public boolean isSystem() {
    return isSystem;
  }
}
