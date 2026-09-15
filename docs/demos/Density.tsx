import { useState } from 'react';
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { ApexTable } from '@';
import type { ApexDensity } from '@';
import './demo.css';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * 密度由 React 状态控制，改变行高时同步更新表格布局。
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
export default function Density() {
  const [density, setDensity] = useState<ApexDensity>('standard');
  const table = useTable({ features, data, columns }, () => null);
  return <div className="apex-demo">
    <div className="apex-demo-query">
      <button type="button" aria-pressed={density === 'compact'} onClick={() => setDensity('compact')}>紧凑</button>
      <button type="button" aria-pressed={density === 'standard'} onClick={() => setDensity('standard')}>标准</button>
      <button type="button" aria-pressed={density === 'comfortable'} onClick={() => setDensity('comfortable')}>宽松</button>
    </div>
    <ApexTable table={table} height={310} density={density} onDensityChange={setDensity} />
  </div>;
}
