import { defineStore } from 'pinia'

export type Address = {
  country: string
  firstName: string
  middleName?: string
  lastName: string
  fullNameEn?: string
  phone: string
  altPhone?: string
  province: string
  city: string
  district?: string
  street: string
  details: string
}

export type ShippingMethod = { id: string; name: string; desc?: string; price: number }

export const useCheckout = defineStore('checkout', {
  state: () => ({
    address: undefined as Address | undefined,
    shipping: undefined as ShippingMethod | undefined,
    payment: undefined as string | undefined
  }),
  actions: {
    setAddress(addr: Address){ this.address = addr },
    setShipping(m: ShippingMethod){ this.shipping = m },
    setPayment(p: string){ this.payment = p }
  }
})

