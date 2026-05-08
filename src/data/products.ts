import { Product } from '../types';

const SOFA_IMAGES = [
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e',
  'https://images.unsplash.com/photo-1550254478-ead40cc54513',
  'https://images.unsplash.com/photo-1540574163026-643ea20ade25',
  'https://images.unsplash.com/photo-1567016432779-094069958ea5',
  'https://images.unsplash.com/photo-1505691938895-1758d7eaa511',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7',
  'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c',
  'https://images.unsplash.com/photo-1523755231516-e43fd2e8dca5'
];

const BED_IMAGES = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af',
  'https://images.unsplash.com/photo-1505693415918-91e514789da1',
  'https://images.unsplash.com/photo-1540518614846-7eded433c457',
  'https://images.unsplash.com/photo-1560185127-6ed189bf02f4',
  'https://images.unsplash.com/photo-1523213139764-16474fb06461',
  'https://images.unsplash.com/photo-1523755231516-e43fd2e8dca5',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858',
  'https://images.unsplash.com/photo-1531835551805-16d864c8d311'
];

const TABLE_IMAGES = [
  'https://images.unsplash.com/photo-1577145745727-42b88d4cfc84',
  'https://images.unsplash.com/photo-1534073828943-f801091bb18c',
  'https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf',
  'https://images.unsplash.com/photo-1604014237800-1c9102c219da',
  'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7',
  'https://images.unsplash.com/photo-1530018607912-eff2df114f23',
  'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c'
];

const CHAIR_IMAGES = [
  'https://images.unsplash.com/photo-1592078619091-155851b720b0',
  'https://images.unsplash.com/photo-1580480055273-228ff5388ef8',
  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c',
  'https://images.unsplash.com/photo-1503602642458-232111445657',
  'https://images.unsplash.com/photo-1510798831971-661eb04b3739',
  'https://images.unsplash.com/photo-1519947486511-46149fa0a254',
  'https://images.unsplash.com/photo-1581539250439-c96689b516dd'
];

const LIGHTING_IMAGES = [
  'https://images.unsplash.com/photo-1534073828943-f801091bb18c',
  'https://images.unsplash.com/photo-1507473884658-660c04bf604b',
  'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15',
  'https://images.unsplash.com/photo-1517409197771-1520a09e8b91',
  'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15',
  'https://images.unsplash.com/photo-1520923179278-ee25e25e09e4'
];

const SOFA_SUBCATS = ['modular', 'zip-leather', 'compact', 'luxury-nest'];
const sofaItems: Product[] = Array.from({ length: 60 }).map((_, i) => {
  const subCat = SOFA_SUBCATS[i % SOFA_SUBCATS.length];
  const name = i === 0 ? "Signature Zip-Modular Sofa" : 
               i === 1 ? "Compact Luxe Sofa" :
               i === 2 ? "Warm Beige Sectional" :
               `${subCat.charAt(0).toUpperCase() + subCat.slice(1)} Series ${Math.floor(i / SOFA_SUBCATS.length) + 1}`;
  return {
    id: `sofa-${i + 1}`,
    name: name,
    description: i === 0 ? "Our flagship modular design. Zip Small. Live Big. Adaptable to any urban living space." : `A beautifully crafted ${subCat} sofa from the ZipSofa collection.`,
    price: 1299 + (i * 50),
    onSale: i % 5 === 0,
    discountPrice: i % 5 === 0 ? Math.round((1299 + (i * 50)) * 0.8) : undefined,
    images: [
      `${SOFA_IMAGES[(i * 1) % SOFA_IMAGES.length]}?auto=format&fit=crop&q=80&w=800&h=800&idx=${i}_1`,
      `${SOFA_IMAGES[(i * 2) % SOFA_IMAGES.length]}?auto=format&fit=crop&q=80&w=800&h=800&idx=${i}_2`,
      `${SOFA_IMAGES[(i * 3) % SOFA_IMAGES.length]}?auto=format&fit=crop&q=80&w=800&h=800&idx=${i}_3`,
    ],
    category: 'sofas',
    subCategory: subCat,
    videoUrl: i === 0 ? 'https://player.vimeo.com/external/370331493.sd.mp4?s=7b231da3050800c025068a73315a013f9c6d4ba4&profile_id=139&oauth2_token_id=57447761' : undefined,
    stock: 10 + (i % 20),
    features: ['High-Performance Fabric', 'Eco-Zip System', 'Solid Oak Base'],
    dimensions: {
      width: 240 + (i % 20),
      height: 85,
      depth: 95
    }
  };
});

const BED_SUBCATS = ['solidwood', 'upholstered', 'minimalist'];
const bedItems: Product[] = Array.from({ length: 45 }).map((_, i) => {
  const subCat = BED_SUBCATS[i % BED_SUBCATS.length];
  return {
    id: `bed-${i + 1}`,
    name: `${subCat.charAt(0).toUpperCase() + subCat.slice(1)} Bed ${Math.floor(i / BED_SUBCATS.length) + 1}`,
    description: `Elegant ${subCat} bed designed for the perfect night's sleep. Premium aesthetics for your bedroom.`,
    price: 599 + (i * 70),
    onSale: i % 6 === 0,
    discountPrice: i % 6 === 0 ? Math.round((599 + (i * 70)) * 0.85) : undefined,
    images: [
      `${BED_IMAGES[(i * 1) % BED_IMAGES.length]}?auto=format&fit=crop&q=80&w=800&h=800&idx=${i}_1`,
      `${BED_IMAGES[(i * 2) % BED_IMAGES.length]}?auto=format&fit=crop&q=80&w=800&h=800&idx=${i}_2`,
    ],
    category: 'beds',
    subCategory: subCat,
    stock: 5 + (i % 15),
    features: ['Comfort oriented', 'Breathable materials', 'Quick assembly']
  };
});

const TABLE_SUBCATS = ['dining', 'coffee', 'side'];
const tableItems: Product[] = Array.from({ length: 45 }).map((_, i) => {
  const subCat = TABLE_SUBCATS[i % TABLE_SUBCATS.length];
  return {
    id: `table-${i + 1}`,
    name: `${subCat.charAt(0).toUpperCase() + subCat.slice(1)} Table ${Math.floor(i / TABLE_SUBCATS.length) + 1}`,
    description: `Functional and stylish ${subCat} table for your home. Ideal for various spaces.`,
    price: 249 + (i * 40),
    onSale: i % 7 === 0,
    discountPrice: i % 7 === 0 ? Math.round((249 + (i * 40)) * 0.75) : undefined,
    images: [
      `${TABLE_IMAGES[(i * 1) % TABLE_IMAGES.length]}?auto=format&fit=crop&q=80&w=800&h=800&idx=${i}_1`,
      `${TABLE_IMAGES[(i * 2) % TABLE_IMAGES.length]}?auto=format&fit=crop&q=80&w=800&h=800&idx=${i}_2`,
    ],
    category: 'tables',
    subCategory: subCat,
    stock: 15 + (i % 10),
    features: ['Modern design', 'Easy to clean', 'Robust build']
  };
});

const CHAIR_SUBCATS = ['dining', 'armchair', 'lounge'];
const chairItems: Product[] = Array.from({ length: 45 }).map((_, i) => {
  const subCat = CHAIR_SUBCATS[i % CHAIR_SUBCATS.length];
  return {
    id: `chair-${i + 1}`,
    name: `${subCat.charAt(0).toUpperCase() + subCat.slice(1)} Chair ${Math.floor(i / CHAIR_SUBCATS.length) + 1}`,
    description: `A unique ${subCat} chair that offers both style and ergonomic support.`,
    price: 149 + (i * 30),
    images: [
      `${CHAIR_IMAGES[(i * 1) % CHAIR_IMAGES.length]}?auto=format&fit=crop&q=80&w=800&h=800&idx=${i}_1`,
      `${CHAIR_IMAGES[(i * 2) % CHAIR_IMAGES.length]}?auto=format&fit=crop&q=80&w=800&h=800&idx=${i}_2`,
    ],
    category: 'chairs',
    subCategory: subCat,
    stock: 20 + (i % 20),
    features: ['Ergonomic', 'Designer look', 'Stable base']
  };
});

const GARDEN_SUBCATS = ['sofa', 'set'];
const gardenItems: Product[] = Array.from({ length: 30 }).map((_, i) => {
  const subCat = GARDEN_SUBCATS[i % GARDEN_SUBCATS.length];
  return {
    id: `garden-${i + 1}`,
    name: `Outdoor ${subCat.charAt(0).toUpperCase() + subCat.slice(1)} ${Math.floor(i / GARDEN_SUBCATS.length) + 1}`,
    description: `Weather-resistant ${subCat} for your outdoor living space. Built for durability.`,
    price: 499 + (i * 60),
    images: [
      `https://images.unsplash.com/photo-1517409197771-1520a09e8b91?auto=format&fit=crop&q=80&w=800&h=800&idx=${i}`,
    ],
    category: 'garden',
    subCategory: subCat,
    stock: 10 + (i % 10),
    features: ['Weather proof', 'UV resistant', 'Lightweight']
  };
});

const lightingItems: Product[] = Array.from({ length: 30 }).map((_, i) => ({
  id: `lighting-${i + 1}`,
  name: `Luminous Lamp ${i + 1}`,
  description: "Perfectly balanced lighting to set the mood in any space.",
  price: 99 + (i * 30),
  images: [
    `${LIGHTING_IMAGES[(i * 1) % LIGHTING_IMAGES.length]}?auto=format&fit=crop&q=80&w=800&h=800&idx=${i}_1`,
  ],
  category: 'lighting',
  stock: 25,
  features: ['Energy efficient', 'Adjustable']
}));

const decorItems: Product[] = Array.from({ length: 30 }).map((_, i) => ({
  id: `decor-${i + 1}`,
  name: `Designer Decor ${i + 1}`,
  description: "The final touch. Small details that make a big difference.",
  price: 49 + (i * 15),
  images: [`https://images.unsplash.com/photo-1513519247388-4e284044efd3?auto=format&fit=crop&q=80&w=800&h=800&idx=${i}`],
  category: 'decor',
  stock: 50,
  features: ['Handcrafted', 'Premium']
}));

const storageItems: Product[] = Array.from({ length: 30 }).map((_, i) => ({
  id: `storage-${i + 1}`,
  name: `Storage Unit ${i + 1}`,
  description: "Functional storage solutions for a clean and organized home.",
  price: 299 + (i * 45),
  images: [`https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=800&h=800&id=${i}`],
  category: 'storage',
  stock: 15,
  features: ['Modular', 'Durable']
}));

export const productsData: Product[] = [
  ...sofaItems,
  ...bedItems,
  ...tableItems,
  ...lightingItems,
  ...chairItems,
  ...storageItems,
  ...decorItems,
  ...gardenItems
];
