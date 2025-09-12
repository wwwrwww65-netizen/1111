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
        PORT: '3001'
      }
    }
  ]
};

