"use client";
export type ToastVariant = 'ok' | 'err' | 'info';

export function toast(message: string, variant: ToastVariant = 'info'){
  if (typeof window === 'undefined') return;
  const el = document.createElement('div');
  el.className = `toast ${variant==='ok'?'ok': variant==='err'?'err':''}`;
  el.setAttribute('role','status');
  el.setAttribute('aria-live','polite');
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(()=>{ el.remove(); }, 2600);
}












