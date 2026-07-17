import { Card, Col, Row, Statistic, Tag, Spin } from 'antd';
import type { ConsumeStat, PlatformAccountStat, Platform } from '@/types';
import { money } from '@/utils/format';

const platformColor: Record<Platform, string> = {
  Meta: '#1877f2',
  TikTok: '#000000',
  Google: '#ea4335',
};

export function PlatformStatCards({
  stats,
  loading,
}: {
  stats?: PlatformAccountStat[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin />
      </div>
    );
  }
  return (
    <Row gutter={[16, 16]}>
      {stats?.map((s) => (
        <Col key={s.platform} xs={24} sm={24} md={8}>
          <Card
            title={
              <span>
                <Tag color={platformColor[s.platform]}>{s.platform}</Tag>
                账户数据
              </span>
            }
            size="small"
          >
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Statistic title="进行中开户" value={s.applyingCount} />
              </Col>
              <Col span={12}>
                <Statistic
                  title="今日申请批数"
                  value={s.todayApplyBatch}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic title="活跃账号" value={s.activeCount} />
              </Col>
              <Col span={12}>
                <Statistic
                  title="今日新增活跃"
                  value={s.todayNewActive}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={12}>
                <Statistic title="空账号(3日无消耗)" value={s.emptyCount} />
              </Col>
              <Col span={12}>
                <Statistic title="今日新增空号" value={s.todayNewEmpty} />
              </Col>
              <Col span={12}>
                <Statistic
                  title="封禁账号"
                  value={s.bannedCount}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="今日封禁"
                  value={s.todayBanned}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export function ConsumeStatCards({
  stat,
  loading,
}: {
  stat?: ConsumeStat;
  loading?: boolean;
}) {
  if (loading || !stat) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin />
      </div>
    );
  }
  const items: { title: string; value: number; color?: string }[] = [
    { title: '今日总消耗', value: stat.todayConsume, color: '#1890ff' },
    { title: '昨日总消耗', value: stat.yesterdayConsume },
    { title: '本月总消耗', value: stat.monthConsume },
    { title: '累计总消耗', value: stat.totalConsume },
    { title: '当前账户内总余额', value: stat.currentAccountBalance, color: '#3f8600' },
    { title: '当前备用金总余额', value: stat.currentReserveBalance, color: '#3f8600' },
    { title: '本月累计充值', value: stat.monthRecharge },
    { title: '历史累计充值', value: stat.totalRecharge },
  ];
  return (
    <Row gutter={[16, 16]}>
      {items.map((it) => (
        <Col key={it.title} xs={12} sm={12} md={6}>
          <Card size="small">
            <Statistic
              title={it.title}
              value={money(it.value)}
              valueStyle={{ fontSize: 20, color: it.color }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
