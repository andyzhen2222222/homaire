import { tryAutoLoadFeishuSnapshot } from './localDb';
import { isRemoteStoreEnabled } from './storeConfig';
import { initRemoteStoreSync, pullCatalogFromServer } from './remoteStore';

let bootstrapped = false;

/** 应用启动：远程库优先拉取；否则从 public 快照加载 */
export async function bootstrapLocalDbOnce(): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;
  if (isRemoteStoreEnabled()) {
    initRemoteStoreSync();
    await pullCatalogFromServer();
    return;
  }
  await tryAutoLoadFeishuSnapshot();
}
