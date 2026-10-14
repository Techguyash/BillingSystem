package com.billingsystem.returns;

import com.billingsystem.invoice.Invoice;
import com.billingsystem.invoice.InvoiceItem;
import com.billingsystem.invoice.InvoiceRepository;
import com.billingsystem.invoice.InvoiceService;
import com.billingsystem.product.Product;
import com.billingsystem.product.ProductRepository;
import com.billingsystem.product.ProductService;
import com.billingsystem.returns.dto.CreateCreditNoteRequest;
import com.billingsystem.returns.dto.CreditNoteItemRequest;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CreditNoteService {

  private static final BigDecimal HUNDRED = new BigDecimal("100");

  private final CreditNoteRepository creditNoteRepository;
  private final InvoiceRepository invoiceRepository;
  private final InvoiceService invoiceService;
  private final ProductRepository productRepository;
  private final ProductService productService;

  public List<CreditNote> findAll(UUID businessId) {
    return creditNoteRepository.findByBusinessIdOrderByCreatedAtDesc(businessId);
  }

  public List<CreditNote> findByInvoice(UUID businessId, UUID invoiceId) {
    return creditNoteRepository.findByBusinessIdAndInvoiceId(businessId, invoiceId);
  }

  public CreditNote findOne(UUID businessId, UUID id) {
    return creditNoteRepository
        .findByBusinessIdAndId(businessId, id)
        .orElseThrow(EntityNotFoundException::new);
  }

  @Transactional
  public CreditNote create(UUID businessId, UUID userId, CreateCreditNoteRequest dto) {
    Invoice invoice =
        invoiceRepository
            .findByBusinessIdAndId(businessId, dto.getInvoiceId())
            .orElseThrow(() -> new IllegalArgumentException("Invoice not found"));
    if ("void".equals(invoice.getStatus())) {
      throw new IllegalArgumentException("Cannot create a return against a void invoice");
    }

    Map<UUID, InvoiceItem> itemsById =
        invoice.getItems().stream().collect(Collectors.toMap(InvoiceItem::getId, i -> i));

    // Cap each line at what's actually left to return, accounting for any
    // credit notes already issued against this same invoice.
    Map<UUID, BigDecimal> alreadyReturned =
        creditNoteRepository.findByBusinessIdAndInvoiceId(businessId, invoice.getId()).stream()
            .flatMap(cn -> cn.getItems().stream())
            .collect(
                Collectors.groupingBy(
                    CreditNoteItem::getInvoiceItemId,
                    Collectors.reducing(BigDecimal.ZERO, CreditNoteItem::getQuantity, BigDecimal::add)));

    CreditNote creditNote = new CreditNote();
    creditNote.setBusinessId(businessId);
    creditNote.setInvoiceId(invoice.getId());
    creditNote.setCustomerId(invoice.getCustomerId());
    creditNote.setCreatedByUserId(userId);
    creditNote.setReason(dto.getReason());

    BigDecimal subtotal = BigDecimal.ZERO;
    BigDecimal taxTotal = BigDecimal.ZERO;

    for (CreditNoteItemRequest line : dto.getItems()) {
      InvoiceItem invoiceItem = itemsById.get(line.getInvoiceItemId());
      if (invoiceItem == null) {
        throw new IllegalArgumentException("Invoice line " + line.getInvoiceItemId() + " not found");
      }

      BigDecimal returned = alreadyReturned.getOrDefault(invoiceItem.getId(), BigDecimal.ZERO);
      BigDecimal remaining = invoiceItem.getQuantity().subtract(returned);
      if (line.getQuantity().compareTo(remaining) > 0) {
        throw new IllegalArgumentException(
            "Cannot return "
                + line.getQuantity()
                + " of \""
                + invoiceItem.getProductName()
                + "\" — only "
                + remaining
                + " left to return");
      }

      BigDecimal lineSubtotal = invoiceItem.getUnitPrice().multiply(line.getQuantity());
      BigDecimal lineTax =
          lineSubtotal.multiply(invoiceItem.getTaxRatePercent()).divide(HUNDRED, 2, RoundingMode.HALF_UP);
      BigDecimal lineTotal = lineSubtotal.add(lineTax);

      subtotal = subtotal.add(lineSubtotal);
      taxTotal = taxTotal.add(lineTax);

      CreditNoteItem item = new CreditNoteItem();
      item.setCreditNote(creditNote);
      item.setInvoiceItemId(invoiceItem.getId());
      item.setProductId(invoiceItem.getProductId());
      item.setProductName(invoiceItem.getProductName());
      item.setQuantity(line.getQuantity());
      item.setUnitPrice(invoiceItem.getUnitPrice());
      item.setTaxRatePercent(invoiceItem.getTaxRatePercent());
      item.setLineTotal(lineTotal);
      creditNote.getItems().add(item);

      // Returned goods go back into stock.
      Product product = productRepository.findById(invoiceItem.getProductId()).orElseThrow();
      productService.restockForReturn(product, line.getQuantity());
    }

    long count = creditNoteRepository.countByBusinessId(businessId);
    creditNote.setCreditNoteNumber("CN-" + String.format("%04d", count + 1));
    creditNote.setSubtotal(subtotal);
    creditNote.setTaxTotal(taxTotal);
    creditNote.setTotalAmount(subtotal.add(taxTotal));

    CreditNote saved = creditNoteRepository.save(creditNote);

    // Same persistence-context staleness caveat seen elsewhere: `invoice`
    // was loaded before this credit note existed, so its `creditNotes`
    // collection won't pick up the new row on its own — append in-memory
    // so the status recompute below (and the response the caller returns)
    // both see it immediately.
    invoice.getCreditNotes().add(saved);
    invoiceService.recomputeStatusAfterReturn(invoice);

    return saved;
  }
}
