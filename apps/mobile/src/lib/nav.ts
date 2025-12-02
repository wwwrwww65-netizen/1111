export function resolveLink(link?: string): { screen: string; params?: any } | null {
  if (!link) return null;
  try {
    const u = new URL(link, 'https://jeeey.com');
    const path = u.pathname;
    if (path === '/' || path === '/home') return { screen: 'home' };
    if (path.startsWith('/categories')) return { screen: 'categories' };
    if (path.startsWith('/wishlist')) return { screen: 'wishlist' };
    if (path.startsWith('/account')) return { screen: 'account' };
    if (path.startsWith('/cart')) return { screen: 'cart' };
    if (path.startsWith('/search')) return { screen: 'search' };
    if (path.startsWith('/p')) {
      const id = u.searchParams.get('id');
      if (id) return { screen: 'Product', params: { id } };
    }
  } catch {}
  return null;
}
