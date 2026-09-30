#!/usr/bin/env node
/**
 * Builds the hosted demo site into ./dist and zips it for upload:
 *   dist/index.html   → presentation deck (from web-demo/)
 *   dist/app/         → the web app in demo mode (no backend needed)
 *   npm run build:web-demo
 * The dev-only test-login values from .env.local are blanked so they never reach the public bundle,
 * and the build fails if any of them still appears in the output.
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const secrets = [];
for (const file of ['.env.local', '.env.development.local', '.env.production.local']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = /^\s*(EXPO_PUBLIC_TEST_LOGIN_[A-Z_]+)\s*=\s*(.+?)\s*$/.exec(line);
    if (match && match[2]) secrets.push(match[2].replace(/^['"]|['"]$/g, ''));
  }
}

rmSync('dist', { recursive: true, force: true });
execSync('npx expo export -p web --output-dir dist/app --clear', {
  stdio: 'inherit',
  env: { ...process.env, EXPO_PUBLIC_DEMO_MODE: 'true', EXPO_PUBLIC_TEST_LOGIN_EMAIL: '', EXPO_PUBLIC_TEST_LOGIN_PASSWORD: '' },
});

cpSync('web-demo', 'dist', { recursive: true });

const walk = (dir) => readdirSync(dir).flatMap((name) => { const p = join(dir, name); return statSync(p).isDirectory() ? walk(p) : [p]; });
for (const file of walk('dist').filter((f) => /\.(js|html|json)$/.test(f))) {
  const text = readFileSync(file, 'utf8');
  for (const secret of secrets) {
    if (secret && text.includes(secret)) { console.error(`\n✖ ${file} contains a value from .env.local — aborting.`); rmSync('dist', { recursive: true, force: true }); process.exit(1); }
  }
}
execSync('cd dist && rm -f ../runout-web-demo.zip && zip -qr ../runout-web-demo.zip . -x ".DS_Store"', { stdio: 'inherit' });
console.log('\n✔ Web demo ready: dist/ and runout-web-demo.zip (upload the zip to Hostinger → public_html and extract; the deck opens at /, the app at /app/).');
