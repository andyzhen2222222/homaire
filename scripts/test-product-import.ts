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
assert(djParsed[0].description.includes('卖点一') && djParsed[0].description.includes('卖点二'), 'djian description from 简短描述1-2');
assert(djParsed[0].features.length === 1 && djParsed[0].features[0] === '第三卖点', 'djian features from 简短描述3+ only');
assert(djParsed[0].detailHtml.includes('Line1'), 'djian detail html');

console.log('test-product-import: OK (processImportedProductRows + localBulkAddProducts + djian)');
