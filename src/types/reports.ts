export interface DayFigures {
  date: string
  gross_sales: number
  refunds: number
  cost: number
  sales_count: number
  net_sales: number
  gross_profit: number
}

export interface Overview {
  period: { from: string; to: string; timezone: string }
  totals: {
    gross_sales: number
    discounts: number
    refunds: number
    net_sales: number
    cost_of_goods: number
    gross_profit: number
    expenses: number
    net_profit: number
    purchases: number
    sales_count: number
    average_sale: number
  }
  payments: { by_method: { method: string; total: number }[]; on_credit: number }
  daily: DayFigures[]
  by_cashier: { cashier_id: number; name: string; sales_count: number; gross_sales: number }[]
  by_category: { category: string; net_sales: number; gross_profit: number }[]
}

export interface ProductFigures {
  product_id: number
  name: string
  quantity: number
  revenue: number
  cost: number
  profit: number
  margin: number | null
}

export interface BalanceList {
  total: number
  count: number
  rows: { id: number; name: string; phone: string | null; balance: number }[]
}

export interface Balances {
  receivable: BalanceList
  payable: BalanceList
}

export interface RecentEvent {
  type: 'sale' | 'refund' | 'purchase' | 'expense'
  title: string
  amount: number
  by: string
  at: string
  link: string
}

export interface Dashboard {
  scope: 'shop' | 'own'
  date: string
  today: {
    net_sales: number
    gross_sales: number
    sales_count: number
    gross_profit: number | null
    expenses: number | null
  }
  week: { date: string; net_sales: number; sales_count: number }[]
  payments: Overview['payments']
  top_products?: ProductFigures[]
  low_stock?: {
    count: number
    items: { id: number; name: string; unit: string; stock: number; threshold: number }[]
  }
  owed_by_customers?: number
  owed_to_suppliers?: number
  stock_value?: number
  recent?: RecentEvent[]
  setup?: { has_products: boolean; has_sales: boolean }
}

export const METHOD_COLOURS: Record<string, string> = {
  CASH: '#0f766e',
  MOBILE_MONEY: '#d97706',
  CARD: '#6366f1',
  BANK: '#64748b',
  OTHER: '#94a3b8',
  CREDIT: '#e11d48',
}
