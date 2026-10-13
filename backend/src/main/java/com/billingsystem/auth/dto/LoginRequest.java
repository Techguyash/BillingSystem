package com.billingsystem.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Login identifier doesn't have to be a real email address — small installs
 * often just want a plain username (e.g. "admin"). Password strength rules
 * belong on user creation, not login, so we only check for non-empty here.
 */
@Data
public class LoginRequest {
  @NotBlank private String email;
  @NotBlank private String password;
}
