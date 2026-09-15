import { useState } from 'react';
import { createColumnHelper, createPaginatedRowModel, rowPaginationFeature, tableFeatures, useTable } from '@tanstack/react-table';
import { ApexTable } from '../../src';
import { defaultColumn, localFeatures } from './model';
import './demo.css';
import '../../src/styles/structure.css';
import '../../src/styles/theme.css';

/*
 * 本地分页显式注册原生分页行模型，过滤和排序先处理完整数据。
 * 改动搜索时业务同步清空选择、回到首屏，不为核心增加数据模式协议。
 */
const features = tableFeatures({ ...localFeatures, rowPaginationFeature, paginatedRowModel: createPaginatedRowModel() });
type Item = { id: string; name: string; stock: number };
const helper = createColumnHelper<typeof features, Item>();
const columns = helper.columns([helper.accessor('name', { header: '物品名称', cell: (cell) => cell.getValue() }), helper.accessor('stock', { header: '库存', cell: (cell) => cell.getValue().toLocaleString() })]);
const data: Item[] = Array.from({ length: 238 }, (_, index) => ({ id: `local-${index}`, name: `${index % 2 ? '瓷器' : '木器'} ${String(index + 1).padStart(3, '0')}`, stock: 238 - index }));
export default function LocalPagination() {
  const [search, setSearch] = useState('');
  const table = useTable({ features, columns, data, defaultColumn, getRowId: (row) => row.id, enableMultiSort: false, sortDescFirst: false, autoResetPageIndex: true, initialState: { pagination: { pageIndex: 0, pageSize: 20 } } }, () => null);
  return <div className="apex-demo"><form className="apex-demo-query" onSubmit={(event) => { event.preventDefault(); table.setColumnFilters(search.trim() ? [{ id: 'name', value: [{ operator: 'contains', value: search.trim() }] }] : []); table.resetRowSelection(true); table.setPageIndex(0); }}><label>本地物品搜索<input value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="瓷器或木器" /></label><button type="submit">筛选完整数据</button></form><ApexTable table={table} height={420} showSelectionColumn showRowNumber name="本地分页列表" /></div>;
}
