/**
 * Production: static site + shared store API
 *   npm run build && npm run start
 */
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleFeishuStatusRequest, handleFeishuSyncRequest } from './feishuSyncApi';
import { handleStoreApiRequest } from './storeApi';
import { getStorePath, readStoreFile } from './jsonFileStore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const port = Number(process.env.PORT || 3000);

if (!fs.existsSync(distDir)) {
  console.error('dist/ not found. Run: npm run build');
  process.exit(1);
}

// Ensure store file exists (may seed from public snapshot)
readStoreFile();
console.log('Store file:', getStorePath());

const app = express();
app.disable('x-powered-by');

app.use(express.json({ limit: '32mb' }));

app.use((req, res, next) => {
  const url = req.url?.split('?')[0] ?? '';
  if (url === '/api/feishu/sync' && req.method === 'POST') {
    void handleFeishuSyncRequest(req as unknown as IncomingMessage, res as unknown as ServerResponse);
    return;
  }
  if (url === '/api/feishu/status' && req.method === 'GET') {
    void handleFeishuStatusRequest(req as unknown as IncomingMessage, res as unknown as ServerResponse);
    return;
  }
  if (handleStoreApiRequest(req as unknown as IncomingMessage, res as unknown as ServerResponse)) {
    return;
  }
  next();
});

app.use(express.static(distDir, { index: false }));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, () => {
  console.log(`Homaire running at http://localhost:${port}`);
  console.log('Shared catalog: GET /api/store/catalog');
  console.log('Orders (admin): GET /api/store/orders');
});
