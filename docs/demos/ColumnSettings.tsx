import { createColumnHelper, tableFeatures, useTable, columnOrderingFeature, columnPinningFeature, columnResizingFeature, columnSizingFeature, columnVisibilityFeature } from '@tanstack/react-table';
import { ApexTable } from '@';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * 列设置集中展示显隐、调序、固定和宽度调整，名称列不可隐藏。
 * 本示例独立声明数据、列和所需特性，源码引用统一使用 @。
 */
const features = tableFeatures({ columnOrderingFeature, columnPinningFeature, columnResizingFeature, columnSizingFeature, columnVisibilityFeature });
type Item = { id: string; name: string; stock: number };
const data: Item[] = [
  { id: 'cup', name: '陶瓷杯', stock: 36 },
  { id: 'cloth', name: '亚麻桌布', stock: 12 },
  { id: 'vase', name: '玻璃花瓶', stock: 24 },
];
const helper = createColumnHelper<typeof features, Item>();
const columns = helper.columns([
  helper.accessor('id', { header: '编号', size: 120 }),
  helper.accessor('name', { header: '物品名称', size: 240, enableHiding: false }),
  helper.accessor('stock', { header: '库存', size: 160 }),
]);
export default function ColumnSettings() {
  const table = useTable({
    features, data, columns,
    defaultColumn: { minSize: 80, maxSize: 400 },
    initialState: { columnPinning: { start: ['name'], end: [] } },
  }, () => null);
  return <ApexTable table={table} height={300} columnSettingsEnabled />;
}
