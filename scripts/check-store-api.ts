/**
 * Quick check: API and snapshot reachable (dev or production URL).
 * Usage: npx tsx scripts/check-store-api.ts [baseUrl]
 */
const base = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');

async function main(): Promise<void> {
  console.log(`Checking ${base}\n`);
  for (const path of [
    '/api/health',
    '/api/v1/products?limit=1',
    '/feishu-bitable-db-v1.json',
  ]) {
    const url = `${base}${path}`;
    try {
      const res = await fetch(url, { cache: 'no-store' });
      const ct = res.headers.get('content-type') || '';
      const text = await res.text();
      const kind = ct.includes('json') ? 'JSON' : text.trimStart().startsWith('<') ? 'HTML' : 'other';
      let extra = '';
      if (kind === 'JSON' && path.includes('products')) {
        const j = JSON.parse(text) as { total?: number };
        extra = ` total=${j.total ?? '?'}`;
      }
      if (kind === 'JSON' && path.includes('health')) {
        const j = JSON.parse(text) as { productCount?: number };
        extra = ` products=${j.productCount ?? '?'}`;
      }
      if (kind === 'JSON' && path.includes('feishu')) {
        const j = JSON.parse(text) as { products?: unknown[] };
        extra = ` products=${j.products?.length ?? '?'}`;
      }
      console.log(`${res.status} ${kind.padEnd(5)} ${path}${extra}`);
    } catch (e) {
      console.log(`ERR   ${path} — ${e instanceof Error ? e.message : e}`);
    }
  }
}

main();
