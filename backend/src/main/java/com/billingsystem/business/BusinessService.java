package com.billingsystem.business;

import com.billingsystem.business.dto.UpdateBusinessRequest;
import java.util.UUID;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BusinessService {

  private final BusinessRepository businessRepository;

  public Business findFirst() {
    return businessRepository.findFirstByOrderByCreatedAtAsc().orElse(null);
  }

  public Business findById(UUID id) {
    return businessRepository.findById(id).orElseThrow(EntityNotFoundException::new);
  }

  public Business create(Business business) {
    return businessRepository.save(business);
  }

  /**
   * `logoUrl` / `invoiceTerms` / `invoiceFooter` aren't real columns — they
   * live inside the free-form `settings` jsonb so invoice customization can
   * grow without further migrations. Everything else maps to real columns.
   */
  public Business update(UUID id, UpdateBusinessRequest dto) {
    Business business = findById(id);

    if (dto.getName() != null) business.setName(dto.getName());
    if (dto.getGstin() != null) business.setGstin(dto.getGstin());
    if (dto.getEmail() != null) business.setEmail(dto.getEmail());
    if (dto.getPhone() != null) business.setPhone(dto.getPhone());
    if (dto.getAddress() != null) business.setAddress(dto.getAddress());
    if (dto.getState() != null) business.setState(dto.getState());

    if (dto.getLogoUrl() != null) business.getSettings().put("logoUrl", dto.getLogoUrl());
    if (dto.getInvoiceTerms() != null)
      business.getSettings().put("invoiceTerms", dto.getInvoiceTerms());
    if (dto.getInvoiceFooter() != null)
      business.getSettings().put("invoiceFooter", dto.getInvoiceFooter());
    if (dto.getInvoiceNumberPrefix() != null)
      business.getSettings().put("invoiceNumberPrefix", dto.getInvoiceNumberPrefix());
    if (dto.getShowHsnCodeOnInvoice() != null)
      business.getSettings().put("showHsnCodeOnInvoice", dto.getShowHsnCodeOnInvoice());
    if (dto.getEnabledModules() != null)
      business.getSettings().put("enabledModules", dto.getEnabledModules());

    return businessRepository.save(business);
  }
}
