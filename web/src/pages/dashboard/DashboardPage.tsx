import { useAuthStore } from '@/store/auth';
import { OperatorDashboard } from './OperatorDashboard';
import { MerchantDashboard } from './MerchantDashboard';
import { MerchantWelcome } from './MerchantWelcome';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)!;

  if (user.role === 'operator') return <OperatorDashboard />;
  if (user.hasOpenedAccount) return <MerchantDashboard />;
  return <MerchantWelcome />;
}
