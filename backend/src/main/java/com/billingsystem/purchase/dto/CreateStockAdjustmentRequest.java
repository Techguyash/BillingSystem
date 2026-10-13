package com.billingsystem.purchase.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class CreateStockAdjustmentRequest {
  @NotNull private UUID productId;

  /** Positive to increase stock, negative to decrease it; cannot be zero. */
  @NotNull private BigDecimal quantityDelta;

  @NotBlank private String reason;
}
