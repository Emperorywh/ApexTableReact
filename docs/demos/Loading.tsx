import { useState } from 'react';
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { ApexTable } from '@';
import './demo.css';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * 加载开关控制骨架状态，加载期间表格暂时隐藏原有数据行。
 * 本示例独立声明数据、列和所需特性，源码引用统一使用 @。
 */
const features = tableFeatures({  });
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
export default function Loading() {
  const [loading, setLoading] = useState(true);
  const table = useTable({ features, data, columns }, () => null);
  return <div className="apex-demo">
    <div className="apex-demo-query"><label><input type="checkbox" checked={loading} onChange={(event) => setLoading(event.currentTarget.checked)} />加载中</label></div>
    <ApexTable table={table} height={260} loading={loading} />
  </div>;
}
