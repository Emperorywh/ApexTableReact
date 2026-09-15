import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { ApexTable } from '@';
import type { ApexSlots } from '@';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * 仅替换工具栏插槽，并转发 rootProps 和 children 以保留内置控件。
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
/*
 * 插槽定义放在组件外，保持组件类型稳定，避免父级更新时卸载控件。
 * 保留 children，后续启用表格内置工具时仍能显示对应内容。
 */
const slots: Partial<ApexSlots<typeof features, Item, null>> = {
  toolbar: ({ rootProps, children }) => <div {...rootProps}><strong>工作室库存</strong>{children}</div>,
};
export default function AdvancedSlots() {
  const table = useTable({ features, data, columns }, () => null);
  return <ApexTable table={table} height={280} slots={slots} />;
}

