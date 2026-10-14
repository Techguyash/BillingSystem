package com.billingsystem.expense;

import com.billingsystem.common.TenantBaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;

/**
 * A non-inventory cost (rent, salaries, utilities, etc.) — kept separate
 * from Purchases (which are always about receiving stock). Feeds into net
 * profit reporting: Net Profit = Gross Profit − Expenses.
 */
@Entity
@Table(name = "expenses")
@Getter
@Setter
public class Expense extends TenantBaseEntity {

  /** Free-text category, e.g. "Rent", "Salaries", "Utilities" — businesses can type their own. */
  @Column(nullable = false)
  private String category;

  @Column(precision = 12, scale = 2, nullable = false)
  private BigDecimal amount;

  @Column(name = "expense_date", nullable = false)
  private LocalDate expenseDate;

  @Column(columnDefinition = "text")
  private String description;

  @Column(name = "payment_method")
  private String paymentMethod;

  @Column(name = "created_by_user_id", nullable = false)
  private UUID createdByUserId;
}
