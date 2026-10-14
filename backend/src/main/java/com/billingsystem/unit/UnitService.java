package com.billingsystem.unit;

import com.billingsystem.unit.dto.UnitRequest;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UnitService {

  private static final List<String[]> DEFAULT_UNITS =
      List.of(
          new String[] {"Pieces", "pcs"},
          new String[] {"Kilogram", "kg"},
          new String[] {"Gram", "g"},
          new String[] {"Liter", "L"},
          new String[] {"Milliliter", "ml"},
          new String[] {"Meter", "m"},
          new String[] {"Box", "box"},
          new String[] {"Dozen", "dz"},
          new String[] {"Ton", "ton"},
          new String[] {"Pack", "pack"});

  private final UnitRepository unitRepository;

  public List<Unit> findAll(UUID businessId) {
    return unitRepository.findByBusinessIdOrderByNameAsc(businessId);
  }

  /** Seeds the default unit set for a newly set-up business. */
  public void seedDefaults(UUID businessId) {
    for (String[] unit : DEFAULT_UNITS) {
      Unit entity = new Unit();
      entity.setBusinessId(businessId);
      entity.setName(unit[0]);
      entity.setAbbreviation(unit[1]);
      entity.setSystem(true);
      unitRepository.save(entity);
    }
  }

  public Unit create(UUID businessId, UnitRequest dto) {
    if (unitRepository.existsByBusinessIdAndAbbreviationIgnoreCase(businessId, dto.getAbbreviation())) {
      throw new IllegalArgumentException(
          "A unit with abbreviation \"" + dto.getAbbreviation() + "\" already exists");
    }
    Unit unit = new Unit();
    unit.setBusinessId(businessId);
    unit.setName(dto.getName());
    unit.setAbbreviation(dto.getAbbreviation());
    unit.setSystem(false);
    return unitRepository.save(unit);
  }

  public void remove(UUID businessId, UUID id) {
    Unit unit =
        unitRepository.findByBusinessIdAndId(businessId, id).orElseThrow(EntityNotFoundException::new);
    if (unit.isSystem()) {
      throw new IllegalArgumentException("\"" + unit.getName() + "\" is a built-in unit and cannot be deleted");
    }
    unitRepository.delete(unit);
  }
}
