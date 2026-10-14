package com.billingsystem.audit;

import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

  private final AuditLogRepository auditLogRepository;

  public List<AuditLog> findAll(UUID businessId) {
    return auditLogRepository.findTop500ByBusinessIdOrderByCreatedAtDesc(businessId);
  }

  /**
   * Records one audit entry. Called from controllers *after* the business
   * operation has already returned successfully — never from inside the
   * same transaction as the operation itself, so a rolled-back operation
   * can never leave behind a misleading "it happened" log entry. Swallows
   * its own failures so a bug in audit logging can never break the
   * operation it's observing.
   */
  public void record(
      UUID businessId, UUID userId, String userName, String action, String entityType, UUID entityId, String description) {
    try {
      AuditLog log = new AuditLog();
      log.setBusinessId(businessId);
      log.setUserId(userId);
      log.setUserName(userName);
      log.setAction(action);
      log.setEntityType(entityType);
      log.setEntityId(entityId);
      log.setDescription(description);
      auditLogRepository.save(log);
    } catch (Exception ignored) {
      // Audit logging must never be able to break the operation it's
      // observing — see the class-level note above.
    }
  }
}
