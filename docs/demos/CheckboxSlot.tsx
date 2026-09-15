import { memo, useLayoutEffect, useRef } from 'react';
import { createColumnHelper, tableFeatures, useTable, rowSelectionFeature } from '@tanstack/react-table';
import { ApexTable } from '@';
import type { ComponentProps } from 'react';
import type { ApexSlots } from '@';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * 复选框插槽把原生 DOM 属性与引用转发到真实 input，并同步半选状态。
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
/*
 * 半选状态需要赋给 DOM 属性，不能作为普通 HTML 属性传入。
 * ref 回调保留 React 的清理返回值，兼容组件提供的引用生命周期。
 */
const Checkbox = memo(function Checkbox({ controlProps }: ComponentProps<ApexSlots<typeof features, Item, null>['checkbox']>) {
  const input = useRef<HTMLInputElement | null>(null);
  const { indeterminate, ref, ...props } = controlProps;
  useLayoutEffect(() => { if (input.current) input.current.indeterminate = indeterminate; }, [indeterminate]);
  return <input {...props} style={{ accentColor: '#ad4f22' }} ref={(node) => {
    input.current = node;
    if (typeof ref === 'function') return ref(node);
    if (ref) ref.current = node;
  }} />;
});
const slots: Partial<ApexSlots<typeof features, Item, null>> = { checkbox: Checkbox };
export default function CheckboxSlot() {
  const table = useTable({ features, data, columns, getRowId: (row) => row.id }, () => null);
  return <ApexTable table={table} height={290} showSelectionColumn slots={slots} />;
}
