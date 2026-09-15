import type { Column, ReactTable, Row, RowData, TableFeatures } from '@tanstack/react-table';
import type { ApexSlots, ApexTableProps } from '../types';

/*
 * 泛型只在内部渲染边界擦除，公开接口从数据或调用方原生实例推断。
 * 渲染层对广义类型中的可选特性逐项探测，不安装特性或修改实例。
 */
export type RuntimeTable = ReactTable<TableFeatures, RowData, unknown>;
export type RuntimeColumn = Column<TableFeatures, RowData>;
export type RuntimeRow = Row<TableFeatures, RowData>;
/*
 * 数据模式安装固定特性，界面通过内部标记识别实际启用的分页和选择。
 * 原生实例模式不传标记，继续按实例能力识别，保持已有接入兼容。
 */
export type RuntimeProps = ApexTableProps<TableFeatures, RowData, unknown> & { paginationEnabled?: boolean; selectionEnabled?: boolean };
export type RuntimeSlots = Partial<ApexSlots<TableFeatures, RowData, unknown>>;
export function columnLabel(column: RuntimeColumn) {
  return column.columnDef.meta?.apex?.label ?? (typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id);
}
export function visibleColumns(table: RuntimeTable) {
  if (table.getStartVisibleLeafColumns) return [...table.getStartVisibleLeafColumns(), ...table.getCenterVisibleLeafColumns(), ...table.getEndVisibleLeafColumns()];
  return table.getVisibleLeafColumns?.() ?? table.getAllLeafColumns();
}
export function clampWidth(column: RuntimeColumn, value: number) {
  return Math.min(column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER, Math.max(column.columnDef.minSize ?? 20, value));
}
