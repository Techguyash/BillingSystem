package com.billingsystem.product;

import com.billingsystem.product.dto.ProductComponentRequest;
import com.billingsystem.product.dto.ProductRequest;
import com.billingsystem.product.dto.UpdateProductRequest;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProductService {

  private final ProductRepository productRepository;
  private final ProductComponentRepository productComponentRepository;

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

  @Transactional
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
    if (dto.getIsComposite() != null) product.setComposite(dto.getIsComposite());
    if (dto.getCustomFields() != null) product.setCustomFields(dto.getCustomFields());
    Product saved = productRepository.save(product);
    if (Boolean.TRUE.equals(dto.getIsComposite()) && dto.getComponents() != null) {
      replaceComponents(businessId, saved, dto.getComponents());
    }
    return saved;
  }

  @Transactional
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
    if (dto.getIsComposite() != null) product.setComposite(dto.getIsComposite());
    if (dto.getCustomFields() != null) product.setCustomFields(dto.getCustomFields());
    Product saved = productRepository.save(product);
    if (dto.getComponents() != null) {
      replaceComponents(businessId, saved, dto.getComponents());
    }
    return saved;
  }

  private void replaceComponents(UUID businessId, Product bundle, List<ProductComponentRequest> components) {
    productComponentRepository.deleteAll(productComponentRepository.findByBundleProductId(bundle.getId()));
    bundle.getComponents().clear();
    for (ProductComponentRequest line : components) {
      if (line.getComponentProductId().equals(bundle.getId())) {
        throw new IllegalArgumentException("A bundle cannot contain itself as a component");
      }
      Product component =
          productRepository
              .findById(line.getComponentProductId())
              .filter(p -> p.getBusinessId().equals(businessId))
              .orElseThrow(
                  () -> new IllegalArgumentException("Component product " + line.getComponentProductId() + " not found"));
      if (component.isComposite()) {
        throw new IllegalArgumentException("\"" + component.getName() + "\" is itself a bundle and cannot be used as a component");
      }

      ProductComponent entity = new ProductComponent();
      entity.setBundleProduct(bundle);
      entity.setComponentProductId(component.getId());
      entity.setComponentProductName(component.getName());
      entity.setQuantity(line.getQuantity());
      bundle.getComponents().add(entity);
    }
    productRepository.save(bundle);
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
    // Composites have no stock of their own (see decrementStockForSale) —
    // their availability is really their components' low-stock status, so
    // including them here would just be a constant false alarm at stockQty=0.
    return productRepository.findByBusinessIdAndIsActiveTrue(businessId).stream()
        .filter(p -> !p.isComposite())
        .filter(p -> p.getStockQty().compareTo(p.getReorderLevel()) <= 0)
        .toList();
  }

  public void adjustStock(UUID productId, BigDecimal delta) {
    Product product = productRepository.findById(productId).orElseThrow(EntityNotFoundException::new);
    product.setStockQty(product.getStockQty().add(delta));
    productRepository.save(product);
  }

  /**
   * Decrements stock for a sale of {@code quantity} units of {@code product}.
   * A composite/bundle product has no stock of its own — selling one decrements
   * each component's stock instead, after first confirming every component has
   * enough on hand (so a bundle sale can't go through half-fulfilled).
   */
  @Transactional
  public void decrementStockForSale(Product product, BigDecimal quantity) {
    if (!product.isComposite()) {
      if (product.getStockQty().compareTo(quantity) < 0) {
        throw new IllegalArgumentException(
            "Insufficient stock for \"" + product.getName() + "\" (available: " + product.getStockQty() + ")");
      }
      product.setStockQty(product.getStockQty().subtract(quantity));
      productRepository.save(product);
      return;
    }

    for (ProductComponent pc : product.getComponents()) {
      Product component = productRepository.findById(pc.getComponentProductId()).orElseThrow();
      BigDecimal needed = pc.getQuantity().multiply(quantity);
      if (component.getStockQty().compareTo(needed) < 0) {
        throw new IllegalArgumentException(
            "Insufficient stock for \""
                + component.getName()
                + "\" (needed "
                + needed
                + " for \""
                + product.getName()
                + "\", available: "
                + component.getStockQty()
                + ")");
      }
    }
    for (ProductComponent pc : product.getComponents()) {
      Product component = productRepository.findById(pc.getComponentProductId()).orElseThrow();
      component.setStockQty(component.getStockQty().subtract(pc.getQuantity().multiply(quantity)));
      productRepository.save(component);
    }
  }

  /** The inverse of {@link #decrementStockForSale} — used by invoice void and sales returns. */
  @Transactional
  public void restockForReturn(Product product, BigDecimal quantity) {
    if (!product.isComposite()) {
      product.setStockQty(product.getStockQty().add(quantity));
      productRepository.save(product);
      return;
    }
    for (ProductComponent pc : product.getComponents()) {
      Product component = productRepository.findById(pc.getComponentProductId()).orElseThrow();
      component.setStockQty(component.getStockQty().add(pc.getQuantity().multiply(quantity)));
      productRepository.save(component);
    }
  }
}
