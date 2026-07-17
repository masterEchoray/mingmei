import { useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Switch, App } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { merchantApi } from '@/services';
import type { Merchant } from '@/types';

interface Props {
  open: boolean;
  editing: Merchant | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function MerchantFormModal({ open, editing, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const isEdit = !!editing;

  useEffect(() => {
    if (open) {
      if (editing) {
        form.setFieldsValue({
          ...editing,
          statusActive: editing.status === 'active',
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ type: 'actual', serviceRate: 5, statusActive: true });
      }
    }
  }, [open, editing, form]);

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => {
      const payload: Partial<Merchant> = {
        name: values.name as string,
        contact: values.contact as string,
        loginAccount: values.loginAccount as string,
        type: values.type as Merchant['type'],
        serviceRate: values.serviceRate as number,
        status: values.statusActive ? 'active' : 'suspended',
        remark: values.remark as string,
      };
      return isEdit
        ? merchantApi.update(editing!.id, payload)
        : merchantApi.create(payload);
    },
    onSuccess: () => {
      message.success(isEdit ? '商户已更新' : '商户已创建');
      onSuccess();
    },
    onError: (e: Error) => message.error(e.message),
  });

  return (
    <Modal
      title={isEdit ? '编辑商户' : '新增商户'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={560}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(v) => mutation.mutate(v)}
        style={{ marginTop: 12 }}
      >
        <Form.Item
          label="商户名称"
          name="name"
          rules={[{ required: true, message: '请输入商户名称' }]}
        >
          <Input placeholder="请输入商户名称" />
        </Form.Item>
        <Form.Item
          label="商户联系人"
          name="contact"
          rules={[{ required: true, message: '请输入商户联系人' }]}
        >
          <Input placeholder="请输入商户联系人" />
        </Form.Item>
        <Form.Item
          label="商户登录账号"
          name="loginAccount"
          rules={[{ required: true, message: '请输入登录账号' }]}
        >
          <Input placeholder="请输入登录账号（邮箱）" />
        </Form.Item>
        {!isEdit && (
          <Form.Item
            label="商户登录密码"
            name="password"
            extra="留空默认与登录账号相同"
          >
            <Input.Password placeholder="请输入登录密码" />
          </Form.Item>
        )}
        <Form.Item
          label="商户类型"
          name="type"
          rules={[{ required: true, message: '请选择商户类型' }]}
        >
          <Select
            options={[
              { label: '预付', value: 'prepaid' },
              { label: '实消', value: 'actual' },
            ]}
          />
        </Form.Item>
        <Form.Item
          label="收取服务费率(%)"
          name="serviceRate"
          rules={[{ required: true, message: '请输入服务费率' }]}
        >
          <InputNumber min={0} max={100} style={{ width: '100%' }} addonAfter="%" />
        </Form.Item>
        <Form.Item label="商户状态" name="statusActive" valuePropName="checked">
          <Switch checkedChildren="正常启用" unCheckedChildren="暂停合作" />
        </Form.Item>
        <Form.Item label="备注" name="remark">
          <Input.TextArea rows={3} placeholder="选填" maxLength={200} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
}
