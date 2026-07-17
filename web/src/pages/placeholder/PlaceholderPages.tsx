import { Card, Empty } from 'antd';
import { PageHeader } from '@/components/PageHeader';

function Placeholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="page-container">
      <PageHeader title={title} subtitle={subtitle} />
      <Card>
        <Empty
          description={`${title}模块规划中，敬请期待（原型未定义具体内容）`}
          style={{ padding: 60 }}
        />
      </Card>
    </div>
  );
}

export function ReportsPage() {
  return <Placeholder title="数据报表" subtitle="多维度经营数据报表" />;
}

export function TgGroupsPage() {
  return <Placeholder title="tg群组管理" subtitle="Telegram 群组通知与管理" />;
}
