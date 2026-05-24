/**
 * 将导出的商品库 JSON 复制到 public/，供 build 打进 dist/。
 *
 * 用法：
 *   npm run publish:snapshot
 *   npm run publish:snapshot -- path/to/feishu-bitable-db-v1.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outFile = path.join(root, 'public', 'feishu-bitable-db-v1.json');

const input =
  process.argv[2] ||
  process.env.DB_SNAPSHOT_INPUT ||
  path.join(root, 'feishu-bitable-db-v1.json');

if (!fs.existsSync(input)) {
  console.error('Input file not found:', input);
  console.error('');
  console.error('Export from Admin → Products → "Export for deploy",');
  console.error('save the file, then run:');
  console.error('  npm run publish:snapshot -- ./feishu-bitable-db-v1.json');
  process.exit(1);
}

const json = fs.readFileSync(input, 'utf8');
JSON.parse(json);

if (!fs.existsSync(path.join(root, 'public'))) {
  fs.mkdirSync(path.join(root, 'public'), { recursive: true });
}
fs.writeFileSync(outFile, json, 'utf8');
const kb = (json.length / 1024).toFixed(1);
console.log('Wrote', outFile, `(${kb} KB)`);
console.log('Next: npm run build — then deploy dist/ (includes this snapshot).');
