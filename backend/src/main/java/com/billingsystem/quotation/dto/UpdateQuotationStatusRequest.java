package com.billingsystem.quotation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateQuotationStatusRequest {
  @NotBlank
  @Pattern(regexp = "draft|sent|accepted|rejected|expired")
  private String status;
}
