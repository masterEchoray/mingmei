import { useAuthStore } from '@/store/auth';
import { OperatorNotifications } from './OperatorNotifications';
import { MerchantInbox } from './MerchantInbox';

export default function NotificationsPage() {
  const user = useAuthStore((s) => s.user)!;
  return user.role === 'operator' ? <OperatorNotifications /> : <MerchantInbox />;
}
