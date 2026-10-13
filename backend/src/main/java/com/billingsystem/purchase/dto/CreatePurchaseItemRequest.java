package com.billingsystem.purchase.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class CreatePurchaseItemRequest {
  @NotNull private UUID productId;

  @NotNull
  @DecimalMin(value = "0.001", message = "quantity must not be less than 0.001")
  private BigDecimal quantity;

  @NotNull
  @DecimalMin(value = "0", message = "unitCost must not be less than 0")
  private BigDecimal unitCost;

  @DecimalMin(value = "0", message = "taxRatePercent must not be less than 0")
  private BigDecimal taxRatePercent;
}
