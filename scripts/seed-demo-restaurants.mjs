import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const catalogue = JSON.parse(readFileSync(new URL('../mobile/src/demo/dubai-restaurants.json', import.meta.url), 'utf8'));
const rows = Object.entries(catalogue).flatMap(([area, location]) =>
  location.restaurants.map((restaurant, index) => ({
    ...restaurant,
    area,
    latitude: location.latitude + (index - 1.5) * 0.003,
    longitude: location.longitude + (index - 1.5) * 0.002,
  })),
);
const sql = readFileSync(new URL('./seed-demo-restaurants.sql', import.meta.url), 'utf8');

const result = spawnSync('docker', [
  'compose', 'exec', '-T', 'postgres',
  'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-v', `catalogue=${JSON.stringify(rows)}`,
  '-U', 'runout', '-d', 'runout',
], { cwd: root, input: sql, stdio: ['pipe', 'inherit', 'inherit'] });

if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
