export interface Expense {
  id: string
  category: string
  amount: string
  expenseDate: string
  description: string | null
  paymentMethod: string | null
  createdAt: string
}

export interface ExpensePayload {
  category: string
  amount: number
  expenseDate: string
  description?: string
  paymentMethod?: string
}
