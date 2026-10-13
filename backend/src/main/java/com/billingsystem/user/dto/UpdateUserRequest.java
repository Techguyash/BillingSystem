package com.billingsystem.user.dto;

import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.Data;

@Data
public class UpdateUserRequest {
  private String name;
  private UUID roleId;
  private Boolean isActive;

  /** Optional — only set when an admin wants to reset this user's password. */
  @Size(min = 4, message = "password must be at least 4 characters")
  private String password;
}
