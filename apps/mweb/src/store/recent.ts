import { defineStore } from 'pinia'

export type RecentItem = { id: string; title: string; price: number; img: string; brand?: string; discountPercent?: number; basePrice?: number; soldPlus?: boolean; couponPrice?: number }

function load(): RecentItem[] {
    try { return JSON.parse(localStorage.getItem('recent_viewed') || '[]') } catch { return [] }
}
function save(items: RecentItem[]) {
    try { localStorage.setItem('recent_viewed', JSON.stringify(items)) } catch { }
}

export const useRecent = defineStore('recent', {
    state: () => ({ items: load() as RecentItem[] }),
    getters: {
        count: (s) => s.items.length,
        list: (s) => s.items.slice(0, 10) // Limit to 10 as requested
    },
    actions: {
        add(item: RecentItem) {
            // Remove if exists to re-add at top
            this.items = this.items.filter(i => i.id !== item.id)
            this.items.unshift(item)
            if (this.items.length > 20) this.items = this.items.slice(0, 20) // Keep 20 in storage, show 10
            save(this.items)
        },
        clear() {
            this.items = []
            save(this.items)
        }
    }
})
