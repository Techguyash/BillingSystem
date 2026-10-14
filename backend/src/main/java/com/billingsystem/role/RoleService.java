package com.billingsystem.role;

import com.billingsystem.role.dto.RoleRequest;
import com.billingsystem.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RoleService {

  private final RoleRepository roleRepository;
  private final UserRepository userRepository;

  public List<Role> findByBusiness(UUID businessId) {
    return roleRepository.findByBusinessId(businessId);
  }

  public Role findById(UUID id) {
    return roleRepository.findById(id).orElseThrow();
  }

  public Role findOne(UUID businessId, UUID id) {
    return roleRepository
        .findByBusinessIdAndId(businessId, id)
        .orElseThrow(EntityNotFoundException::new);
  }

  /** Creates the default Owner/Manager/Cashier roles for a newly set-up business. */
  public List<Role> seedDefaultRoles(UUID businessId) {
    List<Role> roles = new ArrayList<>();
    Permissions.DEFAULT_ROLES.forEach(
        (name, permissions) -> {
          Role role = new Role();
          role.setBusinessId(businessId);
          role.setName(name);
          role.setPermissions(permissions);
          role.setSystem(true);
          roles.add(role);
        });
    return roleRepository.saveAll(roles);
  }

  /**
   * Existing installs have system roles (Owner/Manager/Cashier) whose
   * `permissions` were snapshotted into the database at creation time —
   * adding a new permission constant in code (e.g. a new feature's
   * `expense.manage`) does NOT retroactively reach those stored rows. Users
   * can't edit system roles themselves (see `update`/`remove` above), so
   * without this, a business's own Owner could get silently locked out of
   * every new feature forever. Runs every boot; a no-op once in sync.
   */
  public void syncSystemRolePermissions(UUID businessId) {
    for (Role role : roleRepository.findByBusinessId(businessId)) {
      if (!role.isSystem()) continue;
      List<String> canonical = Permissions.DEFAULT_ROLES.get(role.getName());
      if (canonical != null && !canonical.equals(role.getPermissions())) {
        role.setPermissions(canonical);
        roleRepository.save(role);
      }
    }
  }

  public Role create(UUID businessId, RoleRequest dto) {
    validatePermissions(dto.getPermissions());
    roleRepository
        .findByBusinessIdAndName(businessId, dto.getName())
        .ifPresent(
            r -> {
              throw new IllegalArgumentException("A role named \"" + dto.getName() + "\" already exists");
            });

    Role role = new Role();
    role.setBusinessId(businessId);
    role.setName(dto.getName());
    role.setPermissions(dto.getPermissions());
    role.setSystem(false);
    return roleRepository.save(role);
  }

  public Role update(UUID businessId, UUID id, RoleRequest dto) {
    validatePermissions(dto.getPermissions());
    Role role = findOne(businessId, id);
    if (role.isSystem()) {
      throw new IllegalArgumentException(
          "\"" + role.getName() + "\" is a built-in role and cannot be edited");
    }
    role.setName(dto.getName());
    role.setPermissions(dto.getPermissions());
    return roleRepository.save(role);
  }

  public void remove(UUID businessId, UUID id) {
    Role role = findOne(businessId, id);
    if (role.isSystem()) {
      throw new IllegalArgumentException(
          "\"" + role.getName() + "\" is a built-in role and cannot be deleted");
    }
    if (userRepository.countByBusinessIdAndRoleId(businessId, id) > 0) {
      throw new IllegalArgumentException(
          "Cannot delete \"" + role.getName() + "\" while users are still assigned to it");
    }
    roleRepository.delete(role);
  }

  private void validatePermissions(List<String> permissions) {
    if (!Permissions.ALL_PERMISSIONS.containsAll(permissions)) {
      throw new IllegalArgumentException("One or more permissions are not recognized");
    }
  }
}
