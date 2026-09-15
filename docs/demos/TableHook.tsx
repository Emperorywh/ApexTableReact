import { createTableHook, tableFeatures } from '@tanstack/react-table';
import { ApexTable } from '@';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * createTableHook 在模块作用域定义项目自己的表格 Hook。
 * 生成的原生实例直接传给 ApexTable，无需额外适配。
 */
const { useAppTable } = createTableHook({ features: tableFeatures({}) });
const data = [{ name: '陶瓷杯', stock: 36 }, { name: '亚麻桌布', stock: 12 }];
const columns = [{ accessorKey: 'name', header: '物品名称' }, { accessorKey: 'stock', header: '库存' }];
export default function TableHook() {
  const table = useAppTable({ data, columns }, () => null);
  return <ApexTable table={table} height={230} />;
}
