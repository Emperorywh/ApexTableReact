import { columnFilteringFeature, columnOrderingFeature, columnPinningFeature, columnResizingFeature, columnSizingFeature, columnVisibilityFeature, createFilteredRowModel, createSortedRowModel, globalFilteringFeature, rowPaginationFeature, rowSelectionFeature, rowSortingFeature, tableFeatures } from '@tanstack/react-table';
import type { Row, RowData, Table, TableFeatures } from '@tanstack/react-table';

/*
 * 示例显式组合原生特性，服务器配置不注册本地排序、过滤或分页行模型。
 * 业务过滤条件只用于本示例，不进入 Apex 的公开数据协议。
 */
export const serverFeatures = tableFeatures({ columnFilteringFeature, globalFilteringFeature, rowSortingFeature, rowPaginationFeature, rowSelectionFeature, columnVisibilityFeature, columnOrderingFeature, columnPinningFeature, columnSizingFeature, columnResizingFeature });
export const localFeatures = tableFeatures({ columnFilteringFeature, globalFilteringFeature, rowSortingFeature, rowSelectionFeature, columnVisibilityFeature, columnOrderingFeature, columnPinningFeature, columnSizingFeature, columnResizingFeature, filteredRowModel: createFilteredRowModel(), sortedRowModel: createSortedRowModel() });
export type TextCondition = { operator: 'contains' | 'equals'; value: string };
export type NumberCondition = { operator: 'equals'; value: number } | { operator: 'between'; value: [number, number] };
export type EnumCondition = { operator: 'in'; value: string[] };
export type BusinessCondition = TextCondition | NumberCondition | EnumCondition;
export function validConditions(conditions: BusinessCondition[]) {
  return conditions.every((condition) => {
    if (condition.operator === 'between') return condition.value.every(Number.isFinite) && condition.value[0] <= condition.value[1];
    if (condition.operator === 'equals' && typeof condition.value === 'number') return Number.isFinite(condition.value);
    return true;
  });
}
export function normalize(value: string) { return value.normalize('NFC').toLowerCase(); }
export function matches(value: unknown, conditions: BusinessCondition[]) {
  return conditions.every((condition) => {
    if (value === null || value === undefined) return false;
    if (condition.operator === 'contains') return normalize(String(value)).includes(normalize(condition.value));
    if (condition.operator === 'in') return condition.value.includes(String(value));
    if (condition.operator === 'between') return Array.isArray(condition.value) && typeof value === 'number' && value >= Number(condition.value[0]) && value <= Number(condition.value[1]);
    return typeof condition.value === 'string' ? normalize(String(value)) === normalize(condition.value) : value === condition.value;
  });
}
export function businessFilter<F extends TableFeatures, D extends RowData>(row: Row<F, D>, id: string, value: BusinessCondition[]) { return matches(row.getValue(id), value); }
export function globalSearch<F extends TableFeatures, D extends RowData>(row: Row<F, D>, id: string, value: string) { const cell = row.getValue(id); return cell !== null && cell !== undefined && normalize(String(cell)).includes(normalize(value.trim())); }

/*
 * 原生排序模型在比较器之后应用降序翻转，因此空值分支读取原生方向。
 * 两侧皆空或规范化后相等返回零，让原生稳定排序保留输入次序。
 */
export function nullLastSort<F extends TableFeatures, D extends RowData>(a: Row<F, D>, b: Row<F, D>, id: string) {
  const left = a.getValue(id);
  const right = b.getValue(id);
  const leftNull = left === null || left === undefined;
  const rightNull = right === null || right === undefined;
  if (leftNull || rightNull) {
    const desc = (a.table as unknown as Table<TableFeatures, D>).atoms.sorting?.get().find((sort) => sort.id === id)?.desc;
    return leftNull === rightNull ? 0 : (leftNull ? 1 : -1) * (desc ? -1 : 1);
  }
  if (typeof left === 'number' && typeof right === 'number') return left - right;
  const x = normalize(String(left));
  const y = normalize(String(right));
  return x < y ? -1 : x > y ? 1 : 0;
}
export const defaultColumn = { size: 160, minSize: 64, maxSize: 800, sortFn: nullLastSort, sortUndefined: false as const, filterFn: businessFilter };
