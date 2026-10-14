package com.billingsystem.product;

import com.billingsystem.audit.AuditLogService;
import com.billingsystem.auth.CurrentUser;
import com.billingsystem.product.dto.ProductRequest;
import com.billingsystem.product.dto.UpdateProductRequest;
import com.billingsystem.purchase.StockHistoryService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
public class ProductController {

  private final ProductService productService;
  private final AuditLogService auditLogService;
  private final StockHistoryService stockHistoryService;

  @PreAuthorize("hasAuthority('inventory.view')")
  @GetMapping
  public List<Product> findAll(@RequestParam(required = false) String search) {
    return productService.findAll(CurrentUser.get().getBusinessId(), search);
  }

  @PreAuthorize("hasAuthority('inventory.view')")
  @GetMapping("/{id}")
  public Product findOne(@PathVariable UUID id) {
    return productService.findOne(CurrentUser.get().getBusinessId(), id);
  }

  @PreAuthorize("hasAuthority('inventory.view')")
  @GetMapping("/{id}/stock-history")
  public List<StockHistoryService.StockHistoryEntry> stockHistory(@PathVariable UUID id) {
    return stockHistoryService.getHistory(CurrentUser.get().getBusinessId(), id);
  }

  @PreAuthorize("hasAuthority('product.manage')")
  @PostMapping
  public Product create(@Valid @RequestBody ProductRequest dto) {
    var user = CurrentUser.get();
    Product product = productService.create(user.getBusinessId(), dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "product.create", "Product", product.getId(),
        "Created product \"" + product.getName() + "\"");
    return product;
  }

  @PreAuthorize("hasAuthority('product.manage')")
  @PatchMapping("/{id}")
  public Product update(@PathVariable UUID id, @Valid @RequestBody UpdateProductRequest dto) {
    var user = CurrentUser.get();
    Product product = productService.update(user.getBusinessId(), id, dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "product.update", "Product", product.getId(),
        "Updated product \"" + product.getName() + "\"");
    return product;
  }

  @PreAuthorize("hasAuthority('product.manage')")
  @DeleteMapping("/{id}")
  public void remove(@PathVariable UUID id) {
    var user = CurrentUser.get();
    Product product = productService.findOne(user.getBusinessId(), id);
    productService.remove(user.getBusinessId(), id);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "product.deactivate", "Product", id,
        "Deactivated product \"" + product.getName() + "\"");
  }
}
