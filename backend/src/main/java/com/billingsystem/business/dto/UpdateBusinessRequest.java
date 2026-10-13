package com.billingsystem.business.dto;

import jakarta.validation.constraints.Email;
import java.util.List;
import lombok.Data;

@Data
public class UpdateBusinessRequest {
  private String name;
  private String gstin;

  @Email(message = "email must be an email")
  private String email;

  private String phone;
  private String address;
  private String state;

  // Invoice customization — stored inside the `settings` jsonb column.
  private String logoUrl;
  private String invoiceTerms;
  private String invoiceFooter;
  private String invoiceNumberPrefix;
  private Boolean showHsnCodeOnInvoice;

  // Module toggles — which sidebar sections are available for this
  // business. Also stored inside `settings`.
  private List<String> enabledModules;
}
