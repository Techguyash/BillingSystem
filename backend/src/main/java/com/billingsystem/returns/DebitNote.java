package com.billingsystem.returns;

import com.billingsystem.common.TenantBaseEntity;
import com.billingsystem.purchase.PurchaseOrder;
import com.billingsystem.supplier.Supplier;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * A purchase return against an existing PurchaseOrder — sends stock back
 * out and reduces how much the business owes that supplier (shows up as a
 * debit on the supplier's statement of account).
 */
@Entity
@Table(
    name = "debit_notes",
    uniqueConstraints = @UniqueConstraint(columnNames = {"business_id", "debit_note_number"}))
@Getter
@Setter
public class DebitNote extends TenantBaseEntity {

  @Column(name = "debit_note_number", nullable = false)
  private String debitNoteNumber;

  @Column(name = "purchase_order_id", nullable = false)
  private UUID purchaseOrderId;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "purchase_order_id", insertable = false, updatable = false)
  private PurchaseOrder purchaseOrder;

  @Column(name = "supplier_id")
  private UUID supplierId;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "supplier_id", insertable = false, updatable = false)
  private Supplier supplier;

  @Column(name = "created_by_user_id", nullable = false)
  private UUID createdByUserId;

  @Column(columnDefinition = "text")
  private String reason;

  @Column(precision = 12, scale = 2, nullable = false)
  private BigDecimal subtotal;

  @Column(name = "tax_total", precision = 12, scale = 2, nullable = false)
  private BigDecimal taxTotal;

  @Column(name = "total_amount", precision = 12, scale = 2, nullable = false)
  private BigDecimal totalAmount;

  @OneToMany(mappedBy = "debitNote", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  private List<DebitNoteItem> items = new ArrayList<>();
}
