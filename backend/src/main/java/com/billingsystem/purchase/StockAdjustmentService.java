package com.billingsystem.purchase;

import com.billingsystem.product.Product;
import com.billingsystem.product.ProductRepository;
import com.billingsystem.purchase.dto.CreateStockAdjustmentRequest;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StockAdjustmentService {

  private final StockAdjustmentRepository stockAdjustmentRepository;
  private final ProductRepository productRepository;

  public List<StockAdjustment> findAll(UUID businessId) {
    return stockAdjustmentRepository.findTop100ByBusinessIdOrderByCreatedAtDesc(businessId);
  }

  @Transactional
  public StockAdjustment create(UUID businessId, UUID userId, CreateStockAdjustmentRequest dto) {
    if (dto.getQuantityDelta().compareTo(BigDecimal.ZERO) == 0) {
      throw new IllegalArgumentException("quantityDelta cannot be zero");
    }

    Product product =
        productRepository
            .findById(dto.getProductId())
            .filter(p -> p.getBusinessId().equals(businessId))
            .orElseThrow(() -> new IllegalArgumentException("Product not found"));
    if (product.isComposite()) {
      throw new IllegalArgumentException(
          "\"" + product.getName() + "\" is a bundle with no stock of its own — adjust its components instead");
    }

    BigDecimal newStock = product.getStockQty().add(dto.getQuantityDelta());
    if (newStock.compareTo(BigDecimal.ZERO) < 0) {
      throw new IllegalArgumentException(
          "Adjustment would result in negative stock (current: " + product.getStockQty() + ")");
    }
    product.setStockQty(newStock);
    productRepository.save(product);

    StockAdjustment adjustment = new StockAdjustment();
    adjustment.setBusinessId(businessId);
    adjustment.setProductId(product.getId());
    adjustment.setProductName(product.getName());
    adjustment.setQuantityDelta(dto.getQuantityDelta());
    adjustment.setReason(dto.getReason());
    adjustment.setAdjustedByUserId(userId);

    return stockAdjustmentRepository.save(adjustment);
  }
}
