package com.billingsystem.discount;

import com.billingsystem.discount.dto.DiscountRequest;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DiscountService {

  private final DiscountRepository discountRepository;

  public List<Discount> findAll(UUID businessId) {
    return discountRepository.findByBusinessIdOrderByCreatedAtDesc(businessId);
  }

  /** Enabled + within its date range "today" — what a biller is allowed to pick from. */
  public List<Discount> findActive(UUID businessId) {
    LocalDate today = LocalDate.now();
    return discountRepository.findByBusinessIdOrderByCreatedAtDesc(businessId).stream()
        .filter(Discount::isActive)
        .filter(d -> d.getStartDate() == null || !d.getStartDate().isAfter(today))
        .filter(d -> d.getEndDate() == null || !d.getEndDate().isBefore(today))
        .toList();
  }

  public Discount findOne(UUID businessId, UUID id) {
    return discountRepository
        .findByBusinessIdAndId(businessId, id)
        .orElseThrow(EntityNotFoundException::new);
  }

  public Discount create(UUID businessId, DiscountRequest dto) {
    validate(dto);
    Discount discount = new Discount();
    discount.setBusinessId(businessId);
    apply(discount, dto);
    return discountRepository.save(discount);
  }

  public Discount update(UUID businessId, UUID id, DiscountRequest dto) {
    validate(dto);
    Discount discount = findOne(businessId, id);
    apply(discount, dto);
    return discountRepository.save(discount);
  }

  public void remove(UUID businessId, UUID id) {
    discountRepository.delete(findOne(businessId, id));
  }

  private void validate(DiscountRequest dto) {
    if ("PERCENTAGE".equals(dto.getType()) && dto.getValue().compareTo(new BigDecimal("100")) > 0) {
      throw new IllegalArgumentException("A percentage discount cannot exceed 100%");
    }
    if (dto.getStartDate() != null && dto.getEndDate() != null && dto.getStartDate().isAfter(dto.getEndDate())) {
      throw new IllegalArgumentException("startDate must not be after endDate");
    }
  }

  private void apply(Discount discount, DiscountRequest dto) {
    discount.setName(dto.getName());
    discount.setType(dto.getType());
    discount.setValue(dto.getValue());
    discount.setMinOrderAmount(dto.getMinOrderAmount());
    discount.setStartDate(dto.getStartDate());
    discount.setEndDate(dto.getEndDate());
    if (dto.getIsActive() != null) discount.setActive(dto.getIsActive());
  }

  /**
   * Computes and validates the discount amount for a given pre-discount
   * total. Thrown exceptions surface as 400s so a biller gets a clear reason
   * ("not active today", "order doesn't meet the minimum") rather than the
   * discount silently not applying.
   */
  public BigDecimal resolveAmount(UUID businessId, UUID discountId, BigDecimal preDiscountTotal) {
    Discount discount = findOne(businessId, discountId);
    if (!discount.isActive()) {
      throw new IllegalArgumentException("Discount \"" + discount.getName() + "\" is not currently active");
    }
    LocalDate today = LocalDate.now();
    if (discount.getStartDate() != null && discount.getStartDate().isAfter(today)) {
      throw new IllegalArgumentException("Discount \"" + discount.getName() + "\" is not active yet");
    }
    if (discount.getEndDate() != null && discount.getEndDate().isBefore(today)) {
      throw new IllegalArgumentException("Discount \"" + discount.getName() + "\" has expired");
    }
    if (discount.getMinOrderAmount() != null && preDiscountTotal.compareTo(discount.getMinOrderAmount()) < 0) {
      throw new IllegalArgumentException(
          "Discount \""
              + discount.getName()
              + "\" requires a minimum order of "
              + discount.getMinOrderAmount());
    }

    BigDecimal amount =
        "PERCENTAGE".equals(discount.getType())
            ? preDiscountTotal.multiply(discount.getValue()).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP)
            : discount.getValue();
    return amount.min(preDiscountTotal);
  }
}
