export function getApiBase(): string {
  const trpc = process.env.EXPO_PUBLIC_TRPC_URL || 'http://localhost:4000/trpc';
  return trpc.replace(/\/?trpc$/, '');
}
