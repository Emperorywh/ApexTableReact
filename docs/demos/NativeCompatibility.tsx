import { useLayoutEffect, useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import { createAtom } from '@tanstack/store';
import { createColumnHelper, createPaginatedRowModel, rowPaginationFeature, sortFn_basic, tableFeatures, useTable } from '@tanstack/react-table';
import type { CellContext, FilterFn, HeaderContext, RowSelectionState, Updater } from '@tanstack/react-table';
import { ApexTable } from '../../src';
import type { ApexDiagnostic, ApexSlotProps, ApexSlots } from '../../src';
import { localFeatures } from './model';
import './demo.css';
import '../../src/styles/structure.css';
import '../../src/styles/theme.css';

/*
 * 这是供人工操作的原生 API 示例，所有按钮直接调用实例方法。
 * 计数器仅用于展示渲染和订阅事实，不参与业务数据或表格状态。
 */
const features = tableFeatures({ ...localFeatures, rowPaginationFeature, paginatedRowModel: createPaginatedRowModel() });
type Item = { id: string; name: string; amount: number; group: string };
type NativeTable = ReturnType<typeof useTable<typeof features, Item, null>>;
const helper = createColumnHelper<typeof features, Item>();
const data: Item[] = [
  { id: 'a', name: '陶瓷杯', amount: 3, group: '厨房' },
  { id: 'b', name: '亚麻桌布', amount: 1, group: '居家' },
  { id: 'c', name: '玻璃花瓶', amount: 2, group: '居家' },
  { id: 'd', name: '保温杯', amount: 6, group: '厨房' },
  { id: 'e', name: '帆布袋', amount: 4, group: '出行' },
  { id: 'f', name: '雨伞', amount: 5, group: '出行' },
];
const slices = ['sorting', 'columnFilters', 'globalFilter', 'pagination', 'rowSelection', 'columnOrder', 'columnVisibility', 'columnSizing', 'columnPinning', 'columnResizing'] as const;
type Slice = typeof slices[number];
type Metrics = { renders: Record<string, number>; notifications: Record<string, number>; mismatches: string[]; instance?: NativeTable; refs: Set<HTMLInputElement>; refSet: number; refCleanup: number; businessEvents: number; ownerCallbacks: { arity: number; valueKind: string }[] };
type Ownership = 'internal' | 'state' | 'atom' | 'both';
type CellSlotProps = ComponentProps<ApexSlots<typeof features, Item, null>['cellContent']>;
function json(value: unknown) { return JSON.stringify(value, (_, item) => item instanceof Set ? { type: 'Set', values: [...item] } : item, 2); }
const nativeGlobalFilter: FilterFn<typeof features, Item> = (row, id, value: Set<string>) => value.has(String(row.getValue(id)));
function auditContext<T>(metrics: Metrics, context: CellContext<typeof features, Item, T> | HeaderContext<typeof features, Item, T>) {
  const original = 'cell' in context ? context.cell.getContext() : context.header.getContext();
  const keys = 'cell' in context ? ['table', 'row', 'column', 'cell', 'getValue', 'renderValue'] as const : ['table', 'header', 'column'] as const;
  keys.forEach((key) => { if (Reflect.get(context, key) !== Reflect.get(original, key)) metrics.mismatches.push(`原生上下文 ${key} 引用变化`); });
}
function NativeScope({ ownership }: { ownership: Ownership }) {
  const [slice, setSlice] = useState<Slice>('rowSelection');
  const [hidden, setHidden] = useState(false);
  const [unknownTotal, setUnknownTotal] = useState(false);
  const [duplicateRows, setDuplicateRows] = useState(false);
  const [duplicateColumns, setDuplicateColumns] = useState(false);
  const [conflicts, setConflicts] = useState(false);
  const [snapshot, setSnapshot] = useState('点击“读取观察值”记录当前事实');
  const [diagnostics, setDiagnostics] = useState<ApexDiagnostic[]>([]);
  const metrics = useMemo<Metrics>(() => ({ renders: {}, notifications: {}, mismatches: [], refs: new Set(), refSet: 0, refCleanup: 0, businessEvents: 0, ownerCallbacks: [] }), []);
  const [controlledSelection, setControlledSelection] = useState<RowSelectionState>({ c: true });
  const [externalSelection] = useState(() => createAtom<RowSelectionState>({ a: true }));
  const columns = useMemo(() => helper.columns([
    helper.accessor('name', { id: duplicateColumns ? 'amount' : 'name', size: 180, header: (context) => { auditContext(metrics, context); return '物品'; }, cell: (context) => { auditContext(metrics, context); metrics.renders[context.cell.id] = (metrics.renders[context.cell.id] ?? 0) + 1; return context.getValue(); } }),
    helper.accessor('amount', { header: '数量', cell: (context) => { auditContext(metrics, context); metrics.renders[context.cell.id] = (metrics.renders[context.cell.id] ?? 0) + 1; return context.getValue().toFixed(1); }, filterFn: (row, id, value: Set<number>) => value.has(row.getValue(id)) }),
    helper.accessor('group', { header: '分类' }),
  ]), [duplicateColumns, metrics]);
  const rows = useMemo(() => duplicateRows ? data.map((row, index) => index === 1 ? { ...row, id: 'a' } : row) : data, [duplicateRows]);
  const options = { features, data: rows, columns, getRowId: (row: Item) => row.id, defaultColumn: { size: 160, minSize: 64, maxSize: 480, sortFn: sortFn_basic }, autoResetPageIndex: false, manualPagination: unknownTotal, pageCount: unknownTotal ? -1 : undefined, initialState: { rowSelection: { b: true as const }, columnSizing: { name: 220 }, pagination: { pageIndex: 0, pageSize: 3 } }, globalFilterFn: nativeGlobalFilter };
  /*
   * 全局过滤值显式使用 Set，证明核心不要求业务 JSON 条件协议。
   * 原生 selector 返回 null，表格与观察面板各自订阅需要的状态。
   */
  /*
   * 三种初始值刻意不同，方便观察原生 initialState、state 与 atom 的优先级。
   * 受控回调直接交给所有者；同时提供 atom/state 时不替换原生默认写入路径。
   */
  const ownershipOptions = { ...options,
    ...(ownership === 'state' || ownership === 'both' ? { state: { rowSelection: controlledSelection } } : {}),
    ...(ownership === 'state' ? { onRowSelectionChange: (...args: [Updater<RowSelectionState>]) => { metrics.ownerCallbacks.push({ arity: args.length, valueKind: typeof args[0] }); setControlledSelection(args[0]); } } : {}),
    ...(ownership === 'atom' || ownership === 'both' ? { atoms: { rowSelection: externalSelection } } : {}),
  };
  const table = useTable(ownershipOptions, () => null);
  const nativeMethods = useMemo(() => ({ getRowModel: table.getRowModel, setSorting: table.setSorting, setRowSelection: table.setRowSelection, setColumnSizing: table.setColumnSizing }), [table.store]);
  metrics.instance = table;
  const slots = useMemo(() => ({ cellContent: ({ table: current, rootProps, children }: CellSlotProps) => { if (current !== metrics.instance) metrics.mismatches.push('插槽未收到当前传入实例'); return <div {...rootProps}>{children}</div>; } }), [metrics]);
  const controlRef = useMemo(() => (node: HTMLInputElement | null) => { if (!node) return; metrics.refs.add(node); metrics.refSet++; return () => { metrics.refs.delete(node); metrics.refCleanup++; }; }, [metrics]);
  /*
   * JSON 输入故意模拟未经类型检查的 JavaScript 调用方，只用于观察运行时保护。
   * 正常 TypeScript 接入不使用此路径；受保护字段仍由公开类型拒绝。
   */
  const slotProps = useMemo<ApexSlotProps>(() => ({ checkbox: { controlProps: { ref: controlRef, onChange: () => { metrics.businessEvents++; }, ...(conflicts ? JSON.parse('{"role":"switch","checked":true,"aria-label":"非法覆盖","style":{"height":99}}') : {}) } } }), [conflicts, controlRef, metrics]);
  const report = useMemo(() => (event: ApexDiagnostic) => setDiagnostics((old) => [...old.slice(-7), event]), []);
  useLayoutEffect(() => {
    const subscriptions = slices.map((key) => table.atoms[key].subscribe(() => { metrics.notifications[key] = (metrics.notifications[key] ?? 0) + 1; }));
    return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
  }, [table.store, metrics]);
  const apply = (updater: boolean) => {
    switch (slice) {
      case 'sorting': return updater ? table.setSorting((old) => [...old, { id: 'name', desc: false }]) : table.setSorting([{ id: 'amount', desc: true }]);
      case 'columnFilters': return updater ? table.setColumnFilters((old) => old.map((filter) => ({ ...filter, value: new Set([2, 4, 6]) }))) : table.setColumnFilters([{ id: 'amount', value: new Set([1, 3, 5]) }]);
      case 'globalFilter': return updater ? table.setGlobalFilter((old: unknown) => new Set([...(old instanceof Set ? old : []), '出行'])) : table.setGlobalFilter(new Set(['厨房']));
      case 'pagination': return updater ? table.setPagination((old) => ({ ...old, pageIndex: 0, pageSize: 2 })) : table.setPagination({ pageIndex: 1, pageSize: 3 });
      case 'rowSelection': return updater ? table.setRowSelection((old) => ({ ...old, c: true })) : table.setRowSelection({ a: true });
      case 'columnOrder': return updater ? table.setColumnOrder((old) => ['group', ...old.filter((id) => id !== 'group')]) : table.setColumnOrder(['amount']);
      case 'columnVisibility': return updater ? table.setColumnVisibility((old) => ({ ...old, amount: false, group: false })) : table.setColumnVisibility({ name: false });
      case 'columnSizing': return updater ? table.setColumnSizing((old) => ({ ...old, name: (old.name ?? 180) + 8 })) : table.setColumnSizing({ name: 240 });
      case 'columnPinning': return updater ? table.setColumnPinning((old) => ({ ...old, start: ['group', ...(old.start ?? []).filter((id) => id !== 'group')] })) : table.setColumnPinning({ start: ['name'], end: ['amount'] });
      case 'columnResizing': return updater ? table.setColumnResizing((old) => ({ ...old, deltaOffset: 8 })) : table.setColumnResizing({ startOffset: 0, startSize: 180, deltaOffset: 0, deltaPercentage: 0, isResizingColumn: 'name', columnSizingStart: [['name', 180]] });
    }
  };
  const reset = (defaults: boolean) => {
    const methods = { sorting: table.resetSorting, columnFilters: table.resetColumnFilters, globalFilter: table.resetGlobalFilter, pagination: table.resetPagination, rowSelection: table.resetRowSelection, columnOrder: table.resetColumnOrder, columnVisibility: table.resetColumnVisibility, columnSizing: table.resetColumnSizing, columnPinning: table.resetColumnPinning, columnResizing: table.resetHeaderSizeInfo };
    methods[slice](defaults);
  };
  const capture = () => setSnapshot(json({ renders: metrics.renders, notifications: metrics.notifications, mismatches: metrics.mismatches, businessEvents: metrics.businessEvents, ownerCallbacks: metrics.ownerCallbacks, ownership, ownerState: controlledSelection, ownerAtom: externalSelection.get(), activeInputRefs: metrics.refs.size, refSet: metrics.refSet, refCleanup: metrics.refCleanup, optionsUnchanged: Object.is(table.options, ownershipOptions) && table.options.columns === columns && table.options.data === rows, methodsUnchanged: Object.entries(nativeMethods).every(([key, method]) => Reflect.get(table, key) === method), selectedState: table.state, nameWidth: table.getColumn(duplicateColumns ? 'amount' : 'name')?.getSize() }));
  return <div className="apex-demo"><p>原生状态可独立变更；观察值只在点击按钮时读取，不自动宣告验收通过。</p><div className="apex-demo-query"><label>原生切片<select value={slice} onChange={(event) => setSlice(event.currentTarget.value as Slice)}>{slices.map((key) => <option key={key}>{key}</option>)}</select></label><button type="button" onClick={() => apply(false)}>提交直接值</button><button type="button" onClick={() => apply(true)}>提交 updater</button><button type="button" onClick={() => reset(false)}>reset()</button><button type="button" onClick={() => reset(true)}>reset(true)</button><button type="button" onClick={() => table.setPagination({ pageIndex: -1, pageSize: 0 })}>提交非法分页参数</button><button type="button" onClick={capture}>读取观察值</button></div><div className="apex-demo-query"><label><input type="checkbox" checked={hidden} onChange={(event) => setHidden(event.currentTarget.checked)} />隐藏容器</label><label><input type="checkbox" checked={unknownTotal} onChange={(event) => setUnknownTotal(event.currentTarget.checked)} />原生未知总数</label><label><input type="checkbox" checked={duplicateRows} onChange={(event) => setDuplicateRows(event.currentTarget.checked)} />重复行 ID</label><label><input type="checkbox" checked={duplicateColumns} onChange={(event) => setDuplicateColumns(event.currentTarget.checked)} />重复列 ID</label><label><input type="checkbox" checked={conflicts} onChange={(event) => setConflicts(event.currentTarget.checked)} />模拟未校验的冲突 props</label></div><div style={{ display: hidden ? 'none' : undefined }}><ApexTable table={table} height={330} showSelectionColumn columnSettingsEnabled slots={slots} slotProps={slotProps} onDiagnostic={report} /></div><details open><summary>原生切片</summary><table.Subscribe source={table.store}>{(state) => <pre data-native-state>{json(state)}</pre>}</table.Subscribe></details><details open><summary>观察值</summary><pre data-native-observation>{snapshot}</pre></details><div role="status">{diagnostics.map((event, index) => <div key={`${event.code}-${index}`}>{event.code}：{event.message}</div>)}</div></div>;
}
export default function NativeCompatibility() {
  const [instance, setInstance] = useState(0);
  const [ownership, setOwnership] = useState<Ownership>('internal');
  return <><div className="apex-demo-query"><label>选择状态所有者<select value={ownership} onChange={(event) => setOwnership(event.currentTarget.value as Ownership)}><option value="internal">原生内部 initialState=b</option><option value="state">受控 state=c</option><option value="atom">外部 atom=a</option><option value="both">同时提供 atom=a 与 state=c</option></select></label><button type="button" onClick={() => setInstance((old) => old + 1)}>重新创建原生实例</button></div><NativeScope key={`${instance}-${ownership}`} ownership={ownership} /></>;
}
