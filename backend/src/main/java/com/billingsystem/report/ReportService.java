package com.billingsystem.report;

import com.billingsystem.business.Business;
import com.billingsystem.business.BusinessService;
import com.billingsystem.invoice.Invoice;
import com.billingsystem.invoice.InvoiceItem;
import com.billingsystem.invoice.InvoiceRepository;
import com.billingsystem.invoice.Payment;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * All reports work off a single date-range invoice fetch rather than
 * per-report SQL aggregations — simplest to reason about and fast enough at
 * single-business/single-location data volumes (hundreds to low thousands
 * of invoices). Revisit with DB-side aggregation if that stops being true.
 */
@Service
@RequiredArgsConstructor
public class ReportService {

  private static final ZoneId ZONE = ZoneId.systemDefault();
  private static final DateTimeFormatter DAY_FORMAT = DateTimeFormatter.ISO_LOCAL_DATE;

  private final InvoiceRepository invoiceRepository;
  private final BusinessService businessService;

  private List<Invoice> findInRange(UUID businessId, LocalDate from, LocalDate to) {
    Instant start = from.atStartOfDay(ZONE).toInstant();
    Instant end = to.plusDays(1).atStartOfDay(ZONE).toInstant();
    return invoiceRepository.findByBusinessIdAndCreatedAtBetweenAndStatusNot(
        businessId, start, end, "void");
  }

  public SalesSummary salesSummary(UUID businessId, LocalDate from, LocalDate to) {
    List<Invoice> invoices = findInRange(businessId, from, to);

    BigDecimal totalSales = BigDecimal.ZERO;
    BigDecimal totalTax = BigDecimal.ZERO;
    BigDecimal totalDiscount = BigDecimal.ZERO;
    Map<String, DailyPoint> byDay = new LinkedHashMap<>();

    // Pre-seed every day in range so the chart doesn't skip days with no sales.
    for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
      byDay.put(d.format(DAY_FORMAT), new DailyPoint(d.format(DAY_FORMAT), BigDecimal.ZERO, 0));
    }

    for (Invoice invoice : invoices) {
      totalSales = totalSales.add(invoice.getTotalAmount());
      totalTax = totalTax.add(invoice.getTaxTotal());
      totalDiscount = totalDiscount.add(invoice.getDiscountTotal());

      String day = invoice.getCreatedAt().atZone(ZONE).toLocalDate().format(DAY_FORMAT);
      DailyPoint point = byDay.get(day);
      if (point != null) {
        byDay.put(day, point.plus(invoice.getTotalAmount()));
      }
    }

    return new SalesSummary(
        totalSales, totalTax, totalDiscount, invoices.size(), new ArrayList<>(byDay.values()));
  }

  public GstSummary gstSummary(UUID businessId, LocalDate from, LocalDate to) {
    Business business = businessService.findById(businessId);
    List<Invoice> invoices = findInRange(businessId, from, to);

    BigDecimal taxableValue = BigDecimal.ZERO;
    BigDecimal cgst = BigDecimal.ZERO;
    BigDecimal sgst = BigDecimal.ZERO;
    BigDecimal igst = BigDecimal.ZERO;

    for (Invoice invoice : invoices) {
      taxableValue = taxableValue.add(invoice.getSubtotal());
      String customerState = invoice.getCustomer() != null ? invoice.getCustomer().getState() : null;
      boolean sameState =
          business.getState() != null
              && customerState != null
              && business.getState().trim().equalsIgnoreCase(customerState.trim());

      // Default to intra-state when we can't tell (e.g. walk-in customer
      // with no state on file) — mirrors the frontend's computeTaxBreakdown.
      if (sameState || customerState == null) {
        BigDecimal half = invoice.getTaxTotal().divide(new BigDecimal(2), 2, RoundingMode.HALF_UP);
        cgst = cgst.add(half);
        sgst = sgst.add(half);
      } else {
        igst = igst.add(invoice.getTaxTotal());
      }
    }

    return new GstSummary(taxableValue, cgst, sgst, igst, cgst.add(sgst).add(igst));
  }

  public List<ProductSales> topProducts(UUID businessId, LocalDate from, LocalDate to, int limit) {
    List<Invoice> invoices = findInRange(businessId, from, to);
    Map<UUID, ProductAccumulator> byProduct = new LinkedHashMap<>();

    for (Invoice invoice : invoices) {
      for (InvoiceItem item : invoice.getItems()) {
        byProduct
            .computeIfAbsent(item.getProductId(), id -> new ProductAccumulator(item.getProductName()))
            .add(item.getQuantity(), item.getLineTotal());
      }
    }

    return byProduct.entrySet().stream()
        .map(
            e ->
                new ProductSales(
                    e.getKey(), e.getValue().productName, e.getValue().quantity, e.getValue().revenue))
        .sorted(Comparator.comparing(ProductSales::revenue).reversed())
        .limit(limit)
        .toList();
  }

  public List<PaymentMethodTotal> paymentMethodBreakdown(UUID businessId, LocalDate from, LocalDate to) {
    List<Invoice> invoices = findInRange(businessId, from, to);
    Map<String, BigDecimal> totals = new LinkedHashMap<>();

    for (Invoice invoice : invoices) {
      for (Payment payment : invoice.getPayments()) {
        totals.merge(payment.getMethod(), payment.getAmount(), BigDecimal::add);
      }
    }

    BigDecimal grandTotal = totals.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);

    return totals.entrySet().stream()
        .map(
            e -> {
              double percent =
                  grandTotal.signum() == 0
                      ? 0
                      : e.getValue().doubleValue() / grandTotal.doubleValue() * 100;
              return new PaymentMethodTotal(e.getKey(), e.getValue(), Math.round(percent * 10) / 10.0);
            })
        .sorted(Comparator.comparing(PaymentMethodTotal::amount).reversed())
        .toList();
  }

  private static class ProductAccumulator {
    final String productName;
    BigDecimal quantity = BigDecimal.ZERO;
    BigDecimal revenue = BigDecimal.ZERO;

    ProductAccumulator(String productName) {
      this.productName = productName;
    }

    void add(BigDecimal qty, BigDecimal lineTotal) {
      quantity = quantity.add(qty);
      revenue = revenue.add(lineTotal);
    }
  }

  public record DailyPoint(String date, BigDecimal sales, int invoiceCount) {
    DailyPoint plus(BigDecimal amount) {
      return new DailyPoint(date, sales.add(amount), invoiceCount + 1);
    }
  }

  public record SalesSummary(
      BigDecimal totalSales,
      BigDecimal totalTax,
      BigDecimal totalDiscount,
      int invoiceCount,
      List<DailyPoint> daily) {}

  public record GstSummary(
      BigDecimal taxableValue, BigDecimal cgst, BigDecimal sgst, BigDecimal igst, BigDecimal totalTax) {}

  public record ProductSales(UUID productId, String productName, BigDecimal quantity, BigDecimal revenue) {}

  public record PaymentMethodTotal(String method, BigDecimal amount, double percent) {}
}
