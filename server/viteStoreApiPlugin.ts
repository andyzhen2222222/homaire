import type { Connect } from 'vite';
import type { Plugin } from 'vite';
import { handleFeishuStatusRequest, handleFeishuSyncRequest } from './feishuSyncApi';
import { handleStoreApiRequest } from './storeApi';
import { initDatabase, logDatabaseStatus } from './db/init';

let dbReady: Promise<void> | null = null;

function ensureDb(): Promise<void> {
  if (!dbReady) {
    dbReady = initDatabase()
      .then(() => logDatabaseStatus())
      .catch((err) => {
        console.error('Database init failed:', err);
        dbReady = null;
        throw err;
      });
  }
  return dbReady;
}

function createApiMiddleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = req.url?.split('?')[0] ?? '';
    const run = async () => {
      await ensureDb();
      if (url === '/api/feishu/sync' && req.method === 'POST') {
        void handleFeishuSyncRequest(req, res);
        return;
      }
      if (url === '/api/feishu/status' && req.method === 'GET') {
        void handleFeishuStatusRequest(req, res);
        return;
      }
      if (url.startsWith('/api/v1/') || url.startsWith('/api/store/')) {
        const handled = await handleStoreApiRequest(req, res);
        if (handled) return;
      }
      next();
    };
    void run().catch((err) => {
      console.error('[store-api]', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Internal server error' }));
      }
    });
  };
}

/** Dev / preview: SQLite store API（须在 SPA 回退之前） */
export function storeApiPlugin(): Plugin {
  const apiMiddleware = createApiMiddleware();
  return {
    name: 'homaire-store-api',
    enforce: 'pre',
    configureServer(server) {
      void ensureDb();
      server.middlewares.use(apiMiddleware);
    },
    configurePreviewServer(server) {
      void ensureDb();
      server.middlewares.use(apiMiddleware);
    },
  };
}
