import { createColumnHelper, tableFeatures, useTable, rowSelectionFeature } from '@tanstack/react-table';
import { ApexTable } from '@';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * 稳定的行 ID 用于保存选择，表头复选框操作当前本地结果。
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
export default function RowSelection() {
  const table = useTable({ features, data, columns, getRowId: (row) => row.id }, () => null);
  return <ApexTable table={table} height={290} showSelectionColumn />;
}
