package com.billingsystem.unit.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UnitRequest {
  @NotBlank private String name;
  @NotBlank private String abbreviation;
}
