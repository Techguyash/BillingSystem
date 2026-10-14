package com.billingsystem.purchase;

import com.billingsystem.common.TenantBaseEntity;
import com.billingsystem.returns.DebitNote;
import com.billingsystem.supplier.Supplier;
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
 * A stock-in event from a supplier. This is the "other half" of Invoice —
 * instead of decrementing stock for a sale, receiving a purchase order
 * increments stock and refreshes the product's cost price.
 */
@Entity
@Table(
    name = "purchase_orders",
    uniqueConstraints = @UniqueConstraint(columnNames = {"business_id", "purchase_number"}))
@Getter
@Setter
public class PurchaseOrder extends TenantBaseEntity {

  @Column(name = "purchase_number", nullable = false)
  private String purchaseNumber;

  @Column(name = "supplier_id")
  private UUID supplierId;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "supplier_id", insertable = false, updatable = false)
  private Supplier supplier;

  @Column(name = "created_by_user_id", nullable = false)
  private UUID createdByUserId;

  @Column(name = "invoice_number", nullable = true)
  private String supplierInvoiceNumber;

  @Column(precision = 12, scale = 2, nullable = false)
  private BigDecimal subtotal;

  @Column(name = "tax_total", precision = 12, scale = 2, nullable = false)
  private BigDecimal taxTotal;

  @Column(name = "total_amount", precision = 12, scale = 2, nullable = false)
  private BigDecimal totalAmount;

  @Column(columnDefinition = "text")
  private String notes;

  @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  private List<PurchaseOrderItem> items = new ArrayList<>();

  @OneToMany(mappedBy = "purchaseOrder", fetch = FetchType.EAGER)
  private List<SupplierPayment> payments = new ArrayList<>();

  /** Purchase returns issued against this purchase order — see DebitNoteService. */
  @OneToMany(mappedBy = "purchaseOrder", fetch = FetchType.EAGER)
  private List<DebitNote> debitNotes = new ArrayList<>();
}
