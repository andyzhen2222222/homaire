/**
 * 验证批量导入行解析 + localDb 写入（不启动浏览器）。
 * 运行：npm run test:import
 */
import { processImportedProductRows, isDjianCloudSourceRow } from '../src/lib/productImport';
import { localBulkAddProducts, getLocalProducts } from '../src/lib/localDb';

const memory: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => (Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null),
  setItem: (k: string, v: string) => {
    memory[k] = v;
  },
  removeItem: (k: string) => {
    delete memory[k];
  },
  clear: () => {
    for (const k of Object.keys(memory)) delete memory[k];
  },
};

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// 1) processImportedProductRows：缺图时补占位、过滤空 name
const rows = [
  { name: '  Import Test A ', price: '199.5', category: 'Sofas', stock: '3', description: 'from script' },
  { name: '', price: 1 },
  { Name: 'Import Test B', Price: 88, Category: 'decor', Stock: 1, images: '' },
];
const parsed = processImportedProductRows(rows, { defaultCategory: 'sofas' });
assert(parsed.length === 2, `expected 2 valid rows, got ${parsed.length}`);
assert(parsed[0].name === 'Import Test A', 'trim name');
assert(parsed[0].images.length === 1 && parsed[0].images[0].includes('unsplash'), 'fallback image');
assert(parsed[0].category === 'sofas', 'Sofas column normalizes to sofas slug');
assert(parsed[1].category === 'decor', 'PascalCase + lowercase category');

const inferLighting = processImportedProductRows(
  [{ name: '北欧LED吸顶灯 三色变光', price: 99, stock: 2, category: '', description: '' }],
  { defaultCategory: 'sofas' }
);
assert(inferLighting.length === 1 && inferLighting[0].category === 'lighting', 'infer category from name when category empty');

const inferTables = processImportedProductRows(
  [{ name: '橡木实木餐桌 1.4m', price: 400, stock: 1, category: '' }],
  { defaultCategory: 'sofas' }
);
assert(inferTables[0].category === 'tables', `infer tables, got ${inferTables[0].category}`);

const inferWithAllow = processImportedProductRows(
  [{ name: '橡木餐桌', price: 1, stock: 1, category: 'invalid-slug-xyz' }],
  { defaultCategory: 'sofas', allowedCategorySlugs: ['sofas', 'beds', 'tables', 'chairs'] }
);
assert(
  inferWithAllow[0].category === 'tables',
  `unknown category column + allow list → infer, got ${inferWithAllow[0].category}`
);

// 2) localBulkAddProducts：写入后可读
const before = getLocalProducts().length;
localBulkAddProducts(parsed);
const after = getLocalProducts().length;
assert(after === before + 2, `expected +2 products, before=${before} after=${after}`);

const names = getLocalProducts()
  .map((p) => p.name)
  .filter((n) => n === 'Import Test A' || n === 'Import Test B');
assert(names.length >= 2, 'imported names present in store');

// 3) 大健云仓列：识别 + 映射（键须加引号，避免连字符被解析为减号）
const djianLike = {
  产品型号: 'Test Sofa Model Name',
  德国最新单价: '199.5',
  可售库存: '7',
  图片1: 'https://example.com/a.jpg',
  简短描述1: '卖点一',
  简短描述2: '卖点二',
  简短描述3: '第三卖点',
  长描述: 'Line1\n\nLine2',
  说明书: '',
  '沙发类型-中文': '角沙发',
} as Record<string, string>;
assert(isDjianCloudSourceRow(djianLike), 'djian row detection');
const djParsed = processImportedProductRows([djianLike], { defaultCategory: 'sofas' });
assert(djParsed.length === 1 && djParsed[0].name === 'Test Sofa Model Name', 'djian name');
assert(djParsed[0].price === 199.5 && djParsed[0].stock === 7, 'djian price/stock');
assert(djParsed[0].category === 'sofas', 'djian default category');
assert(djParsed[0].images[0] === 'https://example.com/a.jpg', 'djian image');

const originalFirst = processImportedProductRows([
  {
    产品型号: 'Demo Cabinet',
    德国最新单价: '99',
    可售库存: '1',
    原图片1: 'https://example.com/main-original.jpg',
    图片1: 'https://example.com/detail-crop.jpg',
  },
]);
assert(
  originalFirst[0].images[0] === 'https://example.com/main-original.jpg',
  `prefer 原图片1 as list hero, got ${originalFirst[0].images[0]}`
);

const frenchCdiscount = processImportedProductRows([
  {
    SKU: 'T5828S00001',
    '产品简称-法语': 'Coiffeuse avec miroir LED et rangements pratiques',
    '简短描述1-法语': 'Miroir LED dimmable avec port USB.',
    '简短描述2-法语': 'Nombreux compartiments de rangement.',
    '简短描述3-法语': 'Facile à monter.',
    '长描述-法语': 'Cette table de toilette allie fonctionnalité et élégance.',
    '材质-法语': 'Bois',
  },
], { defaultCategory: 'bedroom-furniture', inferCategoryFromRowData: false });
assert(
  frenchCdiscount[0].name.includes('Coiffeuse'),
  `French title expected, got ${frenchCdiscount[0].name}`
);
assert(frenchCdiscount[0].description.includes('Miroir LED'), 'French short desc in description');
assert(frenchCdiscount[0].features.length >= 1, 'French features from 简短描述3+');

const pricePriority = processImportedProductRows([
  {
    '产品型号': 'Demo Table',
    '德国最新单价': '514',
    '法国平台售价': '89.99',
    '法国平台调价最低价': '79.5',
    '可售库存': '12',
    '产品标题-英语': 'Modern pedestal coffee table',
    '简短描述1-英文': 'Stylish design.',
  },
], { defaultCategory: 'tables', inferCategoryFromRowData: false });
assert(pricePriority[0].price === 90, `list price expected 90, got ${pricePriority[0].price}`);
assert(pricePriority[0].discountPrice === 80, `sale price expected 80, got ${pricePriority[0].discountPrice}`);
assert(pricePriority[0].onSale === true, 'onSale when floor < list');
assert(pricePriority[0].name === 'Modern pedestal coffee table', 'English product title');
assert(pricePriority[0].stock === 12, 'stock from 可售库存');

const floorOnlyList = processImportedProductRows([
  {
    SKU: 'T-FLOOR-ONLY',
    '产品标题-英语': 'Floor price only shelf',
    '法国平台调价最低价': '52.07',
    '可售库存': '3',
  },
], { defaultCategory: 'cabinets', inferCategoryFromRowData: false });
assert(floorOnlyList[0].price === 52, `floor-only list expected 52, got ${floorOnlyList[0].price}`);
assert(floorOnlyList[0].onSale === false, 'no sale when only floor price');

const mappedPriceColumn = processImportedProductRows([
  {
    price: '199',
    '可售库存': '1',
    '产品标题-英语': 'Mapped price column',
  },
], { defaultCategory: 'tables', inferCategoryFromRowData: false });
assert(mappedPriceColumn[0].price === 199, `mapped price column expected 199, got ${mappedPriceColumn[0].price}`);

const frenchTitleFirst = processImportedProductRows([
  {
    SKU: 'T3323P299344',
    '产品标题-英语': 'Badschrank German Title',
    '标题-法语': 'PLACARD de rangement fonctionnel durable',
    '法国平台售价': '61.44',
    '可售库存': '5',
  },
], { defaultCategory: 'cabinets', inferCategoryFromRowData: false });
assert(
  frenchTitleFirst[0].name.startsWith('PLACARD'),
  `French title first, got ${frenchTitleFirst[0].name}`
);

assert(djParsed[0].description.includes('卖点一') && djParsed[0].description.includes('卖点二'), 'djian description from 简短描述1-2');
assert(djParsed[0].features.length === 1 && djParsed[0].features[0] === '第三卖点', 'djian features from 简短描述3+ only');
assert(djParsed[0].detailHtml.includes('Line1'), 'djian detail html');

const skuTableRow = {
  SKU: 'T3789S00003',
  name: 'T3789S00003',
  长描述:
    'Elevate your living space with our modern pedestal coffee table, a stylish and space-saving solution designed to blend functionality with contemporary aesthetics.',
  price: 514,
  stock: 0,
};
const skuParsed = processImportedProductRows([skuTableRow], {
  defaultCategory: 'tables',
  inferCategoryFromRowData: false,
});
assert(skuParsed.length === 1, 'sku row parsed');
assert(skuParsed[0].name.includes('modern pedestal coffee table'), `sku row name from long desc, got ${skuParsed[0].name}`);
assert(skuParsed[0].description.length > 20, 'sku row description filled from long desc');
assert(skuParsed[0].detailHtml.includes('detail-html-body'), 'sku row detail html wrapped');

console.log('test-product-import: OK (processImportedProductRows + localBulkAddProducts + djian)');
