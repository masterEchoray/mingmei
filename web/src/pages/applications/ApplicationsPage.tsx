import { useEffect, useState } from 'react';
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
  Empty,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { applicationApi } from '@/services';
import type { AccountApplication, ApplicationStatus } from '@/types';
import {
  applicationStatusColor,
  applicationStatusLabel,
  merchantTypeLabel,
  TIMEZONE_OPTIONS,
} from '@/utils/labels';
import { dateTime, money } from '@/utils/format';
import { useAuthStore } from '@/store/auth';
import { ApplicationFormModal } from './ApplicationFormModal';
import { ApplicationDetailModal } from './ApplicationDetailModal';

export default function ApplicationsPage() {
  const user = useAuthStore((s) => s.user)!;
  const isOperator = user.role === 'operator';
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState<ApplicationStatus>('processing');
  const [keyword, setKeyword] = useState('');
  const [timezone, setTimezone] = useState<string | undefined>();
  const [merchantType, setMerchantType] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AccountApplication | null>(null);
  const [detail, setDetail] = useState<AccountApplication | null>(null);
  const pageSize = 10;

  useEffect(() => {
    if (searchParams.get('open') === '1' && !isOperator) {
      setEditing(null);
      setFormOpen(true);
      searchParams.delete('open');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, isOperator]);

  const { data, isLoading } = useQuery({
    queryKey: ['applications', tab, keyword, timezone, merchantType, page, user.merchantId],
    queryFn: () =>
      applicationApi.list({
        status: tab,
        keyword,
        timezone,
        merchantType,
        page,
        pageSize,
        merchantId: isOperator ? undefined : user.merchantId,
      }),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => applicationApi.revoke(id),
    onSuccess: () => {
      message.success('已撤销（将同步通知到 tg 群组）');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const columns: ColumnsType<AccountApplication> = [
    { title: '申请批号', dataIndex: 'batchNo', width: 150, fixed: 'left' },
    ...(isOperator
      ? [{ title: '商户名称', dataIndex: 'merchantName', width: 130 } as const]
      : []),
    { title: '投放媒体平台', dataIndex: 'platform', width: 120 },
    { title: '申请开户数', dataIndex: 'applyCount', width: 100 },
    { title: '时区', dataIndex: 'timezone', width: 120 },
    {
      title: '商户类型',
      dataIndex: 'merchantType',
      width: 90,
      render: (v: AccountApplication['merchantType']) => merchantTypeLabel[v],
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: ApplicationStatus) => (
        <Tag color={applicationStatusColor[v]}>{applicationStatusLabel[v]}</Tag>
      ),
    },
    ...(tab === 'revoked'
      ? [
          {
            title: '批次户损(美元)',
            dataIndex: 'lossAmount',
            width: 130,
            render: (v: number) => money(v),
          } as const,
        ]
      : []),
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      width: 170,
      render: (v: string) => dateTime(v),
    },
    {
      title: '最后更新',
      dataIndex: 'updatedAt',
      width: 170,
      render: (v: string) => dateTime(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 170,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => setDetail(record)}>
            {isOperator && record.status === 'processing' ? '处理' : '查看'}
          </Button>
          {!isOperator && record.status === 'processing' && (
            <>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  setEditing(record);
                  setFormOpen(true);
                }}
              >
                编辑
              </Button>
              <Popconfirm
                title="确认撤销本次开户申请吗？"
                description="撤销后将同步通知到 tg 群组"
                onConfirm={() => revokeMutation.mutate(record.id)}
              >
                <Button type="link" size="small" danger>
                  撤销
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const counts = data?.counts;
  const tabItems = [
    { key: 'processing', label: `进行中(${counts?.processing ?? 0})` },
    { key: 'done', label: `已完成(${counts?.done ?? 0})` },
    { key: 'revoked', label: `已撤销(${counts?.revoked ?? 0})` },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="开户管理"
        subtitle={isOperator ? '查看并处理商户的媒体开户申请' : '提交并查看媒体开户申请'}
        extra={
          !isOperator && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              填写开户申请
            </Button>
          )
        }
      />

      <Card styles={{ body: { padding: 12 } }}>
        <Tabs
          activeKey={tab}
          onChange={(k) => {
            setTab(k as ApplicationStatus);
            setPage(1);
          }}
          items={tabItems}
        />

        <Space wrap style={{ marginBottom: 12 }}>
          <Input.Search
            allowClear
            placeholder={isOperator ? '商户名称 / 批号' : '批号'}
            style={{ width: 200 }}
            onSearch={(v) => {
              setKeyword(v);
              setPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="查询时区"
            style={{ width: 150 }}
            value={timezone}
            onChange={(v) => {
              setTimezone(v);
              setPage(1);
            }}
            options={TIMEZONE_OPTIONS}
          />
          {isOperator && (
            <Select
              allowClear
              placeholder="商户类型"
              style={{ width: 130 }}
              value={merchantType}
              onChange={(v) => {
                setMerchantType(v);
                setPage(1);
              }}
              options={[
                { label: '预付', value: 'prepaid' },
                { label: '实消', value: 'actual' },
              ]}
            />
          )}
        </Space>

        {!isLoading && (data?.list.length ?? 0) === 0 && !isOperator ? (
          <Empty
            description="暂无数据，请先提交开户申请"
            style={{ padding: 40 }}
          />
        ) : (
          <ResponsiveTable<AccountApplication>
            rowKey="id"
            columns={columns}
            dataSource={data?.list ?? []}
            loading={isLoading}
            scrollX={1400}
            mobileTitle={(r) => `${r.batchNo} · ${r.platform}`}
            pagination={{
              current: page,
              pageSize,
              total: data?.total ?? 0,
              onChange: setPage,
              showSizeChanger: false,
            }}
          />
        )}
      </Card>

      <ApplicationFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false);
          queryClient.invalidateQueries({ queryKey: ['applications'] });
        }}
      />

      <ApplicationDetailModal
        application={detail}
        isOperator={isOperator}
        onClose={() => setDetail(null)}
        onProcessed={() => {
          setDetail(null);
          queryClient.invalidateQueries({ queryKey: ['applications'] });
        }}
      />
    </div>
  );
}
