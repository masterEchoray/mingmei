import { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Tabs,
  Popconfirm,
  App,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { adAccountApi } from '@/services';
import type { AdAccount, AdAccountStatus } from '@/types';
import {
  adAccountStatusColor,
  adAccountStatusLabel,
  merchantTypeLabel,
} from '@/utils/labels';
import { money, dateTime } from '@/utils/format';
import { useAuthStore } from '@/store/auth';
import {
  AdjustBalanceModal,
  ManageBmModal,
  AccountLogsModal,
  CreateAccountModal,
} from './AccountModals';

export default function AccountsPage() {
  const user = useAuthStore((s) => s.user)!;
  const isOperator = user.role === 'operator';
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [statusTab, setStatusTab] = useState<AdAccountStatus | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [emptyFilter, setEmptyFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [adjustTarget, setAdjustTarget] = useState<AdAccount | null>(null);
  const [bmTarget, setBmTarget] = useState<AdAccount | null>(null);
  const [logsTarget, setLogsTarget] = useState<AdAccount | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['ad-accounts', statusTab, keyword, emptyFilter, page, user.merchantId],
    queryFn: () =>
      adAccountApi.list({
        status: statusTab === 'all' ? undefined : statusTab,
        keyword,
        empty: emptyFilter,
        page,
        pageSize,
        merchantId: isOperator ? undefined : user.merchantId,
      }),
  });

  const clearMutation = useMutation({
    mutationFn: (id: string) => adAccountApi.clear(id),
    onSuccess: () => {
      message.success('清零申请已提交，余额将回退至备用金');
      queryClient.invalidateQueries({ queryKey: ['ad-accounts'] });
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['ad-accounts'] });

  const columns: ColumnsType<AdAccount> = [
    { title: '账户编号', dataIndex: 'code', width: 90, fixed: 'left' },
    { title: '账户ID', dataIndex: 'accountId', width: 150 },
    { title: '账户名', dataIndex: 'accountName', width: 180 },
    { title: '绑定邮箱', dataIndex: 'email', width: 200 },
    { title: '平台', dataIndex: 'platform', width: 90 },
    ...(isOperator
      ? [{ title: '归属商户', dataIndex: 'merchantName', width: 130 } as const]
      : []),
    {
      title: '账户状态',
      dataIndex: 'status',
      width: 100,
      render: (v: AdAccountStatus) => (
        <Tag color={adAccountStatusColor[v]}>{adAccountStatusLabel[v]}</Tag>
      ),
    },
    {
      title: '累计充值($)',
      dataIndex: 'totalRecharge',
      width: 130,
      render: (v: number) => money(v),
    },
    {
      title: '累计消耗($)',
      dataIndex: 'totalConsume',
      width: 130,
      render: (v: number) => money(v),
    },
    {
      title: '当前余额($)',
      dataIndex: 'balance',
      width: 130,
      render: (v: number) => money(v),
    },
    {
      title: '是否空户',
      dataIndex: 'isEmpty',
      width: 90,
      render: (v: boolean) => (v ? <Tag>空户</Tag> : <Tag color="blue">非空</Tag>),
    },
    {
      title: '商户类型',
      dataIndex: 'merchantType',
      width: 90,
      render: (v: AdAccount['merchantType']) => merchantTypeLabel[v],
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (v: string) => dateTime(v),
    },
    {
      title: '操作',
      key: 'action',
      width: isOperator ? 260 : 210,
      fixed: 'right',
      render: (_, record) => (
        <Space size={0} wrap>
          <Button type="link" size="small" onClick={() => setAdjustTarget(record)}>
            调整余额
          </Button>
          <Button type="link" size="small" onClick={() => setBmTarget(record)}>
            管理BM
          </Button>
          <Popconfirm
            title="申请清零"
            description="确认提交该账户的清零申请？清零后余额将自动回退到商户备用金。"
            onConfirm={() => clearMutation.mutate(record.id)}
          >
            <Button type="link" size="small">
              清零
            </Button>
          </Popconfirm>
          {isOperator && (
            <Button type="link" size="small" onClick={() => setLogsTarget(record)}>
              日志
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const counts = data?.counts;
  const tabItems = [
    { key: 'all', label: '全部账户' },
    { key: 'active', label: `活跃(${counts?.active ?? 0})` },
    { key: 'disabled', label: `停用(${counts?.disabled ?? 0})` },
    { key: 'banned', label: `封禁(${counts?.banned ?? 0})` },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="账户管理"
        subtitle={isOperator ? '全部开通账户的查看与管理' : '查看及管理已开通的全部账户'}
        extra={
          isOperator && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
            >
              创建账户
            </Button>
          )
        }
      />

      <Card styles={{ body: { padding: 12 } }}>
        <Tabs
          activeKey={statusTab}
          onChange={(k) => {
            setStatusTab(k as AdAccountStatus | 'all');
            setPage(1);
          }}
          items={tabItems}
        />

        <Space wrap style={{ marginBottom: 12 }}>
          <Input.Search
            allowClear
            placeholder="账户ID / 账户名 / 绑定邮箱"
            style={{ width: 240 }}
            onSearch={(v) => {
              setKeyword(v);
              setPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="账户消耗情况"
            style={{ width: 150 }}
            value={emptyFilter}
            onChange={(v) => {
              setEmptyFilter(v);
              setPage(1);
            }}
            options={[
              { label: '空户', value: 'empty' },
              { label: '非空户', value: 'nonempty' },
            ]}
          />
        </Space>

        <ResponsiveTable<AdAccount>
          rowKey="id"
          columns={columns}
          dataSource={data?.list ?? []}
          loading={isLoading}
          scrollX={2000}
          mobileTitle={(r) => `${r.accountName}`}
          pagination={{
            current: page,
            pageSize,
            total: data?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>

      <AdjustBalanceModal
        account={adjustTarget}
        onClose={() => setAdjustTarget(null)}
        onSuccess={() => {
          setAdjustTarget(null);
          invalidate();
        }}
      />
      <ManageBmModal
        account={bmTarget}
        onClose={() => setBmTarget(null)}
        onSuccess={() => {
          setBmTarget(null);
          invalidate();
        }}
      />
      <AccountLogsModal account={logsTarget} onClose={() => setLogsTarget(null)} />
      <CreateAccountModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          invalidate();
        }}
      />
    </div>
  );
}
