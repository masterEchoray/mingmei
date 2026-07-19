import { Typography, Divider } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services';
import { PageHeader } from '@/components/PageHeader';
import {
  PlatformStatCards,
  MerchantStatCards,
  PeriodStatCards,
  FundStatCards,
} from './StatCards';

const { Title } = Typography;

export function OperatorDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'operator'],
    queryFn: () => dashboardApi.getOperator(),
  });

  return (
    <div className="page-container">
      <PageHeader title="运营总览" subtitle="全平台账户、商户与资金聚合数据" />

      <Title level={5}>账户数据（Meta / TikTok / Google）</Title>
      <PlatformStatCards stats={data?.platformStats} loading={isLoading} />

      <Divider />

      <Title level={5}>商户数据</Title>
      <MerchantStatCards stat={data?.merchantStat} loading={isLoading} />

      <Divider />

      <Title level={5}>消耗数据（全商户）</Title>
      <PeriodStatCards
        stat={data?.consumeStat}
        labelPrefix="总商户消耗"
        loading={isLoading}
      />

      <Divider />

      <Title level={5}>充值数据（全商户）</Title>
      <PeriodStatCards
        stat={data?.rechargeStat}
        labelPrefix="总商户充值"
        loading={isLoading}
      />

      <Divider />

      <Title level={5}>资金数据</Title>
      <FundStatCards stat={data?.fundStat} loading={isLoading} />
    </div>
  );
}
