/**
 * 将「大健云仓数据导入_沙发_筛选用.csv」等 GIGA 导出写入本地库（浏览器外 Node 模拟 localStorage）。
 *
 * 用法：
 *   npm run import:djian
 *   npm run import:djian -- "D:\\path\\to\\file.csv"
 *   DRY=1 npm run import:djian   # 只解析并打印条数，不写库
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';
import { processImportedProductRows } from '../src/lib/productImport';
import { localBulkAddProducts, getLocalProducts, LOCAL_STORAGE_DB_KEY } from '../src/lib/localDb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

const defaultCsv = path.join(__dirname, '..', '大健云仓数据导入_沙发_筛选用.csv');
const argvFlags = new Set(['--dry-run', '--dry']);
const argvRest = process.argv.slice(2).filter((a) => !argvFlags.has(a));
const dry = process.env.DRY === '1' || process.argv.some((a) => argvFlags.has(a));
const filePath = argvRest[0] ? path.resolve(argvRest[0]) : defaultCsv;

if (!fs.existsSync(filePath)) {
  console.error('找不到文件:', filePath);
  process.exit(1);
}

const buf = fs.readFileSync(filePath, 'utf8');
const parsed = Papa.parse<Record<string, string>>(buf, { header: true, skipEmptyLines: true });
if (parsed.errors.length) {
  console.warn('PapaParse 警告:', parsed.errors.slice(0, 5));
}

const products = processImportedProductRows(parsed.data as unknown[], { defaultCategory: 'sofas' });
console.log('解析得到商品数:', products.length);

if (dry) {
  console.log('DRY RUN：未写入 localStorage。去掉 DRY=1 或 --dry-run 后执行写入。');
  process.exit(0);
}

const before = getLocalProducts().length;
const CHUNK = 35;
for (let i = 0; i < products.length; i += CHUNK) {
  localBulkAddProducts(products.slice(i, i + CHUNK));
  console.log('已写入', Math.min(i + CHUNK, products.length), '/', products.length);
}
const after = getLocalProducts().length;
console.log('完成。导入前', before, '条，导入后', after, '条（新增约', after - before, '）。');

const payload = memory[LOCAL_STORAGE_DB_KEY];
if (typeof payload === 'string' && payload.length > 0) {
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const outFile = path.join(publicDir, 'djian-local-db-v1.json');
  fs.writeFileSync(outFile, payload, 'utf8');
  const kb = (payload.length / 1024).toFixed(1);
  console.log('已写出浏览器可加载快照:', outFile, `（约 ${kb} KB）`);
  console.log(
    '在已打开本站的浏览器控制台执行下列代码后刷新页面，即可把快照写入当前域名下的 localStorage：\n\n' +
      `fetch('${'/djian-local-db-v1.json'}').then(r=>r.text()).then(t=>{localStorage.setItem('${LOCAL_STORAGE_DB_KEY}',t);location.reload();});\n`
  );
  console.log('（开发服务器需能访问 /public 下该文件；若端口不是根路径请把 fetch 地址改成完整 URL。）');
}
