/**
 * Navigation link resolver types and utilities.
 * Provides type-safe navigation link resolution for dynamic navigation.
 */

export interface NavigationLink {
  screen: string;
  params?: Record<string, string | number | boolean>;
}

export interface ResolvedLink {
  screen: string;
  params: Record<string, string | number | boolean>;
}

/**
 * Resolves a navigation link string or object into a typed navigation structure.
 * This function can be used to parse link configurations from remote config or deep links.
 * 
 * @param link - The link to resolve (string URL or NavigationLink object)
 * @returns ResolvedLink with screen name and parameters
 */
export function resolveLink(link: string | NavigationLink): ResolvedLink {
  if (typeof link === 'string') {
    // Parse string URLs like "/product/123" or "Product?id=123"
    const [path, search] = link.split('?');
    const screen = path.replace(/^\//, '') || 'Home';
    const params: Record<string, string | number | boolean> = {};
    
    if (search) {
      const searchParams = new URLSearchParams(search);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }
    
    return { screen, params };
  }
  
  return {
    screen: link.screen,
    params: link.params || {},
  };
}

/**
 * Type guard to check if a value is a NavigationLink
 */
export function isNavigationLink(value: unknown): value is NavigationLink {
  return typeof value === 'object' && value !== null && 'screen' in value && typeof (value as NavigationLink).screen === 'string';
}
