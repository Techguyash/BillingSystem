package com.billingsystem.customfield.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import lombok.Data;

@Data
public class FieldDefinitionRequest {
  @NotBlank
  @Pattern(regexp = "product|customer|supplier")
  private String entityType;

  @NotBlank
  @Pattern(regexp = "[a-zA-Z][a-zA-Z0-9_]*", message = "fieldKey must be a valid identifier")
  private String fieldKey;

  @NotBlank private String label;

  @NotBlank
  @Pattern(regexp = "text|number|boolean|date|select")
  private String fieldType;

  private List<String> options;
  private Boolean isRequired;
  private Integer sortOrder;
}
