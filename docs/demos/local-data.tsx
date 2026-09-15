import type { ColumnDef } from '@tanstack/react-table';
import { ApexMenu, ApexTooltip } from '../../src';
import { defaultColumn, localFeatures } from './model';

/*
 * 本地文档示例独立生成数据，提供一万行与十万行两种浏览规模。
 * 列配置与业务单元格仅服务示例展示，图片来自共享演示资源。
 */
const seed = 20260914;
export type LocalDemoRow = { id: string; originalIndex: number; imageIndex: number; enabled: boolean; [key: string]: string | number | boolean | null | undefined };
export type LocalDemoId = 'business' | 'basic';
export const localDatasets: Record<LocalDemoId, { rows: number; columns: number; business: number; text: number; numeric: number; enumeration: number }> = {
  'business': { rows: 10000, columns: 30, business: 5, text: 14, numeric: 5, enumeration: 5 },
  'basic': { rows: 100000, columns: 30, business: 0, text: 17, numeric: 6, enumeration: 6 },
};
export function generateRows(id: LocalDemoId): LocalDemoRow[] {
  const shape = localDatasets[id];
  let random = seed;
  const next = () => { random ^= random << 13; random ^= random >>> 17; random ^= random << 5; return (random >>> 0) / 4294967296; };
  const nullable = (index: number, column: number, value: string | number) => (index + column * 7) % 20 === 0 ? null : (index + column * 7) % 20 === 1 ? undefined : value;
  const rows = Array.from({ length: shape.rows }, (_, index) => {
    const row: LocalDemoRow = { id: String(index), originalIndex: index, imageIndex: index % 4, enabled: index % 2 === 0 };
    const group = `组${String(index % 100).padStart(2, '0')}`;
    for (let col = 0; col < shape.text; col++) {
      const value = `${String((index + col) % 31).padStart(2, '0')}商品描述`.repeat(20).slice(0, [8, 32, 96][index % 3]);
      row[`text${col}`] = col === shape.text - 1 ? `${group} ${value}` : nullable(index, col, value);
    }
    for (let col = 0; col < shape.numeric; col++) row[col === 0 ? 'bucket' : `number${col}`] = col === 0 ? index % 100 : nullable(index, col, (index * 131 + col * 17) % 10000);
    for (let col = 0; col < shape.enumeration; col++) row[col === 0 ? 'group' : `enum${col}`] = col === 0 ? group : nullable(index, col, `枚举${index % 7}`);
    return row;
  });
  for (let index = rows.length - 1; index > 0; index--) { const target = Math.floor(next() * (index + 1)); [rows[index], rows[target]] = [rows[target], rows[index]]; }
  return rows;
}
export function createLocalColumns(id: LocalDemoId, onEnabledChange: (rowId: string, enabled: boolean) => void) {
  const shape = localDatasets[id];
  const columns: ColumnDef<typeof localFeatures, LocalDemoRow>[] = [];
  if (shape.business) columns.push(
    { id: 'image', header: '图片', cell: ({ row }) => <img src={`/demo-assets/product-${row.original.imageIndex}.svg`} width={36} height={36} alt="" /> },
    { id: 'tags', header: '标签', cell: () => <span className="apex-demo-tags"><span>新品</span><span>热销</span><span>精选</span></span> },
    /*
     * 开关值由业务数据所有者按稳定 ID 更新，虚拟行卸载不丢失业务状态。
     * 开关交互直接更新示例数据，并由原生列渲染器展示最新值。
     */
    { id: 'switch', header: '开关', cell: ({ row }) => <input type="checkbox" role="switch" aria-label={`开关 ${row.id}`} checked={row.original.enabled} onChange={(event) => onEnabledChange(row.id, event.currentTarget.checked)} /> },
    { id: 'link', header: '链接', cell: ({ row }) => <a href={`#row-${row.id}`}>商品 {row.id}</a> },
    { id: 'menu', header: '操作', cell: ({ row }) => <ApexMenu items={[{ id: 'detail', label: `查看 ${row.id}`, onSelect: () => undefined }]} /> },
  );
  for (let col = 0; col < shape.text; col++) columns.push({ accessorKey: `text${col}`, header: col === shape.text - 1 ? '文本筛选字段' : `文本 ${col + 1}`, cell: (cell) => <ApexTooltip content={String(cell.getValue() ?? '—')}>{String(cell.getValue() ?? '—')}</ApexTooltip> });
  for (let col = 0; col < shape.numeric; col++) columns.push({ accessorKey: col === 0 ? 'bucket' : `number${col}`, header: col === 0 ? '分桶' : `数值 ${col}`, meta: { apex: { align: 'end' } } });
  for (let col = 0; col < shape.enumeration; col++) columns.push({ accessorKey: col === 0 ? 'group' : `enum${col}`, header: col === 0 ? '分组标记' : `枚举 ${col}` });
  return columns;
}
export { defaultColumn, localFeatures };
