package com.billingsystem.taxrate;

import com.billingsystem.common.TenantBaseEntity;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

/**
 * A named, admin-managed tax rate (e.g. "GST 5%", "GST 18%", "Service Tax
 * 12%") that gets picked on the product form instead of typing a raw number
 * every time. The actual CGST/SGST/IGST split logic (see lib/gst.ts and
 * ReportService) is unchanged — this just makes "what rate to use" a
 * curated, enable/disable-able list rather than free text.
 */
@Entity
@Table(name = "tax_rates")
@Getter
@Setter
public class TaxRate extends TenantBaseEntity {

  @Column(nullable = false)
  private String name;

  @Column(precision = 5, scale = 2, nullable = false)
  private BigDecimal percent;

  // See Product.java for why boolean getters need to be hand-written.
  @Getter(AccessLevel.NONE)
  @Column(name = "is_active", nullable = false)
  private boolean isActive = true;

  @JsonProperty("isActive")
  public boolean isActive() {
    return isActive;
  }
}
