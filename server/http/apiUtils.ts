import type { IncomingMessage, ServerResponse } from 'node:http';

export function readJsonBody(req: IncomingMessage): Promise<unknown> {
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

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export function parseUrl(req: IncomingMessage): { pathname: string; searchParams: URLSearchParams } {
  const host = req.headers.host || 'localhost';
  const u = new URL(req.url || '/', `http://${host}`);
  return { pathname: u.pathname, searchParams: u.searchParams };
}

export function getAdminSecret(): string {
  return (
    process.env.STORE_ADMIN_PASSWORD ||
    process.env.VITE_LOCAL_ADMIN_PASSWORD ||
    process.env.ADMIN_API_SECRET ||
    'admin'
  ).trim();
}

export function isAdminPasswordRequest(req: IncomingMessage): boolean {
  const secret = getAdminSecret();
  const header =
    (req.headers['x-admin-password'] as string | undefined) ||
    (req.headers['x-admin-key'] as string | undefined) ||
    '';
  const auth = req.headers.authorization || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  return Boolean(secret && (header === secret || bearer === secret));
}

export function getBearerToken(req: IncomingMessage): string | null {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
}
