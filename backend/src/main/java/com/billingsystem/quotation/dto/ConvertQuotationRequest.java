package com.billingsystem.quotation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ConvertQuotationRequest {
  @NotBlank
  @Pattern(regexp = "cash|card|upi|credit")
  private String paymentMethod;
}
