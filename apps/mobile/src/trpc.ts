import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import * as SecureStore from 'expo-secure-store';

export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const token = await SecureStore.getItemAsync('shop_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export function createTrpcLinks() {
  return [
    httpBatchLink({
      url: process.env.EXPO_PUBLIC_TRPC_URL || 'http://localhost:4000/trpc',
      headers: async () => await getAuthHeaders(),
    }),
  ];
}

// TRPC client typed as any for now to keep mobile decoupled from API typings
export const trpc = createTRPCReact<any>() as any;

