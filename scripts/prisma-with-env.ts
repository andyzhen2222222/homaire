/**
 * Run Prisma CLI with DATABASE_URL loaded (see ensure-env.ts).
 * Usage: tsx scripts/prisma-with-env.ts db push
 */
import { spawnSync } from 'node:child_process';
import { ensureEnv } from './ensure-env';

ensureEnv();

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: tsx scripts/prisma-with-env.ts <prisma-args...>');
  process.exit(1);
}

const prismaArgs = [...args];
if (prismaArgs[0] === 'db' && prismaArgs[1] === 'push' && !prismaArgs.includes('--skip-generate')) {
  prismaArgs.push('--skip-generate');
}

const result = spawnSync('npx', ['prisma', ...prismaArgs], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
  cwd: process.cwd(),
});

process.exit(result.status ?? 1);
