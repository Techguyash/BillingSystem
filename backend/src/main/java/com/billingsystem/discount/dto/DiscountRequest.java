package com.billingsystem.discount.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class DiscountRequest {
  @NotBlank private String name;

  @NotNull
  @Pattern(regexp = "PERCENTAGE|FIXED")
  private String type;

  @NotNull
  @DecimalMin(value = "0.01", message = "value must not be less than 0.01")
  private BigDecimal value;

  @DecimalMin(value = "0", message = "minOrderAmount must not be less than 0")
  private BigDecimal minOrderAmount;

  private LocalDate startDate;
  private LocalDate endDate;
  private Boolean isActive;
}
