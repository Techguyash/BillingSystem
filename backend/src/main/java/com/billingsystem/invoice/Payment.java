package com.billingsystem.invoice;

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

@Entity
@Table(name = "payments")
@Getter
@Setter
public class Payment extends TenantBaseEntity {

  @Column(name = "invoice_id", nullable = false)
  private UUID invoiceId;

  // Avoid Invoice -> payments -> Payment.invoice -> ... recursion, and the
  // lazy proxy wouldn't serialize cleanly outside a transaction anyway.
  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "invoice_id", insertable = false, updatable = false)
  private Invoice invoice;

  @Column(precision = 12, scale = 2, nullable = false)
  private BigDecimal amount;

  @Column(name = "payment_method", nullable = false)
  private String method;

  @Column(name = "received_by_user_id", nullable = false)
  private UUID receivedByUserId;

  @Column(columnDefinition = "text")
  private String notes;
}
