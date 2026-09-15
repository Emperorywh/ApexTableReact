import { useEffect, useState } from 'react';
import { createColumnHelper, tableFeatures, useTable, rowPaginationFeature } from '@tanstack/react-table';
import { ApexTable } from '@';
import type { PaginationState } from '@tanstack/react-table';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * 服务端分页只注册分页状态，模拟接口负责截取当前页并返回准确总数。
 * 本示例独立声明数据、列和所需特性，源码引用统一使用 @。
 */
const features = tableFeatures({ rowPaginationFeature });
type Item = { id: string; name: string; stock: number };
const inventory: Item[] = Array.from({ length: 53 }, (_, index) => ({ id: String(index), name: `商品 ${index + 1}`, stock: 100 - index }));
const helper = createColumnHelper<typeof features, Item>();
const columns = helper.columns([
  helper.accessor('name', { header: '物品名称' }),
  helper.accessor('stock', { header: '库存' }),
]);
export default function ProductTable() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const [result, setResult] = useState<{ data: Item[]; rowCount: number; query: PaginationState | null }>({ data: [], rowCount: 0, query: null });
  const loading = result.query !== pagination;
  /*
   * 定时器模拟接口延迟；分页变化或组件卸载时取消旧任务。
   * 当前页数据与总数一起提交，用查询引用确保切页时立即显示加载态。
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const start = pagination.pageIndex * pagination.pageSize;
      setResult({ data: inventory.slice(start, start + pagination.pageSize), rowCount: inventory.length, query: pagination });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [pagination]);
  const table = useTable({
    features, columns, data: result.data, rowCount: result.rowCount,
    getRowId: (row) => row.id, manualPagination: true,
    state: { pagination }, onPaginationChange: setPagination,
  }, () => null);
  return <ApexTable table={table} height={380} loading={loading} pagination={{ pageSizeOptions: [5, 10, 20] }} />;
}
