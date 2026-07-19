import { Card, Col, Row, Button, Typography, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/PageHeader';

const { Paragraph } = Typography;

interface PlatformCard {
  platform: string;
  color: string;
  slogans: string[];
  /** 是否可点击进入开户流程；第一期仅 Meta 可用，其余仅展示 */
  actionable: boolean;
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
    actionable: true,
  },
  {
    platform: 'Google',
    color: '#ea4335',
    slogans: [
      'Ad Spot 跨境客户专享，免费获取 Buy On Google 或 Free Listings 流量',
      'Google & Ad Spot 跨境，电商孵化春田计划',
      '官方绿色通道，GMC 快速解封',
    ],
    actionable: false,
  },
  {
    platform: 'TikTok',
    color: '#000000',
    slogans: [
      'TikTok 新手卖家成长计划，绿色通道极速开户',
      'TikTok 联合 Ad Spot 跨境，赋能品牌出海',
      'TikTok 官方针对性服务，制定专属营销计划',
    ],
    actionable: false,
  },
];

export function MerchantWelcome() {
  const user = useAuthStore((s) => s.user)!;
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <PageHeader
        title={`欢迎回来，${user.name}`}
        subtitle="轻松管理您的投放账户资产"
      />
      <Row gutter={[16, 16]}>
        {CARDS.map((c) => (
          <Col key={c.platform} xs={24} sm={24} md={8}>
            <Card
              styles={{ body: { minHeight: 260, display: 'flex', flexDirection: 'column' } }}
              title={
                <span>
                  <Tag color={c.color}>{c.platform}</Tag> 开户
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
                onClick={() => {
                  if (c.actionable) {
                    navigate('/applications?open=1');
                  }
                }}
              >
                即刻申请开户
              </Button>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
