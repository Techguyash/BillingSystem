package com.billingsystem.branch;

import com.billingsystem.common.TenantBaseEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "branches")
@Getter
@Setter
public class Branch extends TenantBaseEntity {

  @Column(nullable = false)
  private String name;

  @Column(columnDefinition = "text")
  private String address;

  private String phone;

  // See Product.java for why this needs a hand-written getter.
  @Getter(AccessLevel.NONE)
  @Column(name = "is_default", nullable = false)
  private boolean isDefault = false;

  @JsonProperty("isDefault")
  public boolean isDefault() {
    return isDefault;
  }
}
