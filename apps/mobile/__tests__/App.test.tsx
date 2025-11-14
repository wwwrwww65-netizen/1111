/**
 * Basic smoke tests for the mobile app utilities
 * These tests ensure type safety and utility functions work correctly
 */

describe('Mobile App Utilities', () => {
  describe('Navigation utilities', () => {
    it('resolves string URLs to navigation links', () => {
      const { resolveLink } = require('../src/lib/nav');
      
      // Test string URL resolution
      const result1 = resolveLink('/product/123');
      expect(result1.screen).toBe('product/123');
      expect(result1.params).toEqual({});
      
      // Test URL with query params
      const result2 = resolveLink('Product?id=123&name=test');
      expect(result2.screen).toBe('Product');
      expect(result2.params.id).toBe('123');
      expect(result2.params.name).toBe('test');
    });
    
    it('resolves navigation link objects', () => {
      const { resolveLink } = require('../src/lib/nav');
      
      const result = resolveLink({ 
        screen: 'Home', 
        params: { tab: 'new', page: 1 } 
      });
      expect(result.screen).toBe('Home');
      expect(result.params).toEqual({ tab: 'new', page: 1 });
    });
    
    it('validates navigation link type guards', () => {
      const { isNavigationLink } = require('../src/lib/nav');
      
      expect(isNavigationLink({ screen: 'Home' })).toBe(true);
      expect(isNavigationLink({ screen: 'Product', params: { id: '1' } })).toBe(true);
      expect(isNavigationLink('not a link')).toBe(false);
      expect(isNavigationLink(null)).toBe(false);
      expect(isNavigationLink(undefined)).toBe(false);
      expect(isNavigationLink({})).toBe(false);
      expect(isNavigationLink({ params: {} })).toBe(false);
    });
  });
  
  describe('Auth utilities', () => {
    it('provides token storage interface', async () => {
      const { auth } = require('../src/lib/auth');
      
      expect(auth.getAccessToken).toBeDefined();
      expect(auth.setAccessToken).toBeDefined();
      expect(auth.logout).toBeDefined();
      expect(auth.isAuthenticated).toBeDefined();
    });
    
    it('can check authentication status', async () => {
      const { auth } = require('../src/lib/auth');
      
      const isAuthed = await auth.isAuthenticated();
      expect(typeof isAuthed).toBe('boolean');
    });
  });
});
