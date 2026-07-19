// 领域模型类型定义（依据原型图整理）

export type Role = 'operator' | 'merchant';

export type Platform = 'Meta' | 'TikTok' | 'Google';

export const PLATFORMS: Platform[] = ['Meta', 'TikTok', 'Google'];

/** 商户类型：预付 / 实消 */
export type MerchantType = 'prepaid' | 'actual';

/** 商户合作状态：正常 / 暂停合作 */
export type MerchantStatus = 'active' | 'suspended';

export interface Merchant {
  id: string;
  /** 商户编号（展示用） */
  code: string;
  name: string;
  contact: string;
  loginAccount: string;
  type: MerchantType;
  /** 服务费率，百分比数值，如 5 表示 5% */
  serviceRate: number;
  status: MerchantStatus;
  remark?: string;
  /** 历史累计消耗 */
  totalConsume: number;
  /** 备用金余额 */
  reserveBalance: number;
  /** 在绑账户余额 */
  boundAccountBalance: number;
  /** 当前启用账户数 */
  activeAccountCount: number;
  operator: string;
  updatedAt: string;
  createdAt: string;
}

/** 开户申请状态 */
export type ApplicationStatus = 'processing' | 'done' | 'revoked';

export interface AccountApplication {
  id: string;
  /** 申请批号 */
  batchNo: string;
  merchantId: string;
  merchantName: string;
  platform: Platform;
  timezone: string;
  /** 申请开户数 */
  applyCount: number;
  /** 初次绑定的商务 BMID 列表 */
  bmids: string[];
  status: ApplicationStatus;
  /** 批次户损金额（美元） */
  lossAmount: number;
  /** 撤销方：merchant / platform */
  revokeBy?: 'merchant' | 'platform';
  merchantType: MerchantType;
  operator: string;
  applyTime: string;
  updatedAt: string;
  completeTime?: string;
}

/** 广告账户状态 */
export type AdAccountStatus = 'active' | 'disabled' | 'banned';

export interface BmidBinding {
  bmid: string;
  status: 'bound' | 'unbound';
}

export interface AdAccount {
  id: string;
  /** 账户编号（序号展示用） */
  code: string;
  accountId: string;
  accountName: string;
  email: string;
  status: AdAccountStatus;
  platform: Platform;
  /** 累计充值 */
  totalRecharge: number;
  /** 累计消耗 */
  totalConsume: number;
  /** 累计清零 */
  totalClear: number;
  /** 当前余额 */
  balance: number;
  bmids: BmidBinding[];
  /** 是否为空户 */
  isEmpty: boolean;
  merchantId: string;
  merchantName: string;
  merchantType: MerchantType;
  timezone: string;
  createdBy: string;
  createdAt: string;
}

export interface AccountLog {
  id: string;
  accountId: string;
  action: string;
  detail: string;
  operator: string;
  createdAt: string;
}

/** 站内信通知范围 */
export type NotificationScope = 'all' | 'partial';
export type NotificationStatus = 'sent' | 'revoked';

export interface Notification {
  id: string;
  title: string;
  content: string;
  scope: NotificationScope;
  status: NotificationStatus;
  /** 指定商户（scope=partial 时） */
  targetMerchantIds: string[];
  sender: string;
  sentAt: string;
  revokedAt?: string;
  /** 商户端：是否已读 */
  read?: boolean;
}

/** 资产占位模块的通用订单/账变记录 */
export interface AssetRecord {
  id: string;
  serialNo: string;
  merchantId: string;
  merchantName: string;
  type: string;
  amount: number;
  balanceAfter?: number;
  status: string;
  remark?: string;
  createdAt: string;
}

/** 换绑记录 */
export interface RebindRecord {
  id: string;
  serialNo: string;
  merchantName: string;
  accountId: string;
  fromBmid: string;
  toBmid: string;
  operator: string;
  createdAt: string;
}

/** 仪表盘 —— 单平台的账户指标 */
export interface PlatformAccountStat {
  platform: Platform;
  /** 申请开户进行中总数 */
  applyingCount: number;
  /** 今日申请开户批数 */
  todayApplyBatch: number;
  /** 总空账号数 */
  emptyCount: number;
  /** 今日新增空账号数 */
  todayNewEmpty: number;
  /** 总活跃账号数 */
  activeCount: number;
  /** 今日新增活跃账号数 */
  todayNewActive: number;
  /** 总封禁账号数 */
  bannedCount: number;
  /** 今日封禁数 */
  todayBanned: number;
}

/** 仪表盘 —— 消耗与充值 */
export interface ConsumeStat {
  todayConsume: number;
  yesterdayConsume: number;
  monthConsume: number;
  totalConsume: number;
  currentAccountBalance: number;
  currentReserveBalance: number;
  monthRecharge: number;
  totalRecharge: number;
}

export interface DashboardData {
  platformStats: PlatformAccountStat[];
  consumeStat: ConsumeStat;
}

/** 运营端仪表盘 —— 商户数据 */
export interface MerchantStat {
  todayNewMerchants: number;
  activeMerchants: number;
}

/** 四段式金额统计（今日/昨日/本月/累计） */
export interface PeriodStat {
  today: number;
  yesterday: number;
  month: number;
  total: number;
}

/** 运营端仪表盘 —— 资金数据 */
export interface FundStat {
  accountBalance: number;
  reserveBalance: number;
  /** 备用金负数待追缴总金额 */
  reserveNegativeToCollect: number;
}

/** 运营端仪表盘（比商户端更丰富，见运营端脑图） */
export interface OperatorDashboardData {
  platformStats: PlatformAccountStat[];
  merchantStat: MerchantStat;
  consumeStat: PeriodStat;
  rechargeStat: PeriodStat;
  fundStat: FundStat;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UserInfo {
  id: string;
  name: string;
  role: Role;
  email: string;
  merchantId?: string;
  /** 商户端：是否已开户 */
  hasOpenedAccount?: boolean;
}
