import { useState } from 'react';
import { Card, List, Tag, Typography, Button, App, Empty, Pagination } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { notificationApi } from '@/services';
import { dateTime } from '@/utils/format';

const { Paragraph, Text } = Typography;

export function MerchantInbox() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'merchant', page],
    queryFn: () => notificationApi.list({ role: 'merchant', page, pageSize }),
  });

  const readAll = useMutation({
    mutationFn: () => notificationApi.readAll(),
    onSuccess: () => {
      message.success('已全部标为已读');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  return (
    <div className="page-container">
      <PageHeader
        title="消息通知"
        subtitle="您的站内信收件箱"
        extra={
          <Button onClick={() => readAll.mutate()} loading={readAll.isPending}>
            全部已读
          </Button>
        }
      />
      <Card styles={{ body: { padding: 12 } }}>
        {!isLoading && (data?.list.length ?? 0) === 0 ? (
          <Empty description="暂无消息" style={{ padding: 40 }} />
        ) : (
          <>
            <List
              loading={isLoading}
              itemLayout="vertical"
              dataSource={data?.list ?? []}
              renderItem={(n) => (
                <List.Item
                  key={n.id}
                  extra={<Text type="secondary">{dateTime(n.sentAt)}</Text>}
                >
                  <List.Item.Meta
                    title={
                      <span>
                        {!n.read && <Tag color="red">未读</Tag>}
                        {n.title}
                      </span>
                    }
                  />
                  <Paragraph style={{ marginBottom: 0 }}>{n.content}</Paragraph>
                </List.Item>
              )}
            />
            <div style={{ textAlign: 'right', marginTop: 12 }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={data?.total ?? 0}
                onChange={setPage}
                showSizeChanger={false}
                simple
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
