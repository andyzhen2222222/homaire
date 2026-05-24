import { spawnSync } from 'node:child_process';

export type LarkCliJson = {
  ok?: boolean;
  data?: unknown;
  error?: { type?: string; message?: string; hint?: string; console_url?: string };
  identity?: string;
};

/** 调用 lark-cli，默认 JSON 输出（auth 子命令除外） */
export function runLarkCli(
  args: string[],
  opts?: { as?: 'user' | 'bot'; json?: boolean }
): LarkCliJson {
  /** 仅 record-list / record-search 等支持 --format json；其余 base 命令默认即 JSON */
  const wantsFormatJson =
    opts?.json === true ||
    (opts?.json !== false &&
      args[0] !== 'auth' &&
      (args.includes('+record-list') || args.includes('+record-search') || args.includes('+record-get')));
  const full = [
    ...(opts?.as ? ['--as', opts.as] : []),
    ...args,
    ...(wantsFormatJson ? ['--format', 'json'] : []),
  ];
  const res = spawnSync('lark-cli', full, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    shell: process.platform === 'win32',
  });
  const stdout = (res.stdout || '').trim();
  const stderr = (res.stderr || '').trim();
  if (!stdout) {
    throw new Error(stderr || `lark-cli 无输出 (exit ${res.status})`);
  }
  try {
    return JSON.parse(stdout) as LarkCliJson;
  } catch {
    throw new Error(`lark-cli 返回非 JSON：\n${stdout.slice(0, 800)}`);
  }
}

export function assertLarkOk(payload: LarkCliJson, context: string): unknown {
  if (payload.ok === false || payload.error) {
    const e = payload.error;
    const parts = [
      context,
      e?.message,
      e?.hint,
      e?.console_url ? `console: ${e.console_url}` : '',
    ].filter(Boolean);
    throw new Error(parts.join('\n'));
  }
  return payload.data;
}
