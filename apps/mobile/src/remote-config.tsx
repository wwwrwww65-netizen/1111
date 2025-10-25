import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type DesignTokens = {
  colors: Record<string, string>;
  spacing: Record<string, number>;
  radius: Record<string, number>;
  typography?: Record<string, any>;
};

type HomeManifest = {
  sections: Array<
    | { type: 'banner'; id: string; imageUrl: string; link?: string }
    | { type: 'carousel'; id: string; title?: string; items: Array<{ imageUrl: string; link?: string }> }
    | { type: 'grid'; id: string; title?: string; items: Array<{ productId: string }> }
  >;
  version?: string;
};

type NavManifest = {
  header: { title?: string; actions?: Array<{ icon: string; link: string }> };
  tabs: Array<{ key: string; title: string; icon: string; link: string }>;
};

type PdpManifest = { blocks: Array<{ type: string; options?: Record<string, any> }>; };
type CategoriesManifest = { layout: { columns: number; gap: number }; showImages: boolean; filters: string[] };
type CartManifest = { showThumb: boolean; showVendor: boolean; totals: string[] };
type CheckoutManifest = { steps: string[]; paymentProviders: string[]; successLink: string; failureLink: string };
type OffersManifest = { placements: Record<string, any[]> };

type RemoteConfig = {
  tokens: DesignTokens;
  home: HomeManifest;
  nav: NavManifest;
  pdp: PdpManifest;
  categories: CategoriesManifest;
  cart: CartManifest;
  checkout: CheckoutManifest;
  offers: OffersManifest;
  loadedAt: number;
};

const DEFAULT_CONFIG: RemoteConfig = {
  tokens: {
    colors: { primary: '#000000', background: '#ffffff', text: '#0f172a' },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
    radius: { sm: 6, md: 10, lg: 16 },
  },
  home: { sections: [], version: '0' },
  nav: { header: { title: 'Jeeey' }, tabs: [] },
  pdp: { blocks: [{ type: 'images' }, { type: 'title-price' }, { type: 'actions' }] },
  categories: { layout: { columns: 3, gap: 8 }, showImages: true, filters: [] },
  cart: { showThumb: true, showVendor: false, totals: ['subtotal','shipping','discounts','total'] },
  checkout: { steps: ['address','shipping','payment','review'], paymentProviders: ['stripe'], successLink: '/pay/success', failureLink: '/pay/failure' },
  offers: { placements: {} },
  loadedAt: Date.now(),
};

const RC_KEY = 'remote_config_v1';

const RemoteConfigContext = createContext<RemoteConfig>(DEFAULT_CONFIG);

export function useRemoteConfig() {
  return useContext(RemoteConfigContext);
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const RemoteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cfg, setCfg] = useState<RemoteConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    (async () => {
      // Load cached first
      try {
        const cached = await AsyncStorage.getItem(RC_KEY);
        if (cached) setCfg(JSON.parse(cached));
      } catch {}

      // Fetch remote tokens and manifest (test endpoints now; move to Secrets later)
      const base = process.env.EXPO_PUBLIC_CONFIG_BASE || 'https://api.jeeey.com';
      const tokensUrl = `${base}/mobile/config/tokens.json`;
      const homeUrl = `${base}/mobile/config/home.json`;
      const navUrl = `${base}/mobile/config/nav.json`;
      const pdpUrl = `${base}/mobile/config/pdp.json`;
      const catsUrl = `${base}/mobile/config/categories.json`;
      const cartUrl = `${base}/mobile/config/cart.json`;
      const checkoutUrl = `${base}/mobile/config/checkout.json`;
      const offersUrl = `${base}/mobile/config/offers.json`;

      const [tokens, home, nav, pdp, categories, cart, checkout, offers] = await Promise.all([
        fetchJson<DesignTokens>(tokensUrl),
        fetchJson<HomeManifest>(homeUrl),
        fetchJson<NavManifest>(navUrl),
        fetchJson<PdpManifest>(pdpUrl),
        fetchJson<CategoriesManifest>(catsUrl),
        fetchJson<CartManifest>(cartUrl),
        fetchJson<CheckoutManifest>(checkoutUrl),
        fetchJson<OffersManifest>(offersUrl),
      ]);

      const next: RemoteConfig = {
        tokens: tokens || cfg.tokens,
        home: home || cfg.home,
        nav: nav || cfg.nav,
        pdp: pdp || cfg.pdp,
        categories: categories || cfg.categories,
        cart: cart || cfg.cart,
        checkout: checkout || cfg.checkout,
        offers: offers || cfg.offers,
        loadedAt: Date.now(),
      };
      setCfg(next);
      try {
        await AsyncStorage.setItem(RC_KEY, JSON.stringify(next));
      } catch {}
    })();
  }, []);

  const value = useMemo(() => cfg, [cfg]);
  return <RemoteConfigContext.Provider value={value}>{children}</RemoteConfigContext.Provider>;
};
