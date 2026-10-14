package com.billingsystem.returns.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import lombok.Data;

@Data
public class CreateCreditNoteRequest {
  @NotNull private UUID invoiceId;

  @NotEmpty
  @Valid
  private List<CreditNoteItemRequest> items;

  private String reason;
}
