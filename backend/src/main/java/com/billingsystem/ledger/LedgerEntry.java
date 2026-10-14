package com.billingsystem.ledger;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * One line of a customer/supplier statement of account.
 *
 * <p>{@code amount} is signed: positive increases the running balance (the
 * party owes more), negative decreases it (something was paid/returned).
 * This keeps the customer side ("they owe us") and supplier side ("we owe
 * them") expressible with the same shape instead of separate debit/credit
 * columns with opposite conventions per party type.
 */
public record LedgerEntry(
    Instant date, String type, String reference, BigDecimal amount, BigDecimal balance) {}
