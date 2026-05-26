import { prisma } from '../db/client';

export async function bumpCatalogRevision(): Promise<number> {
  const meta = await prisma.catalogMeta.upsert({
    where: { id: 'global' },
    create: { id: 'global', revision: 1 },
    update: { revision: { increment: 1 } },
  });
  return meta.revision;
}

export async function getCatalogRevision(): Promise<number> {
  const meta = await prisma.catalogMeta.findUnique({ where: { id: 'global' } });
  return meta?.revision ?? 0;
}
