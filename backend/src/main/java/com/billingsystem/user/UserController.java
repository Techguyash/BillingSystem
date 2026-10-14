package com.billingsystem.user;

import com.billingsystem.audit.AuditLogService;
import com.billingsystem.auth.CurrentUser;
import com.billingsystem.user.dto.CreateUserRequest;
import com.billingsystem.user.dto.UpdateUserRequest;
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
@RequestMapping("/users")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('user.manage')")
public class UserController {

  private final UserService userService;
  private final AuditLogService auditLogService;

  @GetMapping
  public List<User> findAll() {
    return userService.findAll(CurrentUser.get().getBusinessId());
  }

  @PostMapping
  public User create(@Valid @RequestBody CreateUserRequest dto) {
    var currentUser = CurrentUser.get();
    User created = userService.createTeammate(currentUser.getBusinessId(), dto);
    auditLogService.record(
        currentUser.getBusinessId(), currentUser.getUserId(), currentUser.getName(), "user.create", "User",
        created.getId(), "Created user \"" + created.getName() + "\" (" + created.getEmail() + ")");
    return created;
  }

  @PatchMapping("/{id}")
  public User update(@PathVariable UUID id, @Valid @RequestBody UpdateUserRequest dto) {
    var currentUser = CurrentUser.get();
    User updated = userService.update(currentUser.getBusinessId(), id, currentUser.getUserId(), dto);
    auditLogService.record(
        currentUser.getBusinessId(), currentUser.getUserId(), currentUser.getName(), "user.update", "User",
        updated.getId(), "Updated user \"" + updated.getName() + "\"");
    return updated;
  }

  @DeleteMapping("/{id}")
  public void remove(@PathVariable UUID id) {
    var currentUser = CurrentUser.get();
    userService.deactivate(currentUser.getBusinessId(), id, currentUser.getUserId());
    auditLogService.record(
        currentUser.getBusinessId(), currentUser.getUserId(), currentUser.getName(), "user.deactivate", "User", id,
        "Deactivated a user");
  }
}
