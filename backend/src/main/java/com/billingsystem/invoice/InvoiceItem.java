package com.billingsystem.invoice;

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
@Table(name = "invoice_items")
@Getter
@Setter
public class InvoiceItem extends BaseEntity {

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "invoice_id", nullable = false)
  private Invoice invoice;

  @Column(name = "product_id", nullable = false)
  private UUID productId;

  // Lazy and unused in API responses (we keep a productName snapshot below);
  // ignored so Jackson never tries to initialize this proxy outside a
  // transaction (open-in-view is disabled).
  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "product_id", insertable = false, updatable = false)
  private Product product;

  /** Snapshot of the product name at sale time, in case the product is renamed later. */
  @Column(name = "product_name", nullable = false)
  private String productName;

  @Column(precision = 12, scale = 3, nullable = false)
  private BigDecimal quantity;

  @Column(name = "unit_price", precision = 12, scale = 2, nullable = false)
  private BigDecimal unitPrice;

  @Column(name = "tax_rate_percent", precision = 5, scale = 2, nullable = false)
  private BigDecimal taxRatePercent = BigDecimal.ZERO;

  @Column(name = "line_total", precision = 12, scale = 2, nullable = false)
  private BigDecimal lineTotal;
}
