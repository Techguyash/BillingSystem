package com.billingsystem.role;

import com.billingsystem.audit.AuditLogService;
import com.billingsystem.auth.CurrentUser;
import com.billingsystem.role.dto.RoleRequest;
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
@RequestMapping("/roles")
@RequiredArgsConstructor
public class RoleController {

  private final RoleService roleService;
  private final AuditLogService auditLogService;

  // Readable by anyone authenticated — the user-management form needs the
  // role list to assign one, not just settings.manage holders.
  @GetMapping
  public List<Role> findAll() {
    return roleService.findByBusiness(CurrentUser.get().getBusinessId());
  }

  @GetMapping("/permissions")
  public List<String> allPermissions() {
    return Permissions.ALL_PERMISSIONS;
  }

  @PreAuthorize("hasAuthority('role.manage')")
  @PostMapping
  public Role create(@Valid @RequestBody RoleRequest dto) {
    var user = CurrentUser.get();
    Role role = roleService.create(user.getBusinessId(), dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "role.create", "Role", role.getId(),
        "Created role \"" + role.getName() + "\"");
    return role;
  }

  @PreAuthorize("hasAuthority('role.manage')")
  @PatchMapping("/{id}")
  public Role update(@PathVariable UUID id, @Valid @RequestBody RoleRequest dto) {
    var user = CurrentUser.get();
    Role role = roleService.update(user.getBusinessId(), id, dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "role.update", "Role", role.getId(),
        "Updated role \"" + role.getName() + "\"");
    return role;
  }

  @PreAuthorize("hasAuthority('role.manage')")
  @DeleteMapping("/{id}")
  public void remove(@PathVariable UUID id) {
    var user = CurrentUser.get();
    Role role = roleService.findOne(user.getBusinessId(), id);
    roleService.remove(user.getBusinessId(), id);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "role.delete", "Role", id,
        "Deleted role \"" + role.getName() + "\"");
  }
}
