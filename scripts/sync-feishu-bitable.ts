/**
 * 从飞书多维表格同步商品到 Homaire 本地库，并写出 public 快照供浏览器加载。
 *
 * 前置：
 *   1. lark-cli 已 config init
 *   2. lark-cli auth login --domain base（用户身份）
 *
 * 用法：
 *   npm run sync:feishu
 *   npm run sync:feishu -- "https://xxx.feishu.cn/base/AppXXX?table=tblYYY"
 *   DRY=1 npm run sync:feishu
 *   FEISHU_AS=bot npm run sync:feishu   # 需应用在开放平台开通 base 权限
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getLocalProducts, LOCAL_STORAGE_DB_KEY, localApplyFeishuCategorySync } from '../src/lib/localDb';
import { fetchProductsFromFeishuBitableUrl } from './lib/feishuFetchProducts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const memory: Record<string, string> = {};
(globalThis as unknown as { localStorage: Storage }).localStorage = {
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
  key: () => null,
  length: 0,
} as Storage;

const argvFlags = new Set(['--dry-run', '--dry']);
const argvRest = process.argv.slice(2).filter((a) => !argvFlags.has(a));
const dry = process.env.DRY === '1' || process.argv.some((a) => argvFlags.has(a));
const categorySlug = (process.env.FEISHU_CATEGORY || 'sofas').trim().toLowerCase();

const defaultUrl =
  process.env.FEISHU_BITABLE_URL ||
  'https://ecnwellv8vhf.feishu.cn/base/MoFsbKDb9afweksIGUXcRG2inHe?table=tbloSN5lLDGcsxGG&view=vew9XNieRe';
const inputUrl = argvRest[0] || defaultUrl;

async function main(): Promise<void> {
  console.log('飞书多维表 → Homaire 同步');
  console.log('链接:', inputUrl);
  console.log('目标分类:', categorySlug);

  const result = fetchProductsFromFeishuBitableUrl(inputUrl, {
    categorySlug,
    as: process.env.FEISHU_AS === 'bot' ? 'bot' : 'user',
  });
  console.log('拉取原始行数:', result.rawRowCount);
  console.log('可导入商品数:', result.products.length);

  if (dry) {
    console.log('DRY RUN：未写入。去掉 DRY=1 后执行完整同步。');
    if (result.products[0]) {
      console.log('示例:', result.products[0].name, '|', result.products[0].price);
    }
    return;
  }

  const before = getLocalProducts().length;
  const { removed, added } = localApplyFeishuCategorySync(categorySlug, result.products);
  const after = getLocalProducts().length;
  console.log(
    '完成。分类',
    categorySlug,
    '：移除旧飞书商品',
    removed,
    '条，写入',
    added,
    '条；库内总计',
    before,
    '→',
    after
  );

  const payload = memory[LOCAL_STORAGE_DB_KEY];
  if (typeof payload === 'string' && payload.length > 0) {
    const publicDir = path.join(__dirname, '..', 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    const outFile = path.join(publicDir, 'feishu-bitable-db-v1.json');
    fs.writeFileSync(outFile, payload, 'utf8');
    const kb = (payload.length / 1024).toFixed(1);
    console.log('\n已写出快照:', outFile, `（约 ${kb} KB）`);
    console.log(
      '在已打开 Homaire 的浏览器控制台执行后刷新：\n\n' +
        `fetch('/feishu-bitable-db-v1.json').then(r=>r.text()).then(t=>{localStorage.setItem('${LOCAL_STORAGE_DB_KEY}',t);location.reload();});\n`
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
