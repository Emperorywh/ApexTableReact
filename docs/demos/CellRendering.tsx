import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { ApexTable } from '@';
import './demo.css';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * 列的 cell 回调直接读取原生值，分别展示货币格式和库存标签。
 * 本示例独立声明数据、列和所需特性，源码引用统一使用 @。
 */
const features = tableFeatures({  });
type Item = { id: string; name: string; price: number; stock: number };
const data: Item[] = [
  { id: 'cup', name: '陶瓷杯', price: 39.9, stock: 36 },
  { id: 'cloth', name: '亚麻桌布', price: 89, stock: 0 },
  { id: 'vase', name: '玻璃花瓶', price: 59, stock: 24 },
];
const helper = createColumnHelper<typeof features, Item>();
const columns = helper.columns([
  helper.accessor('name', { header: '物品名称' }),
  helper.accessor('price', { header: '售价', cell: (cell) => `¥ ${cell.getValue().toFixed(2)}` }),
  helper.accessor('stock', { header: '库存状态', cell: (cell) => <span className="apex-demo-status" data-active={cell.getValue() > 0}>{cell.getValue() > 0 ? '有货' : '缺货'}</span> }),
]);
export default function CellRendering() {
  const table = useTable({ features, data, columns }, () => null);
  return <ApexTable table={table} height={260} />;
}
