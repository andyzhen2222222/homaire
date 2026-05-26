import { listProductsQuery } from '../server/services/catalogService';
import { prisma } from '../server/db/client';

async function main() {
  const all = await listProductsQuery({ limit: 5 });
  const sofas = await listProductsQuery({ category: 'sofas', limit: 5 });
  console.log('all', all.total, 'items', all.items.length);
  console.log('sofas', sofas.total, 'sample', sofas.items[0]?.name);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
