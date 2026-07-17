import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { RequireAuth } from './RequireAuth';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import MerchantsPage from '@/pages/merchants/MerchantsPage';
import ApplicationsPage from '@/pages/applications/ApplicationsPage';
import AccountsPage from '@/pages/accounts/AccountsPage';
import RebindPage from '@/pages/rebind/RebindPage';
import NotificationsPage from '@/pages/notifications/NotificationsPage';
import {
  RechargeOrdersPage,
  WithdrawOrdersPage,
  WalletLedgerPage,
  ReserveLedgerPage,
} from '@/pages/assets/AssetPages';
import { ReportsPage, TgGroupsPage } from '@/pages/placeholder/PlaceholderPages';
import NotFoundPage from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      {
        path: 'merchants',
        element: (
          <RequireAuth roles={['operator']}>
            <MerchantsPage />
          </RequireAuth>
        ),
      },
      { path: 'applications', element: <ApplicationsPage /> },
      { path: 'accounts', element: <AccountsPage /> },
      {
        path: 'rebind',
        element: (
          <RequireAuth roles={['operator']}>
            <RebindPage />
          </RequireAuth>
        ),
      },
      { path: 'assets/recharge', element: <RechargeOrdersPage /> },
      { path: 'assets/withdraw', element: <WithdrawOrdersPage /> },
      { path: 'assets/wallet-ledger', element: <WalletLedgerPage /> },
      { path: 'assets/reserve-ledger', element: <ReserveLedgerPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      {
        path: 'reports',
        element: (
          <RequireAuth roles={['operator']}>
            <ReportsPage />
          </RequireAuth>
        ),
      },
      {
        path: 'tg-groups',
        element: (
          <RequireAuth roles={['operator']}>
            <TgGroupsPage />
          </RequireAuth>
        ),
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
