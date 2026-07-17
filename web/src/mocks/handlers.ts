import { http, HttpResponse } from 'msw';
import * as db from './db';
import type {
  AccountApplication,
  AdAccount,
  Merchant,
  Notification,
} from '@/types';

const API = '/api/v1';

function delayed<T>(data: T) {
  return HttpResponse.json(data as Record<string, unknown>);
}

function paginate<T>(list: T[], url: URL) {
  const page = Number(url.searchParams.get('page') ?? 1);
  const pageSize = Number(url.searchParams.get('pageSize') ?? 10);
  const start = (page - 1) * pageSize;
  return {
    list: list.slice(start, start + pageSize),
    total: list.length,
    page,
    pageSize,
  };
}

function genId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
}

export const handlers = [
  // -------- 仪表盘 --------
  http.get(`${API}/dashboard`, ({ request }) => {
    const url = new URL(request.url);
    const scope = url.searchParams.get('scope') ?? 'merchant';
    const scale = scope === 'operator' ? 1 : 0.08;
    return delayed({
      platformStats: db.buildPlatformStats(scale),
      consumeStat: db.buildConsumeStat(scale),
    });
  }),

  // -------- 商户管理 --------
  http.get(`${API}/merchants/summary`, () => {
    const totalConsume = db.merchants.reduce((s, m) => s + m.totalConsume, 0);
    const totalBalance = db.merchants.reduce((s, m) => s + m.boundAccountBalance, 0);
    const totalReserve = db.merchants.reduce((s, m) => s + m.reserveBalance, 0);
    return delayed({ totalConsume, totalBalance, totalReserve, count: db.merchants.length });
  }),

  http.get(`${API}/merchants`, ({ request }) => {
    const url = new URL(request.url);
    const keyword = (url.searchParams.get('keyword') ?? '').toLowerCase();
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const onlyNegative = url.searchParams.get('onlyNegativeReserve') === 'true';
    let list = [...db.merchants];
    if (keyword)
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(keyword) ||
          m.code.toLowerCase().includes(keyword) ||
          m.contact.toLowerCase().includes(keyword),
      );
    if (type) list = list.filter((m) => m.type === type);
    if (status) list = list.filter((m) => m.status === status);
    if (onlyNegative) list = list.filter((m) => m.reserveBalance < 0);
    return delayed(paginate(list, url));
  }),

  http.post(`${API}/merchants`, async ({ request }) => {
    const body = (await request.json()) as Partial<Merchant>;
    const now = new Date().toISOString();
    const m: Merchant = {
      id: genId('m'),
      code: `SP${1001 + db.merchants.length}`,
      name: body.name ?? '',
      contact: body.contact ?? '',
      loginAccount: body.loginAccount ?? '',
      type: body.type ?? 'actual',
      serviceRate: body.serviceRate ?? 5,
      status: body.status ?? 'active',
      remark: body.remark ?? '',
      totalConsume: 0,
      reserveBalance: 0,
      boundAccountBalance: 0,
      activeAccountCount: 0,
      operator: '当前运营',
      updatedAt: now,
      createdAt: now,
    };
    db.merchants.unshift(m);
    return delayed(m);
  }),

  http.put(`${API}/merchants/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<Merchant>;
    const idx = db.merchants.findIndex((m) => m.id === params.id);
    if (idx < 0) return new HttpResponse(null, { status: 404 });
    db.merchants[idx] = {
      ...db.merchants[idx],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return delayed(db.merchants[idx]);
  }),

  http.post(`${API}/merchants/:id/status`, async ({ params, request }) => {
    const body = (await request.json()) as { status: Merchant['status'] };
    const m = db.merchants.find((x) => x.id === params.id);
    if (!m) return new HttpResponse(null, { status: 404 });
    m.status = body.status;
    m.updatedAt = new Date().toISOString();
    return delayed(m);
  }),

  // -------- 开户申请 --------
  http.get(`${API}/applications`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const merchantId = url.searchParams.get('merchantId');
    const keyword = (url.searchParams.get('keyword') ?? '').toLowerCase();
    const timezone = url.searchParams.get('timezone');
    const merchantType = url.searchParams.get('merchantType');
    let list = [...db.applications];
    if (merchantId) list = list.filter((a) => a.merchantId === merchantId);
    if (status) list = list.filter((a) => a.status === status);
    if (timezone) list = list.filter((a) => a.timezone === timezone);
    if (merchantType) list = list.filter((a) => a.merchantType === merchantType);
    if (keyword)
      list = list.filter(
        (a) =>
          a.merchantName.toLowerCase().includes(keyword) ||
          a.batchNo.toLowerCase().includes(keyword),
      );
    const counts = {
      processing: db.applications.filter((a) => a.status === 'processing').length,
      done: db.applications.filter((a) => a.status === 'done').length,
      revoked: db.applications.filter((a) => a.status === 'revoked').length,
    };
    return delayed({ ...paginate(list, url), counts });
  }),

  http.post(`${API}/applications`, async ({ request }) => {
    const body = (await request.json()) as Partial<AccountApplication>;
    const merchant = db.merchants.find((m) => m.id === body.merchantId) ?? db.merchants[0];
    const now = new Date().toISOString();
    const app: AccountApplication = {
      id: genId('app'),
      batchNo: `KH${new Date().getFullYear()}${10000 + db.applications.length}`,
      merchantId: merchant.id,
      merchantName: merchant.name,
      platform: body.platform ?? 'Meta',
      timezone: body.timezone ?? 'GMT+08:00',
      applyCount: body.applyCount ?? 1,
      bmids: body.bmids ?? [],
      status: 'processing',
      lossAmount: 0,
      merchantType: merchant.type,
      operator: '当前运营',
      applyTime: now,
      updatedAt: now,
    };
    db.applications.unshift(app);
    return delayed(app);
  }),

  http.put(`${API}/applications/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Partial<AccountApplication>;
    const idx = db.applications.findIndex((a) => a.id === params.id);
    if (idx < 0) return new HttpResponse(null, { status: 404 });
    db.applications[idx] = {
      ...db.applications[idx],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return delayed(db.applications[idx]);
  }),

  http.post(`${API}/applications/:id/revoke`, ({ params }) => {
    const a = db.applications.find((x) => x.id === params.id);
    if (!a) return new HttpResponse(null, { status: 404 });
    a.status = 'revoked';
    a.revokeBy = 'merchant';
    a.updatedAt = new Date().toISOString();
    return delayed(a);
  }),

  http.post(`${API}/applications/:id/complete`, ({ params }) => {
    const a = db.applications.find((x) => x.id === params.id);
    if (!a) return new HttpResponse(null, { status: 404 });
    a.status = 'done';
    a.completeTime = new Date().toISOString();
    a.updatedAt = a.completeTime;
    return delayed(a);
  }),

  // -------- 广告账户 --------
  http.get(`${API}/ad-accounts`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const merchantId = url.searchParams.get('merchantId');
    const emptyFilter = url.searchParams.get('empty');
    const keyword = (url.searchParams.get('keyword') ?? '').toLowerCase();
    let list = [...db.adAccounts];
    if (merchantId) list = list.filter((a) => a.merchantId === merchantId);
    if (status) list = list.filter((a) => a.status === status);
    if (emptyFilter === 'empty') list = list.filter((a) => a.isEmpty);
    if (emptyFilter === 'nonempty') list = list.filter((a) => !a.isEmpty);
    if (keyword)
      list = list.filter(
        (a) =>
          a.accountId.toLowerCase().includes(keyword) ||
          a.accountName.toLowerCase().includes(keyword) ||
          a.email.toLowerCase().includes(keyword),
      );
    const counts = {
      active: db.adAccounts.filter((a) => a.status === 'active').length,
      disabled: db.adAccounts.filter((a) => a.status === 'disabled').length,
      banned: db.adAccounts.filter((a) => a.status === 'banned').length,
    };
    return delayed({ ...paginate(list, url), counts });
  }),

  http.post(`${API}/ad-accounts`, async ({ request }) => {
    const body = (await request.json()) as Partial<AdAccount>;
    const merchant =
      db.merchants.find((m) => m.id === body.merchantId) ?? db.merchants[0];
    const now = new Date().toISOString();
    const acc: AdAccount = {
      id: genId('acc'),
      code: String(db.adAccounts.length + 1),
      accountId: body.accountId ?? `act_${Date.now()}`,
      accountName: body.accountName ?? '',
      email: body.email ?? '',
      status: 'active',
      platform: body.platform ?? 'Meta',
      totalRecharge: 0,
      totalConsume: 0,
      totalClear: 0,
      balance: 0,
      bmids: [],
      isEmpty: true,
      merchantId: merchant.id,
      merchantName: merchant.name,
      merchantType: merchant.type,
      timezone: body.timezone ?? 'GMT+08:00',
      createdBy: '当前运营',
      createdAt: now,
    };
    db.adAccounts.unshift(acc);
    return delayed(acc);
  }),

  http.post(`${API}/ad-accounts/:id/adjust-balance`, async ({ params, request }) => {
    const body = (await request.json()) as { type: 'add' | 'deduct'; amount: number };
    const acc = db.adAccounts.find((a) => a.id === params.id);
    if (!acc) return new HttpResponse(null, { status: 404 });
    const delta = body.type === 'add' ? body.amount : -body.amount;
    acc.balance = Math.round((acc.balance + delta) * 100) / 100;
    if (body.type === 'add') acc.totalRecharge += body.amount;
    acc.isEmpty = acc.balance <= 0 && acc.totalConsume === 0;
    db.accountLogs.unshift({
      id: genId('log'),
      accountId: acc.id,
      action: '调整余额',
      detail: `${body.type === 'add' ? '加款' : '减款'} $${body.amount.toFixed(2)}`,
      operator: '当前运营',
      createdAt: new Date().toISOString(),
    });
    return delayed(acc);
  }),

  http.post(`${API}/ad-accounts/:id/bmids`, async ({ params, request }) => {
    const body = (await request.json()) as { bmids: string[] };
    const acc = db.adAccounts.find((a) => a.id === params.id);
    if (!acc) return new HttpResponse(null, { status: 404 });
    acc.bmids = body.bmids.map((b) => ({ bmid: b, status: 'bound' as const }));
    db.accountLogs.unshift({
      id: genId('log'),
      accountId: acc.id,
      action: '管理BM',
      detail: `更新绑定 ${body.bmids.length} 条 BMID`,
      operator: '当前运营',
      createdAt: new Date().toISOString(),
    });
    return delayed(acc);
  }),

  http.post(`${API}/ad-accounts/:id/clear`, ({ params }) => {
    const acc = db.adAccounts.find((a) => a.id === params.id);
    if (!acc) return new HttpResponse(null, { status: 404 });
    const cleared = acc.balance;
    acc.totalClear += cleared;
    acc.balance = 0;
    acc.isEmpty = acc.totalConsume === 0;
    db.accountLogs.unshift({
      id: genId('log'),
      accountId: acc.id,
      action: '申请清零',
      detail: `清零金额 $${cleared.toFixed(2)}，回退至备用金`,
      operator: '当前运营',
      createdAt: new Date().toISOString(),
    });
    return delayed(acc);
  }),

  http.get(`${API}/ad-accounts/:id/logs`, ({ params }) => {
    const list = db.accountLogs.filter((l) => l.accountId === params.id);
    return delayed({ list, total: list.length, page: 1, pageSize: list.length });
  }),

  // -------- 站内信 --------
  http.get(`${API}/notifications`, ({ request }) => {
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const keyword = (url.searchParams.get('keyword') ?? '').toLowerCase();
    const scope = url.searchParams.get('scope');
    let list = [...db.notifications];
    if (role === 'merchant') list = list.filter((n) => n.status === 'sent');
    if (scope) list = list.filter((n) => n.scope === scope);
    if (keyword) list = list.filter((n) => n.title.toLowerCase().includes(keyword));
    return delayed(paginate(list, url));
  }),

  http.get(`${API}/notifications/unread-count`, () => {
    const count = db.notifications.filter((n) => n.status === 'sent' && !n.read).length;
    return delayed({ count });
  }),

  http.post(`${API}/notifications`, async ({ request }) => {
    const body = (await request.json()) as Partial<Notification>;
    const now = new Date().toISOString();
    const n: Notification = {
      id: genId('noti'),
      title: body.title ?? '',
      content: body.content ?? '',
      scope: body.scope ?? 'all',
      status: 'sent',
      targetMerchantIds: body.targetMerchantIds ?? [],
      sender: '当前运营',
      sentAt: now,
      read: false,
    };
    db.notifications.unshift(n);
    return delayed(n);
  }),

  http.post(`${API}/notifications/:id/revoke`, ({ params }) => {
    const n = db.notifications.find((x) => x.id === params.id);
    if (!n) return new HttpResponse(null, { status: 404 });
    n.status = 'revoked';
    n.revokedAt = new Date().toISOString();
    return delayed(n);
  }),

  http.post(`${API}/notifications/read-all`, () => {
    db.notifications.forEach((n) => (n.read = true));
    return delayed({ ok: true });
  }),

  // -------- 资产占位模块 --------
  http.get(`${API}/assets/recharge-orders`, ({ request }) =>
    delayed(paginate(db.rechargeOrders, new URL(request.url))),
  ),
  http.get(`${API}/assets/withdraw-orders`, ({ request }) =>
    delayed(paginate(db.withdrawOrders, new URL(request.url))),
  ),
  http.get(`${API}/assets/wallet-ledger`, ({ request }) =>
    delayed(paginate(db.walletLedger, new URL(request.url))),
  ),
  http.get(`${API}/assets/reserve-ledger`, ({ request }) =>
    delayed(paginate(db.reserveLedger, new URL(request.url))),
  ),
  http.get(`${API}/assets/rebind-records`, ({ request }) =>
    delayed(paginate(db.rebindRecords, new URL(request.url))),
  ),
];
