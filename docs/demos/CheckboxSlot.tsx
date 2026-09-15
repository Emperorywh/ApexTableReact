import { memo, useLayoutEffect, useRef } from 'react';
import { ApexTableReact } from 'apex-table-react';
import type { ApexColumnDef } from 'apex-table-react';
import type { ComponentProps } from 'react';
import type { ApexTableSlots } from 'apex-table-react';

/*
 * 复选框插槽把原生 DOM 属性与引用转发到真实 input，并同步半选状态。
 * 本示例直接传入列、数据和功能 props，组件自动管理实例并加载样式。
 */
type Item = { id: string; name: string; stock: number };
const data: Item[] = [
  { id: 'cup', name: '陶瓷杯', stock: 36 },
  { id: 'cloth', name: '亚麻桌布', stock: 12 },
  { id: 'vase', name: '玻璃花瓶', stock: 24 },
];
const columns: ApexColumnDef<Item>[] = [
  { accessorKey: 'name', header: '物品名称' },
  { accessorKey: 'stock', header: '库存' },
];
/*
 * 半选状态需要赋给 DOM 属性，不能作为普通 HTML 属性传入。
 * ref 回调保留 React 的清理返回值，兼容组件提供的引用生命周期。
 */
const Checkbox = memo(function Checkbox({ controlProps }: ComponentProps<ApexTableSlots<Item>['checkbox']>) {
  const input = useRef<HTMLInputElement | null>(null);
  const { indeterminate, ref, ...props } = controlProps;
  useLayoutEffect(() => { if (input.current) input.current.indeterminate = indeterminate; }, [indeterminate]);
  return <input {...props} style={{ accentColor: '#ad4f22' }} ref={(node) => {
    input.current = node;
    if (typeof ref === 'function') return ref(node);
    if (ref) ref.current = node;
  }} />;
});
const slots: Partial<ApexTableSlots<Item>> = { checkbox: Checkbox };
export default function CheckboxSlot() {
  return <ApexTableReact columns={columns} data={data} getRowId={(row) => row.id} height={290} showSelectionColumn slots={slots} />;
}
