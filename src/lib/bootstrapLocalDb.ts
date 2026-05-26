import { isRemoteStoreEnabled } from './storeConfig';
import { initRemoteStoreSync } from './remoteStore';

let bootstrapped = false;

/**
 * 应用启动：商品/分类/配置由各页面实时请求 API；
 * 仅保留订单轮询（管理端）。
 */
export async function bootstrapLocalDbOnce(): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;

  if (isRemoteStoreEnabled()) {
    initRemoteStoreSync();
  }
}
