package com.billingsystem.supplier.dto;

import java.util.Map;
import lombok.Data;

@Data
public class UpdateSupplierRequest {
  private String name;
  private String phone;
  private String email;
  private String address;
  private String gstin;
  private String state;
  private Boolean isActive;
  private Map<String, Object> customFields;
}
