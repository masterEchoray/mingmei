import { Card, Col, Row, Button, Typography, Tag, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/PageHeader';

const { Paragraph, Text } = Typography;

interface PlatformCard {
  platform: string;
  color: string;
  slogans: string[];
  enabled: boolean;
}

const CARDS: PlatformCard[] = [
  {
    platform: 'Meta',
    color: '#1877f2',
    slogans: [
      'Ad Spot 跨境客户专享，Facebook 官方广告投放补贴',
      '专属绿色通道，降低账号违规和被封风险',
      'Facebook & Ad Spot 跨境，电商客户雏鹰计划',
    ],
    enabled: true,
  },
  {
    platform: 'Google',
    color: '#ea4335',
    slogans: [
      'Ad Spot 跨境客户专享，免费获取 Buy On Google 或 Free Listings 流量',
      'Google & Ad Spot 跨境，电商孵化春田计划',
      '官方绿色通道，GMC 快速解封',
    ],
    enabled: false,
  },
  {
    platform: 'TikTok',
    color: '#000000',
    slogans: [
      'TikTok 新手卖家成长计划，绿色通道极速开户',
      'TikTok 联合 Ad Spot 跨境，赋能品牌出海',
      'TikTok 官方针对性服务，制定专属营销计划',
    ],
    enabled: false,
  },
];

export function MerchantWelcome() {
  const user = useAuthStore((s) => s.user)!;
  const navigate = useNavigate();
  const { message } = App.useApp();

  return (
    <div className="page-container">
      <PageHeader
        title={`欢迎回来，${user.name}`}
        subtitle="轻松管理您的投放账户资产 · 选择媒体平台开启您的第一个广告账户"
      />
      <Row gutter={[16, 16]}>
        {CARDS.map((c) => (
          <Col key={c.platform} xs={24} sm={24} md={8}>
            <Card
              styles={{ body: { minHeight: 260, display: 'flex', flexDirection: 'column' } }}
              title={
                <span>
                  <Tag color={c.color}>{c.platform}</Tag> 开户
                  {!c.enabled && (
                    <Tag style={{ marginLeft: 8 }} color="default">
                      即将上线
                    </Tag>
                  )}
                </span>
              }
            >
              <div style={{ flex: 1 }}>
                {c.slogans.map((s, i) => (
                  <Paragraph key={i} type="secondary" style={{ marginBottom: 8 }}>
                    · {s}
                  </Paragraph>
                ))}
              </div>
              <Button
                type="primary"
                block
                disabled={!c.enabled}
                onClick={() => {
                  if (c.enabled) {
                    navigate('/applications?open=1');
                  } else {
                    message.info(`${c.platform} 开户第一期仅做展示，敬请期待`);
                  }
                }}
              >
                {c.enabled ? '即刻申请开户' : '敬请期待'}
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
      <Text type="secondary" style={{ display: 'block', marginTop: 16, fontSize: 12 }}>
        说明：Google、TikTok 开户第一期仅做展示，点击暂无实际功能（依据原型批注）。
      </Text>
    </div>
  );
}
