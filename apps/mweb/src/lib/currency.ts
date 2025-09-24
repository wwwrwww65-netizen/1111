export type Currency = 'SAR' | 'USD'
let current: Currency = 'SAR'
export function setCurrency(c: Currency){ current = c }
export function getCurrency(){ return current }
export function fmtPrice(n: number){ return current==='USD' ? `$${n.toFixed(2)}` : `${n.toFixed(2)} ر.س` }

