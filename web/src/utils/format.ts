import dayjs from 'dayjs';

/** 美元金额格式化：$1,234.56 */
export function money(v: number | undefined | null): string {
  if (v === undefined || v === null || Number.isNaN(v)) return '$0.00';
  return `$${v.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** 大数字紧凑格式：1.2M / 88.79K */
export function compact(v: number | undefined | null): string {
  if (v === undefined || v === null || Number.isNaN(v)) return '0';
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(2)}K`;
  return v.toFixed(2);
}

export function dateTime(v?: string): string {
  return v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-';
}

export function date(v?: string): string {
  return v ? dayjs(v).format('YYYY-MM-DD') : '-';
}
