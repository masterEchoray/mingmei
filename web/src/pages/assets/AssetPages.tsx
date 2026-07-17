import { useState } from 'react';
import { Card, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { assetApi } from '@/services';
import type { AssetRecord } from '@/types';
import { money, dateTime } from '@/utils/format';
import { useAuthStore } from '@/store/auth';

type Fetcher = typeof assetApi.rechargeOrders;

function AssetListPage({
  title,
  subtitle,
  fetcher,
  queryKey,
  amountLabel = '金额',
}: {
  title: string;
  subtitle: string;
  fetcher: Fetcher;
  queryKey: string;
  amountLabel?: string;
}) {
  const user = useAuthStore((s) => s.user)!;
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: [queryKey, page, user.merchantId],
    queryFn: () =>
      fetcher({
        page,
        pageSize,
        merchantId: user.role === 'merchant' ? user.merchantId : undefined,
      }),
  });

  const columns: ColumnsType<AssetRecord> = [
    { title: '流水号', dataIndex: 'serialNo', width: 180 },
    ...(user.role === 'operator'
      ? [{ title: '商户', dataIndex: 'merchantName', width: 140 } as const]
      : []),
    { title: '类型', dataIndex: 'type', width: 120 },
    {
      title: amountLabel,
      dataIndex: 'amount',
      width: 140,
      render: (v: number) => (
        <span style={{ color: v < 0 ? '#cf1322' : '#3f8600' }}>{money(v)}</span>
      ),
    },
    {
      title: '变动后余额',
      dataIndex: 'balanceAfter',
      width: 140,
      render: (v: number) => money(v),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => (
        <Tag color={v === '成功' ? 'success' : v === '处理中' ? 'processing' : 'error'}>
          {v}
        </Tag>
      ),
    },
    { title: '备注', dataIndex: 'remark', width: 140 },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (v: string) => dateTime(v),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader title={title} subtitle={subtitle} />
      <Card styles={{ body: { padding: 12 } }}>
        <ResponsiveTable<AssetRecord>
          rowKey="id"
          columns={columns}
          dataSource={data?.list ?? []}
          loading={isLoading}
          mobileTitle={(r) => r.serialNo}
          pagination={{
            current: page,
            pageSize,
            total: data?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  );
}

export function RechargeOrdersPage() {
  return (
    <AssetListPage
      title="充值订单"
      subtitle="商户充值订单记录"
      fetcher={assetApi.rechargeOrders}
      queryKey="recharge-orders"
      amountLabel="充值金额"
    />
  );
}

export function WithdrawOrdersPage() {
  return (
    <AssetListPage
      title="提款订单"
      subtitle="商户提款订单记录"
      fetcher={assetApi.withdrawOrders}
      queryKey="withdraw-orders"
      amountLabel="提款金额"
    />
  );
}

export function WalletLedgerPage() {
  return (
    <AssetListPage
      title="钱包账变记录"
      subtitle="钱包资金变动明细"
      fetcher={assetApi.walletLedger}
      queryKey="wallet-ledger"
      amountLabel="变动金额"
    />
  );
}

export function ReserveLedgerPage() {
  return (
    <AssetListPage
      title="备用金账变记录"
      subtitle="备用金资金变动明细"
      fetcher={assetApi.reserveLedger}
      queryKey="reserve-ledger"
      amountLabel="变动金额"
    />
  );
}
