import { tryAutoLoadFeishuSnapshot } from './localDb';
import { isRemoteStoreEnabled } from './storeConfig';
import { initRemoteStoreSync, pullCatalogFromServer } from './remoteStore';

let bootstrapped = false;

/** 应用启动：先拉 API，失败或空库时回退到 dist 内快照；生产环境再开启轮询同步 */
export async function bootstrapLocalDbOnce(): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;

  await pullCatalogFromServer();
  await tryAutoLoadFeishuSnapshot();

  if (isRemoteStoreEnabled()) {
    initRemoteStoreSync();
  }
}
