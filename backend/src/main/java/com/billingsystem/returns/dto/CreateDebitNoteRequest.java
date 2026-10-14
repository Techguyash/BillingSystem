package com.billingsystem.returns.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class CreateDebitNoteRequest {
  @NotNull private UUID purchaseOrderId;

  @NotEmpty
  @Valid
  private List<DebitNoteItemRequest> items;

  private String reason;
}
