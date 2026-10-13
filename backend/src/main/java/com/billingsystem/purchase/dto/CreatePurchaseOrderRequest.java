package com.billingsystem.purchase.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class CreatePurchaseOrderRequest {
  private UUID supplierId;
  private String supplierInvoiceNumber;

  @NotEmpty
  @Valid
  private List<CreatePurchaseItemRequest> items;

  private String notes;
}
