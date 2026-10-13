package com.billingsystem.supplier.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import lombok.Data;

@Data
public class SupplierRequest {
  @NotBlank private String name;
  private String phone;
  private String email;
  private String address;
  private String gstin;
  private String state;
  private Map<String, Object> customFields;
}
