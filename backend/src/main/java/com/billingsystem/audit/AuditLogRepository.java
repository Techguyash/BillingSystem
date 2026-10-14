package com.billingsystem.audit;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
  List<AuditLog> findTop500ByBusinessIdOrderByCreatedAtDesc(UUID businessId);
}
