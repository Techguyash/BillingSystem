package com.billingsystem.ledger;

import com.billingsystem.customer.Customer;
import com.billingsystem.customer.CustomerRepository;
import com.billingsystem.invoice.Invoice;
import com.billingsystem.invoice.InvoiceRepository;
import com.billingsystem.invoice.Payment;
import com.billingsystem.purchase.PurchaseOrder;
import com.billingsystem.purchase.PurchaseOrderRepository;
import com.billingsystem.purchase.SupplierPayment;
import com.billingsystem.purchase.SupplierPaymentRepository;
import com.billingsystem.returns.CreditNote;
import com.billingsystem.returns.CreditNoteRepository;
import com.billingsystem.returns.DebitNote;
import com.billingsystem.returns.DebitNoteRepository;
import com.billingsystem.supplier.Supplier;
import com.billingsystem.supplier.SupplierRepository;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Builds a running-balance statement of account for a customer or
 * supplier by merging all the entity types that move their balance
 * (invoices/payments/credit notes for customers; purchases/payments/debit
 * notes for suppliers) into one chronological timeline.
 */
@Service
@RequiredArgsConstructor
public class LedgerService {

  private final CustomerRepository customerRepository;
  private final SupplierRepository supplierRepository;
  private final InvoiceRepository invoiceRepository;
  private final CreditNoteRepository creditNoteRepository;
  private final PurchaseOrderRepository purchaseOrderRepository;
  private final SupplierPaymentRepository supplierPaymentRepository;
  private final DebitNoteRepository debitNoteRepository;

  public List<LedgerEntry> customerLedger(UUID businessId, UUID customerId) {
    Customer customer =
        customerRepository
            .findByBusinessIdAndId(businessId, customerId)
            .orElseThrow(EntityNotFoundException::new);

    record RawEntry(java.time.Instant date, String type, String reference, BigDecimal amount) {}
    List<RawEntry> raw = new ArrayList<>();

    for (Invoice invoice : invoiceRepository.findByBusinessIdAndCustomerIdOrderByCreatedAtAsc(businessId, customerId)) {
      if ("void".equals(invoice.getStatus())) continue;
      raw.add(new RawEntry(invoice.getCreatedAt(), "Invoice", invoice.getInvoiceNumber(), invoice.getTotalAmount()));
      for (Payment payment : invoice.getPayments()) {
        raw.add(
            new RawEntry(
                payment.getCreatedAt(), "Payment", invoice.getInvoiceNumber(), payment.getAmount().negate()));
      }
    }
    for (CreditNote creditNote :
        creditNoteRepository.findByBusinessIdAndCustomerIdOrderByCreatedAtAsc(businessId, customerId)) {
      raw.add(
          new RawEntry(
              creditNote.getCreatedAt(),
              "Credit Note",
              creditNote.getCreditNoteNumber(),
              creditNote.getTotalAmount().negate()));
    }

    return buildTimeline(raw.stream()
        .sorted(Comparator.comparing(RawEntry::date))
        .map(r -> new LedgerEntry(r.date(), r.type(), r.reference(), r.amount(), null))
        .toList(), customer.getOpeningBalance());
  }

  public List<LedgerEntry> supplierLedger(UUID businessId, UUID supplierId) {
    Supplier supplier =
        supplierRepository
            .findByBusinessIdAndId(businessId, supplierId)
            .orElseThrow(EntityNotFoundException::new);

    record RawEntry(java.time.Instant date, String type, String reference, BigDecimal amount) {}
    List<RawEntry> raw = new ArrayList<>();

    for (PurchaseOrder po :
        purchaseOrderRepository.findByBusinessIdAndSupplierIdOrderByCreatedAtAsc(businessId, supplierId)) {
      raw.add(new RawEntry(po.getCreatedAt(), "Purchase", po.getPurchaseNumber(), po.getTotalAmount()));
    }
    for (SupplierPayment payment :
        supplierPaymentRepository.findByBusinessIdAndSupplierIdOrderByCreatedAtAsc(businessId, supplierId)) {
      raw.add(new RawEntry(payment.getCreatedAt(), "Payment", null, payment.getAmount().negate()));
    }
    for (DebitNote debitNote :
        debitNoteRepository.findByBusinessIdAndSupplierIdOrderByCreatedAtAsc(businessId, supplierId)) {
      raw.add(
          new RawEntry(
              debitNote.getCreatedAt(),
              "Debit Note",
              debitNote.getDebitNoteNumber(),
              debitNote.getTotalAmount().negate()));
    }

    return buildTimeline(raw.stream()
        .sorted(Comparator.comparing(RawEntry::date))
        .map(r -> new LedgerEntry(r.date(), r.type(), r.reference(), r.amount(), null))
        .toList(), supplier.getOpeningBalance());
  }

  private List<LedgerEntry> buildTimeline(List<LedgerEntry> entries, BigDecimal openingBalance) {
    List<LedgerEntry> result = new ArrayList<>();
    BigDecimal running = openingBalance;
    result.add(new LedgerEntry(null, "Opening Balance", null, openingBalance, running));
    for (LedgerEntry entry : entries) {
      running = running.add(entry.amount());
      result.add(new LedgerEntry(entry.date(), entry.type(), entry.reference(), entry.amount(), running));
    }
    return result;
  }
}
