package com.billingsystem.purchase;

import com.billingsystem.common.BaseEntity;
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

@Entity
@Table(name = "purchase_order_items")
@Getter
@Setter
public class PurchaseOrderItem extends BaseEntity {

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "purchase_order_id", nullable = false)
  private PurchaseOrder purchaseOrder;

  @Column(name = "product_id", nullable = false)
  private UUID productId;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "product_id", insertable = false, updatable = false)
  private Product product;

  /** Snapshot of the product name at purchase time. */
  @Column(name = "product_name", nullable = false)
  private String productName;

  @Column(precision = 12, scale = 3, nullable = false)
  private BigDecimal quantity;

  @Column(name = "unit_cost", precision = 12, scale = 2, nullable = false)
  private BigDecimal unitCost;

  @Column(name = "tax_rate_percent", precision = 5, scale = 2, nullable = false)
  private BigDecimal taxRatePercent = BigDecimal.ZERO;

  @Column(name = "line_total", precision = 12, scale = 2, nullable = false)
  private BigDecimal lineTotal;
}
