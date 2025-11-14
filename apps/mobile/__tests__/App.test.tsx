/**
 * Basic smoke tests for the mobile app utilities
 * These tests ensure type safety and utility functions work correctly
 */

import { resolveLink, isNavigationLink } from '../src/lib/nav';
import { auth } from '../src/lib/auth';

describe('Mobile App Utilities', () => {
  describe('Navigation utilities', () => {
    it('resolves string URLs to navigation links', () => {
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
      const result = resolveLink({ 
        screen: 'Home', 
        params: { tab: 'new', page: 1 } 
      });
      expect(result.screen).toBe('Home');
      expect(result.params).toEqual({ tab: 'new', page: 1 });
    });
    
    it('validates navigation link type guards', () => {
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
      expect(auth.getAccessToken).toBeDefined();
      expect(auth.setAccessToken).toBeDefined();
      expect(auth.logout).toBeDefined();
      expect(auth.isAuthenticated).toBeDefined();
    });
    
    it('can check authentication status', async () => {
      const isAuthed = await auth.isAuthenticated();
      expect(typeof isAuthed).toBe('boolean');
    });
  });
});
