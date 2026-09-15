import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { ApexTable } from '@';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * 空数组会显示默认空态，无需额外注册特性或传递状态参数。
 * 本示例独立声明数据、列和所需特性，源码引用统一使用 @。
 */
const features = tableFeatures({  });
type Item = { name: string; stock: number };
const data: Item[] = [];
const helper = createColumnHelper<typeof features, Item>();
const columns = helper.columns([
  helper.accessor('name', { header: '物品名称' }),
  helper.accessor('stock', { header: '库存' }),
]);
export default function Empty() {
  const table = useTable({ features, data, columns }, () => null);
  return <ApexTable table={table} height={260} />;
}
