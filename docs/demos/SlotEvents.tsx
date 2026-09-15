import { useState } from 'react';
import { createColumnHelper, tableFeatures, useTable, rowSelectionFeature } from '@tanstack/react-table';
import { ApexTable } from '@';
import './demo.css';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * slotProps 在原有控件上补充业务事件，preventDefault 可以取消本次选择。
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
export default function SlotEvents() {
  const [locked, setLocked] = useState(false);
  const table = useTable({ features, data, columns, getRowId: (row) => row.id }, () => null);
  return <div className="apex-demo">
    <div className="apex-demo-query"><label><input type="checkbox" checked={locked} onChange={(event) => setLocked(event.currentTarget.checked)} />禁止修改选择</label></div>
    <ApexTable table={table} height={290} showSelectionColumn slotProps={{
      checkbox: { controlProps: { onChange: (event) => { if (locked) event.preventDefault(); } } },
    }} />
  </div>;
}
