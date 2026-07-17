import { Badge, Dropdown, Space, Avatar, Button, List, Empty, Typography } from 'antd';
import {
  BellOutlined,
  GlobalOutlined,
  UserOutlined,
  DownOutlined,
  LogoutOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { notificationApi } from '@/services';
import { useResponsive } from '@/hooks/useResponsive';
import { date } from '@/utils/format';

const { Text } = Typography;

export function HeaderBar() {
  const user = useAuthStore((s) => s.user)!;
  const lang = useAuthStore((s) => s.lang);
  const setLang = useAuthStore((s) => s.setLang);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useResponsive();

  const { data: unread } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationApi.unreadCount(),
    refetchInterval: 15_000,
  });

  const { data: recent } = useQuery({
    queryKey: ['recent-notifications'],
    queryFn: () => notificationApi.list({ role: user.role, page: 1, pageSize: 5 }),
  });

  const title =
    user.role === 'operator' ? '海外媒体投放运营后台' : '海外媒体投放商户后台';

  const notificationDropdown = (
    <div style={{ width: isMobile ? 260 : 340, background: '#fff', borderRadius: 8 }}>
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text strong>消息通知</Text>
        <Button
          type="link"
          size="small"
          onClick={async () => {
            await notificationApi.readAll();
            queryClient.invalidateQueries({ queryKey: ['unread-count'] });
            queryClient.invalidateQueries({ queryKey: ['recent-notifications'] });
          }}
        >
          全部已读
        </Button>
      </div>
      {recent && recent.list.length > 0 ? (
        <List
          size="small"
          dataSource={recent.list}
          renderItem={(n) => (
            <List.Item style={{ padding: '10px 16px' }}>
              <List.Item.Meta
                title={
                  <Text ellipsis style={{ maxWidth: isMobile ? 200 : 280 }}>
                    {n.title}
                  </Text>
                }
                description={<Text type="secondary">{date(n.sentAt)}</Text>}
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无消息"
          style={{ padding: 24 }}
        />
      )}
      <div
        style={{
          padding: 8,
          textAlign: 'center',
          borderTop: '1px solid #f0f0f0',
        }}
      >
        <Button type="link" size="small" onClick={() => navigate('/notifications')}>
          查看全部
        </Button>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        gap: 12,
      }}
    >
      {!isMobile && (
        <Text strong style={{ fontSize: 16, whiteSpace: 'nowrap' }}>
          {title}
        </Text>
      )}
      <div style={{ flex: 1 }} />

      <Dropdown
        menu={{
          items: [
            { key: 'zh-CN', label: '中文' },
            { key: 'en-US', label: 'English' },
          ],
          selectedKeys: [lang],
          onClick: ({ key }) => setLang(key as 'zh-CN' | 'en-US'),
        }}
      >
        <Space style={{ cursor: 'pointer' }}>
          <GlobalOutlined />
          {!isMobile && <span>{lang === 'zh-CN' ? '中文' : 'English'}</span>}
        </Space>
      </Dropdown>

      <Dropdown
        popupRender={() => notificationDropdown}
        trigger={['click']}
        placement="bottomRight"
      >
        <Badge count={unread?.count ?? 0} size="small">
          <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
        </Badge>
      </Dropdown>

      <Dropdown
        menu={{
          items: [
            {
              key: 'switch',
              icon: <SwapOutlined />,
              label:
                user.role === 'operator' ? '切换到商户端' : '切换到运营端',
              onClick: () => {
                login(user.role === 'operator' ? 'merchant' : 'operator');
                navigate('/dashboard');
              },
            },
            { type: 'divider' },
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: '退出登录',
              onClick: () => {
                logout();
                navigate('/login');
              },
            },
          ],
        }}
      >
        <Space style={{ cursor: 'pointer' }}>
          <Avatar size="small" icon={<UserOutlined />} />
          {!isMobile && (
            <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.email}
            </span>
          )}
          <DownOutlined style={{ fontSize: 10 }} />
        </Space>
      </Dropdown>
    </div>
  );
}
