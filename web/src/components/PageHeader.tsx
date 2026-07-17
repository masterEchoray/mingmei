import type { ReactNode } from 'react';
import { Typography } from 'antd';

const { Title, Text } = Typography;

export function PageHeader({
  title,
  subtitle,
  extra,
}: {
  title: string;
  subtitle?: string;
  extra?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
      }}
    >
      <div>
        <Title level={4} style={{ margin: 0 }}>
          {title}
        </Title>
        {subtitle && <Text type="secondary">{subtitle}</Text>}
      </div>
      {extra && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{extra}</div>}
    </div>
  );
}
