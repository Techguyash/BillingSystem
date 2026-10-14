package com.billingsystem.discount;

import com.billingsystem.auth.CurrentUser;
import com.billingsystem.discount.dto.DiscountRequest;
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
@RequestMapping("/discounts")
@RequiredArgsConstructor
public class DiscountController {

  private final DiscountService discountService;

  // Readable by anyone authenticated — a biller needs the full list to
  // manage the sale, not just settings.manage holders (same pattern as
  // /roles and /units).
  @GetMapping
  public List<Discount> findAll() {
    return discountService.findAll(CurrentUser.get().getBusinessId());
  }

  /** What's actually pickable on the billing screen right now. */
  @GetMapping("/active")
  public List<Discount> findActive() {
    return discountService.findActive(CurrentUser.get().getBusinessId());
  }

  @PreAuthorize("hasAuthority('discount.manage')")
  @PostMapping
  public Discount create(@Valid @RequestBody DiscountRequest dto) {
    return discountService.create(CurrentUser.get().getBusinessId(), dto);
  }

  @PreAuthorize("hasAuthority('discount.manage')")
  @PatchMapping("/{id}")
  public Discount update(@PathVariable UUID id, @Valid @RequestBody DiscountRequest dto) {
    return discountService.update(CurrentUser.get().getBusinessId(), id, dto);
  }

  @PreAuthorize("hasAuthority('discount.manage')")
  @DeleteMapping("/{id}")
  public void remove(@PathVariable UUID id) {
    discountService.remove(CurrentUser.get().getBusinessId(), id);
  }
}
