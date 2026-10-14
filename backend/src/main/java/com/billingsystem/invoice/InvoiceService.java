package com.billingsystem.invoice;

import com.billingsystem.branch.BranchService;
import com.billingsystem.business.BusinessService;
import com.billingsystem.customer.Customer;
import com.billingsystem.customer.CustomerRepository;
import com.billingsystem.discount.Discount;
import com.billingsystem.discount.DiscountService;
import com.billingsystem.invoice.dto.CreateInvoiceItemRequest;
import com.billingsystem.invoice.dto.CreateInvoiceRequest;
import com.billingsystem.invoice.dto.RecordPaymentRequest;
import com.billingsystem.product.Product;
import com.billingsystem.product.ProductRepository;
import com.billingsystem.product.ProductService;
import com.billingsystem.returns.CreditNote;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InvoiceService {

  private static final BigDecimal PAID_EPSILON = new BigDecimal("0.005");
  private static final BigDecimal HUNDRED = new BigDecimal("100");

  private final InvoiceRepository invoiceRepository;
  private final PaymentRepository paymentRepository;
  private final ProductRepository productRepository;
  private final ProductService productService;
  private final CustomerRepository customerRepository;
  private final BranchService branchService;
  private final BusinessService businessService;
  private final DiscountService discountService;

  public List<Invoice> findAll(UUID businessId) {
    return invoiceRepository.findTop100ByBusinessIdOrderByCreatedAtDesc(businessId);
  }

  public Invoice findOne(UUID businessId, UUID id) {
    return invoiceRepository
        .findByBusinessIdAndId(businessId, id)
        .orElseThrow(EntityNotFoundException::new);
  }

  @Transactional
  public Invoice create(UUID businessId, UUID userId, CreateInvoiceRequest dto) {
    UUID branchId = dto.getBranchId();
    if (branchId == null) {
      branchId = branchService.resolveDefault(businessId).getId();
    }

    if (dto.getCustomerId() != null) {
      customerRepository
          .findById(dto.getCustomerId())
          .filter(c -> c.getBusinessId().equals(businessId))
          .orElseThrow(() -> new IllegalArgumentException("Invalid customer"));
    }

    BigDecimal subtotal = BigDecimal.ZERO;
    BigDecimal taxTotal = BigDecimal.ZERO;

    Invoice invoice = new Invoice();
    invoice.setBusinessId(businessId);
    invoice.setBranchId(branchId);
    invoice.setCustomerId(dto.getCustomerId());
    invoice.setCreatedByUserId(userId);

    for (CreateInvoiceItemRequest line : dto.getItems()) {
      Product product =
          productRepository
              .findById(line.getProductId())
              .filter(p -> p.getBusinessId().equals(businessId))
              .orElseThrow(
                  () ->
                      new IllegalArgumentException(
                          "Product " + line.getProductId() + " not found"));

      productService.decrementStockForSale(product, line.getQuantity());

      BigDecimal unitPrice =
          line.getUnitPrice() != null ? line.getUnitPrice() : product.getSellingPrice();
      BigDecimal taxRatePercent = product.getTaxRatePercent();
      BigDecimal lineSubtotal = unitPrice.multiply(line.getQuantity());
      BigDecimal lineTax =
          lineSubtotal.multiply(taxRatePercent).divide(HUNDRED, 2, RoundingMode.HALF_UP);
      BigDecimal lineTotal = lineSubtotal.add(lineTax);

      subtotal = subtotal.add(lineSubtotal);
      taxTotal = taxTotal.add(lineTax);

      InvoiceItem item = new InvoiceItem();
      item.setInvoice(invoice);
      item.setProductId(product.getId());
      item.setProductName(product.getName());
      item.setQuantity(line.getQuantity());
      item.setUnitPrice(unitPrice);
      item.setTaxRatePercent(taxRatePercent);
      item.setLineTotal(lineTotal);
      invoice.getItems().add(item);
    }

    BigDecimal preDiscountTotal = subtotal.add(taxTotal);

    BigDecimal discountTotal;
    Discount appliedDiscount = null;
    if (dto.getDiscountId() != null) {
      // A named preset always wins over a client-sent discountTotal — the
      // amount is derived from the rule itself so the scope/date-range/
      // enabled checks can't be bypassed by just posting a number.
      discountTotal = discountService.resolveAmount(businessId, dto.getDiscountId(), preDiscountTotal);
      appliedDiscount = discountService.findOne(businessId, dto.getDiscountId());
    } else {
      discountTotal = dto.getDiscountTotal() != null ? dto.getDiscountTotal() : BigDecimal.ZERO;
      if (discountTotal.compareTo(preDiscountTotal) > 0) {
        throw new IllegalArgumentException(
            "Discount of " + discountTotal + " cannot exceed the invoice total of " + preDiscountTotal);
      }
    }
    BigDecimal totalAmount = preDiscountTotal.subtract(discountTotal);
    String paymentMethod = dto.getPaymentMethod() != null ? dto.getPaymentMethod() : "cash";
    // Credit sales start unpaid; every other method is collected in full at
    // the counter, so we record the payment immediately for the ledger.
    String status = "credit".equals(paymentMethod) ? "due" : "paid";

    long invoiceCount = invoiceRepository.countByBusinessId(businessId);
    Object configuredPrefix = businessService.findById(businessId).getSettings().get("invoiceNumberPrefix");
    String prefix =
        configuredPrefix instanceof String s && !s.isBlank() ? s : "INV";
    String invoiceNumber = prefix + "-" + String.format("%04d", invoiceCount + 1);

    invoice.setInvoiceNumber(invoiceNumber);
    invoice.setStatus(status);
    invoice.setPaymentMethod(paymentMethod);
    invoice.setSubtotal(subtotal);
    invoice.setTaxTotal(taxTotal);
    invoice.setDiscountTotal(discountTotal);
    if (appliedDiscount != null) {
      invoice.setDiscountId(appliedDiscount.getId());
      invoice.setDiscountName(appliedDiscount.getName());
    }
    invoice.setTotalAmount(totalAmount);
    invoice.setNotes(dto.getNotes());

    Invoice saved = invoiceRepository.save(invoice);

    if (!"credit".equals(paymentMethod)) {
      Payment payment = new Payment();
      payment.setBusinessId(businessId);
      payment.setInvoiceId(saved.getId());
      payment.setAmount(totalAmount);
      payment.setMethod(paymentMethod);
      payment.setReceivedByUserId(userId);
      paymentRepository.save(payment);
      // `saved` is a managed entity already in this transaction's
      // persistence context, so re-querying by id here would just return
      // the same Java object with its `payments` collection as it was
      // first loaded — it does NOT pick up the row we just inserted above.
      // Append in-memory to keep the response consistent with the DB.
      saved.getPayments().add(payment);
    }

    return saved;
  }

  @Transactional
  public Invoice recordPayment(UUID businessId, UUID invoiceId, UUID userId, RecordPaymentRequest dto) {
    Invoice invoice = findOne(businessId, invoiceId);
    if ("void".equals(invoice.getStatus())) {
      throw new IllegalArgumentException("Cannot record a payment on a void invoice");
    }

    BigDecimal alreadyPaid =
        invoice.getPayments().stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal balanceDue = getEffectiveAmountOwed(invoice).subtract(alreadyPaid);

    if (dto.getAmount().compareTo(balanceDue.add(PAID_EPSILON)) > 0) {
      throw new IllegalArgumentException(
          "Payment of "
              + dto.getAmount()
              + " exceeds the remaining balance of "
              + balanceDue.setScale(2, RoundingMode.HALF_UP));
    }

    Payment payment = new Payment();
    payment.setBusinessId(businessId);
    payment.setInvoiceId(invoiceId);
    payment.setAmount(dto.getAmount());
    payment.setMethod(dto.getMethod());
    payment.setReceivedByUserId(userId);
    payment.setNotes(dto.getNotes());
    paymentRepository.save(payment);
    // Same persistence-context caveat as in create(): append in-memory
    // rather than relying on a re-query to reflect the new row.
    invoice.getPayments().add(payment);

    BigDecimal totalPaid = alreadyPaid.add(dto.getAmount());
    invoice.setStatus(computeStatus(getEffectiveAmountOwed(invoice), totalPaid));
    invoiceRepository.save(invoice);

    return invoice;
  }

  /**
   * Called by CreditNoteService right after a return is recorded — a
   * return reduces what's actually owed, so the invoice's status (and
   * therefore the Dashboard's "Outstanding Dues" and every list filtered by
   * status) needs to reflect it immediately, not just the ledger view.
   */
  @Transactional
  public void recomputeStatusAfterReturn(Invoice invoice) {
    if ("void".equals(invoice.getStatus())) return;
    BigDecimal totalPaid =
        invoice.getPayments().stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    invoice.setStatus(computeStatus(getEffectiveAmountOwed(invoice), totalPaid));
    invoiceRepository.save(invoice);
  }

  /** What the customer actually owes net of returns — total amount minus every credit note issued against this invoice. */
  private BigDecimal getEffectiveAmountOwed(Invoice invoice) {
    BigDecimal returned = getReturnedTotal(invoice);
    BigDecimal effective = invoice.getTotalAmount().subtract(returned);
    return effective.max(BigDecimal.ZERO);
  }

  private BigDecimal getReturnedTotal(Invoice invoice) {
    return invoice.getCreditNotes().stream()
        .map(CreditNote::getTotalAmount)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  @Transactional
  public Invoice voidInvoice(UUID businessId, UUID id) {
    Invoice invoice = findOne(businessId, id);
    if ("void".equals(invoice.getStatus())) {
      return invoice;
    }

    for (InvoiceItem item : invoice.getItems()) {
      Product product = productRepository.findById(item.getProductId()).orElseThrow();
      productService.restockForReturn(product, item.getQuantity());
    }

    invoice.setStatus("void");
    return invoiceRepository.save(invoice);
  }

  public TodaySummary getTodaySummary(UUID businessId) {
    Instant startOfDay =
        LocalDate.now(ZoneId.systemDefault()).atStartOfDay(ZoneId.systemDefault()).toInstant();

    List<Invoice> invoices =
        invoiceRepository.findByBusinessIdAndCreatedAtGreaterThanEqualAndStatusNot(
            businessId, startOfDay, "void");

    // Net of returns — a refunded sale should pull "today's sales" back
    // down, not sit there as if the full original amount still stands.
    BigDecimal totalSales =
        invoices.stream()
            .map(invoice -> invoice.getTotalAmount().subtract(getReturnedTotal(invoice)))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    return new TodaySummary(totalSales, invoices.size());
  }

  private static String computeStatus(BigDecimal totalAmount, BigDecimal totalPaid) {
    if (totalPaid.compareTo(totalAmount.subtract(PAID_EPSILON)) >= 0) return "paid";
    if (totalPaid.compareTo(BigDecimal.ZERO) > 0) return "partial";
    return "due";
  }

  /** Sum of what's still owed across every unpaid/partially-paid invoice, net of returns (excludes void/paid). */
  public BigDecimal getTotalOutstanding(UUID businessId) {
    return invoiceRepository.findByBusinessIdAndStatusIn(businessId, List.of("due", "partial")).stream()
        .map(
            invoice -> {
              BigDecimal paid =
                  invoice.getPayments().stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
              return getEffectiveAmountOwed(invoice).subtract(paid).max(BigDecimal.ZERO);
            })
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  public record TodaySummary(BigDecimal totalSales, int invoiceCount) {}
}
