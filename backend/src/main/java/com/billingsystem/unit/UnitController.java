package com.billingsystem.unit;

import com.billingsystem.auth.CurrentUser;
import com.billingsystem.unit.dto.UnitRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/units")
@RequiredArgsConstructor
public class UnitController {

  private final UnitService unitService;

  @GetMapping
  public List<Unit> findAll() {
    return unitService.findAll(CurrentUser.get().getBusinessId());
  }

  @PreAuthorize("hasAuthority('settings.manage')")
  @PostMapping
  public Unit create(@Valid @RequestBody UnitRequest dto) {
    return unitService.create(CurrentUser.get().getBusinessId(), dto);
  }

  @PreAuthorize("hasAuthority('settings.manage')")
  @DeleteMapping("/{id}")
  public void remove(@PathVariable UUID id) {
    unitService.remove(CurrentUser.get().getBusinessId(), id);
  }
}
