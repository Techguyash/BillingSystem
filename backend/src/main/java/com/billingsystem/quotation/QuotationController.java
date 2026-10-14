package com.billingsystem.quotation;

import com.billingsystem.audit.AuditLogService;
import com.billingsystem.auth.CurrentUser;
import com.billingsystem.invoice.Invoice;
import com.billingsystem.quotation.dto.ConvertQuotationRequest;
import com.billingsystem.quotation.dto.CreateQuotationRequest;
import com.billingsystem.quotation.dto.UpdateQuotationStatusRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/quotations")
@RequiredArgsConstructor
public class QuotationController {

  private final QuotationService quotationService;
  private final AuditLogService auditLogService;

  @PreAuthorize("hasAuthority('quotation.view')")
  @GetMapping
  public List<Quotation> findAll() {
    return quotationService.findAll(CurrentUser.get().getBusinessId());
  }

  @PreAuthorize("hasAuthority('quotation.view')")
  @GetMapping("/{id}")
  public Quotation findOne(@PathVariable UUID id) {
    return quotationService.findOne(CurrentUser.get().getBusinessId(), id);
  }

  @PreAuthorize("hasAuthority('quotation.create')")
  @PostMapping
  public Quotation create(@Valid @RequestBody CreateQuotationRequest dto) {
    var user = CurrentUser.get();
    Quotation quotation = quotationService.create(user.getBusinessId(), user.getUserId(), dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "quotation.create", "Quotation", quotation.getId(),
        "Created quotation " + quotation.getQuotationNumber() + " for " + quotation.getTotalAmount());
    return quotation;
  }

  @PreAuthorize("hasAuthority('quotation.create')")
  @PatchMapping("/{id}/status")
  public Quotation updateStatus(
      @PathVariable UUID id, @Valid @RequestBody UpdateQuotationStatusRequest dto) {
    return quotationService.updateStatus(CurrentUser.get().getBusinessId(), id, dto.getStatus());
  }

  @PreAuthorize("hasAuthority('quotation.create')")
  @PostMapping("/{id}/convert")
  public Invoice convert(@PathVariable UUID id, @Valid @RequestBody ConvertQuotationRequest dto) {
    var user = CurrentUser.get();
    Invoice invoice =
        quotationService.convertToInvoice(user.getBusinessId(), user.getUserId(), id, dto.getPaymentMethod());
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "quotation.convert", "Quotation", id,
        "Converted quotation to invoice " + invoice.getInvoiceNumber());
    return invoice;
  }

  @PreAuthorize("hasAuthority('quotation.create')")
  @DeleteMapping("/{id}")
  public void remove(@PathVariable UUID id) {
    quotationService.remove(CurrentUser.get().getBusinessId(), id);
  }
}
