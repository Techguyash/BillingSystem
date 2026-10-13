package com.billingsystem.role;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, UUID> {
  List<Role> findByBusinessId(UUID businessId);

  Optional<Role> findByBusinessIdAndName(UUID businessId, String name);

  Optional<Role> findByBusinessIdAndId(UUID businessId, UUID id);
}
