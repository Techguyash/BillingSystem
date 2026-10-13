package com.billingsystem.purchase;

import com.billingsystem.common.TenantBaseEntity;
import com.billingsystem.product.Product;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/** Manual stock correction (damage, theft, stocktake reconciliation, etc.) outside of sales/purchases. */
@Entity
@Table(name = "stock_adjustments")
@Getter
@Setter
public class StockAdjustment extends TenantBaseEntity {

  @Column(name = "product_id", nullable = false)
  private UUID productId;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "product_id", insertable = false, updatable = false)
  private Product product;

  @Column(name = "product_name", nullable = false)
  private String productName;

  /** Positive to increase stock, negative to decrease it. */
  @Column(precision = 12, scale = 3, nullable = false)
  private BigDecimal quantityDelta;

  @Column(nullable = false)
  private String reason;

  @Column(name = "adjusted_by_user_id", nullable = false)
  private UUID adjustedByUserId;
}
