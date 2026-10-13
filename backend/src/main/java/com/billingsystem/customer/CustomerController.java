package com.billingsystem.customer;

import com.billingsystem.auth.CurrentUser;
import com.billingsystem.customer.dto.CustomerRequest;
import com.billingsystem.customer.dto.UpdateCustomerRequest;
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

  @GetMapping
  public List<Customer> findAll(@RequestParam(required = false) String search) {
    return customerService.findAll(CurrentUser.get().getBusinessId(), search);
  }

  @GetMapping("/{id}")
  public Customer findOne(@PathVariable UUID id) {
    return customerService.findOne(CurrentUser.get().getBusinessId(), id);
  }

  @PostMapping
  public Customer create(@Valid @RequestBody CustomerRequest dto) {
    return customerService.create(CurrentUser.get().getBusinessId(), dto);
  }

  @PatchMapping("/{id}")
  public Customer update(@PathVariable UUID id, @Valid @RequestBody UpdateCustomerRequest dto) {
    return customerService.update(CurrentUser.get().getBusinessId(), id, dto);
  }

  @DeleteMapping("/{id}")
  public void remove(@PathVariable UUID id) {
    customerService.remove(CurrentUser.get().getBusinessId(), id);
  }
}
