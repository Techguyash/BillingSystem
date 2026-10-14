package com.billingsystem.returns;

import com.billingsystem.common.TenantBaseEntity;
import com.billingsystem.customer.Customer;
import com.billingsystem.invoice.Invoice;
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
 * A sales return against an existing Invoice — restocks the returned
 * quantities and reduces how much the customer is considered to owe (shows
 * up as a credit on their statement of account).
 */
@Entity
@Table(
    name = "credit_notes",
    uniqueConstraints = @UniqueConstraint(columnNames = {"business_id", "credit_note_number"}))
@Getter
@Setter
public class CreditNote extends TenantBaseEntity {

  @Column(name = "credit_note_number", nullable = false)
  private String creditNoteNumber;

  @Column(name = "invoice_id", nullable = false)
  private UUID invoiceId;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "invoice_id", insertable = false, updatable = false)
  private Invoice invoice;

  @Column(name = "customer_id")
  private UUID customerId;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "customer_id", insertable = false, updatable = false)
  private Customer customer;

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

  @OneToMany(mappedBy = "creditNote", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  private List<CreditNoteItem> items = new ArrayList<>();
}
