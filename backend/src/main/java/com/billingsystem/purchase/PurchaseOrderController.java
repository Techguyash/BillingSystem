package com.billingsystem.purchase;

import com.billingsystem.audit.AuditLogService;
import com.billingsystem.auth.CurrentUser;
import com.billingsystem.purchase.dto.CreatePurchaseOrderRequest;
import com.billingsystem.purchase.dto.RecordSupplierPaymentRequest;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/purchases")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('inventory.adjust_stock')")
public class PurchaseOrderController {

  private final PurchaseOrderService purchaseOrderService;
  private final AuditLogService auditLogService;

  @GetMapping
  public List<PurchaseOrder> findAll() {
    return purchaseOrderService.findAll(CurrentUser.get().getBusinessId());
  }

  @GetMapping("/{id}")
  public PurchaseOrder findOne(@PathVariable UUID id) {
    return purchaseOrderService.findOne(CurrentUser.get().getBusinessId(), id);
  }

  @PostMapping
  public PurchaseOrder create(@Valid @RequestBody CreatePurchaseOrderRequest dto) {
    var user = CurrentUser.get();
    PurchaseOrder purchase = purchaseOrderService.create(user.getBusinessId(), user.getUserId(), dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "purchase.create", "PurchaseOrder",
        purchase.getId(), "Recorded purchase " + purchase.getPurchaseNumber() + " for " + purchase.getTotalAmount());
    return purchase;
  }

  @PostMapping("/{id}/payments")
  public PurchaseOrder recordPayment(
      @PathVariable UUID id, @Valid @RequestBody RecordSupplierPaymentRequest dto) {
    var user = CurrentUser.get();
    PurchaseOrder purchase = purchaseOrderService.recordPayment(user.getBusinessId(), id, user.getUserId(), dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "purchase.payment", "PurchaseOrder",
        purchase.getId(),
        "Paid supplier " + dto.getAmount() + " (" + dto.getMethod() + ") on " + purchase.getPurchaseNumber());
    return purchase;
  }
}
