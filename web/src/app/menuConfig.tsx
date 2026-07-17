import type { ReactNode } from 'react';
import {
  DashboardOutlined,
  ShopOutlined,
  FileAddOutlined,
  AppstoreOutlined,
  SwapOutlined,
  WalletOutlined,
  BellOutlined,
  BarChartOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { Role } from '@/types';

export interface MenuNode {
  key: string;
  label: string;
  icon?: ReactNode;
  path?: string;
  children?: MenuNode[];
  roles: Role[];
}

const ALL: Role[] = ['operator', 'merchant'];

export const MENU: MenuNode[] = [
  {
    key: 'dashboard',
    label: '仪表盘',
    icon: <DashboardOutlined />,
    path: '/dashboard',
    roles: ALL,
  },
  {
    key: 'merchants',
    label: '商户管理',
    icon: <ShopOutlined />,
    path: '/merchants',
    roles: ['operator'],
  },
  {
    key: 'applications',
    label: '开户管理',
    icon: <FileAddOutlined />,
    path: '/applications',
    roles: ALL,
  },
  {
    key: 'accounts',
    label: '账户管理',
    icon: <AppstoreOutlined />,
    path: '/accounts',
    roles: ALL,
  },
  {
    key: 'rebind',
    label: '换绑记录',
    icon: <SwapOutlined />,
    path: '/rebind',
    roles: ['operator'],
  },
  {
    key: 'assets',
    label: '资产管理',
    icon: <WalletOutlined />,
    roles: ALL,
    children: [
      { key: 'assets-recharge', label: '充值订单', path: '/assets/recharge', roles: ALL },
      { key: 'assets-withdraw', label: '提款订单', path: '/assets/withdraw', roles: ALL },
      {
        key: 'assets-wallet',
        label: '钱包账变记录',
        path: '/assets/wallet-ledger',
        roles: ALL,
      },
      {
        key: 'assets-reserve',
        label: '备用金账变记录',
        path: '/assets/reserve-ledger',
        roles: ALL,
      },
    ],
  },
  {
    key: 'notifications',
    label: '消息通知',
    icon: <BellOutlined />,
    path: '/notifications',
    roles: ALL,
  },
  {
    key: 'reports',
    label: '数据报表',
    icon: <BarChartOutlined />,
    path: '/reports',
    roles: ['operator'],
  },
  {
    key: 'tg-groups',
    label: 'tg群组管理',
    icon: <TeamOutlined />,
    path: '/tg-groups',
    roles: ['operator'],
  },
];

export function filterMenuByRole(role: Role): MenuNode[] {
  return MENU.filter((n) => n.roles.includes(role)).map((n) => ({
    ...n,
    children: n.children?.filter((c) => c.roles.includes(role)),
  }));
}

/** 通过路径找到对应的菜单 key 与父级 key（用于高亮/展开） */
export function findMenuKeys(pathname: string): { selected: string[]; open: string[] } {
  for (const node of MENU) {
    if (node.path && pathname.startsWith(node.path)) {
      return { selected: [node.key], open: [] };
    }
    if (node.children) {
      for (const child of node.children) {
        if (child.path && pathname.startsWith(child.path)) {
          return { selected: [child.key], open: [node.key] };
        }
      }
    }
  }
  return { selected: ['dashboard'], open: [] };
}
