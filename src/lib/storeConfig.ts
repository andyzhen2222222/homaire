/** Enable shared server store (catalog sync + centralized orders) */
export function isRemoteStoreEnabled(): boolean {
  const flag = import.meta.env.VITE_USE_REMOTE_STORE;
  if (flag === 'false' || flag === '0') return false;
  if (flag === 'true' || flag === '1') return true;
  // Default on: SQLite backend is the source of truth in dev and production
  return true;
}

export function getStorePollIntervalMs(): number {
  const n = Number(import.meta.env.VITE_STORE_POLL_MS || 15000);
  return Number.isFinite(n) && n >= 5000 ? n : 15000;
}

/** Admin API auth — must match server STORE_ADMIN_PASSWORD */
export function getStoreAdminPassword(): string {
  return (
    import.meta.env.VITE_STORE_ADMIN_PASSWORD ||
    import.meta.env.VITE_LOCAL_ADMIN_PASSWORD ||
    'admin'
  ).trim();
}

export function getStoreAdminHeaders(): Record<string, string> {
  return { 'X-Admin-Password': getStoreAdminPassword() };
}
