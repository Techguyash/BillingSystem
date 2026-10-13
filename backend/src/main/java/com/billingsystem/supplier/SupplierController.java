package com.billingsystem.supplier;

import com.billingsystem.auth.CurrentUser;
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

  @GetMapping
  public List<Supplier> findAll(@RequestParam(required = false) String search) {
    return supplierService.findAll(CurrentUser.get().getBusinessId(), search);
  }

  @GetMapping("/{id}")
  public Supplier findOne(@PathVariable UUID id) {
    return supplierService.findOne(CurrentUser.get().getBusinessId(), id);
  }

  @PostMapping
  public Supplier create(@Valid @RequestBody SupplierRequest dto) {
    return supplierService.create(CurrentUser.get().getBusinessId(), dto);
  }

  @PatchMapping("/{id}")
  public Supplier update(@PathVariable UUID id, @Valid @RequestBody UpdateSupplierRequest dto) {
    return supplierService.update(CurrentUser.get().getBusinessId(), id, dto);
  }

  @DeleteMapping("/{id}")
  public void remove(@PathVariable UUID id) {
    supplierService.remove(CurrentUser.get().getBusinessId(), id);
  }
}
