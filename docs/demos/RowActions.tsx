import { useMemo, useState } from 'react';
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { ApexTable } from '@';
import { ApexMenu } from '@';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * 操作列使用原生行数据创建菜单，独立按钮不会连带触发行点击。
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
export default function RowActions() {
  const [notice, setNotice] = useState('点击行查看物品，或在操作菜单中选择编辑。');
  const actionColumns = useMemo(() => helper.columns([
    ...columns,
    helper.display({ id: 'actions', header: '操作', cell: ({ row }) => <ApexMenu items={[
      { id: 'edit', label: '编辑', onSelect: () => setNotice(`编辑：${row.original.name}`) },
    ]} /> }),
  ]), []);
  const table = useTable({ features, data, columns: actionColumns }, () => null);
  return <div>
    <ApexTable table={table} height={260} onRowClick={(row) => setNotice(`查看：${row.original.name}`)} />
    <p role="status">{notice}</p>
  </div>;
}
