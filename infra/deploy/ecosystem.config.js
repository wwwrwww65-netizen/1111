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
      cwd: process.env.PROJECT_DIR || '/var/www/ecom/apps/web',
      script: 'node',
      args: '.next/standalone/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: '3000'
      }
    },
    {
      name: 'ecom-admin',
      cwd: process.env.PROJECT_DIR || '/var/www/ecom/apps/admin',
      script: 'node',
      args: '.next/standalone/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: '3001'
      }
    }
  ]
};

