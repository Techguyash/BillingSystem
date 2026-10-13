package com.billingsystem.customer.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.Map;
import lombok.Data;

@Data
public class CustomerRequest {
  @NotBlank private String name;
  private String phone;
  private String email;
  private String address;
  private String gstin;
  private String state;
  private BigDecimal openingBalance;
  private Map<String, Object> customFields;
}
