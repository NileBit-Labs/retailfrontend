import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { apiFetch } from '@/lib/api'
import { uuid } from '@/lib/format'
import { useCatalogStore } from '@/stores/catalog'
import { useShopStore } from '@/stores/shop'
import type { PaymentMethod, PosProduct, ProductUnit, Sale } from '@/types/sales'

export interface CartLine {
  id: string
  productId: number
  name: string
  baseUnit: string
  unit: string
  conversion: number
  unitPrice: number
  quantity: number
  discount: number
  units: ProductUnit[]
  stock: number
}

export interface PaymentInput {
  method: PaymentMethod
  amount: number
  reference?: string
}

const roundMoney = (n: number) => Math.round(n)
const roundQty = (n: number) => Math.round(n * 1000) / 1000

export const useCartStore = defineStore('cart', () => {
  const lines = ref<CartLine[]>([])
  const orderDiscount = ref(0)
  // One key per sale attempt: if the request is retried after a dropped
  // connection the server recognises it and never records the sale twice.
  const attemptKey = ref(uuid())

  const lineTotal = (line: CartLine) => roundMoney(line.quantity * line.unitPrice) - line.discount
  const subtotal = computed(() =>
    lines.value.reduce((sum, l) => sum + roundMoney(l.quantity * l.unitPrice), 0),
  )
  const discountTotal = computed(
    () => lines.value.reduce((sum, l) => sum + l.discount, 0) + orderDiscount.value,
  )
  const total = computed(() => Math.max(0, subtotal.value - discountTotal.value))
  const itemCount = computed(() => lines.value.length)

  // How much of a product (in its base unit) is already in the cart,
  // optionally leaving one line out.
  function baseInCart(productId: number, exceptLineId?: string) {
    return lines.value
      .filter((l) => l.productId === productId && l.id !== exceptLineId)
      .reduce((sum, l) => sum + l.quantity * l.conversion, 0)
  }

  function maxQuantity(line: CartLine) {
    return roundQty((line.stock - baseInCart(line.productId, line.id)) / line.conversion)
  }

  function add(product: PosProduct) {
    const existing = lines.value.find(
      (l) => l.productId === product.id && l.unit === product.base_unit,
    )
    if (existing) {
      setQuantity(existing, existing.quantity + 1)
      return
    }
    if (product.stock - baseInCart(product.id) < 1) return

    lines.value.push({
      id: uuid(),
      productId: product.id,
      name: product.name,
      baseUnit: product.base_unit,
      unit: product.base_unit,
      conversion: 1,
      unitPrice: product.selling_price,
      quantity: 1,
      discount: 0,
      units: product.units,
      stock: product.stock,
    })
  }

  function setQuantity(line: CartLine, quantity: number) {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      remove(line)
      return
    }
    line.quantity = Math.min(roundQty(quantity), Math.max(maxQuantity(line), 0))
    if (line.discount > roundMoney(line.quantity * line.unitPrice)) {
      line.discount = roundMoney(line.quantity * line.unitPrice)
    }
    if (line.quantity <= 0) remove(line)
  }

  function setUnit(line: CartLine, unitName: string) {
    const catalog = useCatalogStore().products.find((p) => p.id === line.productId)
    if (unitName === line.baseUnit) {
      line.unit = line.baseUnit
      line.conversion = 1
      line.unitPrice = catalog?.selling_price ?? line.unitPrice
    } else {
      const unit = line.units.find((u) => u.unit_name === unitName)
      if (!unit) return
      line.unit = unit.unit_name
      line.conversion = unit.conversion_to_base_unit
      line.unitPrice = unit.selling_price
    }
    line.discount = 0
    setQuantity(line, line.quantity)
  }

  function setLineDiscount(line: CartLine, discount: number) {
    const gross = roundMoney(line.quantity * line.unitPrice)
    line.discount = Math.min(Math.max(Math.round(discount) || 0, 0), gross)
  }

  function setOrderDiscount(discount: number) {
    const room = subtotal.value - lines.value.reduce((sum, l) => sum + l.discount, 0)
    orderDiscount.value = Math.min(Math.max(Math.round(discount) || 0, 0), Math.max(room, 0))
  }

  function remove(line: CartLine) {
    lines.value = lines.value.filter((l) => l.id !== line.id)
    if (!lines.value.length) orderDiscount.value = 0
  }

  function clear() {
    lines.value = []
    orderDiscount.value = 0
    attemptKey.value = uuid()
  }

  async function checkout(payments: PaymentInput[]): Promise<Sale> {
    const sale = await apiFetch<Sale>('/sales', {
      method: 'POST',
      body: {
        idempotency_key: attemptKey.value,
        discount: orderDiscount.value || undefined,
        items: lines.value.map((l) => ({
          product_id: l.productId,
          quantity: l.quantity,
          unit: l.unit,
          discount: l.discount || undefined,
        })),
        payments: payments.map((p) => ({
          method: p.method,
          amount: p.amount,
          reference: p.reference || undefined,
        })),
      },
    })

    const shopId = useShopStore().currentShop?.id
    const catalog = useCatalogStore()
    if (shopId) {
      for (const line of lines.value) {
        catalog.adjustStock(line.productId, -roundQty(line.quantity * line.conversion), shopId)
      }
    }

    clear()
    return sale
  }

  return {
    lines,
    orderDiscount,
    subtotal,
    discountTotal,
    total,
    itemCount,
    lineTotal,
    maxQuantity,
    add,
    setQuantity,
    setUnit,
    setLineDiscount,
    setOrderDiscount,
    remove,
    clear,
    checkout,
  }
})
