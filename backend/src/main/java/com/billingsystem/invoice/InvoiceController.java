package com.billingsystem.invoice;

import com.billingsystem.audit.AuditLogService;
import com.billingsystem.auth.CurrentUser;
import com.billingsystem.invoice.dto.CreateInvoiceRequest;
import com.billingsystem.invoice.dto.RecordPaymentRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
public class InvoiceController {

  private final InvoiceService invoiceService;
  private final AuditLogService auditLogService;

  @PreAuthorize("hasAuthority('invoice.view')")
  @GetMapping
  public List<Invoice> findAll() {
    return invoiceService.findAll(CurrentUser.get().getBusinessId());
  }

  @PreAuthorize("hasAuthority('invoice.view')")
  @GetMapping("/{id}")
  public Invoice findOne(@PathVariable UUID id) {
    return invoiceService.findOne(CurrentUser.get().getBusinessId(), id);
  }

  @PreAuthorize("hasAuthority('invoice.create')")
  @PostMapping
  public Invoice create(@Valid @RequestBody CreateInvoiceRequest dto) {
    var user = CurrentUser.get();
    Invoice invoice = invoiceService.create(user.getBusinessId(), user.getUserId(), dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "invoice.create", "Invoice", invoice.getId(),
        "Created invoice " + invoice.getInvoiceNumber() + " for " + invoice.getTotalAmount());
    return invoice;
  }

  @PreAuthorize("hasAuthority('invoice.void')")
  @PatchMapping("/{id}/void")
  public Invoice voidInvoice(@PathVariable UUID id) {
    var user = CurrentUser.get();
    Invoice invoice = invoiceService.voidInvoice(user.getBusinessId(), id);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "invoice.void", "Invoice", invoice.getId(),
        "Voided invoice " + invoice.getInvoiceNumber());
    return invoice;
  }

  @PreAuthorize("hasAuthority('invoice.create')")
  @PostMapping("/{id}/payments")
  public Invoice recordPayment(@PathVariable UUID id, @Valid @RequestBody RecordPaymentRequest dto) {
    var user = CurrentUser.get();
    Invoice invoice = invoiceService.recordPayment(user.getBusinessId(), id, user.getUserId(), dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "invoice.payment", "Invoice", invoice.getId(),
        "Recorded payment of " + dto.getAmount() + " (" + dto.getMethod() + ") on " + invoice.getInvoiceNumber());
    return invoice;
  }
}
