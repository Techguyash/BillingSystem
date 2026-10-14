package com.billingsystem.purchase;

import com.billingsystem.audit.AuditLogService;
import com.billingsystem.auth.CurrentUser;
import com.billingsystem.purchase.dto.CreateStockAdjustmentRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/stock-adjustments")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('inventory.adjust_stock')")
public class StockAdjustmentController {

  private final StockAdjustmentService stockAdjustmentService;
  private final AuditLogService auditLogService;

  @GetMapping
  public List<StockAdjustment> findAll() {
    return stockAdjustmentService.findAll(CurrentUser.get().getBusinessId());
  }

  @PostMapping
  public StockAdjustment create(@Valid @RequestBody CreateStockAdjustmentRequest dto) {
    var user = CurrentUser.get();
    StockAdjustment adjustment = stockAdjustmentService.create(user.getBusinessId(), user.getUserId(), dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "inventory.adjust_stock", "Product",
        adjustment.getProductId(),
        "Adjusted stock of \"" + adjustment.getProductName() + "\" by " + adjustment.getQuantityDelta()
            + " (" + adjustment.getReason() + ")");
    return adjustment;
  }
}
