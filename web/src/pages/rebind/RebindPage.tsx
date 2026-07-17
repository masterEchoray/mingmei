import { useState } from 'react';
import { Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { assetApi } from '@/services';
import type { RebindRecord } from '@/types';
import { dateTime } from '@/utils/format';

export default function RebindPage() {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['rebind-records', page],
    queryFn: () => assetApi.rebindRecords({ page, pageSize }),
  });

  const columns: ColumnsType<RebindRecord> = [
    { title: '流水号', dataIndex: 'serialNo', width: 160 },
    { title: '商户', dataIndex: 'merchantName', width: 140 },
    { title: '账户ID', dataIndex: 'accountId', width: 160 },
    { title: '原BMID', dataIndex: 'fromBmid', width: 200 },
    { title: '新BMID', dataIndex: 'toBmid', width: 200 },
    { title: '操作人', dataIndex: 'operator', width: 120 },
    {
      title: '换绑时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (v: string) => dateTime(v),
    },
  ];

  return (
    <div className="page-container">
      <PageHeader title="换绑记录" subtitle="账户 BMID 换绑历史记录" />
      <Card styles={{ body: { padding: 12 } }}>
        <ResponsiveTable<RebindRecord>
          rowKey="id"
          columns={columns}
          dataSource={data?.list ?? []}
          loading={isLoading}
          mobileTitle={(r) => r.serialNo}
          pagination={{
            current: page,
            pageSize,
            total: data?.total ?? 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  );
}
