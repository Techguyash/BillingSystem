package com.billingsystem.invoice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import lombok.Data;

@Data
public class RecordPaymentRequest {
  @NotNull
  @DecimalMin(value = "0.01", message = "amount must not be less than 0.01")
  private BigDecimal amount;

  @NotNull
  @Pattern(regexp = "cash|card|upi|credit")
  private String method;

  private String notes;
}
