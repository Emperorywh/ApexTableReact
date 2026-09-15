import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { ApexTable } from '@';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * 最小本地渲染只需要静态数据、两列和一个原生表格实例。
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
export default function Basic() {
  const table = useTable({ features, data, columns }, () => null);
  return <ApexTable table={table} height={260} />;
}
