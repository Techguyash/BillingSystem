package com.billingsystem.taxrate;

import com.billingsystem.taxrate.dto.TaxRateRequest;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TaxRateService {

  private static final List<String[]> DEFAULT_RATES =
      List.of(
          new String[] {"No Tax", "0"},
          new String[] {"GST 5%", "5"},
          new String[] {"GST 12%", "12"},
          new String[] {"GST 18%", "18"},
          new String[] {"GST 28%", "28"});

  private final TaxRateRepository taxRateRepository;

  public List<TaxRate> findAll(UUID businessId) {
    return taxRateRepository.findByBusinessIdOrderByPercentAsc(businessId);
  }

  public List<TaxRate> findActive(UUID businessId) {
    return findAll(businessId).stream().filter(TaxRate::isActive).toList();
  }

  /** Seeds common GST slabs for a newly set-up business. */
  public void seedDefaults(UUID businessId) {
    for (String[] rate : DEFAULT_RATES) {
      TaxRate entity = new TaxRate();
      entity.setBusinessId(businessId);
      entity.setName(rate[0]);
      entity.setPercent(new BigDecimal(rate[1]));
      taxRateRepository.save(entity);
    }
  }

  public TaxRate findOne(UUID businessId, UUID id) {
    return taxRateRepository
        .findByBusinessIdAndId(businessId, id)
        .orElseThrow(EntityNotFoundException::new);
  }

  public TaxRate create(UUID businessId, TaxRateRequest dto) {
    TaxRate taxRate = new TaxRate();
    taxRate.setBusinessId(businessId);
    apply(taxRate, dto);
    return taxRateRepository.save(taxRate);
  }

  public TaxRate update(UUID businessId, UUID id, TaxRateRequest dto) {
    TaxRate taxRate = findOne(businessId, id);
    apply(taxRate, dto);
    return taxRateRepository.save(taxRate);
  }

  public void remove(UUID businessId, UUID id) {
    taxRateRepository.delete(findOne(businessId, id));
  }

  private void apply(TaxRate taxRate, TaxRateRequest dto) {
    taxRate.setName(dto.getName());
    taxRate.setPercent(dto.getPercent());
    if (dto.getIsActive() != null) taxRate.setActive(dto.getIsActive());
  }
}
