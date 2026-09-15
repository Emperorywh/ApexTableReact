import { useState } from 'react';
import { createColumnHelper, tableFeatures, useTable, columnFilteringFeature, createFilteredRowModel } from '@tanstack/react-table';
import { ApexTable } from '@';
import './demo.css';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * 搜索表单只更新名称列的过滤条件，由本地过滤行模型计算结果。
 * 本示例独立声明数据、列和所需特性，源码引用统一使用 @。
 */
const features = tableFeatures({ columnFilteringFeature, filteredRowModel: createFilteredRowModel() });
type Item = { id: string; name: string; stock: number };
const data: Item[] = [
  { id: 'cup', name: '陶瓷杯', stock: 36 },
  { id: 'cloth', name: '亚麻桌布', stock: 12 },
  { id: 'vase', name: '玻璃花瓶', stock: 24 },
];
const helper = createColumnHelper<typeof features, Item>();
const columns = helper.columns([
  helper.accessor('name', { header: '物品名称', filterFn: (row, id, value: string) => row.getValue<string>(id).includes(value) }),
  helper.accessor('stock', { header: '库存' }),
]);
export default function LocalFiltering() {
  const [keyword, setKeyword] = useState('');
  const table = useTable({ features, data, columns }, () => null);
  return <div className="apex-demo">
    <form className="apex-demo-query" onSubmit={(event) => {
      event.preventDefault();
      table.setColumnFilters(keyword.trim() ? [{ id: 'name', value: keyword.trim() }] : []);
    }}>
      <label>物品名称<input value={keyword} onChange={(event) => setKeyword(event.currentTarget.value)} placeholder="输入陶瓷杯" /></label>
      <button type="submit">搜索</button>
      <button type="button" onClick={() => { setKeyword(''); table.resetColumnFilters(true); }}>重置</button>
    </form>
    <ApexTable table={table} height={260} />
  </div>;
}
