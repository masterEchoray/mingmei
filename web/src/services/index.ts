import { http, type QueryParams } from './http';
import type {
  AccountApplication,
  AccountLog,
  AdAccount,
  AssetRecord,
  DashboardData,
  Merchant,
  Notification,
  OperatorDashboardData,
  PageResult,
  RebindRecord,
} from '@/types';

// -------- 仪表盘 --------
export const dashboardApi = {
  get: (scope: 'merchant' | 'operator', merchantId?: string) =>
    http.get<DashboardData>('/dashboard', { scope, merchantId }),
  getOperator: () =>
    http.get<OperatorDashboardData>('/dashboard', { scope: 'operator' }),
};

// -------- 商户管理 --------
export interface MerchantSummary {
  totalConsume: number;
  totalBalance: number;
  totalReserve: number;
  count: number;
}

export const merchantApi = {
  list: (params?: QueryParams) => http.get<PageResult<Merchant>>('/merchants', params),
  summary: () => http.get<MerchantSummary>('/merchants/summary'),
  create: (data: Partial<Merchant>) => http.post<Merchant>('/merchants', data),
  update: (id: string, data: Partial<Merchant>) =>
    http.put<Merchant>(`/merchants/${id}`, data),
  setStatus: (id: string, status: Merchant['status']) =>
    http.post<Merchant>(`/merchants/${id}/status`, { status }),
};

// -------- 开户申请 --------
export interface ApplicationListResult extends PageResult<AccountApplication> {
  counts: { processing: number; done: number; revoked: number };
}

export const applicationApi = {
  list: (params?: QueryParams) =>
    http.get<ApplicationListResult>('/applications', params),
  create: (data: Partial<AccountApplication>) =>
    http.post<AccountApplication>('/applications', data),
  update: (id: string, data: Partial<AccountApplication>) =>
    http.put<AccountApplication>(`/applications/${id}`, data),
  revoke: (id: string) => http.post<AccountApplication>(`/applications/${id}/revoke`),
  complete: (id: string) =>
    http.post<AccountApplication>(`/applications/${id}/complete`),
};

// -------- 广告账户 --------
export interface AdAccountListResult extends PageResult<AdAccount> {
  counts: { active: number; disabled: number; banned: number };
}

export const adAccountApi = {
  list: (params?: QueryParams) =>
    http.get<AdAccountListResult>('/ad-accounts', params),
  create: (data: Partial<AdAccount>) => http.post<AdAccount>('/ad-accounts', data),
  adjustBalance: (id: string, type: 'add' | 'deduct', amount: number) =>
    http.post<AdAccount>(`/ad-accounts/${id}/adjust-balance`, { type, amount }),
  updateBmids: (id: string, bmids: string[]) =>
    http.post<AdAccount>(`/ad-accounts/${id}/bmids`, { bmids }),
  clear: (id: string) => http.post<AdAccount>(`/ad-accounts/${id}/clear`),
  logs: (id: string) => http.get<PageResult<AccountLog>>(`/ad-accounts/${id}/logs`),
};

// -------- 站内信 --------
export const notificationApi = {
  list: (params?: QueryParams) =>
    http.get<PageResult<Notification>>('/notifications', params),
  unreadCount: () => http.get<{ count: number }>('/notifications/unread-count'),
  create: (data: Partial<Notification>) =>
    http.post<Notification>('/notifications', data),
  revoke: (id: string) => http.post<Notification>(`/notifications/${id}/revoke`),
  readAll: () => http.post<{ ok: boolean }>('/notifications/read-all'),
};

// -------- 资产占位模块 --------
export const assetApi = {
  rechargeOrders: (params?: QueryParams) =>
    http.get<PageResult<AssetRecord>>('/assets/recharge-orders', params),
  withdrawOrders: (params?: QueryParams) =>
    http.get<PageResult<AssetRecord>>('/assets/withdraw-orders', params),
  walletLedger: (params?: QueryParams) =>
    http.get<PageResult<AssetRecord>>('/assets/wallet-ledger', params),
  reserveLedger: (params?: QueryParams) =>
    http.get<PageResult<AssetRecord>>('/assets/reserve-ledger', params),
  rebindRecords: (params?: QueryParams) =>
    http.get<PageResult<RebindRecord>>('/assets/rebind-records', params),
};
