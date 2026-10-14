package com.billingsystem.user;

import com.billingsystem.auth.dto.UpdateProfileRequest;
import com.billingsystem.role.Role;
import com.billingsystem.role.RoleService;
import com.billingsystem.user.dto.CreateUserRequest;
import com.billingsystem.user.dto.UpdateUserRequest;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;
  private final RoleService roleService;
  private final PasswordEncoder passwordEncoder;

  public Optional<User> findByEmail(String email) {
    return userRepository.findByEmail(email);
  }

  public Optional<User> findById(UUID id) {
    return userRepository.findById(id);
  }

  public User create(User user) {
    return userRepository.save(user);
  }

  public List<User> findAll(UUID businessId) {
    return userRepository.findByBusinessIdOrderByCreatedAtAsc(businessId);
  }

  public User findOne(UUID businessId, UUID id) {
    return userRepository
        .findByBusinessIdAndId(businessId, id)
        .orElseThrow(EntityNotFoundException::new);
  }

  public User createTeammate(UUID businessId, CreateUserRequest dto) {
    userRepository
        .findByEmail(dto.getEmail())
        .ifPresent(
            u -> {
              throw new IllegalArgumentException(
                  "A user with that email/username already exists");
            });

    Role role = roleService.findOne(businessId, dto.getRoleId());

    User user = new User();
    user.setBusinessId(businessId);
    user.setName(dto.getName());
    user.setEmail(dto.getEmail());
    user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
    user.setRole(role);
    return userRepository.save(user);
  }

  public User update(UUID businessId, UUID id, UUID currentUserId, UpdateUserRequest dto) {
    User user = findOne(businessId, id);

    if (dto.getName() != null) user.setName(dto.getName());
    if (dto.getRoleId() != null) {
      user.setRole(roleService.findOne(businessId, dto.getRoleId()));
    }
    if (dto.getIsActive() != null) {
      if (!dto.getIsActive() && id.equals(currentUserId)) {
        throw new IllegalArgumentException("You cannot deactivate your own account");
      }
      user.setActive(dto.getIsActive());
    }
    if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
      user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
    }

    return userRepository.save(user);
  }

  /** Self-service version of {@link #update} — no role/active changes, and a password change requires proving the current one. */
  public User updateProfile(UUID businessId, UUID userId, UpdateProfileRequest dto) {
    User user = findOne(businessId, userId);

    if (dto.getName() != null && !dto.getName().isBlank()) {
      user.setName(dto.getName());
    }

    if (dto.getNewPassword() != null && !dto.getNewPassword().isBlank()) {
      if (dto.getCurrentPassword() == null
          || !passwordEncoder.matches(dto.getCurrentPassword(), user.getPasswordHash())) {
        throw new IllegalArgumentException("Current password is incorrect");
      }
      user.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
    }

    return userRepository.save(user);
  }

  public void deactivate(UUID businessId, UUID id, UUID currentUserId) {
    if (id.equals(currentUserId)) {
      throw new IllegalArgumentException("You cannot deactivate your own account");
    }
    User user = findOne(businessId, id);
    user.setActive(false);
    userRepository.save(user);
  }
}
