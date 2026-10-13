package com.billingsystem.user;

import com.billingsystem.common.TenantBaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import com.billingsystem.role.Role;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(
    name = "users",
    uniqueConstraints = @UniqueConstraint(columnNames = {"business_id", "email"}))
@Getter
@Setter
public class User extends TenantBaseEntity {

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String email;

  // Never serialize the hash — User is now returned directly by
  // UserController list/create/update endpoints.
  @JsonIgnore
  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  // See Product.java for why this needs a hand-written getter.
  @Getter(AccessLevel.NONE)
  @Column(name = "is_active", nullable = false)
  private boolean isActive = true;

  @JsonProperty("isActive")
  public boolean isActive() {
    return isActive;
  }

  // EAGER: every authenticated request needs role name + permissions right
  // after loading the user, outside of any explicit @Transactional method
  // (open-in-view is disabled), so a LAZY proxy would throw
  // LazyInitializationException once the loading session closes.
  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "role_id", nullable = false)
  private Role role;
}
