import { useState } from 'react';
import { createColumnHelper, tableFeatures, useTable, rowSelectionFeature } from '@tanstack/react-table';
import { ApexTable } from '@';
import type { RowSelectionState } from '@tanstack/react-table';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * React state 是选择状态的所有者，原生 updater 直接交给状态 setter。
 * 本示例独立声明数据、列和所需特性，源码引用统一使用 @。
 */
const features = tableFeatures({ rowSelectionFeature });
type Item = { id: string; name: string; stock: number };
const data: Item[] = [
  { id: 'cup', name: '陶瓷杯', stock: 36 },
  { id: 'cloth', name: '亚麻桌布', stock: 12 },
  { id: 'vase', name: '玻璃花瓶', stock: 24 },
];
const helper = createColumnHelper<typeof features, Item>();
const columns = helper.columns([
  helper.accessor('name', { header: '物品名称' }),
  helper.accessor('stock', { header: '库存' }),
]);
export default function ControlledSelection() {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({ cup: true });
  const table = useTable({
    features, data, columns, getRowId: (row) => row.id,
    state: { rowSelection }, onRowSelectionChange: setRowSelection,
  }, () => null);
  return <div>
    <ApexTable table={table} height={290} showSelectionColumn />
    <p role="status">已选 ID：{Object.keys(rowSelection).filter((id) => rowSelection[id]).join('、') || '无'}</p>
  </div>;
}
