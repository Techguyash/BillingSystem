package com.billingsystem.customer;

import com.billingsystem.audit.AuditLogService;
import com.billingsystem.auth.CurrentUser;
import com.billingsystem.customer.dto.CustomerRequest;
import com.billingsystem.customer.dto.UpdateCustomerRequest;
import com.billingsystem.ledger.LedgerEntry;
import com.billingsystem.ledger.LedgerService;
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
@RequestMapping("/customers")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('customer.manage')")
public class CustomerController {

  private final CustomerService customerService;
  private final LedgerService ledgerService;
  private final AuditLogService auditLogService;

  @GetMapping
  public List<Customer> findAll(@RequestParam(required = false) String search) {
    return customerService.findAll(CurrentUser.get().getBusinessId(), search);
  }

  @GetMapping("/{id}")
  public Customer findOne(@PathVariable UUID id) {
    return customerService.findOne(CurrentUser.get().getBusinessId(), id);
  }

  @GetMapping("/{id}/ledger")
  public List<LedgerEntry> ledger(@PathVariable UUID id) {
    return ledgerService.customerLedger(CurrentUser.get().getBusinessId(), id);
  }

  @PostMapping
  public Customer create(@Valid @RequestBody CustomerRequest dto) {
    var user = CurrentUser.get();
    Customer customer = customerService.create(user.getBusinessId(), dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "customer.create", "Customer", customer.getId(),
        "Created customer \"" + customer.getName() + "\"");
    return customer;
  }

  @PatchMapping("/{id}")
  public Customer update(@PathVariable UUID id, @Valid @RequestBody UpdateCustomerRequest dto) {
    var user = CurrentUser.get();
    Customer customer = customerService.update(user.getBusinessId(), id, dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "customer.update", "Customer", customer.getId(),
        "Updated customer \"" + customer.getName() + "\"");
    return customer;
  }

  @DeleteMapping("/{id}")
  public void remove(@PathVariable UUID id) {
    var user = CurrentUser.get();
    Customer customer = customerService.findOne(user.getBusinessId(), id);
    customerService.remove(user.getBusinessId(), id);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "customer.deactivate", "Customer", id,
        "Deactivated customer \"" + customer.getName() + "\"");
  }
}
