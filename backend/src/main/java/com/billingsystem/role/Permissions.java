package com.billingsystem.role;

import java.util.List;
import java.util.Map;

/**
 * Flat catalog of fine-grained permissions. Roles are a configurable set of
 * these strings (see Role entity) rather than a fixed Admin/Staff enum, so
 * each business can compose roles that match how they actually work.
 */
public final class Permissions {

  private Permissions() {}

  // Billing
  public static final String INVOICE_CREATE = "invoice.create";
  public static final String INVOICE_VOID = "invoice.void";
  public static final String INVOICE_VIEW = "invoice.view";
  // Inventory
  public static final String INVENTORY_VIEW = "inventory.view";
  public static final String INVENTORY_ADJUST_STOCK = "inventory.adjust_stock";
  public static final String PRODUCT_MANAGE = "product.manage";
  // Customers / Suppliers
  public static final String CUSTOMER_MANAGE = "customer.manage";
  public static final String SUPPLIER_MANAGE = "supplier.manage";
  // Reports
  public static final String REPORTS_VIEW = "reports.view";
  public static final String REPORTS_VIEW_GST = "reports.view_gst";
  // Settings / Admin
  public static final String SETTINGS_MANAGE = "settings.manage";
  public static final String USER_MANAGE = "user.manage";
  public static final String ROLE_MANAGE = "role.manage";
  // Expenses
  public static final String EXPENSE_MANAGE = "expense.manage";
  // Quotations/Estimates
  public static final String QUOTATION_CREATE = "quotation.create";
  public static final String QUOTATION_VIEW = "quotation.view";
  // Returns
  public static final String CREDIT_NOTE_MANAGE = "credit_note.manage";
  public static final String DEBIT_NOTE_MANAGE = "debit_note.manage";
  // Audit
  public static final String AUDIT_LOG_VIEW = "audit_log.view";
  // Discounts & tax rates
  public static final String DISCOUNT_MANAGE = "discount.manage";
  public static final String TAX_RATE_MANAGE = "tax_rate.manage";

  public static final List<String> ALL_PERMISSIONS =
      List.of(
          INVOICE_CREATE,
          INVOICE_VOID,
          INVOICE_VIEW,
          INVENTORY_VIEW,
          INVENTORY_ADJUST_STOCK,
          PRODUCT_MANAGE,
          CUSTOMER_MANAGE,
          SUPPLIER_MANAGE,
          REPORTS_VIEW,
          REPORTS_VIEW_GST,
          SETTINGS_MANAGE,
          USER_MANAGE,
          ROLE_MANAGE,
          EXPENSE_MANAGE,
          QUOTATION_CREATE,
          QUOTATION_VIEW,
          CREDIT_NOTE_MANAGE,
          DEBIT_NOTE_MANAGE,
          AUDIT_LOG_VIEW,
          DISCOUNT_MANAGE,
          TAX_RATE_MANAGE);

  /** Seeded default roles so a fresh install is usable immediately. */
  public static final Map<String, List<String>> DEFAULT_ROLES =
      Map.of(
          "Owner", ALL_PERMISSIONS,
          "Manager",
              List.of(
                  INVOICE_CREATE,
                  INVOICE_VOID,
                  INVOICE_VIEW,
                  INVENTORY_VIEW,
                  INVENTORY_ADJUST_STOCK,
                  PRODUCT_MANAGE,
                  CUSTOMER_MANAGE,
                  SUPPLIER_MANAGE,
                  REPORTS_VIEW,
                  REPORTS_VIEW_GST,
                  EXPENSE_MANAGE,
                  QUOTATION_CREATE,
                  QUOTATION_VIEW,
                  CREDIT_NOTE_MANAGE,
                  DEBIT_NOTE_MANAGE,
                  DISCOUNT_MANAGE,
                  TAX_RATE_MANAGE),
          "Cashier",
              List.of(
                  INVOICE_CREATE,
                  INVOICE_VIEW,
                  INVENTORY_VIEW,
                  CUSTOMER_MANAGE,
                  QUOTATION_CREATE,
                  QUOTATION_VIEW));
}
