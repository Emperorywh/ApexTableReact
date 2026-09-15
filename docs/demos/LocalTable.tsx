import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { ApexTable } from '@';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * 一万行本地数据只演示虚拟滚动，表体按可视区域挂载数据行。
 * 本示例独立声明数据、列和所需特性，源码引用统一使用 @。
 */
const features = tableFeatures({  });
type Item = { id: string; name: string; stock: number };
const data: Item[] = Array.from({ length: 10000 }, (_, index) => ({ id: `item-${index + 1}`, name: `物品 ${index + 1}`, stock: index % 100 }));
const helper = createColumnHelper<typeof features, Item>();
const columns = helper.columns([
  helper.accessor('name', { header: '物品名称' }),
  helper.accessor('stock', { header: '库存' }),
]);
export default function LocalTable() {
  const table = useTable({ features, data, columns, getRowId: (row) => row.id }, () => null);
  return <ApexTable table={table} height={420} showRowNumber virtualization={{ overscan: 8 }} />;
}
