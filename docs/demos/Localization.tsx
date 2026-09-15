import { createColumnHelper, tableFeatures, useTable, rowSelectionFeature } from '@tanstack/react-table';
import { ApexTable } from '@';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * 只覆盖当前选择场景的内置文案，未提供的文案自动回退为简体中文。
 * 本示例独立声明数据、列和所需特性，源码引用统一使用 @。
 */
const features = tableFeatures({ rowSelectionFeature });
type Item = { id: string; name: string; stock: number };
const data: Item[] = [
  { id: 'cup', name: 'Ceramic cup', stock: 36 },
  { id: 'cloth', name: 'Linen tablecloth', stock: 12 },
  { id: 'vase', name: 'Glass vase', stock: 24 },
];
const helper = createColumnHelper<typeof features, Item>();
const columns = helper.columns([
  helper.accessor('name', { header: 'Product' }),
  helper.accessor('stock', { header: 'Stock' }),
]);
export default function Localization() {
  const table = useTable({ features, data, columns, getRowId: (row) => row.id }, () => null);
  return <ApexTable table={table} height={290} showSelectionColumn name="Inventory" locale={{
    selectResults: 'Select all results',
    selectRow: (id) => `Select row ${id}`,
    selected: (count) => `${count} selected`,
    clearSelection: 'Clear selection',
    density: 'Density',
    compact: 'Compact',
    standard: 'Standard',
    comfortable: 'Comfortable',
  }} />;
}
