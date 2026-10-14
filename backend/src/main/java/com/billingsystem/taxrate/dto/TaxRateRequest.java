package com.billingsystem.taxrate.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class TaxRateRequest {
  @NotBlank private String name;

  @NotNull
  @DecimalMin(value = "0", message = "percent must not be less than 0")
  private BigDecimal percent;

  private Boolean isActive;
}
