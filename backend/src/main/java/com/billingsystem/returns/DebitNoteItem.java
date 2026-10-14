package com.billingsystem.returns;

import com.billingsystem.common.BaseEntity;
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
@Table(name = "debit_note_items")
@Getter
@Setter
public class DebitNoteItem extends BaseEntity {

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "debit_note_id", nullable = false)
  private DebitNote debitNote;

  /** The original PurchaseOrder line this return is against — used to cap quantity returned. */
  @Column(name = "purchase_order_item_id", nullable = false)
  private UUID purchaseOrderItemId;

  @Column(name = "product_id", nullable = false)
  private UUID productId;

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
