package com.billingsystem.search;

import com.billingsystem.customer.Customer;
import com.billingsystem.customer.CustomerService;
import com.billingsystem.invoice.Invoice;
import com.billingsystem.invoice.InvoiceRepository;
import com.billingsystem.product.Product;
import com.billingsystem.product.ProductService;
import com.billingsystem.supplier.Supplier;
import com.billingsystem.supplier.SupplierService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Backs the topbar global search — a single call fans out across the
 * entities a cashier/owner actually looks things up by by name by day to
 * day, capped per category so the dropdown stays fast and scannable.
 */
@Service
@RequiredArgsConstructor
public class SearchService {

  private static final int LIMIT_PER_CATEGORY = 5;

  private final ProductService productService;
  private final CustomerService customerService;
  private final SupplierService supplierService;
  private final InvoiceRepository invoiceRepository;

  public SearchResults search(UUID businessId, String query) {
    if (query == null || query.isBlank()) {
      return new SearchResults(List.of(), List.of(), List.of(), List.of());
    }

    List<Product> products = productService.findAll(businessId, query).stream()
        .limit(LIMIT_PER_CATEGORY)
        .toList();
    List<Customer> customers = customerService.findAll(businessId, query).stream()
        .limit(LIMIT_PER_CATEGORY)
        .toList();
    List<Supplier> suppliers = supplierService.findAll(businessId, query).stream()
        .limit(LIMIT_PER_CATEGORY)
        .toList();
    List<Invoice> invoices =
        invoiceRepository
            .findTop5ByBusinessIdAndInvoiceNumberContainingIgnoreCaseOrderByCreatedAtDesc(
                businessId, query);

    return new SearchResults(products, customers, suppliers, invoices);
  }

  public record SearchResults(
      List<Product> products, List<Customer> customers, List<Supplier> suppliers, List<Invoice> invoices) {}
}
