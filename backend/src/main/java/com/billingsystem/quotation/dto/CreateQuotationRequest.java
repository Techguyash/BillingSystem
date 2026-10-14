package com.billingsystem.quotation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class CreateQuotationRequest {
  private UUID customerId;
  private LocalDate validUntil;

  @NotEmpty
  @Valid
  private List<CreateQuotationItemRequest> items;

  @DecimalMin(value = "0", message = "discountTotal must not be less than 0")
  private BigDecimal discountTotal;

  private String notes;
}
