package com.billingsystem.user;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, UUID> {
  Optional<User> findByEmail(String email);

  List<User> findByBusinessIdOrderByCreatedAtAsc(UUID businessId);

  Optional<User> findByBusinessIdAndId(UUID businessId, UUID id);

  long countByBusinessIdAndRoleId(UUID businessId, UUID roleId);
}
