package com.billingsystem.business;

import com.billingsystem.audit.AuditLogService;
import com.billingsystem.auth.CurrentUser;
import com.billingsystem.business.dto.UpdateBusinessRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/business")
@RequiredArgsConstructor
public class BusinessController {

  private final BusinessService businessService;
  private final AuditLogService auditLogService;

  @GetMapping("/me")
  public Business me() {
    return businessService.findById(CurrentUser.get().getBusinessId());
  }

  @PreAuthorize("hasAuthority('settings.manage')")
  @PatchMapping("/me")
  public Business update(@Valid @RequestBody UpdateBusinessRequest dto) {
    var user = CurrentUser.get();
    Business business = businessService.update(user.getBusinessId(), dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "settings.update", "Business", business.getId(),
        "Updated business settings");
    return business;
  }
}
