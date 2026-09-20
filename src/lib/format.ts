export function formatUgx(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: 'UGX',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatQuantity(quantity: number): string {
  return new Intl.NumberFormat('en-UG', { maximumFractionDigits: 3 }).format(quantity)
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-UG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// crypto.randomUUID only exists in secure contexts, and this app is opened
// over plain http on a LAN in shops, so it needs a fallback.
export function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}
