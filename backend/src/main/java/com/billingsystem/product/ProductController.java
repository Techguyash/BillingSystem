package com.billingsystem.product;

import com.billingsystem.auth.CurrentUser;
import com.billingsystem.product.dto.ProductRequest;
import com.billingsystem.product.dto.UpdateProductRequest;
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

  @PreAuthorize("hasAuthority('product.manage')")
  @PostMapping
  public Product create(@Valid @RequestBody ProductRequest dto) {
    return productService.create(CurrentUser.get().getBusinessId(), dto);
  }

  @PreAuthorize("hasAuthority('product.manage')")
  @PatchMapping("/{id}")
  public Product update(@PathVariable UUID id, @Valid @RequestBody UpdateProductRequest dto) {
    return productService.update(CurrentUser.get().getBusinessId(), id, dto);
  }

  @PreAuthorize("hasAuthority('product.manage')")
  @DeleteMapping("/{id}")
  public void remove(@PathVariable UUID id) {
    productService.remove(CurrentUser.get().getBusinessId(), id);
  }
}
