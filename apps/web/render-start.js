const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const standalone = join(__dirname, '.next', 'standalone', 'server.js');
const nextStartCmd = ['next', 'start'];

function runNode(args, env) {
  const child = spawn('node', args, { stdio: 'inherit', env: { ...process.env, ...env } });
  child.on('exit', (code) => process.exit(code || 0));
}

// Prefer standalone if it exists, otherwise fallback to next start
if (existsSync(standalone)) {
  runNode([standalone]);
} else {
  const child = spawn(nextStartCmd[0], [nextStartCmd[1]], { stdio: 'inherit', env: process.env });
  child.on('exit', (code) => process.exit(code || 0));
}

