import { Typography, Divider } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/PageHeader';
import { PlatformStatCards, ConsumeStatCards } from './StatCards';

const { Title } = Typography;

export function MerchantDashboard() {
  const user = useAuthStore((s) => s.user)!;
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'merchant', user.merchantId],
    queryFn: () => dashboardApi.get('merchant', user.merchantId),
  });

  return (
    <div className="page-container">
      <PageHeader
        title={`欢迎回来，${user.name}`}
        subtitle="轻松管理您的投放账户资产"
      />

      <Title level={5}>账户数据</Title>
      <PlatformStatCards stats={data?.platformStats} loading={isLoading} />

      <Divider />

      <Title level={5}>消耗与充值数据</Title>
      <ConsumeStatCards stat={data?.consumeStat} loading={isLoading} />
    </div>
  );
}
