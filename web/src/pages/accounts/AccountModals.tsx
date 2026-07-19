import { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Radio,
  InputNumber,
  Descriptions,
  Input,
  Button,
  Space,
  Table,
  Select,
  App,
  Alert,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adAccountApi, merchantApi } from '@/services';
import type { AdAccount } from '@/types';
import { PLATFORMS } from '@/types';
import { TIMEZONE_OPTIONS } from '@/utils/labels';
import { money, dateTime } from '@/utils/format';

// -------- 调整余额 --------
export function AdjustBalanceModal({
  account,
  onClose,
  onSuccess,
}: {
  account: AdAccount | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    if (account)
      form.setFieldsValue({ type: 'add', currency: 'USD', amount: undefined });
  }, [account, form]);

  const mutation = useMutation({
    mutationFn: (values: { type: 'add' | 'deduct'; amount: number }) =>
      adAccountApi.adjustBalance(account!.id, values.type, values.amount),
    onSuccess: () => {
      message.success('余额调整成功');
      onSuccess();
    },
    onError: (e: Error) => message.error(e.message),
  });

  return (
    <Modal
      title="调整账户余额"
      open={!!account}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
    >
      {account && (
        <>
          <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="账户ID">{account.accountId}</Descriptions.Item>
            <Descriptions.Item label="账户名称">
              {account.accountName}
            </Descriptions.Item>
            <Descriptions.Item label="绑定邮箱">{account.email}</Descriptions.Item>
            <Descriptions.Item label="账户当前余额">
              {money(account.balance)}
            </Descriptions.Item>
          </Descriptions>
          <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
            <Form.Item label="币种" name="currency" initialValue="USD">
              <Select options={[{ label: '美元（USD）', value: 'USD' }]} />
            </Form.Item>
            <Form.Item
              label="操作类型"
              name="type"
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Radio.Button value="add">加款</Radio.Button>
                <Radio.Button value="deduct">减款</Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              label="操作金额"
              name="amount"
              rules={[{ required: true, message: '请输入操作金额' }]}
            >
              <InputNumber
                min={0.01}
                style={{ width: '100%' }}
                addonBefore="$"
                placeholder="请输入操作金额"
              />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
}

// -------- 管理 BM --------
export function ManageBmModal({
  account,
  onClose,
  onSuccess,
}: {
  account: AdAccount | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form] = Form.useForm();
  const { message } = App.useApp();

  useEffect(() => {
    if (account) {
      const existing = account.bmids.map((b) => b.bmid);
      form.setFieldsValue({
        bmids: existing.length ? existing : ['', '', ''],
      });
    }
  }, [account, form]);

  const mutation = useMutation({
    mutationFn: (values: { bmids: string[] }) =>
      adAccountApi.updateBmids(account!.id, values.bmids.filter(Boolean)),
    onSuccess: () => {
      message.success('BM 绑定已更新');
      onSuccess();
    },
    onError: (e: Error) => message.error(e.message),
  });

  return (
    <Modal
      title="管理 BMID"
      open={!!account}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={560}
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="默认显示 3 条输入栏，点击新增每次增加 1 条，单次最多新增 30 条"
      />
      <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
        <Form.List name="bmids">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <Form.Item key={field.key} label={index === 0 ? '此账户关联BMID' : ''}>
                  <Space>
                    <Form.Item {...field} noStyle>
                      <Input placeholder="请输入 BMID" style={{ width: 380 }} />
                    </Form.Item>
                    {fields.length > 1 && (
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    )}
                  </Space>
                </Form.Item>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  disabled={fields.length >= 30}
                >
                  新增商务BMID
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}

// -------- 账户日志 --------
export function AccountLogsModal({
  account,
  onClose,
}: {
  account: AdAccount | null;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['account-logs', account?.id],
    queryFn: () => adAccountApi.logs(account!.id),
    enabled: !!account,
  });

  return (
    <Modal
      title={`账户日志 - ${account?.accountName ?? ''}`}
      open={!!account}
      onCancel={onClose}
      footer={<Button onClick={onClose}>关闭</Button>}
      width={680}
    >
      <Table
        rowKey="id"
        size="small"
        loading={isLoading}
        dataSource={data?.list ?? []}
        pagination={false}
        scroll={{ x: 500, y: 360 }}
        columns={[
          { title: '操作', dataIndex: 'action', width: 100 },
          { title: '详情', dataIndex: 'detail' },
          { title: '操作人', dataIndex: 'operator', width: 100 },
          {
            title: '时间',
            dataIndex: 'createdAt',
            width: 170,
            render: (v: string) => dateTime(v),
          },
        ]}
      />
    </Modal>
  );
}

// -------- 创建账户（运营端） --------
export function CreateAccountModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [merchantSearch, setMerchantSearch] = useState('');

  const { data: merchants } = useQuery({
    queryKey: ['merchants-options', merchantSearch],
    queryFn: () => merchantApi.list({ keyword: merchantSearch, page: 1, pageSize: 50 }),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ platform: 'Meta', timezone: 'GMT+08:00' });
    }
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      adAccountApi.create({
        merchantId: values.merchantId as string,
        platform: values.platform as AdAccount['platform'],
        accountId: values.accountId as string,
        accountName: values.accountName as string,
        email: values.email as string,
        timezone: values.timezone as string,
      }),
    onSuccess: () => {
      message.success('账户已创建');
      onSuccess();
    },
    onError: (e: Error) => message.error(e.message),
  });

  return (
    <Modal
      title="创建账户"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={560}
    >
      <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
        <Form.Item
          label="归属商户"
          name="merchantId"
          rules={[{ required: true, message: '请选择归属商户' }]}
        >
          <Select
            showSearch
            filterOption={false}
            onSearch={setMerchantSearch}
            placeholder="请选择或输入商户名称"
            options={(merchants?.list ?? []).map((m) => ({
              label: `${m.name}（${m.code}）`,
              value: m.id,
            }))}
          />
        </Form.Item>
        <Form.Item label="媒体平台" name="platform" rules={[{ required: true }]}>
          <Select options={PLATFORMS.map((p) => ({ label: p, value: p }))} />
        </Form.Item>
        <Form.Item
          label="账户ID"
          name="accountId"
          rules={[{ required: true, message: '请输入账户ID' }]}
        >
          <Input placeholder="请输入账户ID" />
        </Form.Item>
        <Form.Item
          label="账户名"
          name="accountName"
          rules={[{ required: true, message: '请输入账户名' }]}
        >
          <Input placeholder="请输入账户名" />
        </Form.Item>
        <Form.Item
          label="绑定邮箱"
          name="email"
          rules={[{ required: true, message: '请输入绑定邮箱' }]}
        >
          <Input placeholder="请输入绑定邮箱" />
        </Form.Item>
        <Form.Item label="时区" name="timezone" rules={[{ required: true }]}>
          <Select options={TIMEZONE_OPTIONS} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
