/**
 * Parse docs/gigab2b-categories.md → src/data/gigab2bCategoryData.ts
 * Run: node scripts/generate-gigab2b-categories.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const mdPaths = [
  path.join(root, 'docs', 'gigab2b-categories.md'),
  path.join(root, '..', 'gigab2b-categories.md'),
];
const mdPath = mdPaths.find((p) => fs.existsSync(p));
if (!mdPath) {
  console.error('gigab2b-categories.md not found');
  process.exit(1);
}

const md = fs.readFileSync(mdPath, 'utf8');

function extractEnglish(line) {
  let s = line.replace(/^#+\s*/, '').replace(/^-\s*/, '').trim();
  s = s.replace(/^[一二三四五六七八九十]+、\s*/, '');
  s = s.replace(/^\d+(\.\d+)?\s+/, '');
  s = s.replace(/[（(][^）)]+[）)]\s*$/, '').trim();
  return s;
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '')
    .replace(/\s*&\s*/g, '-')
    .replace(/&/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function uniqueSlug(base, used) {
  let slug = base || 'category';
  if (!used.has(slug)) {
    used.add(slug);
    return slug;
  }
  let n = 2;
  while (used.has(`${slug}-${n}`)) n++;
  slug = `${slug}-${n}`;
  used.add(slug);
  return slug;
}

const usedSlugs = new Set();
const tree = [];
let l1 = null;
let l2 = null;

for (const line of md.split(/\r?\n/)) {
  if (line.startsWith('## ')) {
    const name = extractEnglish(line);
    l1 = { name, slug: uniqueSlug(slugify(name), usedSlugs), children: [] };
    tree.push(l1);
    l2 = null;
  } else if (line.startsWith('### ')) {
    if (!l1) continue;
    const name = extractEnglish(line);
    l2 = { name, slug: uniqueSlug(slugify(name), usedSlugs), children: [] };
    l1.children.push(l2);
  } else if (line.startsWith('- ')) {
    if (!l2) continue;
    const name = extractEnglish(line);
    l2.children.push({ name, slug: uniqueSlug(slugify(name), usedSlugs) });
  }
}

const HERO_IMAGES = {
  furniture: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=2000',
  'garden-outdoor': 'https://images.unsplash.com/photo-1517409197771-1520a09e8b91?auto=format&fit=crop&q=80&w=2000',
  'fitness-sports': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=2000',
  'bath-faucets': 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&q=80&w=2000',
  kitchen: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&q=80&w=2000',
  'pet-supplies': 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&q=80&w=2000',
  toys: 'https://images.unsplash.com/photo-1515488042361-ee00e3ddd4d4?auto=format&fit=crop&q=80&w=2000',
  'auto-parts-transport': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=2000',
  lighting: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80&w=2000',
  'household-supplies-decor': 'https://images.unsplash.com/photo-1513519247388-4e284044efd3?auto=format&fit=crop&q=80&w=2000',
  travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=2000',
  'electrical-appliances': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=2000',
  'tools-tool-organizers': 'https://images.unsplash.com/photo-1581147036323-c1c5c7d2e672?auto=format&fit=crop&q=80&w=2000',
  'home-improvement': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=2000',
  commercial: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=2000',
  'industrial-scientific': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000',
  other: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=2000',
  part: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=2000',
};

const LEVEL1_IMAGES = { ...HERO_IMAGES };

const HERO_SUBTITLES = {
  furniture: 'Bedroom, dining, living, office and more — curated for modern homes.',
  'garden-outdoor': 'Patio sets, gazebos, grilling and everything for outdoor living.',
  'fitness-sports': 'Home gyms, cardio equipment and sports gear.',
  'bath-faucets': 'Bathtubs, vanities, showers and bathroom essentials.',
  kitchen: 'Appliances, sinks, storage and tools for the heart of your home.',
  'pet-supplies': 'Comfortable beds, condos and care for your companions.',
  toys: 'Playsets, rides and outdoor fun for kids.',
  'auto-parts-transport': 'Mobility, cargo and transport solutions.',
  lighting: 'Layered light for every room and outdoor space.',
  'household-supplies-decor': 'Finishing touches and everyday home essentials.',
  travel: 'Luggage and backpacks built for the journey.',
  'electrical-appliances': 'Climate, cleaning and home electronics.',
  'tools-tool-organizers': 'Workshop tools, storage and outdoor power equipment.',
  'home-improvement': 'Doors, hardware and wall treatments.',
  commercial: 'Professional equipment for business and hospitality.',
  'industrial-scientific': 'Specialized furniture and equipment.',
  other: 'Discover more across our catalog.',
  part: 'Replacement parts and accessories.',
};

/** Legacy flat slugs → new leaf or L1 slug */
const LEGACY_PRODUCT_CATEGORY_MAP = {
  sofas: 'sofas',
  beds: 'beds-frames-and-bases',
  tables: 'tables',
  chairs: 'chairs-and-accent-seating',
  garden: 'garden-outdoor',
  lighting: 'lighting',
  storage: 'display-shelving-and-etageres',
  decor: 'household-supplies-decor',
};

// Fix map after we know actual slugs
function findSlugByNamePart(part) {
  for (const s of usedSlugs) {
    if (s.includes(part)) return s;
  }
  return null;
}

// Reconcile legacy map with generated slugs
const slugList = [...usedSlugs];
const legacyMap = {};
for (const [old, target] of Object.entries(LEGACY_PRODUCT_CATEGORY_MAP)) {
  if (usedSlugs.has(target)) {
    legacyMap[old] = target;
  } else {
    const guess = slugList.find((s) => s.replace(/-/g, '').includes(target.replace(/-/g, '').slice(0, 8)));
    legacyMap[old] = guess || target;
  }
}

// Count stats
let l2count = 0;
let l3count = 0;
for (const n of tree) {
  l2count += n.children.length;
  for (const c of n.children) l3count += c.children.length;
}

const out = `/* eslint-disable */
/** AUTO-GENERATED by scripts/generate-gigab2b-categories.mjs — do not edit manually */
import type { Category } from '../types';

export type Gigab2bNode = {
  name: string;
  slug: string;
  children?: Gigab2bNode[];
};

/** GIGAB2B taxonomy: ${tree.length} level-1, ${l2count} level-2, ${l3count} level-3 */
export const GIGAB2B_TREE: Gigab2bNode[] = ${JSON.stringify(tree, null, 2)};

export const GIGAB2B_LEVEL1_IMAGES: Record<string, string> = ${JSON.stringify(LEVEL1_IMAGES, null, 2)};

export const GIGAB2B_HERO_IMAGES: Record<string, string> = ${JSON.stringify(HERO_IMAGES, null, 2)};

export const GIGAB2B_HERO_SUBTITLES: Record<string, string> = ${JSON.stringify(HERO_SUBTITLES, null, 2)};

/** Old 8-category slugs → new product category slug */
export const LEGACY_PRODUCT_CATEGORY_MAP: Record<string, string> = ${JSON.stringify(legacyMap, null, 2)};

export const LEGACY_ROOT_CATEGORY_SLUGS = new Set([
  'sofas', 'beds', 'tables', 'chairs', 'garden', 'lighting', 'storage', 'decor',
]);

export const GIGAB2B_PRIMARY_NAV_SLUGS: string[] = ${JSON.stringify(tree.map((n) => n.slug))};

function flattenTree(): Category[] {
  const out: Category[] = [];
  let sort = 0;
  const walk = (nodes: Gigab2bNode[], parentId: string | null) => {
    for (const node of nodes) {
      const id = \`cat_gb_\${node.slug}\`;
      out.push({
        id,
        name: node.name,
        slug: node.slug,
        image: parentId ? '' : (GIGAB2B_LEVEL1_IMAGES[node.slug] || ''),
        parentId,
        sortOrder: sort++,
      });
      if (node.children?.length) walk(node.children, id);
    }
  };
  walk(GIGAB2B_TREE, null);
  return out;
}

let _flat: Category[] | null = null;

export function getGigab2bCategoriesFlat(): Category[] {
  if (!_flat) _flat = flattenTree();
  return _flat.map((c) => ({ ...c }));
}

export function buildGigab2bSlugLabelMap(): Record<string, string> {
  const map: Record<string, string> = { sale: 'Sale', accessories: 'Accessories' };
  for (const c of getGigab2bCategoriesFlat()) {
    map[c.slug] = c.name;
  }
  return map;
}

export function buildNavSublinksFromTree(): Record<string, { name: string; href: string }[]> {
  const flat = getGigab2bCategoriesFlat();
  const byParent = new Map<string | null, Category[]>();
  for (const c of flat) {
    const pid = c.parentId ?? null;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid)!.push(c);
  }
  for (const arr of byParent.values()) {
    arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }
  const out: Record<string, { name: string; href: string }[]> = {};
  for (const l1 of byParent.get(null) || []) {
    const l2s = byParent.get(l1.id) || [];
    out[l1.slug] = l2s.slice(0, 8).map((c) => ({
      name: c.name,
      href: \`/category/\${c.slug}\`,
    }));
  }
  return out;
}

export function isLegacyFlatCategoryTree(categories: Category[]): boolean {
  if (!categories.length) return false;
  const roots = categories.filter((c) => !c.parentId);
  if (roots.length > 12) return false;
  return roots.every((r) => LEGACY_ROOT_CATEGORY_SLUGS.has(r.slug));
}

export function migrateLegacyProductCategory(slug: string): string {
  const key = slug.trim().toLowerCase();
  return LEGACY_PRODUCT_CATEGORY_MAP[key] || key;
}

export const GIGAB2B_LEAF_SLUGS: string[] = ${JSON.stringify(
  tree.flatMap((l1) => l1.children.flatMap((l2) => l2.children.map((l3) => l3.slug))),
  null,
  2,
)};
`;

const outPath = path.join(root, 'src', 'data', 'gigab2bCategoryData.ts');
fs.writeFileSync(outPath, out, 'utf8');
console.log(`Wrote ${outPath}`);
console.log(`Level 1: ${tree.length}, Level 2: ${l2count}, Level 3: ${l3count}, Total slugs: ${usedSlugs.size}`);
console.log('Legacy map:', legacyMap);
