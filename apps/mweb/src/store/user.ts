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
        console.log('Checking auth...')
        const user = await apiGet('/api/auth/me')
        console.log('Auth check result:', user)
        if (user) {
          this.isLoggedIn = true
          this.username = user.name || user.email.split('@')[0]
          console.log('User logged in:', this.username)
        } else {
          this.isLoggedIn = false
          this.username = 'jeeey'
          console.log('User not logged in (no user data)')
        }
      } catch (e: any) {
        // Suppress 401/403 errors as they are expected for guests
        if (e?.status !== 401 && e?.status !== 403) {
          console.error('Auth check failed:', e)
        } else {
          console.log('User is guest')
        }
        this.isLoggedIn = false
        this.username = 'jeeey'
      }
    }
  }
})

