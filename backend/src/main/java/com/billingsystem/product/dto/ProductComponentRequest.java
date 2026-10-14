package com.billingsystem.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class ProductComponentRequest {
  @NotNull private UUID componentProductId;

  @NotNull
  @DecimalMin(value = "0.001", message = "quantity must not be less than 0.001")
  private BigDecimal quantity;
}
