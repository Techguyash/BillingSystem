package com.billingsystem.discount;

import com.billingsystem.common.TenantBaseEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

/**
 * A named, admin-configured discount rule (e.g. "Festival Sale — 10% on all
 * purchases", "₹50 off orders above ₹500"). A biller picks one from a
 * dropdown on the billing screen instead of typing an ad-hoc number, and the
 * actual discount amount is always computed/validated server-side against
 * the rule (see InvoiceService) so the scope/date-range/enabled checks can't
 * be bypassed from the client.
 */
@Entity
@Table(name = "discounts")
@Getter
@Setter
public class Discount extends TenantBaseEntity {

  @Column(nullable = false)
  private String name;

  /** PERCENTAGE | FIXED */
  @Column(nullable = false)
  private String type;

  /** For PERCENTAGE this is a percent (e.g. 10 = 10%); for FIXED this is a ₹ amount. */
  @Column(precision = 12, scale = 2, nullable = false)
  private BigDecimal value;

  /** Only applies once the invoice's pre-discount total reaches this amount. Null = no minimum. */
  @Column(name = "min_order_amount", precision = 12, scale = 2)
  private BigDecimal minOrderAmount;

  @Column(name = "start_date")
  private LocalDate startDate;

  @Column(name = "end_date")
  private LocalDate endDate;

  // See Product.java for why boolean getters need to be hand-written.
  @Getter(AccessLevel.NONE)
  @Column(name = "is_active", nullable = false)
  private boolean isActive = true;

  @JsonProperty("isActive")
  public boolean isActive() {
    return isActive;
  }
}
