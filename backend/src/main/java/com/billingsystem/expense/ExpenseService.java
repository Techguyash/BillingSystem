package com.billingsystem.expense;

import com.billingsystem.expense.dto.ExpenseRequest;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExpenseService {

  private final ExpenseRepository expenseRepository;

  public List<Expense> findAll(UUID businessId, LocalDate from, LocalDate to) {
    if (from == null || to == null) {
      return expenseRepository.findByBusinessIdOrderByExpenseDateDesc(businessId);
    }
    return expenseRepository.findByBusinessIdAndExpenseDateBetweenOrderByExpenseDateDesc(
        businessId, from, to);
  }

  public Expense create(UUID businessId, UUID userId, ExpenseRequest dto) {
    Expense expense = new Expense();
    expense.setBusinessId(businessId);
    expense.setCategory(dto.getCategory());
    expense.setAmount(dto.getAmount());
    expense.setExpenseDate(dto.getExpenseDate());
    expense.setDescription(dto.getDescription());
    expense.setPaymentMethod(dto.getPaymentMethod());
    expense.setCreatedByUserId(userId);
    return expenseRepository.save(expense);
  }

  public Expense update(UUID businessId, UUID id, ExpenseRequest dto) {
    Expense expense = findOne(businessId, id);
    expense.setCategory(dto.getCategory());
    expense.setAmount(dto.getAmount());
    expense.setExpenseDate(dto.getExpenseDate());
    expense.setDescription(dto.getDescription());
    expense.setPaymentMethod(dto.getPaymentMethod());
    return expenseRepository.save(expense);
  }

  public void remove(UUID businessId, UUID id) {
    expenseRepository.delete(findOne(businessId, id));
  }

  private Expense findOne(UUID businessId, UUID id) {
    return expenseRepository
        .findByBusinessIdAndId(businessId, id)
        .orElseThrow(EntityNotFoundException::new);
  }
}
