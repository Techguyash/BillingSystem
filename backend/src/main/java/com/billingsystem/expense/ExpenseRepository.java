package com.billingsystem.expense;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
  List<Expense> findByBusinessIdOrderByExpenseDateDesc(UUID businessId);

  List<Expense> findByBusinessIdAndExpenseDateBetweenOrderByExpenseDateDesc(
      UUID businessId, LocalDate from, LocalDate to);

  Optional<Expense> findByBusinessIdAndId(UUID businessId, UUID id);
}
