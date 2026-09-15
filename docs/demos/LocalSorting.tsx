import { createColumnHelper, tableFeatures, useTable, rowSortingFeature, createSortedRowModel, sortFn_basic } from '@tanstack/react-table';
import { ApexTable } from '@';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * 点击库存表头切换排序方向，排序行模型负责重排本地数据。
 * 本示例独立声明数据、列和所需特性，源码引用统一使用 @。
 */
const features = tableFeatures({ rowSortingFeature, sortedRowModel: createSortedRowModel() });
type Item = { id: string; name: string; stock: number };
const data: Item[] = [
  { id: 'cup', name: '陶瓷杯', stock: 36 },
  { id: 'cloth', name: '亚麻桌布', stock: 12 },
  { id: 'vase', name: '玻璃花瓶', stock: 24 },
];
const helper = createColumnHelper<typeof features, Item>();
const columns = helper.columns([
  helper.accessor('name', { header: '物品名称', enableSorting: false }),
  helper.accessor('stock', { header: '库存', sortFn: sortFn_basic }),
]);
export default function LocalSorting() {
  const table = useTable({ features, data, columns, enableMultiSort: false, sortDescFirst: false }, () => null);
  return <ApexTable table={table} height={260} />;
}
