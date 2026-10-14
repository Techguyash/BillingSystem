package com.billingsystem.expense.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class ExpenseRequest {
  @NotBlank private String category;

  @NotNull
  @DecimalMin(value = "0.01", message = "amount must not be less than 0.01")
  private BigDecimal amount;

  @NotNull private LocalDate expenseDate;

  private String description;
  private String paymentMethod;
}
