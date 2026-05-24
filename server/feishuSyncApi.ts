import type { IncomingMessage, ServerResponse } from 'node:http';
import { fetchProductsFromFeishuBitableUrl } from '../scripts/lib/feishuFetchProducts';

export type FeishuSyncApiBody = {
  url: string;
  categorySlug: string;
  allowedCategorySlugs?: string[];
};

export type FeishuSyncApiResponse = {
  ok: boolean;
  products?: Array<Record<string, unknown>>;
  rawRowCount?: number;
  tableId?: string;
  error?: string;
};

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: FeishuSyncApiResponse): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

/** 处理 POST /api/feishu/sync */
export async function handleFeishuSyncRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }
  try {
    const body = (await readJsonBody(req)) as FeishuSyncApiBody;
    const url = String(body.url || '').trim();
    const categorySlug = String(body.categorySlug || '')
      .trim()
      .toLowerCase();
    if (!url || !categorySlug) {
      sendJson(res, 400, { ok: false, error: '缺少 url 或 categorySlug' });
      return;
    }
    const result = fetchProductsFromFeishuBitableUrl(url, {
      categorySlug,
      allowedCategorySlugs: body.allowedCategorySlugs,
      as: 'user',
    });
    sendJson(res, 200, {
      ok: true,
      products: result.products as unknown as Array<Record<string, unknown>>,
      rawRowCount: result.rawRowCount,
      tableId: result.tableId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    sendJson(res, 500, { ok: false, error: msg });
  }
}

/** 处理 GET /api/feishu/status */
export async function handleFeishuStatusRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed' });
    return;
  }
  try {
    const { runLarkCli } = await import('../scripts/lib/larkCli');
    const status = runLarkCli(['auth', 'status'], { json: false }) as {
      identities?: Record<string, { available?: boolean; userName?: string }>;
    };
    const userReady = Boolean(status.identities?.user?.available);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        ok: true,
        userReady,
        userName: status.identities?.user?.userName,
        hint: userReady
          ? undefined
          : '飞书 CLI 用户未登录。请在终端执行：lark-cli auth login --domain base',
      })
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    sendJson(res, 500, { ok: false, error: msg });
  }
}
