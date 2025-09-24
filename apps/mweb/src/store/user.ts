import { defineStore } from 'pinia'

export const useUser = defineStore('user', {
  state: () => ({
    isLoggedIn: false,
    username: 'jeeey',
    clubLevel: 'S0',
    monthPoints: 15,
    lastMonthPoints: 10,
    orders: 1,
    reviews: 0,
    points: 0,
    coupons: 1
  })
})

