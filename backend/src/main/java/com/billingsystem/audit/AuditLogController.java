package com.billingsystem.audit;

import com.billingsystem.auth.CurrentUser;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('audit_log.view')")
public class AuditLogController {

  private final AuditLogService auditLogService;

  @GetMapping
  public List<AuditLog> findAll() {
    return auditLogService.findAll(CurrentUser.get().getBusinessId());
  }
}
