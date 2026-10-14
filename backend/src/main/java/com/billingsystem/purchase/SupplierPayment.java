package com.billingsystem.purchase;

import com.billingsystem.common.TenantBaseEntity;
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

/** A payment made to a supplier against a specific PurchaseOrder — the "other half" of Payment (invoice/customer side). */
@Entity
@Table(name = "supplier_payments")
@Getter
@Setter
public class SupplierPayment extends TenantBaseEntity {

  @Column(name = "purchase_order_id", nullable = false)
  private UUID purchaseOrderId;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "purchase_order_id", insertable = false, updatable = false)
  private PurchaseOrder purchaseOrder;

  @Column(name = "supplier_id", nullable = false)
  private UUID supplierId;

  @Column(precision = 12, scale = 2, nullable = false)
  private BigDecimal amount;

  @Column(name = "payment_method", nullable = false)
  private String method;

  @Column(name = "paid_by_user_id", nullable = false)
  private UUID paidByUserId;

  @Column(columnDefinition = "text")
  private String notes;
}
