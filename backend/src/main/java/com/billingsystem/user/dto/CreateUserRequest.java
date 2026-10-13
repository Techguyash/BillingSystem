package com.billingsystem.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.Data;

@Data
public class CreateUserRequest {
  @NotBlank private String name;

  /** Doesn't have to be a real email — see LoginRequest for why. */
  @NotBlank private String email;

  @NotBlank
  @Size(min = 4, message = "password must be at least 4 characters")
  private String password;

  @NotNull private UUID roleId;
}
