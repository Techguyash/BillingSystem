package com.billingsystem.returns;

import com.billingsystem.audit.AuditLogService;
import com.billingsystem.auth.CurrentUser;
import com.billingsystem.returns.dto.CreateCreditNoteRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/credit-notes")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('credit_note.manage')")
public class CreditNoteController {

  private final CreditNoteService creditNoteService;
  private final AuditLogService auditLogService;

  @GetMapping
  public List<CreditNote> findAll(@RequestParam(required = false) UUID invoiceId) {
    UUID businessId = CurrentUser.get().getBusinessId();
    return invoiceId != null
        ? creditNoteService.findByInvoice(businessId, invoiceId)
        : creditNoteService.findAll(businessId);
  }

  @GetMapping("/{id}")
  public CreditNote findOne(@PathVariable UUID id) {
    return creditNoteService.findOne(CurrentUser.get().getBusinessId(), id);
  }

  @PostMapping
  public CreditNote create(@Valid @RequestBody CreateCreditNoteRequest dto) {
    var user = CurrentUser.get();
    CreditNote creditNote = creditNoteService.create(user.getBusinessId(), user.getUserId(), dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "credit_note.create", "CreditNote",
        creditNote.getId(),
        "Recorded sales return " + creditNote.getCreditNoteNumber() + " for " + creditNote.getTotalAmount());
    return creditNote;
  }
}
