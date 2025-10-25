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

type RemoteConfig = {
  tokens: DesignTokens;
  home: HomeManifest;
  loadedAt: number;
};

const DEFAULT_CONFIG: RemoteConfig = {
  tokens: {
    colors: { primary: '#000000', background: '#ffffff', text: '#0f172a' },
    spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 },
    radius: { sm: 6, md: 10, lg: 16 },
  },
  home: { sections: [], version: '0' },
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

      const [tokens, home] = await Promise.all([
        fetchJson<DesignTokens>(tokensUrl),
        fetchJson<HomeManifest>(homeUrl),
      ]);

      const next: RemoteConfig = {
        tokens: tokens || cfg.tokens,
        home: home || cfg.home,
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
