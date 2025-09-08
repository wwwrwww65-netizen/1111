module.exports = {
  apps: [
    {
      name: 'ecom-api',
      cwd: process.env.PROJECT_DIR || '/var/www/ecom',
      script: 'node',
      args: 'packages/api/dist/index.js',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'ecom-web',
      cwd: (process.env.PROJECT_DIR ? `${process.env.PROJECT_DIR}/apps/web` : '/var/www/ecom/apps/web'),
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
        PORT: '3000'
      }
    },
    {
      name: 'ecom-admin',
      cwd: (process.env.PROJECT_DIR ? `${process.env.PROJECT_DIR}/apps/admin` : '/var/www/ecom/apps/admin'),
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      env: {
        NODE_ENV: 'production',
        PORT: '3001'
      }
    }
  ]
};

