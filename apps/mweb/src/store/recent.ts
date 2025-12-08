import { defineStore } from 'pinia'
import { apiGet } from '@/lib/api'

export type RecentItem = {
    id: string;
    title: string;
    price: number;
    img: string;
    images?: string[];
    colorThumbs?: string[];
    colors?: string[];
    brand?: string;
    discountPercent?: number;
    basePrice?: number;
    soldPlus?: boolean;
    couponPrice?: number;
    overlayBannerSrc?: string;
    overlayBannerAlt?: string;
    slug?: string;
}

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
        async sync() {
            try {
                const sid = localStorage.getItem('sid_v1') || ''
                const res = await apiGet<{ items: RecentItem[] }>(`/api/products/recent?sessionId=${sid}`)
                if (res && Array.isArray(res.items) && res.items.length > 0) {
                    // Merge: Keep local items at the top (they might be newer than server sync), add server items
                    const currentIds = new Set(this.items.map(i => i.id))
                    const newItems = res.items.filter(i => !currentIds.has(i.id))

                    // If we have local items, we trust them as "most recent" for this session
                    // But if server returns a list, it might be from a previous session
                    // Let's append server items to the end of local items
                    this.items = [...this.items, ...newItems]

                    if (this.items.length > 20) this.items = this.items.slice(0, 20)
                    save(this.items)
                }
            } catch (e) {
                console.error('Failed to sync recent', e)
            }
        },
        clear() {
            this.items = []
            save(this.items)
        }
    }
})
