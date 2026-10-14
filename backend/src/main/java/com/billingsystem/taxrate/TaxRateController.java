package com.billingsystem.taxrate;

import com.billingsystem.auth.CurrentUser;
import com.billingsystem.taxrate.dto.TaxRateRequest;
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
@RequestMapping("/tax-rates")
@RequiredArgsConstructor
public class TaxRateController {

  private final TaxRateService taxRateService;

  @GetMapping
  public List<TaxRate> findAll() {
    return taxRateService.findAll(CurrentUser.get().getBusinessId());
  }

  @GetMapping("/active")
  public List<TaxRate> findActive() {
    return taxRateService.findActive(CurrentUser.get().getBusinessId());
  }

  @PreAuthorize("hasAuthority('tax_rate.manage')")
  @PostMapping
  public TaxRate create(@Valid @RequestBody TaxRateRequest dto) {
    return taxRateService.create(CurrentUser.get().getBusinessId(), dto);
  }

  @PreAuthorize("hasAuthority('tax_rate.manage')")
  @PatchMapping("/{id}")
  public TaxRate update(@PathVariable UUID id, @Valid @RequestBody TaxRateRequest dto) {
    return taxRateService.update(CurrentUser.get().getBusinessId(), id, dto);
  }

  @PreAuthorize("hasAuthority('tax_rate.manage')")
  @DeleteMapping("/{id}")
  public void remove(@PathVariable UUID id) {
    taxRateService.remove(CurrentUser.get().getBusinessId(), id);
  }
}
