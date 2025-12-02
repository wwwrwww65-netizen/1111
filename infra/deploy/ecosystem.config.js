module.exports = {
  apps: [
    {
      name: 'ecom-api',
      cwd: process.env.PROJECT_DIR || '/var/www/ecom',
      script: 'node',
      args: '-r dotenv/config packages/api/dist/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: '4000',
        HOST: '127.0.0.1',
        API_FORCE_LISTEN: '1',
        // Allow external Graph API calls for Meta integrations (disable in CI)
        META_ALLOW_EXTERNAL: process.env.META_ALLOW_EXTERNAL || '1',
        COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || '.jeeey.com',
        // Coupons audience: new user window in days (affects /api/me/coupons audience filtering)
        COUPON_NEW_USER_WINDOW_DAYS: process.env.COUPON_NEW_USER_WINDOW_DAYS || '30',
        // Ensure API builds absolute URLs for local uploads even if .env is missing
        PUBLIC_API_BASE: process.env.PUBLIC_API_BASE || 'https://api.jeeey.com',
        // OAuth redirect URIs (callbacks must hit API domain, not web/mweb)
        GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'https://api.jeeey.com/api/auth/google/callback',
        FACEBOOK_REDIRECT_URI: process.env.FACEBOOK_REDIRECT_URI || 'https://api.jeeey.com/api/auth/facebook/callback',
        // Default uploads directory (overridable via environment)
        UPLOADS_DIR: process.env.UPLOADS_DIR || '/var/www/ecom/uploads',
        DOTENV_CONFIG_PATH: 'packages/api/.env'
      }
    },
    {
      name: 'ecom-web',
      cwd: (process.env.PROJECT_DIR ? `${process.env.PROJECT_DIR}/apps/web` : '/var/www/ecom/apps/web'),
      script: 'node',
      args: '.next/standalone/apps/web/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        HOST: '127.0.0.1'
      }
    },
    {
      name: 'ecom-admin',
      cwd: (process.env.PROJECT_DIR ? `${process.env.PROJECT_DIR}/apps/admin` : '/var/www/ecom/apps/admin'),
      script: 'node',
      args: '.next/standalone/apps/admin/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: '3001',
        HOST: '127.0.0.1',
        // Force admin proxy to use local API to avoid egress/SSL issues
        INTERNAL_API_URL: process.env.INTERNAL_API_URL || 'http://127.0.0.1:4000',
        // Public base for client-only references if needed
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.jeeey.com'
      }
    }
  ]
};

