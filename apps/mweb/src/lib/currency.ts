import { ref } from 'vue'
export type Currency = 'SAR' | 'USD' | 'YER' | string
let current: Currency = 'SAR'
let symbol = 'ر.س'
let initialized = false
export const currencyVersion = ref(0)

export function setCurrency(c: Currency, sym?: string){ current = c; if (sym) symbol = sym }
export function getCurrency(){ return current }
export function setSymbol(sym: string){ symbol = sym }
export function getSymbol(){ return symbol }

export async function initCurrency(): Promise<void> {
  if (initialized) return
  try{
    // Use API_BASE to avoid hitting Vite dev server (5173) which has no /api proxy
    const base = (await import('@/lib/api')).API_BASE
    const res = await fetch(`${base}/api/currency`, { headers: { 'Accept': 'application/json' }, credentials: 'omit' })
    if (res.ok){
      const d = await res.json()
      const code = d?.code || d?.base || d?.currency || current
      let sym = d?.symbol || symbol
      if (!sym && code==='YER') sym = 'ر.ي'
      setCurrency(code, sym)
      currencyVersion.value++
      initialized = true
      return
    }
  }catch{}
  initialized = true
}

export function fmtPrice(n: number){
  // make it reactive to currency changes
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  currencyVersion.value
  const value = Number(n||0)
  const decimals = current === 'YER' ? 0 : 2
  const formatted = value.toFixed(decimals)
  return `${formatted} ${symbol}`
}

