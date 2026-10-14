package com.billingsystem.supplier;

import com.billingsystem.common.TenantBaseEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "suppliers")
@Getter
@Setter
public class Supplier extends TenantBaseEntity {

  @Column(nullable = false)
  private String name;

  private String phone;

  private String email;

  @Column(columnDefinition = "text")
  private String address;

  private String gstin;

  private String state;

  /** What the business owed this supplier before this install started tracking purchases here. */
  @Column(name = "opening_balance", precision = 12, scale = 2, nullable = false)
  private BigDecimal openingBalance = BigDecimal.ZERO;

  // See Product.java for why this needs a hand-written getter.
  @Getter(AccessLevel.NONE)
  @Column(name = "is_active", nullable = false)
  private boolean isActive = true;

  @JsonProperty("isActive")
  public boolean isActive() {
    return isActive;
  }

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "custom_fields", columnDefinition = "jsonb", nullable = false)
  private Map<String, Object> customFields = new HashMap<>();
}
