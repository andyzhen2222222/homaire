import type { Plugin } from 'vite';
import { handleFeishuStatusRequest, handleFeishuSyncRequest } from './feishuSyncApi';

/** 开发态：为后台提供飞书多维表同步 API（依赖本机 lark-cli） */
export function feishuSyncApiPlugin(): Plugin {
  return {
    name: 'homaire-feishu-sync-api',
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
        next();
      });
    },
  };
}
