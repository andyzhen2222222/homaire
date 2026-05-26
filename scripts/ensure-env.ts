/**
 * Load .env (create from .env.example if missing) and apply safe defaults for local/deploy scripts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');
const examplePath = path.join(root, '.env.example');

export function ensureEnv(): void {
  if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    console.log('[env] Created .env from .env.example');
  }
  config({ path: envPath });

  process.env.DATABASE_URL ??= 'file:./data/homaire.db';
  process.env.JWT_SECRET ??= 'dev-change-me-in-production';
  process.env.ADMIN_SEED_EMAIL ??= 'admin@homaire.local';
  process.env.ADMIN_SEED_PASSWORD ??= 'admin';
  process.env.STORE_ADMIN_PASSWORD ??= 'admin';
  process.env.PORT ??= '3000';
}
