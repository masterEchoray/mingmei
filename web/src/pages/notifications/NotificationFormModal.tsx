import { useEffect, useState } from 'react';
import { Modal, Form, Input, Radio, Select, App } from 'antd';
import { useMutation, useQuery } from '@tanstack/react-query';
import { notificationApi, merchantApi } from '@/services';
import type { Notification } from '@/types';

export function NotificationFormModal({
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
  const [scope, setScope] = useState<'all' | 'partial'>('all');

  const { data: merchants } = useQuery({
    queryKey: ['merchants-all'],
    queryFn: () => merchantApi.list({ page: 1, pageSize: 100 }),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ scope: 'all' });
      setScope('all');
    }
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      notificationApi.create({
        title: values.title as string,
        content: values.content as string,
        scope: values.scope as Notification['scope'],
        targetMerchantIds:
          values.scope === 'partial' ? (values.targetMerchantIds as string[]) : [],
      }),
    onSuccess: () => {
      message.success('站内信已发送');
      onSuccess();
    },
    onError: (e: Error) => message.error(e.message),
  });

  return (
    <Modal
      title="新增通知"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(v) => mutation.mutate(v)}
        style={{ marginTop: 12 }}
      >
        <Form.Item
          label="选择站内信推送范围"
          name="scope"
          rules={[{ required: true }]}
        >
          <Radio.Group onChange={(e) => setScope(e.target.value)}>
            <Radio value="all">全部商户</Radio>
            <Radio value="partial">部分商户</Radio>
          </Radio.Group>
        </Form.Item>

        {scope === 'partial' && (
          <Form.Item
            label="请选择指定商户（支持多选）"
            name="targetMerchantIds"
            rules={[{ required: true, message: '请选择指定商户' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择指定商户"
              optionFilterProp="label"
              options={(merchants?.list ?? []).map((m) => ({
                label: `${m.name}（${m.code}）`,
                value: m.id,
              }))}
            />
          </Form.Item>
        )}

        <Form.Item
          label="站内信标题"
          name="title"
          rules={[{ required: true, message: '请输入站内信标题' }]}
        >
          <Input placeholder="标题不超过 50 个字符" maxLength={50} showCount />
        </Form.Item>
        <Form.Item
          label="站内信正文"
          name="content"
          rules={[{ required: true, message: '请输入站内信正文' }]}
        >
          <Input.TextArea
            rows={5}
            placeholder="正文不超过 300 个字符"
            maxLength={300}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
