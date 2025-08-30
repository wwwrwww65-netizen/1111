const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const standalone = join(__dirname, '.next', 'standalone', 'server.js');
const nextBin = join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');

function runNode(args, env) {
  const child = spawn('node', args, { stdio: 'inherit', env: { ...process.env, ...env } });
  child.on('exit', (code) => process.exit(code || 0));
}

// Prefer standalone if it exists, otherwise fallback to next start
if (existsSync(standalone)) {
  runNode([standalone]);
} else {
  const args = [nextBin, 'start'];
  const child = spawn(process.execPath, args, { stdio: 'inherit', env: process.env });
  child.on('error', (err) => {
    console.error('Failed to start Next via local bin:', err);
    process.exit(1);
  });
  child.on('exit', (code) => process.exit(code || 0));
}

