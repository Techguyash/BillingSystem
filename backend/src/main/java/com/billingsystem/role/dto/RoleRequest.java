package com.billingsystem.role.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Data;

@Data
public class RoleRequest {
  @NotBlank private String name;

  @NotEmpty(message = "Select at least one permission")
  private List<String> permissions;
}
