import { Card, Typography, Button, Space, Segmented, Switch, Form } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import type { Role } from '@/types';

const { Title, Paragraph, Text } = Typography;

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('merchant');
  const [opened, setOpened] = useState(true);

  const handleLogin = () => {
    login(role, { hasOpenedAccount: opened });
    navigate('/dashboard');
  };

  return (
    <div className="login-bg">
      <Card
        style={{ width: '100%', maxWidth: 420, borderRadius: 16 }}
        styles={{ body: { padding: 32 } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, color: '#1890ff' }}>◆</div>
          <Title level={3} style={{ marginBottom: 4 }}>
            海外媒体投放平台
          </Title>
          <Text type="secondary">阶段一演示版（前端 + Mock 数据）</Text>
        </div>

        <Form layout="vertical">
          <Form.Item label="选择登录角色">
            <Segmented
              block
              value={role}
              onChange={(v) => setRole(v as Role)}
              options={[
                { label: '商户端', value: 'merchant' },
                { label: '运营端', value: 'operator' },
              ]}
            />
          </Form.Item>

          {role === 'merchant' && (
            <Form.Item label="商户开户状态">
              <Space>
                <Switch checked={opened} onChange={setOpened} />
                <Text>{opened ? '已开户（展示完整仪表盘）' : '未开户（展示开户引导）'}</Text>
              </Space>
            </Form.Item>
          )}

          <Button type="primary" block size="large" onClick={handleLogin}>
            进入系统
          </Button>
        </Form>

        <Paragraph
          type="secondary"
          style={{ marginTop: 20, marginBottom: 0, fontSize: 12 }}
        >
          演示说明：本阶段无需真实账号密码，选择角色后即可体验。登录后可在右上角头像菜单一键切换角色。
        </Paragraph>
      </Card>
    </div>
  );
}
