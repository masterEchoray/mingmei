import { Typography, Divider } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services';
import { PageHeader } from '@/components/PageHeader';
import { PlatformStatCards, ConsumeStatCards } from './StatCards';

const { Title } = Typography;

export function OperatorDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'operator'],
    queryFn: () => dashboardApi.get('operator'),
  });

  return (
    <div className="page-container">
      <PageHeader title="运营总览" subtitle="全平台账户与资金聚合数据" />

      <Title level={5}>账户数据（全平台）</Title>
      <PlatformStatCards stats={data?.platformStats} loading={isLoading} />

      <Divider />

      <Title level={5}>消耗与充值数据（全商户）</Title>
      <ConsumeStatCards stat={data?.consumeStat} loading={isLoading} />
    </div>
  );
}
