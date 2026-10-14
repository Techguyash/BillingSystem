package com.billingsystem.supplier;

import com.billingsystem.audit.AuditLogService;
import com.billingsystem.auth.CurrentUser;
import com.billingsystem.ledger.LedgerEntry;
import com.billingsystem.ledger.LedgerService;
import com.billingsystem.supplier.dto.SupplierRequest;
import com.billingsystem.supplier.dto.UpdateSupplierRequest;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/suppliers")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('supplier.manage')")
public class SupplierController {

  private final SupplierService supplierService;
  private final LedgerService ledgerService;
  private final AuditLogService auditLogService;

  @GetMapping
  public List<Supplier> findAll(@RequestParam(required = false) String search) {
    return supplierService.findAll(CurrentUser.get().getBusinessId(), search);
  }

  @GetMapping("/{id}")
  public Supplier findOne(@PathVariable UUID id) {
    return supplierService.findOne(CurrentUser.get().getBusinessId(), id);
  }

  @GetMapping("/{id}/ledger")
  public List<LedgerEntry> ledger(@PathVariable UUID id) {
    return ledgerService.supplierLedger(CurrentUser.get().getBusinessId(), id);
  }

  @PostMapping
  public Supplier create(@Valid @RequestBody SupplierRequest dto) {
    var user = CurrentUser.get();
    Supplier supplier = supplierService.create(user.getBusinessId(), dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "supplier.create", "Supplier", supplier.getId(),
        "Created supplier \"" + supplier.getName() + "\"");
    return supplier;
  }

  @PatchMapping("/{id}")
  public Supplier update(@PathVariable UUID id, @Valid @RequestBody UpdateSupplierRequest dto) {
    var user = CurrentUser.get();
    Supplier supplier = supplierService.update(user.getBusinessId(), id, dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "supplier.update", "Supplier", supplier.getId(),
        "Updated supplier \"" + supplier.getName() + "\"");
    return supplier;
  }

  @DeleteMapping("/{id}")
  public void remove(@PathVariable UUID id) {
    var user = CurrentUser.get();
    Supplier supplier = supplierService.findOne(user.getBusinessId(), id);
    supplierService.remove(user.getBusinessId(), id);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "supplier.deactivate", "Supplier", id,
        "Deactivated supplier \"" + supplier.getName() + "\"");
  }
}
