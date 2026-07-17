import { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Row,
  Col,
  Statistic,
  Popconfirm,
  App,
  Checkbox,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { merchantApi } from '@/services';
import type { Merchant } from '@/types';
import {
  merchantStatusColor,
  merchantStatusLabel,
  merchantTypeLabel,
} from '@/utils/labels';
import { money, dateTime } from '@/utils/format';
import { MerchantFormModal } from './MerchantFormModal';

export default function MerchantsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [onlyNegative, setOnlyNegative] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Merchant | null>(null);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['merchants', keyword, type, status, onlyNegative, page],
    queryFn: () =>
      merchantApi.list({
        keyword,
        type,
        status,
        onlyNegativeReserve: onlyNegative,
        page,
        pageSize,
      }),
  });

  const { data: summary } = useQuery({
    queryKey: ['merchants-summary'],
    queryFn: () => merchantApi.summary(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: Merchant['status'] }) =>
      merchantApi.setStatus(id, next),
    onSuccess: () => {
      message.success('操作成功');
      queryClient.invalidateQueries({ queryKey: ['merchants'] });
    },
  });

  const columns: ColumnsType<Merchant> = [
    { title: '商户ID', dataIndex: 'code', width: 100, fixed: 'left' },
    { title: '商户名称', dataIndex: 'name', width: 140 },
    { title: '联系人', dataIndex: 'contact', width: 100 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      render: (v: Merchant['type']) => merchantTypeLabel[v],
    },
    {
      title: '服务费率',
      dataIndex: 'serviceRate',
      width: 90,
      render: (v: number) => `${v}%`,
    },
    {
      title: '历史累计消耗',
      dataIndex: 'totalConsume',
      width: 140,
      render: (v: number) => money(v),
    },
    {
      title: '备用金余额',
      dataIndex: 'reserveBalance',
      width: 130,
      render: (v: number) => (
        <span style={{ color: v < 0 ? '#cf1322' : undefined }}>{money(v)}</span>
      ),
    },
    {
      title: '在绑账户余额',
      dataIndex: 'boundAccountBalance',
      width: 140,
      render: (v: number) => money(v),
    },
    { title: '启用账户', dataIndex: 'activeAccountCount', width: 90 },
    {
      title: '合作状态',
      dataIndex: 'status',
      width: 100,
      render: (v: Merchant['status']) => (
        <Tag color={merchantStatusColor[v]}>{merchantStatusLabel[v]}</Tag>
      ),
    },
    {
      title: '最近编辑',
      dataIndex: 'updatedAt',
      width: 170,
      render: (v: string) => dateTime(v),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setEditing(record);
              setModalOpen(true);
            }}
          >
            编辑
          </Button>
          {record.status === 'active' ? (
            <Popconfirm
              title="暂停合作确认"
              description={`请注意，该商户备用金余额约 ${money(
                record.reserveBalance,
              )}，是否确认调整为【暂停合作】？`}
              onConfirm={() =>
                statusMutation.mutate({ id: record.id, next: 'suspended' })
              }
            >
              <Button type="link" size="small" danger>
                暂停
              </Button>
            </Popconfirm>
          ) : (
            <Button
              type="link"
              size="small"
              onClick={() => statusMutation.mutate({ id: record.id, next: 'active' })}
            >
              启用
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="商户管理"
        subtitle="管理平台全部商户及合作状态"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            新增商户
          </Button>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="全部商户历史总消耗"
              value={money(summary?.totalConsume ?? 0)}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="所有商户账户总余额"
              value={money(summary?.totalBalance ?? 0)}
              valueStyle={{ fontSize: 20, color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="所有商户备用金总余额"
              value={money(summary?.totalReserve ?? 0)}
              valueStyle={{ fontSize: 20, color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Card styles={{ body: { padding: 12 } }}>
        <Space wrap style={{ marginBottom: 12 }}>
          <Input.Search
            allowClear
            placeholder="商户名称 / ID / 联系人"
            style={{ width: 220 }}
            onSearch={(v) => {
              setKeyword(v);
              setPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="商户类型"
            style={{ width: 140 }}
            value={type}
            onChange={(v) => {
              setType(v);
              setPage(1);
            }}
            options={[
              { label: '预付', value: 'prepaid' },
              { label: '实消', value: 'actual' },
            ]}
          />
          <Select
            allowClear
            placeholder="合作状态"
            style={{ width: 140 }}
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={[
              { label: '正常', value: 'active' },
              { label: '暂停合作', value: 'suspended' },
            ]}
          />
          <Checkbox
            checked={onlyNegative}
            onChange={(e) => {
              setOnlyNegative(e.target.checked);
              setPage(1);
            }}
          >
            只看备用金负数
          </Checkbox>
        </Space>

        <ResponsiveTable<Merchant>
          rowKey="id"
          columns={columns}
          dataSource={data?.list ?? []}
          loading={isLoading}
          scrollX={1600}
          mobileTitle={(r) => `${r.name}（${r.code}）`}
          pagination={{
            current: page,
            pageSize,
            total: data?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>

      <MerchantFormModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['merchants'] });
          queryClient.invalidateQueries({ queryKey: ['merchants-summary'] });
        }}
      />
    </div>
  );
}
