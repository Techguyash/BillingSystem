package com.billingsystem.product.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import lombok.Data;

/** All fields optional — only provided fields are applied (mirrors PartialType(CreateProductDto)). */
@Data
public class UpdateProductRequest {
  private String name;
  private String sku;
  private String barcode;
  private String hsnCode;
  private String unit;

  @DecimalMin(value = "0", message = "costPrice must not be less than 0")
  private BigDecimal costPrice;

  @DecimalMin(value = "0", message = "sellingPrice must not be less than 0")
  private BigDecimal sellingPrice;

  @DecimalMin(value = "0", message = "taxRatePercent must not be less than 0")
  private BigDecimal taxRatePercent;

  @DecimalMin(value = "0", message = "stockQty must not be less than 0")
  private BigDecimal stockQty;

  @DecimalMin(value = "0", message = "reorderLevel must not be less than 0")
  private BigDecimal reorderLevel;

  private Boolean isActive;
  private Boolean isComposite;

  @Valid
  private List<ProductComponentRequest> components;

  private Map<String, Object> customFields;
}
