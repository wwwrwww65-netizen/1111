/**
 * Secure token handling utilities for authentication.
 * Provides abstraction for secure token storage with fallback to AsyncStorage.
 * 
 * TODO: Implement actual SecureStore integration when expo-secure-store is added.
 * TODO: Add token refresh logic.
 * TODO: Add token expiration handling.
 */

// Note: This is a stub implementation. In production, use expo-secure-store for sensitive tokens.
// For now, we use AsyncStorage as a placeholder.

interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  setAccessToken(token: string): Promise<void>;
  removeAccessToken(): Promise<void>;
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string): Promise<void>;
  removeRefreshToken(): Promise<void>;
}

/**
 * Token storage implementation.
 * 
 * SECURITY NOTE: This implementation uses AsyncStorage as a placeholder.
 * In production, install expo-secure-store and use SecureStore for access tokens:
 * 
 * ```
 * import * as SecureStore from 'expo-secure-store';
 * 
 * async getAccessToken() {
 *   return await SecureStore.getItemAsync('access_token');
 * }
 * ```
 * 
 * Use AsyncStorage only for non-sensitive data like cached user preferences.
 */
class TokenStorageImpl implements TokenStorage {
  private memoryStore: Map<string, string> = new Map();

  async getAccessToken(): Promise<string | null> {
    // TODO: Replace with SecureStore.getItemAsync('access_token')
    return this.memoryStore.get('access_token') || null;
  }

  async setAccessToken(token: string): Promise<void> {
    // TODO: Replace with SecureStore.setItemAsync('access_token', token)
    this.memoryStore.set('access_token', token);
  }

  async removeAccessToken(): Promise<void> {
    // TODO: Replace with SecureStore.deleteItemAsync('access_token')
    this.memoryStore.delete('access_token');
  }

  async getRefreshToken(): Promise<string | null> {
    // TODO: Replace with SecureStore.getItemAsync('refresh_token')
    return this.memoryStore.get('refresh_token') || null;
  }

  async setRefreshToken(token: string): Promise<void> {
    // TODO: Replace with SecureStore.setItemAsync('refresh_token', token)
    this.memoryStore.set('refresh_token', token);
  }

  async removeRefreshToken(): Promise<void> {
    // TODO: Replace with SecureStore.deleteItemAsync('refresh_token')
    this.memoryStore.delete('refresh_token');
  }
}

export const tokenStorage: TokenStorage = new TokenStorageImpl();

/**
 * Authentication utilities
 */
export const auth = {
  /**
   * Get the current access token
   */
  getAccessToken: () => tokenStorage.getAccessToken(),

  /**
   * Set the access token
   */
  setAccessToken: (token: string) => tokenStorage.setAccessToken(token),

  /**
   * Remove the access token (logout)
   */
  logout: async () => {
    await tokenStorage.removeAccessToken();
    await tokenStorage.removeRefreshToken();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: async (): Promise<boolean> => {
    const token = await tokenStorage.getAccessToken();
    return token !== null;
  },
};
