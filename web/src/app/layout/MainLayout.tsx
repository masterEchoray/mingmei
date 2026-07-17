import { useMemo, useState } from 'react';
import { Layout, Menu, Drawer, Grid } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { filterMenuByRole, findMenuKeys, type MenuNode } from '../menuConfig';
import { HeaderBar } from './HeaderBar';
import { useResponsive } from '@/hooks/useResponsive';

const { Sider, Header, Content } = Layout;

function toAntdItems(nodes: MenuNode[]) {
  return nodes.map((n) => ({
    key: n.key,
    icon: n.icon,
    label: n.label,
    children: n.children?.map((c) => ({ key: c.key, label: c.label })),
  }));
}

function flatten(nodes: MenuNode[]): MenuNode[] {
  return nodes.flatMap((n) => (n.children ? n.children : [n]));
}

export function MainLayout() {
  const user = useAuthStore((s) => s.user)!;
  const location = useLocation();
  const navigate = useNavigate();
  const { isNarrow } = useResponsive();
  const screens = Grid.useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuNodes = useMemo(() => filterMenuByRole(user.role), [user.role]);
  const flatNodes = useMemo(() => flatten(menuNodes), [menuNodes]);
  const { selected, open } = findMenuKeys(location.pathname);
  const [openKeys, setOpenKeys] = useState<string[]>(open);

  const onMenuClick = ({ key }: { key: string }) => {
    const node = flatNodes.find((n) => n.key === key);
    if (node?.path) {
      navigate(node.path);
      setDrawerOpen(false);
    }
  };

  const menu = (
    <Menu
      mode="inline"
      theme="light"
      selectedKeys={selected}
      openKeys={openKeys}
      onOpenChange={setOpenKeys}
      onClick={onMenuClick}
      items={toAntdItems(menuNodes)}
      style={{ borderInlineEnd: 'none' }}
    />
  );

  const logo = (
    <div
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed && !isNarrow ? 'center' : 'flex-start',
        gap: 8,
        padding: collapsed && !isNarrow ? 0 : '0 16px',
        fontWeight: 700,
        fontSize: 15,
        color: '#1890ff',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      <span style={{ fontSize: 20 }}>◆</span>
      {(!collapsed || isNarrow) && <span>海外投放平台</span>}
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isNarrow && (
        <Sider
          theme="light"
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={220}
          style={{
            boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          {logo}
          {menu}
        </Sider>
      )}

      {isNarrow && (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          styles={{ body: { padding: 0 } }}
          width={240}
          title={logo}
        >
          {menu}
        </Drawer>
      )}

      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: screens.xs ? '0 12px' : '0 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          {isNarrow && (
            <MenuOutlined
              style={{ fontSize: 18 }}
              onClick={() => setDrawerOpen(true)}
            />
          )}
          <HeaderBar />
        </Header>
        <Content style={{ overflow: 'initial' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
