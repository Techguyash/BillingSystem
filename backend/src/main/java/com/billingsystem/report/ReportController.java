package com.billingsystem.report;

import com.billingsystem.auth.CurrentUser;
import com.billingsystem.invoice.InvoiceService;
import com.billingsystem.product.Product;
import com.billingsystem.product.ProductService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {

  private final InvoiceService invoiceService;
  private final ProductService productService;
  private final ReportService reportService;

  // summary/sales/payment-methods/low-stock are deliberately NOT gated by
  // reports.view — they feed the Dashboard, which is the home page every
  // role lands on (including a plain Cashier). Only the deeper BI endpoints
  // below (top-products, gst) are reserved for roles with report access,
  // matching the default Cashier role's permission set.
  @GetMapping("/summary")
  public Summary summary() {
    var businessId = CurrentUser.get().getBusinessId();
    var today = invoiceService.getTodaySummary(businessId);
    long productsInStock = productService.countInStock(businessId);
    long lowStockCount = productService.countLowStock(businessId);
    var totalOutstanding = invoiceService.getTotalOutstanding(businessId);
    return new Summary(
        today.totalSales(), today.invoiceCount(), productsInStock, lowStockCount, totalOutstanding);
  }

  @GetMapping("/sales")
  public ReportService.SalesSummary sales(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    DateRange range = resolveRange(from, to);
    return reportService.salesSummary(CurrentUser.get().getBusinessId(), range.from(), range.to());
  }

  @PreAuthorize("hasAuthority('reports.view_gst')")
  @GetMapping("/gst")
  public ReportService.GstSummary gst(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    DateRange range = resolveRange(from, to);
    return reportService.gstSummary(CurrentUser.get().getBusinessId(), range.from(), range.to());
  }

  @PreAuthorize("hasAuthority('reports.view')")
  @GetMapping("/top-products")
  public List<ReportService.ProductSales> topProducts(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
      @RequestParam(defaultValue = "10") int limit) {
    DateRange range = resolveRange(from, to);
    return reportService.topProducts(CurrentUser.get().getBusinessId(), range.from(), range.to(), limit);
  }

  @GetMapping("/payment-methods")
  public List<ReportService.PaymentMethodTotal> paymentMethods(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    DateRange range = resolveRange(from, to);
    return reportService.paymentMethodBreakdown(
        CurrentUser.get().getBusinessId(), range.from(), range.to());
  }

  @GetMapping("/low-stock")
  public List<Product> lowStock() {
    return productService.findLowStock(CurrentUser.get().getBusinessId());
  }

  /** Defaults to the last 30 days (inclusive of today) when no range is given. */
  private DateRange resolveRange(LocalDate from, LocalDate to) {
    LocalDate resolvedTo = to != null ? to : LocalDate.now();
    LocalDate resolvedFrom = from != null ? from : resolvedTo.minusDays(29);
    return new DateRange(resolvedFrom, resolvedTo);
  }

  private record DateRange(LocalDate from, LocalDate to) {}

  public record Summary(
      BigDecimal todaySales,
      int todayInvoiceCount,
      long productsInStock,
      long lowStockCount,
      BigDecimal totalOutstanding) {}
}
