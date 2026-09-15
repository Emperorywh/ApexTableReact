import { useMemo, useRef } from 'react';
import type { RowSelectionState } from '@tanstack/react-table';
import type { ApexCheckboxDOM, ApexRootDOM } from '../types';
import { composeRefs, mergeDOM } from '../internal/dom';
import { useUI } from '../internal/context';
import type { RuntimeRow, RuntimeTable } from '../internal/runtime';

/*
 * 半选状态是 DOM 属性，必须同步到真实 input。
 * 行选择仅订阅该行 ID，业务单元格不依赖整份选择集合。
 */
function Checkbox({ table, row, scope, checked, indeterminate, disabled, onChange }: {
  table: RuntimeTable; row?: RuntimeRow; scope: 'row' | 'page' | 'results'; checked: boolean; indeterminate: boolean; disabled: boolean; onChange(): void;
}) {
  const { locale, slots, slotProps } = useUI();
  const input = useRef<HTMLInputElement>(null);
  const ref = useMemo(() => composeRefs<HTMLInputElement>(input, (node) => { if (node) node.indeterminate = indeterminate; }), [indeterminate]);
  const controlProps = mergeDOM<ApexCheckboxDOM>({
    ref, type: 'checkbox', className: 'apex-table-checkbox', checked, indeterminate, disabled,
    'aria-label': row ? locale.selectRow(row.id) : scope === 'page' ? locale.selectPage : locale.selectResults,
    'aria-checked': indeterminate ? 'mixed' : checked, onChange,
  }, slotProps.checkbox?.controlProps);
  if (slots.checkbox) return <slots.checkbox {...{ table, row, scope, controlProps, locale }} />;
  const { indeterminate: mixed, ...inputProps } = controlProps;
  return <input {...inputProps} data-indeterminate={mixed || undefined} />;
}
export function RowCheckbox({ table, row }: { table: RuntimeTable; row: RuntimeRow }) {
  if (!table.atoms.rowSelection) return null;
  return <table.Subscribe source={table.atoms.rowSelection} selector={(state) => !!state[row.id]}>
    {(checked) => <Checkbox table={table} row={row} scope="row" checked={checked} indeterminate={false} disabled={!row.getCanSelect?.()} onChange={() => row.toggleSelected?.()} />}
  </table.Subscribe>;
}
export function HeaderCheckbox({ table, unavailable }: { table: RuntimeTable; unavailable: boolean }) {
  /*
   * 数据模式的连续列表也安装了分页特性，必须按界面配置区分页内与结果全选。
   * 原生实例未提供标记时继续探测其分页能力。
   */
  const { paginationEnabled } = useUI();
  if (!table.atoms.rowSelection) return null;
  return <table.Subscribe source={table.atoms.rowSelection}>
    {() => {
      const paged = paginationEnabled ?? (typeof table.getPageCount === 'function' && !!table.atoms.pagination);
      const rows = paged ? table.getRowModel().rows : (table.getFilteredRowModel?.() ?? table.getRowModel()).rows;
      return <Checkbox table={table} scope={paged ? 'page' : 'results'} checked={paged ? table.getIsAllPageRowsSelected() : table.getIsAllRowsSelected()} indeterminate={paged ? table.getIsSomePageRowsSelected() : table.getIsSomeRowsSelected()} disabled={unavailable || !rows.some((row) => row.getCanSelect?.())} onChange={() => paged ? table.toggleAllPageRowsSelected() : table.toggleAllRowsSelected()} />;
    }}
  </table.Subscribe>;
}
function Summary({ table, selection }: { table: RuntimeTable; selection: RowSelectionState }) {
  const { locale, slots, slotProps } = useUI();
  /*
   * 受控选择允许保留值为 false 的键，只统计实际选中的记录。
   * 摘要数量与行复选框读取同一份状态含义。
   */
  const count = Object.values(selection).filter(Boolean).length;
  const rootProps = mergeDOM<ApexRootDOM>({ className: 'apex-table-selection-summary', 'aria-live': 'polite' }, slotProps.selectionSummary?.rootProps);
  const children = <><span>{locale.selected(count)}</span>{count > 0 && <button type="button" onClick={() => table.resetRowSelection(true)}>{locale.clearSelection}</button>}</>;
  return slots.selectionSummary ? <slots.selectionSummary {...{ table, locale, rowSelection: selection, count, rootProps, children }} /> : <div {...rootProps}>{children}</div>;
}
export function SelectionSummary({ table }: { table: RuntimeTable }) {
  /*
   * 仅安装选择特性时不显示摘要，启用选择的表格才占用底栏空间。
   * 原生模式未提供标记时保持已有行为。
   */
  const { selectionEnabled } = useUI();
  if (selectionEnabled === false || !table.atoms.rowSelection) return null;
  return <table.Subscribe source={table.atoms.rowSelection}>{(selection) => <Summary table={table} selection={selection} />}</table.Subscribe>;
}
