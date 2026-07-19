import { useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  Button,
  Space,
  App,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { applicationApi } from '@/services';
import type { AccountApplication } from '@/types';
import { PLATFORMS } from '@/types';
import { TIMEZONE_OPTIONS } from '@/utils/labels';
import { useAuthStore } from '@/store/auth';

interface Props {
  open: boolean;
  editing: AccountApplication | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApplicationFormModal({ open, editing, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const user = useAuthStore((s) => s.user)!;
  const isEdit = !!editing;

  useEffect(() => {
    if (open) {
      if (editing) {
        form.setFieldsValue({
          platform: editing.platform,
          currency: 'USD',
          timezone: editing.timezone,
          applyCount: editing.applyCount,
          bmids: editing.bmids.length ? editing.bmids : [''],
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          platform: 'Meta',
          currency: 'USD',
          applyCount: 1,
          bmids: [''],
        });
      }
    }
  }, [open, editing, form]);

  const mutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => {
      const payload: Partial<AccountApplication> = {
        merchantId: user.merchantId,
        platform: values.platform as AccountApplication['platform'],
        timezone: values.timezone as string,
        applyCount: values.applyCount as number,
        bmids: ((values.bmids as string[]) ?? []).filter(Boolean),
      };
      return isEdit
        ? applicationApi.update(editing!.id, payload)
        : applicationApi.create(payload);
    },
    onSuccess: () => {
      message.success(isEdit ? '开户申请已更新' : '开户申请已提交');
      onSuccess();
    },
    onError: (e: Error) => message.error(e.message),
  });

  return (
    <Modal
      title={isEdit ? '编辑开户申请' : '填写开户申请'}
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
          label="媒体平台"
          name="platform"
          rules={[{ required: true, message: '请选择需要开户的媒体平台' }]}
        >
          <Select options={PLATFORMS.map((p) => ({ label: p, value: p }))} />
        </Form.Item>
        <Form.Item label="币种" name="currency" initialValue="USD">
          <Select options={[{ label: '美元（USD）', value: 'USD' }]} />
        </Form.Item>
        <Form.Item
          label="时区"
          name="timezone"
          rules={[{ required: true, message: '请选择时区' }]}
        >
          <Select placeholder="请选择时区" options={TIMEZONE_OPTIONS} />
        </Form.Item>
        <Form.Item
          label="申请开户数量"
          name="applyCount"
          rules={[{ required: true, message: '请输入申请开户数量' }]}
          extra="单次最多申请数不超过 1000"
        >
          <InputNumber min={1} max={1000} style={{ width: '100%' }} />
        </Form.Item>

        <Form.List name="bmids">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <Form.Item
                  key={field.key}
                  label={index === 0 ? '绑定商务BMID（选填）' : ''}
                >
                  <Space>
                    <Form.Item {...field} noStyle>
                      <Input placeholder="请输入 BMID" style={{ width: 360 }} />
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
