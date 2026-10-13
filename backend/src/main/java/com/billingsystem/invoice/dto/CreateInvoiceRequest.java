package com.billingsystem.invoice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class CreateInvoiceRequest {
  private UUID customerId;
  private UUID branchId;

  @NotEmpty
  @Valid
  private List<CreateInvoiceItemRequest> items;

  @Pattern(regexp = "cash|card|upi|credit")
  private String paymentMethod;

  @DecimalMin(value = "0", message = "discountTotal must not be less than 0")
  private BigDecimal discountTotal;

  private String notes;
}
