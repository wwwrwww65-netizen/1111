import { defineStore } from 'pinia'
import { apiGet } from '../lib/api'

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
  }),

  actions: {
    async checkAuth() {
      try {
        const user = await apiGet('/api/auth/me')
        if (user) {
          this.isLoggedIn = true
          this.username = user.name || user.email.split('@')[0]
          // You can map other fields here if the API returns them
        } else {
          this.isLoggedIn = false
          this.username = 'jeeey'
        }
      } catch (e) {
        this.isLoggedIn = false
        this.username = 'jeeey'
      }
    }
  }
})

