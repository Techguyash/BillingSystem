package com.billingsystem.auth.dto;

import lombok.Data;

/** Self-service profile update — distinct from the admin-only UpdateUserRequest (no role/active fields here). */
@Data
public class UpdateProfileRequest {
  private String name;

  /** Required only when newPassword is set — proves the requester actually knows the current password. */
  private String currentPassword;

  private String newPassword;
}
