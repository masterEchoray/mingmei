// 内存 Mock 数据库（阶段一：无真实后端，数据仅存活于当前会话）
import type {
  AccountApplication,
  AccountLog,
  AdAccount,
  AssetRecord,
  Merchant,
  Notification,
  Platform,
  RebindRecord,
} from '@/types';
import { PLATFORMS } from '@/types';

function pad(n: number, len = 4): string {
  return String(n).padStart(len, '0');
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const TIMEZONES = ['GMT+08:00', 'GMT+06:00', 'GMT+00:00', 'GMT-05:00', 'GMT+01:00'];

// ---------------- 商户 ----------------
const merchantNames = [
  'LUCKY004', 'STARLINK', 'GLOBAL-EC', 'SHINE-TECH', 'OCEAN-TRADE',
  'REDBERRY', 'NOVA-SHOP', 'PINEAPPLE', 'HORIZON', 'BLUEWAVE',
  'GREENLEAF', 'SUNRISE-CO', 'MOONLIGHT', 'FALCON-X', 'ZEN-STORE',
];

export const merchants: Merchant[] = merchantNames.map((name, i) => {
  const type = i % 3 === 0 ? 'prepaid' : 'actual';
  return {
    id: `m${pad(i + 1)}`,
    code: `SP${pad(1001 + i)}`,
    name,
    contact: `联系人${i + 1}`,
    loginAccount: `${name.toLowerCase()}@adspot.com`,
    type,
    serviceRate: [3, 5, 6, 8][i % 4],
    status: i % 7 === 0 ? 'suspended' : 'active',
    remark: i % 2 === 0 ? '重点客户，优先处理' : '',
    totalConsume: Math.round(Math.random() * 5_000_000 * 100) / 100,
    reserveBalance: Math.round((Math.random() * 200000 - 20000) * 100) / 100,
    boundAccountBalance: Math.round(Math.random() * 800000 * 100) / 100,
    activeAccountCount: Math.floor(Math.random() * 12),
    operator: '运营小李',
    updatedAt: daysAgo(i),
    createdAt: daysAgo(i + 30),
  };
});

// ---------------- 开户申请 ----------------
const appStatuses: AccountApplication['status'][] = ['processing', 'done', 'revoked'];
export const applications: AccountApplication[] = Array.from({ length: 28 }).map((_, i) => {
  const merchant = merchants[i % merchants.length];
  const platform = PLATFORMS[i % PLATFORMS.length];
  const status = appStatuses[i % 3 === 0 ? 0 : i % 5 === 0 ? 2 : 1];
  return {
    id: `app${pad(i + 1)}`,
    batchNo: `KH${new Date().getFullYear()}${pad(10000 + i, 5)}`,
    merchantId: merchant.id,
    merchantName: merchant.name,
    platform,
    timezone: TIMEZONES[i % TIMEZONES.length],
    applyCount: [2, 4, 6, 10][i % 4],
    bmids: i % 2 === 0 ? [`BM-8823441987${pad(60000 + i, 5)}`] : [],
    status,
    lossAmount: status === 'revoked' ? Math.round(Math.random() * 5000 * 100) / 100 : 0,
    revokeBy: status === 'revoked' ? (i % 2 === 0 ? 'merchant' : 'platform') : undefined,
    merchantType: merchant.type,
    operator: '运营小王',
    applyTime: daysAgo(i + 1),
    updatedAt: daysAgo(i),
    completeTime: status === 'done' ? daysAgo(i - 1 < 0 ? 0 : i - 1) : undefined,
  };
});

// ---------------- 广告账户 ----------------
const accStatuses: AdAccount['status'][] = ['active', 'disabled', 'banned'];
export const adAccounts: AdAccount[] = Array.from({ length: 42 }).map((_, i) => {
  const merchant = merchants[i % merchants.length];
  const platform = PLATFORMS[i % PLATFORMS.length];
  const status = accStatuses[i % 5 === 0 ? 2 : i % 3 === 0 ? 1 : 0];
  const totalRecharge = Math.round(Math.random() * 500000 * 100) / 100;
  const totalConsume = Math.round(totalRecharge * Math.random() * 100) / 100;
  const balance = Math.round((totalRecharge - totalConsume) * 100) / 100;
  return {
    id: `acc${pad(i + 1)}`,
    code: pad(i + 1),
    accountId: `act_${pad(100200300 + i * 7, 9)}`,
    accountName: `${merchant.name}-${platform}-${pad(i + 1)}`,
    email: `${merchant.name.toLowerCase()}${i}@gmail.com`,
    status,
    platform,
    totalRecharge,
    totalConsume,
    totalClear: Math.round(Math.random() * 20000 * 100) / 100,
    balance: balance < 0 ? 0 : balance,
    bmids:
      i % 3 === 0
        ? [{ bmid: `BM-8823441987${pad(60000 + i, 5)}`, status: 'bound' }]
        : [],
    isEmpty: balance <= 0 && totalConsume === 0,
    merchantId: merchant.id,
    merchantName: merchant.name,
    merchantType: merchant.type,
    timezone: TIMEZONES[i % TIMEZONES.length],
    createdBy: '运营小李',
    createdAt: daysAgo(i + 2),
  };
});

// ---------------- 账户日志 ----------------
export const accountLogs: AccountLog[] = adAccounts.slice(0, 20).flatMap((acc, i) => [
  {
    id: `log${pad(i * 2 + 1)}`,
    accountId: acc.id,
    action: '调整余额',
    detail: `加款 $${(1000 + i * 10).toFixed(2)}`,
    operator: '运营小李',
    createdAt: daysAgo(i),
  },
  {
    id: `log${pad(i * 2 + 2)}`,
    accountId: acc.id,
    action: '绑定BM',
    detail: `新增 BM-8823441987${pad(70000 + i, 5)}`,
    operator: '运营小王',
    createdAt: daysAgo(i + 1),
  },
]);

// ---------------- 站内信 ----------------
export const notifications: Notification[] = Array.from({ length: 12 }).map((_, i) => {
  const scope = i % 3 === 0 ? 'partial' : 'all';
  const status = i % 6 === 0 ? 'revoked' : 'sent';
  return {
    id: `noti${pad(i + 1)}`,
    title: i % 2 === 0 ? '关于回流清算的规则补充说明' : '请关注您的账户资金变动',
    content:
      i % 2 === 0
        ? '致全体商户，关于回流清算的规则补充说明。为规范资金流转，自本月起清算规则调整如下……'
        : `尊敬的用户，您的账户余额发生变动，请及时登录平台查看充值与消耗明细。`,
    scope,
    status,
    targetMerchantIds: scope === 'partial' ? [merchants[i % merchants.length].id] : [],
    sender: '运营小李',
    sentAt: daysAgo(i),
    revokedAt: status === 'revoked' ? daysAgo(i - 1 < 0 ? 0 : i - 1) : undefined,
    read: i > 3,
  };
});

// ---------------- 资产占位记录 ----------------
function assetRecords(prefix: string, types: string[]): AssetRecord[] {
  return Array.from({ length: 16 }).map((_, i) => {
    const merchant = merchants[i % merchants.length];
    return {
      id: `${prefix}${pad(i + 1)}`,
      serialNo: `${prefix.toUpperCase()}${new Date().getFullYear()}${pad(1000 + i, 5)}`,
      merchantId: merchant.id,
      merchantName: merchant.name,
      type: types[i % types.length],
      amount: Math.round((Math.random() * 100000 - 20000) * 100) / 100,
      balanceAfter: Math.round(Math.random() * 500000 * 100) / 100,
      status: ['成功', '处理中', '已驳回'][i % 3],
      remark: i % 2 === 0 ? '系统自动处理' : '人工审核',
      createdAt: daysAgo(i),
    };
  });
}

export const rechargeOrders = assetRecords('rc', ['对公转账', '数字货币', '信用支付']);
export const withdrawOrders = assetRecords('wd', ['提款到账户', '退回备用金']);
export const walletLedger = assetRecords('wl', ['充值', '消耗', '服务费', '退款']);
export const reserveLedger = assetRecords('rl', ['备用金充值', '备用金扣减', '清零回退']);

export const rebindRecords: RebindRecord[] = Array.from({ length: 10 }).map((_, i) => {
  const merchant = merchants[i % merchants.length];
  return {
    id: `rb${pad(i + 1)}`,
    serialNo: `RB${new Date().getFullYear()}${pad(2000 + i, 5)}`,
    merchantName: merchant.name,
    accountId: adAccounts[i].accountId,
    fromBmid: `BM-8823441987${pad(60000 + i, 5)}`,
    toBmid: `BM-8823441987${pad(70000 + i, 5)}`,
    operator: '运营小王',
    createdAt: daysAgo(i),
  };
});

// ---------------- 仪表盘统计 ----------------
export function buildPlatformStats(scale = 1) {
  return PLATFORMS.map((platform: Platform, idx) => ({
    platform,
    applyingCount: Math.floor((20 + idx * 5) * scale),
    todayApplyBatch: Math.floor((3 + idx) * scale),
    emptyCount: Math.floor((120 + idx * 30) * scale),
    todayNewEmpty: Math.floor((5 + idx) * scale),
    activeCount: Math.floor((300 + idx * 60) * scale),
    todayNewActive: Math.floor((8 + idx * 2) * scale),
    bannedCount: Math.floor((40 + idx * 10) * scale),
    todayBanned: Math.floor((1 + idx) * scale),
  }));
}

export function buildConsumeStat(scale = 1) {
  return {
    todayConsume: Math.round(1_250_000 * scale * 100) / 100,
    yesterdayConsume: Math.round(1_180_000 * scale * 100) / 100,
    monthConsume: Math.round(28_500_000 * scale * 100) / 100,
    totalConsume: Math.round(934_346_879.35 * scale * 100) / 100,
    currentAccountBalance: Math.round(88_787_874.88 * scale * 100) / 100,
    currentReserveBalance: Math.round(87_564_454.88 * scale * 100) / 100,
    monthRecharge: Math.round(31_200_000 * scale * 100) / 100,
    totalRecharge: Math.round(1_020_446_879.35 * scale * 100) / 100,
  };
}

// ---------------- 运营端仪表盘（专属脑图） ----------------
export function buildMerchantStat() {
  return {
    todayNewMerchants: 6,
    activeMerchants: merchants.filter((m) => m.status === 'active').length,
  };
}

export function buildOperatorConsumeStat() {
  return {
    today: 1_250_000,
    yesterday: 1_180_000,
    month: 28_500_000,
    total: 934_346_879.35,
  };
}

export function buildOperatorRechargeStat() {
  return {
    today: 1_360_000,
    yesterday: 1_205_000,
    month: 31_200_000,
    total: 1_020_446_879.35,
  };
}

export function buildFundStat() {
  // 备用金负数汇总（待追缴）：取所有为负的备用金余额之和的绝对值
  const reserveNegativeToCollect =
    Math.round(
      merchants
        .filter((m) => m.reserveBalance < 0)
        .reduce((sum, m) => sum + m.reserveBalance, 0) * 100,
    ) / 100;
  return {
    accountBalance: 88_787_874.88,
    reserveBalance: 87_564_454.88,
    reserveNegativeToCollect: Math.abs(reserveNegativeToCollect),
  };
}
