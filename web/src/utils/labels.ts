import type {
  AdAccountStatus,
  ApplicationStatus,
  MerchantStatus,
  MerchantType,
  NotificationScope,
  NotificationStatus,
} from '@/types';

export const merchantTypeLabel: Record<MerchantType, string> = {
  prepaid: '预付',
  actual: '实消',
};

export const merchantStatusLabel: Record<MerchantStatus, string> = {
  active: '正常',
  suspended: '暂停合作',
};

export const merchantStatusColor: Record<MerchantStatus, string> = {
  active: 'success',
  suspended: 'default',
};

export const applicationStatusLabel: Record<ApplicationStatus, string> = {
  processing: '进行中',
  done: '已完成',
  revoked: '已撤销',
};

export const applicationStatusColor: Record<ApplicationStatus, string> = {
  processing: 'processing',
  done: 'success',
  revoked: 'default',
};

export const adAccountStatusLabel: Record<AdAccountStatus, string> = {
  active: '活跃',
  disabled: '停用',
  banned: '封禁',
};

export const adAccountStatusColor: Record<AdAccountStatus, string> = {
  active: 'success',
  disabled: 'warning',
  banned: 'error',
};

export const notificationScopeLabel: Record<NotificationScope, string> = {
  all: '全体商户',
  partial: '部分商户',
};

export const notificationStatusLabel: Record<NotificationStatus, string> = {
  sent: '已发送',
  revoked: '已撤销',
};

export const TIMEZONE_OPTIONS = [
  'GMT+08:00',
  'GMT+06:00',
  'GMT+00:00',
  'GMT-05:00',
  'GMT+01:00',
].map((v) => ({ label: v, value: v }));
