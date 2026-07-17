import { useEffect, useState } from 'react';
import {
  Modal,
  Descriptions,
  Tag,
  Table,
  Input,
  Button,
  Space,
  Popconfirm,
  App,
  Alert,
} from 'antd';
import { useMutation } from '@tanstack/react-query';
import { applicationApi } from '@/services';
import type { AccountApplication } from '@/types';
import {
  applicationStatusColor,
  applicationStatusLabel,
} from '@/utils/labels';
import { dateTime, money } from '@/utils/format';

interface Props {
  application: AccountApplication | null;
  isOperator: boolean;
  onClose: () => void;
  onProcessed: () => void;
}

interface AccountRow {
  key: number;
  accountId: string;
  accountName: string;
  email: string;
}

export function ApplicationDetailModal({
  application,
  isOperator,
  onClose,
  onProcessed,
}: Props) {
  const { message } = App.useApp();
  const [rows, setRows] = useState<AccountRow[]>([]);

  useEffect(() => {
    if (application) {
      setRows(
        Array.from({ length: application.applyCount }).map((_, i) => ({
          key: i,
          accountId: '',
          accountName: '',
          email: '',
        })),
      );
    }
  }, [application]);

  const completeMutation = useMutation({
    mutationFn: () => applicationApi.complete(application!.id),
    onSuccess: () => {
      message.success('开户信息已提交，批次已完成');
      onProcessed();
    },
  });

  const revokeMutation = useMutation({
    mutationFn: () => applicationApi.revoke(application!.id),
    onSuccess: () => {
      message.success('已撤销开户批次（将同步通知到 tg 群组）');
      onProcessed();
    },
  });

  if (!application) return null;

  const canProcess = isOperator && application.status === 'processing';

  const updateRow = (key: number, field: keyof AccountRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    );
  };

  const columns = [
    { title: '账户编号', dataIndex: 'key', width: 80, render: (v: number) => v + 1 },
    {
      title: '账户ID',
      dataIndex: 'accountId',
      render: (_: string, r: AccountRow) => (
        <Input
          placeholder="请输入账户ID"
          value={r.accountId}
          onChange={(e) => updateRow(r.key, 'accountId', e.target.value)}
        />
      ),
    },
    {
      title: '账户名',
      dataIndex: 'accountName',
      render: (_: string, r: AccountRow) => (
        <Input
          placeholder="请输入账户名"
          value={r.accountName}
          onChange={(e) => updateRow(r.key, 'accountName', e.target.value)}
        />
      ),
    },
    {
      title: '绑定邮箱',
      dataIndex: 'email',
      render: (_: string, r: AccountRow) => (
        <Input
          placeholder="请输入绑定邮箱"
          value={r.email}
          onChange={(e) => updateRow(r.key, 'email', e.target.value)}
        />
      ),
    },
  ];

  return (
    <Modal
      title={canProcess ? '处理开户申请' : '开户申请详情'}
      open={!!application}
      onCancel={onClose}
      width={760}
      footer={
        canProcess ? (
          <Space>
            <Popconfirm
              title="确认撤销本次开户申请吗？"
              description="撤销后将同步通知到 tg 群组"
              onConfirm={() => revokeMutation.mutate()}
            >
              <Button danger loading={revokeMutation.isPending}>
                撤销批次
              </Button>
            </Popconfirm>
            <Button onClick={onClose}>取消</Button>
            <Button
              type="primary"
              loading={completeMutation.isPending}
              onClick={() => {
                const filled = rows.every(
                  (r) => r.accountId && r.accountName && r.email,
                );
                if (!filled) {
                  message.warning('请完整填写本批次全部开户信息后再提交');
                  return;
                }
                completeMutation.mutate();
              }}
            >
              提交并完成
            </Button>
          </Space>
        ) : (
          <Button onClick={onClose}>关闭</Button>
        )
      }
    >
      <Descriptions
        column={{ xs: 1, sm: 2 }}
        size="small"
        bordered
        style={{ marginBottom: 16 }}
      >
        <Descriptions.Item label="申请批号">{application.batchNo}</Descriptions.Item>
        <Descriptions.Item label="商户名称">
          {application.merchantName}
        </Descriptions.Item>
        <Descriptions.Item label="媒体平台">{application.platform}</Descriptions.Item>
        <Descriptions.Item label="申请开户数">
          {application.applyCount}
        </Descriptions.Item>
        <Descriptions.Item label="时区">{application.timezone}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={applicationStatusColor[application.status]}>
            {applicationStatusLabel[application.status]}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="首次绑定BMID" span={2}>
          {application.bmids.length ? application.bmids.join(' / ') : '未填写'}
        </Descriptions.Item>
        <Descriptions.Item label="申请时间">
          {dateTime(application.applyTime)}
        </Descriptions.Item>
        {application.completeTime && (
          <Descriptions.Item label="完成时间">
            {dateTime(application.completeTime)}
          </Descriptions.Item>
        )}
        {application.status === 'revoked' && (
          <Descriptions.Item label="批次户损">
            {money(application.lossAmount)}
          </Descriptions.Item>
        )}
      </Descriptions>

      {canProcess && (
        <>
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message={`本批次需填入 ${application.applyCount} 条开户信息，请仔细核对填写后统一提交`}
          />
          <Table
            rowKey="key"
            size="small"
            columns={columns}
            dataSource={rows}
            pagination={false}
            scroll={{ x: 600 }}
          />
        </>
      )}
    </Modal>
  );
}
