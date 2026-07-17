import { Table, Card, Empty, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { TablePaginationConfig } from 'antd/es/table';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveTableProps<T> {
  columns: ColumnsType<T>;
  dataSource: T[];
  rowKey: string;
  loading?: boolean;
  pagination?: TablePaginationConfig | false;
  /** 移动端卡片主标题字段渲染 */
  mobileTitle?: (record: T) => React.ReactNode;
  scrollX?: number;
}

/**
 * 桌面/平板渲染标准表格（窄屏横向滚动），
 * 手机渲染卡片列表，保证全端自适应。
 */
export function ResponsiveTable<T extends object>({
  columns,
  dataSource,
  rowKey,
  loading,
  pagination,
  mobileTitle,
  scrollX = 1000,
}: ResponsiveTableProps<T>) {
  const { isMobile } = useResponsive();

  if (isMobile) {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      );
    }
    if (!dataSource.length) {
      return <Empty description="暂无数据" style={{ padding: 40 }} />;
    }
    return (
      <div className="mobile-card-list">
        {dataSource.map((record) => {
          const key = String((record as Record<string, unknown>)[rowKey]);
          return (
            <Card key={key} size="small">
              {mobileTitle && (
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  {mobileTitle(record)}
                </div>
              )}
              {columns
                .filter((c) => 'title' in c && c.title)
                .map((col, i) => {
                  const colAny = col as {
                    title?: React.ReactNode;
                    dataIndex?: string;
                    render?: (value: unknown, record: T, index: number) => React.ReactNode;
                  };
                  const value = colAny.dataIndex
                    ? (record as Record<string, unknown>)[colAny.dataIndex]
                    : undefined;
                  const content = colAny.render
                    ? colAny.render(value, record, i)
                    : (value as React.ReactNode);
                  return (
                    <div className="mobile-card-row" key={i}>
                      <span className="label">{colAny.title as React.ReactNode}</span>
                      <span className="value">{content ?? '-'}</span>
                    </div>
                  );
                })}
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="responsive-table">
      <Table<T>
        columns={columns}
        dataSource={dataSource}
        rowKey={rowKey}
        loading={loading}
        pagination={pagination}
        scroll={{ x: scrollX }}
        size="middle"
      />
    </div>
  );
}
