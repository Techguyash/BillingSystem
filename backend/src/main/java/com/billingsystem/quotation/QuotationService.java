package com.billingsystem.quotation;

import com.billingsystem.customer.CustomerRepository;
import com.billingsystem.invoice.Invoice;
import com.billingsystem.invoice.InvoiceService;
import com.billingsystem.invoice.dto.CreateInvoiceItemRequest;
import com.billingsystem.invoice.dto.CreateInvoiceRequest;
import com.billingsystem.product.Product;
import com.billingsystem.product.ProductRepository;
import com.billingsystem.quotation.dto.CreateQuotationItemRequest;
import com.billingsystem.quotation.dto.CreateQuotationRequest;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuotationService {

  private static final BigDecimal HUNDRED = new BigDecimal("100");

  private final QuotationRepository quotationRepository;
  private final ProductRepository productRepository;
  private final CustomerRepository customerRepository;
  private final InvoiceService invoiceService;

  public List<Quotation> findAll(UUID businessId) {
    return quotationRepository.findTop100ByBusinessIdOrderByCreatedAtDesc(businessId);
  }

  public Quotation findOne(UUID businessId, UUID id) {
    return quotationRepository
        .findByBusinessIdAndId(businessId, id)
        .orElseThrow(EntityNotFoundException::new);
  }

  @Transactional
  public Quotation create(UUID businessId, UUID userId, CreateQuotationRequest dto) {
    if (dto.getCustomerId() != null) {
      customerRepository
          .findById(dto.getCustomerId())
          .filter(c -> c.getBusinessId().equals(businessId))
          .orElseThrow(() -> new IllegalArgumentException("Invalid customer"));
    }

    Quotation quotation = new Quotation();
    quotation.setBusinessId(businessId);
    quotation.setCustomerId(dto.getCustomerId());
    quotation.setCreatedByUserId(userId);
    quotation.setValidUntil(dto.getValidUntil());
    quotation.setNotes(dto.getNotes());

    BigDecimal subtotal = BigDecimal.ZERO;
    BigDecimal taxTotal = BigDecimal.ZERO;

    for (CreateQuotationItemRequest line : dto.getItems()) {
      Product product =
          productRepository
              .findById(line.getProductId())
              .filter(p -> p.getBusinessId().equals(businessId))
              .orElseThrow(
                  () -> new IllegalArgumentException("Product " + line.getProductId() + " not found"));

      BigDecimal unitPrice = line.getUnitPrice() != null ? line.getUnitPrice() : product.getSellingPrice();
      BigDecimal taxRatePercent = product.getTaxRatePercent();
      BigDecimal lineSubtotal = unitPrice.multiply(line.getQuantity());
      BigDecimal lineTax = lineSubtotal.multiply(taxRatePercent).divide(HUNDRED, 2, RoundingMode.HALF_UP);
      BigDecimal lineTotal = lineSubtotal.add(lineTax);

      subtotal = subtotal.add(lineSubtotal);
      taxTotal = taxTotal.add(lineTax);

      QuotationItem item = new QuotationItem();
      item.setQuotation(quotation);
      item.setProductId(product.getId());
      item.setProductName(product.getName());
      item.setQuantity(line.getQuantity());
      item.setUnitPrice(unitPrice);
      item.setTaxRatePercent(taxRatePercent);
      item.setLineTotal(lineTotal);
      quotation.getItems().add(item);
    }

    BigDecimal discountTotal = dto.getDiscountTotal() != null ? dto.getDiscountTotal() : BigDecimal.ZERO;
    BigDecimal preDiscountTotal = subtotal.add(taxTotal);
    if (discountTotal.compareTo(preDiscountTotal) > 0) {
      throw new IllegalArgumentException(
          "Discount of " + discountTotal + " cannot exceed the quotation total of " + preDiscountTotal);
    }

    long count = quotationRepository.countByBusinessId(businessId);
    quotation.setQuotationNumber("QUO-" + String.format("%04d", count + 1));
    quotation.setSubtotal(subtotal);
    quotation.setTaxTotal(taxTotal);
    quotation.setDiscountTotal(discountTotal);
    quotation.setTotalAmount(preDiscountTotal.subtract(discountTotal));

    return quotationRepository.save(quotation);
  }

  public Quotation updateStatus(UUID businessId, UUID id, String status) {
    Quotation quotation = findOne(businessId, id);
    if ("converted".equals(quotation.getStatus())) {
      throw new IllegalArgumentException("This quotation has already been converted to an invoice");
    }
    quotation.setStatus(status);
    return quotationRepository.save(quotation);
  }

  public void remove(UUID businessId, UUID id) {
    Quotation quotation = findOne(businessId, id);
    if ("converted".equals(quotation.getStatus())) {
      throw new IllegalArgumentException("Cannot delete a quotation that's already been converted");
    }
    quotationRepository.delete(quotation);
  }

  /** Converts an accepted quotation into a real sale — same prices as quoted, not today's. */
  @Transactional
  public Invoice convertToInvoice(UUID businessId, UUID userId, UUID id, String paymentMethod) {
    Quotation quotation = findOne(businessId, id);
    if ("converted".equals(quotation.getStatus())) {
      throw new IllegalArgumentException("This quotation has already been converted to an invoice");
    }

    CreateInvoiceRequest invoiceRequest = new CreateInvoiceRequest();
    invoiceRequest.setCustomerId(quotation.getCustomerId());
    invoiceRequest.setPaymentMethod(paymentMethod);
    invoiceRequest.setDiscountTotal(quotation.getDiscountTotal());
    invoiceRequest.setNotes("Converted from quotation " + quotation.getQuotationNumber());
    invoiceRequest.setItems(
        quotation.getItems().stream()
            .map(
                item -> {
                  CreateInvoiceItemRequest line = new CreateInvoiceItemRequest();
                  line.setProductId(item.getProductId());
                  line.setQuantity(item.getQuantity());
                  line.setUnitPrice(item.getUnitPrice());
                  return line;
                })
            .toList());

    Invoice invoice = invoiceService.create(businessId, userId, invoiceRequest);

    quotation.setStatus("converted");
    quotation.setConvertedInvoiceId(invoice.getId());
    quotationRepository.save(quotation);

    return invoice;
  }
}
