const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join } = require('node:path');

const standaloneTop = join(__dirname, '.next', 'standalone', 'server.js');
const standaloneNested = join(__dirname, '.next', 'standalone', 'apps', 'admin', 'server.js');
const nextBin = join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');

function runNode(args, env) {
  const child = spawn(process.execPath, args, { stdio: 'inherit', env: { ...process.env, ...env } });
  child.on('exit', (code) => process.exit(code || 0));
  child.on('error', (err) => { console.error(err); process.exit(1); });
}

if (existsSync(standaloneTop)) {
  runNode([standaloneTop]);
} else if (existsSync(standaloneNested)) {
  runNode([standaloneNested]);
} else if (existsSync(nextBin)) {
  runNode([nextBin, 'start', '-p', process.env.PORT || '3001']);
} else {
  console.error('[render-start] Neither standalone server.js nor next binary found.');
  process.exit(1);
}

