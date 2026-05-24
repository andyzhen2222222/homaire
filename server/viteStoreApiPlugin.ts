import type { Plugin } from 'vite';
import { handleFeishuStatusRequest, handleFeishuSyncRequest } from './feishuSyncApi';
import { handleStoreApiRequest } from './storeApi';

/** Dev: Feishu sync + shared store API */
export function storeApiPlugin(): Plugin {
  return {
    name: 'homaire-store-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (url === '/api/feishu/sync') {
          void handleFeishuSyncRequest(req, res);
          return;
        }
        if (url === '/api/feishu/status') {
          void handleFeishuStatusRequest(req, res);
          return;
        }
        if (handleStoreApiRequest(req, res)) return;
        next();
      });
    },
  };
}
