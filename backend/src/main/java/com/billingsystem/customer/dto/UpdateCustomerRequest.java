package com.billingsystem.customer.dto;

import java.math.BigDecimal;
import java.util.Map;
import lombok.Data;

@Data
public class UpdateCustomerRequest {
  private String name;
  private String phone;
  private String email;
  private String address;
  private String gstin;
  private String state;
  private BigDecimal openingBalance;
  private Boolean isActive;
  private Map<String, Object> customFields;
}
