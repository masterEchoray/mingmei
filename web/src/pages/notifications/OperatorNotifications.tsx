import { useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  App,
  Modal,
  Typography,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { notificationApi } from '@/services';
import type { Notification } from '@/types';
import { notificationScopeLabel, notificationStatusLabel } from '@/utils/labels';
import { dateTime } from '@/utils/format';
import { NotificationFormModal } from './NotificationFormModal';

const { Paragraph } = Typography;

export function OperatorNotifications() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [scope, setScope] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<Notification | null>(null);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'operator', keyword, scope, page],
    queryFn: () =>
      notificationApi.list({ role: 'operator', keyword, scope, page, pageSize }),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => notificationApi.revoke(id),
    onSuccess: () => {
      message.success('已撤销该条推送');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const columns: ColumnsType<Notification> = [
    { title: '序号', width: 70, render: (_, __, i) => (page - 1) * pageSize + i + 1 },
    { title: '站内信标题', dataIndex: 'title', width: 220 },
    {
      title: '通知范围',
      dataIndex: 'scope',
      width: 110,
      render: (v: Notification['scope']) => (
        <Tag color={v === 'all' ? 'blue' : 'gold'}>{notificationScopeLabel[v]}</Tag>
      ),
    },
    { title: '发起人', dataIndex: 'sender', width: 100 },
    {
      title: '发送时间',
      dataIndex: 'sentAt',
      width: 170,
      render: (v: string) => dateTime(v),
    },
    {
      title: '通知状态',
      dataIndex: 'status',
      width: 100,
      render: (v: Notification['status']) => (
        <Tag color={v === 'sent' ? 'success' : 'default'}>
          {notificationStatusLabel[v]}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => setDetail(record)}>
            查看
          </Button>
          {record.status === 'sent' && (
            <Popconfirm
              title="确认撤销此条消息推送？"
              onConfirm={() => revokeMutation.mutate(record.id)}
            >
              <Button type="link" size="small" danger>
                撤销
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="消息通知"
        subtitle="管理和发送商户站内信"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setFormOpen(true)}
          >
            新增通知
          </Button>
        }
      />

      <Card styles={{ body: { padding: 12 } }}>
        <Space wrap style={{ marginBottom: 12 }}>
          <Input.Search
            allowClear
            placeholder="查询通知标题关键词"
            style={{ width: 220 }}
            onSearch={(v) => {
              setKeyword(v);
              setPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="通知范围"
            style={{ width: 150 }}
            value={scope}
            onChange={(v) => {
              setScope(v);
              setPage(1);
            }}
            options={[
              { label: '全体商户', value: 'all' },
              { label: '部分商户', value: 'partial' },
            ]}
          />
        </Space>

        <ResponsiveTable<Notification>
          rowKey="id"
          columns={columns}
          dataSource={data?.list ?? []}
          loading={isLoading}
          scrollX={1000}
          mobileTitle={(r) => r.title}
          pagination={{
            current: page,
            pageSize,
            total: data?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>

      <NotificationFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        }}
      />

      <Modal
        title="查看通知"
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={<Button onClick={() => setDetail(null)}>关闭</Button>}
      >
        {detail && (
          <>
            <Typography.Title level={5}>{detail.title}</Typography.Title>
            <Space style={{ marginBottom: 12 }}>
              <Tag color={detail.scope === 'all' ? 'blue' : 'gold'}>
                {notificationScopeLabel[detail.scope]}
              </Tag>
              <span className="text-muted">{dateTime(detail.sentAt)}</span>
            </Space>
            <Paragraph>{detail.content}</Paragraph>
          </>
        )}
      </Modal>
    </div>
  );
}
