package com.billingsystem.product;

import com.billingsystem.product.dto.ProductRequest;
import com.billingsystem.product.dto.UpdateProductRequest;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductService {

  private final ProductRepository productRepository;

  public List<Product> findAll(UUID businessId, String search) {
    if (search == null || search.isBlank()) {
      return productRepository.findByBusinessIdOrderByCreatedAtDesc(businessId);
    }
    return productRepository.search(businessId, search);
  }

  public Product findOne(UUID businessId, UUID id) {
    return productRepository
        .findByBusinessIdAndId(businessId, id)
        .orElseThrow(EntityNotFoundException::new);
  }

  public Product create(UUID businessId, ProductRequest dto) {
    Product product = new Product();
    product.setBusinessId(businessId);
    product.setName(dto.getName());
    product.setSku(dto.getSku());
    product.setBarcode(dto.getBarcode());
    product.setHsnCode(dto.getHsnCode());
    if (dto.getUnit() != null) product.setUnit(dto.getUnit());
    product.setCostPrice(dto.getCostPrice());
    product.setSellingPrice(dto.getSellingPrice());
    if (dto.getTaxRatePercent() != null) product.setTaxRatePercent(dto.getTaxRatePercent());
    if (dto.getStockQty() != null) product.setStockQty(dto.getStockQty());
    if (dto.getReorderLevel() != null) product.setReorderLevel(dto.getReorderLevel());
    if (dto.getCustomFields() != null) product.setCustomFields(dto.getCustomFields());
    return productRepository.save(product);
  }

  public Product update(UUID businessId, UUID id, UpdateProductRequest dto) {
    Product product = findOne(businessId, id);
    if (dto.getName() != null) product.setName(dto.getName());
    if (dto.getSku() != null) product.setSku(dto.getSku());
    if (dto.getBarcode() != null) product.setBarcode(dto.getBarcode());
    if (dto.getHsnCode() != null) product.setHsnCode(dto.getHsnCode());
    if (dto.getUnit() != null) product.setUnit(dto.getUnit());
    if (dto.getCostPrice() != null) product.setCostPrice(dto.getCostPrice());
    if (dto.getSellingPrice() != null) product.setSellingPrice(dto.getSellingPrice());
    if (dto.getTaxRatePercent() != null) product.setTaxRatePercent(dto.getTaxRatePercent());
    if (dto.getStockQty() != null) product.setStockQty(dto.getStockQty());
    if (dto.getReorderLevel() != null) product.setReorderLevel(dto.getReorderLevel());
    if (dto.getIsActive() != null) product.setActive(dto.getIsActive());
    if (dto.getCustomFields() != null) product.setCustomFields(dto.getCustomFields());
    return productRepository.save(product);
  }

  public void remove(UUID businessId, UUID id) {
    Product product = findOne(businessId, id);
    product.setActive(false);
    productRepository.save(product);
  }

  public long countInStock(UUID businessId) {
    return productRepository.countByBusinessIdAndIsActiveTrue(businessId);
  }

  public long countLowStock(UUID businessId) {
    return findLowStock(businessId).size();
  }

  public List<Product> findLowStock(UUID businessId) {
    return productRepository.findByBusinessIdAndIsActiveTrue(businessId).stream()
        .filter(p -> p.getStockQty().compareTo(p.getReorderLevel()) <= 0)
        .toList();
  }

  public void adjustStock(UUID productId, BigDecimal delta) {
    Product product = productRepository.findById(productId).orElseThrow(EntityNotFoundException::new);
    product.setStockQty(product.getStockQty().add(delta));
    productRepository.save(product);
  }
}
