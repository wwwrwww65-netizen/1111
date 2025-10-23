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
        API_FORCE_LISTEN: '1',
        COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || '.jeeey.com',
        // Ensure API builds absolute URLs for local uploads even if .env is missing
        PUBLIC_API_BASE: process.env.PUBLIC_API_BASE || 'https://api.jeeey.com',
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
        PORT: '3000'
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
        // Force admin proxy to use local API to avoid egress/SSL issues
        INTERNAL_API_URL: process.env.INTERNAL_API_URL || 'http://127.0.0.1:4000',
        // Public base for client-only references if needed
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.jeeey.com'
      }
    }
  ]
};

