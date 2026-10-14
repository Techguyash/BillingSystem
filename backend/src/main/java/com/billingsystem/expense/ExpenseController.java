package com.billingsystem.expense;

import com.billingsystem.audit.AuditLogService;
import com.billingsystem.auth.CurrentUser;
import com.billingsystem.expense.dto.ExpenseRequest;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
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
@RequestMapping("/expenses")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('expense.manage')")
public class ExpenseController {

  private final ExpenseService expenseService;
  private final AuditLogService auditLogService;

  @GetMapping
  public List<Expense> findAll(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    return expenseService.findAll(CurrentUser.get().getBusinessId(), from, to);
  }

  @PostMapping
  public Expense create(@Valid @RequestBody ExpenseRequest dto) {
    var user = CurrentUser.get();
    Expense expense = expenseService.create(user.getBusinessId(), user.getUserId(), dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "expense.create", "Expense", expense.getId(),
        "Recorded expense \"" + expense.getCategory() + "\" for " + expense.getAmount());
    return expense;
  }

  @PatchMapping("/{id}")
  public Expense update(@PathVariable UUID id, @Valid @RequestBody ExpenseRequest dto) {
    var user = CurrentUser.get();
    Expense expense = expenseService.update(user.getBusinessId(), id, dto);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "expense.update", "Expense", expense.getId(),
        "Updated expense \"" + expense.getCategory() + "\"");
    return expense;
  }

  @DeleteMapping("/{id}")
  public void remove(@PathVariable UUID id) {
    var user = CurrentUser.get();
    expenseService.remove(user.getBusinessId(), id);
    auditLogService.record(
        user.getBusinessId(), user.getUserId(), user.getName(), "expense.delete", "Expense", id, "Deleted an expense");
  }
}
