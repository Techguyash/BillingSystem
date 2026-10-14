package com.billingsystem.returns;

import com.billingsystem.audit.AuditLogService;
import com.billingsystem.auth.CurrentUser;
import com.billingsystem.returns.dto.CreateDebitNoteRequest;
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
@RequestMapping("/debit-notes")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('debit_note.manage')")
public class DebitNoteController {

  private final DebitNoteService debitNoteService;
  private final AuditLogService auditLogService;

  @GetMapping
  public List<DebitNote> findAll(@RequestParam(required = false) UUID purchaseOrderId) {
    UUID businessId = CurrentUser.get().getBusinessId();
    return purchaseOrderId != null
        ? debitNoteService.findByPurchaseOrder(businessId, purchaseOrderId)
        : debitNoteService.findAll(businessId);
  }

  @GetMapping("/{id}")
  public DebitNote findOne(@PathVariable UUID id) {
    return debitNoteService.findOne(CurrentUser.get().getBusinessId(), id);
  }

  @PostMapping
  public DebitNote create(@Valid @RequestBody CreateDebitNoteRequest dto) {
    var user = CurrentUser.get();
    DebitNote debitNote = debitNoteService.create(user.getBusinessId(), user.getUserId(), dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "debit_note.create", "DebitNote",
        debitNote.getId(),
        "Recorded purchase return " + debitNote.getDebitNoteNumber() + " for " + debitNote.getTotalAmount());
    return debitNote;
  }
}
