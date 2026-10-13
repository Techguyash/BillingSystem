package com.billingsystem.invoice;

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
    return invoiceService.create(user.getBusinessId(), user.getUserId(), dto);
  }

  @PreAuthorize("hasAuthority('invoice.void')")
  @PatchMapping("/{id}/void")
  public Invoice voidInvoice(@PathVariable UUID id) {
    return invoiceService.voidInvoice(CurrentUser.get().getBusinessId(), id);
  }

  @PreAuthorize("hasAuthority('invoice.create')")
  @PostMapping("/{id}/payments")
  public Invoice recordPayment(@PathVariable UUID id, @Valid @RequestBody RecordPaymentRequest dto) {
    var user = CurrentUser.get();
    return invoiceService.recordPayment(user.getBusinessId(), id, user.getUserId(), dto);
  }
}
