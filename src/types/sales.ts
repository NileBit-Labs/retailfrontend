export type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'BANK' | 'OTHER'

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CARD', label: 'Card' },
  { value: 'BANK', label: 'Bank' },
  { value: 'OTHER', label: 'Other' },
]

export interface ProductUnit {
  unit_name: string
  conversion_to_base_unit: number
  selling_price: number
}

export interface PosProduct {
  id: number
  name: string
  sku: string | null
  barcode: string | null
  category: string | null
  base_unit: string
  selling_price: number
  stock: number
  low_stock_threshold: number
  units: ProductUnit[]
}

export interface SaleItem {
  id: number
  product_id: number
  product_name: string
  quantity: number
  unit: string
  unit_price: number
  discount: number
  line_total: number
}

export interface SalePayment {
  id: number
  method: PaymentMethod
  amount: number
  reference: string | null
  direction: 'in' | 'out'
}

export interface Sale {
  id: number
  sale_number: string
  status: 'completed' | 'voided'
  subtotal: number
  discount: number
  total: number
  amount_paid: number
  amount_due: number
  created_at: string
  void_reason: string | null
  cashier?: { id: number; name: string }
  items?: SaleItem[]
  items_count?: number
  payments?: SalePayment[]
  shop?: { id: number; name: string; phone: string | null; address: string | null }
}

export interface Paginated<T> {
  data: T[]
  current_page: number
  last_page: number
  total: number
}

export function paymentLabel(method: PaymentMethod): string {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method
}
