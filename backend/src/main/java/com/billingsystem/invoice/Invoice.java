package com.billingsystem.invoice;

import com.billingsystem.branch.Branch;
import com.billingsystem.common.TenantBaseEntity;
import com.billingsystem.customer.Customer;
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

@Entity
@Table(
    name = "invoices",
    uniqueConstraints = @UniqueConstraint(columnNames = {"business_id", "invoice_number"}))
@Getter
@Setter
public class Invoice extends TenantBaseEntity {

  @Column(name = "invoice_number", nullable = false)
  private String invoiceNumber;

  @Column(name = "branch_id", nullable = false)
  private UUID branchId;

  // Lazy and not currently consumed by the frontend; ignored so Jackson
  // never tries to initialize this proxy outside a transaction.
  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "branch_id", insertable = false, updatable = false)
  private Branch branch;

  @Column(name = "customer_id")
  private UUID customerId;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "customer_id", insertable = false, updatable = false)
  private Customer customer;

  @Column(name = "created_by_user_id", nullable = false)
  private UUID createdByUserId;

  @Column(nullable = false)
  private String status = "due";

  @Column(name = "payment_method", nullable = false)
  private String paymentMethod = "cash";

  @Column(precision = 12, scale = 2, nullable = false)
  private BigDecimal subtotal;

  @Column(name = "tax_total", precision = 12, scale = 2, nullable = false)
  private BigDecimal taxTotal;

  @Column(name = "discount_total", precision = 12, scale = 2, nullable = false)
  private BigDecimal discountTotal = BigDecimal.ZERO;

  @Column(name = "total_amount", precision = 12, scale = 2, nullable = false)
  private BigDecimal totalAmount;

  @Column(columnDefinition = "text")
  private String notes;

  @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  private List<InvoiceItem> items = new ArrayList<>();

  @OneToMany(mappedBy = "invoice", fetch = FetchType.EAGER)
  private List<Payment> payments = new ArrayList<>();
}
