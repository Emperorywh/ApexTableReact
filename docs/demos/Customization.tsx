import { memo, useLayoutEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { createAtom } from '@tanstack/store';
import { createColumnHelper, createTableHook, rowSelectionFeature, tableFeatures, useTable } from '@tanstack/react-table';
import type { RowSelectionState } from '@tanstack/react-table';
import { ApexTable } from '../../src';
import type { ApexSlots } from '../../src';
import './demo.css';
import '../../src/styles/structure.css';
import '../../src/styles/theme.css';

/*
 * 使用最小特性和外部 atom 验证缩窄 selector 后仍由局部订阅更新。
 * 插槽将 controlProps 放到真实 input，事件取消在调用原生 setter 前生效。
 */
const features = tableFeatures({ rowSelectionFeature });
const helper = createColumnHelper<typeof features, { id: string; name: string; quantity: number }>();
const columns = helper.columns([helper.accessor('name', { header: '物品' }), helper.accessor('quantity', { header: '数量', cell: (cell) => cell.getValue().toFixed(0) })]);
const data = [{ id: 'one', name: '陶瓷杯', quantity: 12 }, { id: 'two', name: '亚麻桌布', quantity: 8 }, { id: 'three', name: '玻璃花瓶', quantity: 4 }];
const { useAppTable } = createTableHook({ features: tableFeatures({}) });
/*
 * 使用 memo 组件及其自己的 Hook，展示插槽遵循 React 组件语义。
 * 控件引用仍落在同一个 input，布局副作用在绘制前同步半选状态。
 */
const CustomCheckbox = memo(function CustomCheckbox({ controlProps }: ComponentProps<ApexSlots<typeof features, typeof data[number], null>['checkbox']>) {
  const input = useRef<HTMLInputElement | null>(null);
  const { indeterminate, ref, ...rest } = controlProps;
  useLayoutEffect(() => { if (input.current) input.current.indeterminate = indeterminate; }, [indeterminate]);
  return <input {...rest} ref={(node) => { input.current = node; if (typeof ref === 'function') return ref(node); if (ref) ref.current = node; }} />;
});
const slots: Partial<ApexSlots<typeof features, typeof data[number], null>> = {
  checkbox: CustomCheckbox,
  toolbar: ({ rootProps, children }) => <div {...rootProps}><strong>工作室库存</strong>{children}</div>,
};
export default function Customization() {
  const [rowSelection] = useState(() => createAtom<RowSelectionState>({ two: true }));
  const [cancel, setCancel] = useState(false);
  const table = useTable({ features, data, columns, getRowId: (row) => row.id, atoms: { rowSelection } }, () => null);
  const minimal = useAppTable({ data, columns: [{ accessorKey: 'name', header: '物品' }, { accessorKey: 'quantity', header: '数量' }] }, () => null);
  return <div className="apex-demo"><p>上表使用外部选择 atom、品牌主题与复选框插槽；下表使用原生 createTableHook 的最小实例。</p><label><input type="checkbox" checked={cancel} onChange={(event) => setCancel(event.currentTarget.checked)} />通过 slotProps.preventDefault 取消勾选</label><ApexTable table={table} height={250} showSelectionColumn className="apex-demo-brand" slots={slots} slotProps={{ checkbox: { controlProps: { onChange: (event) => { if (cancel) event.preventDefault(); } } } }} /><div style={{ height: 24 }} /><ApexTable table={minimal} height={220} virtualization={false} name="最小原生实例" /></div>;
}
