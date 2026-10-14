package com.billingsystem.quotation.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.Data;

@Data
public class CreateQuotationItemRequest {
  @NotNull private UUID productId;

  @NotNull
  @DecimalMin(value = "0.001", message = "quantity must not be less than 0.001")
  private BigDecimal quantity;

  @DecimalMin(value = "0", message = "unitPrice must not be less than 0")
  private BigDecimal unitPrice;
}
