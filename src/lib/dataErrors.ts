import { readLocalSession } from './localSession';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface DataErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: { providerId?: string | null; email?: string | null }[];
  };
}

/** 与原先 Firestore 错误结构兼容，便于现有 catch 逻辑解析 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const session = readLocalSession();
  const errInfo: DataErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: session?.uid ?? null,
      email: session?.email ?? null,
      emailVerified: true,
      isAnonymous: false,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path,
  };
  console.error('Data error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
