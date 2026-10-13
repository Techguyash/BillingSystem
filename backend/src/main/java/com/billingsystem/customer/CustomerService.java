package com.billingsystem.customer;

import com.billingsystem.customer.dto.CustomerRequest;
import com.billingsystem.customer.dto.UpdateCustomerRequest;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomerService {

  private final CustomerRepository customerRepository;

  public List<Customer> findAll(UUID businessId, String search) {
    if (search == null || search.isBlank()) {
      return customerRepository.findByBusinessIdOrderByCreatedAtDesc(businessId);
    }
    return customerRepository
        .findByBusinessIdAndNameContainingIgnoreCaseOrBusinessIdAndPhoneContainingIgnoreCase(
            businessId, search, businessId, search);
  }

  public Customer findOne(UUID businessId, UUID id) {
    return customerRepository
        .findByBusinessIdAndId(businessId, id)
        .orElseThrow(EntityNotFoundException::new);
  }

  public Customer create(UUID businessId, CustomerRequest dto) {
    Customer customer = new Customer();
    customer.setBusinessId(businessId);
    customer.setName(dto.getName());
    customer.setPhone(dto.getPhone());
    customer.setEmail(dto.getEmail());
    customer.setAddress(dto.getAddress());
    customer.setGstin(dto.getGstin());
    customer.setState(dto.getState());
    if (dto.getOpeningBalance() != null) customer.setOpeningBalance(dto.getOpeningBalance());
    if (dto.getCustomFields() != null) customer.setCustomFields(dto.getCustomFields());
    return customerRepository.save(customer);
  }

  public Customer update(UUID businessId, UUID id, UpdateCustomerRequest dto) {
    Customer customer = findOne(businessId, id);
    if (dto.getName() != null) customer.setName(dto.getName());
    if (dto.getPhone() != null) customer.setPhone(dto.getPhone());
    if (dto.getEmail() != null) customer.setEmail(dto.getEmail());
    if (dto.getAddress() != null) customer.setAddress(dto.getAddress());
    if (dto.getGstin() != null) customer.setGstin(dto.getGstin());
    if (dto.getState() != null) customer.setState(dto.getState());
    if (dto.getOpeningBalance() != null) customer.setOpeningBalance(dto.getOpeningBalance());
    if (dto.getIsActive() != null) customer.setActive(dto.getIsActive());
    if (dto.getCustomFields() != null) customer.setCustomFields(dto.getCustomFields());
    return customerRepository.save(customer);
  }

  public void remove(UUID businessId, UUID id) {
    Customer customer = findOne(businessId, id);
    customer.setActive(false);
    customerRepository.save(customer);
  }
}
