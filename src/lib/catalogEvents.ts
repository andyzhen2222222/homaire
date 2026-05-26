/** 管理端写入后通知各 hook 重新拉取 API */
const listeners = new Set<() => void>();

export function onCatalogInvalidate(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitCatalogInvalidate(): void {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}
