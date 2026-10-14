package com.billingsystem.quotation;

import com.billingsystem.common.TenantBaseEntity;
import com.billingsystem.customer.Customer;
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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * A quotation/estimate — same shape as an Invoice, minus stock/payment
 * effects, with a one-way "convert to invoice" action once the customer
 * accepts. Kept as its own entity (not a flag on Invoice) since its
 * lifecycle (draft/sent/accepted/rejected/expired/converted) and the fact
 * that it never touches stock are different enough to not want them
 * conflated in queries/reports.
 */
@Entity
@Table(
    name = "quotations",
    uniqueConstraints = @UniqueConstraint(columnNames = {"business_id", "quotation_number"}))
@Getter
@Setter
public class Quotation extends TenantBaseEntity {

  @Column(name = "quotation_number", nullable = false)
  private String quotationNumber;

  @Column(name = "customer_id")
  private UUID customerId;

  @ManyToOne(fetch = FetchType.EAGER)
  @JoinColumn(name = "customer_id", insertable = false, updatable = false)
  private Customer customer;

  @Column(name = "created_by_user_id", nullable = false)
  private UUID createdByUserId;

  /** draft | sent | accepted | rejected | expired | converted */
  @Column(nullable = false)
  private String status = "draft";

  @Column(name = "valid_until")
  private LocalDate validUntil;

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

  /** Set once this quotation has been converted — links to the resulting sale. */
  @Column(name = "converted_invoice_id")
  private UUID convertedInvoiceId;

  @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
  private List<QuotationItem> items = new ArrayList<>();
}
