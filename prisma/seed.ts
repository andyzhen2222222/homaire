import { initDatabase } from '../server/db/init';
import { prisma } from '../server/db/client';

async function main(): Promise<void> {
  await initDatabase();
  const productCount = await prisma.product.count();
  console.log(`Seed complete: ${productCount} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
