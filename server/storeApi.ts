import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleApiRequest } from './apiRouter';

/** Route /api/v1/* and legacy /api/store/* (SQLite-backed) */
export async function handleStoreApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  return handleApiRequest(req, res);
}
