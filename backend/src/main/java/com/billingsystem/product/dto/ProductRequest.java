package com.billingsystem.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.Map;
import lombok.Data;

@Data
public class ProductRequest {
  @NotBlank private String name;
  private String sku;
  private String barcode;
  private String hsnCode;
  private String unit;

  @NotNull
  @DecimalMin(value = "0", message = "costPrice must not be less than 0")
  private BigDecimal costPrice;

  @NotNull
  @DecimalMin(value = "0", message = "sellingPrice must not be less than 0")
  private BigDecimal sellingPrice;

  @DecimalMin(value = "0", message = "taxRatePercent must not be less than 0")
  private BigDecimal taxRatePercent;

  @DecimalMin(value = "0", message = "stockQty must not be less than 0")
  private BigDecimal stockQty;

  @DecimalMin(value = "0", message = "reorderLevel must not be less than 0")
  private BigDecimal reorderLevel;

  private Boolean isActive;
  private Map<String, Object> customFields;
}
