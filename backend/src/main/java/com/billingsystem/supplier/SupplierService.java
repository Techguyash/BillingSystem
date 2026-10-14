package com.billingsystem.supplier;

import com.billingsystem.supplier.dto.SupplierRequest;
import com.billingsystem.supplier.dto.UpdateSupplierRequest;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SupplierService {

  private final SupplierRepository supplierRepository;

  public List<Supplier> findAll(UUID businessId, String search) {
    if (search == null || search.isBlank()) {
      return supplierRepository.findByBusinessIdOrderByCreatedAtDesc(businessId);
    }
    return supplierRepository
        .findByBusinessIdAndNameContainingIgnoreCaseOrBusinessIdAndPhoneContainingIgnoreCase(
            businessId, search, businessId, search);
  }

  public Supplier findOne(UUID businessId, UUID id) {
    return supplierRepository
        .findByBusinessIdAndId(businessId, id)
        .orElseThrow(EntityNotFoundException::new);
  }

  public Supplier create(UUID businessId, SupplierRequest dto) {
    Supplier supplier = new Supplier();
    supplier.setBusinessId(businessId);
    supplier.setName(dto.getName());
    supplier.setPhone(dto.getPhone());
    supplier.setEmail(dto.getEmail());
    supplier.setAddress(dto.getAddress());
    supplier.setGstin(dto.getGstin());
    supplier.setState(dto.getState());
    if (dto.getOpeningBalance() != null) supplier.setOpeningBalance(dto.getOpeningBalance());
    if (dto.getCustomFields() != null) supplier.setCustomFields(dto.getCustomFields());
    return supplierRepository.save(supplier);
  }

  public Supplier update(UUID businessId, UUID id, UpdateSupplierRequest dto) {
    Supplier supplier = findOne(businessId, id);
    if (dto.getName() != null) supplier.setName(dto.getName());
    if (dto.getPhone() != null) supplier.setPhone(dto.getPhone());
    if (dto.getEmail() != null) supplier.setEmail(dto.getEmail());
    if (dto.getAddress() != null) supplier.setAddress(dto.getAddress());
    if (dto.getGstin() != null) supplier.setGstin(dto.getGstin());
    if (dto.getState() != null) supplier.setState(dto.getState());
    if (dto.getOpeningBalance() != null) supplier.setOpeningBalance(dto.getOpeningBalance());
    if (dto.getIsActive() != null) supplier.setActive(dto.getIsActive());
    if (dto.getCustomFields() != null) supplier.setCustomFields(dto.getCustomFields());
    return supplierRepository.save(supplier);
  }

  public void remove(UUID businessId, UUID id) {
    Supplier supplier = findOne(businessId, id);
    supplier.setActive(false);
    supplierRepository.save(supplier);
  }
}
