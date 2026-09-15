import { createRoot } from 'react-dom/client';
import { createColumnHelper, createSortedRowModel, columnOrderingFeature, columnPinningFeature, columnResizingFeature, columnSizingFeature, columnVisibilityFeature, rowSelectionFeature, rowSortingFeature, tableFeatures, useTable } from '@tanstack/react-table';
import { ApexTable } from 'apex-table-react';
import 'apex-table-react/styles/structure.css';
import './brand.css';

/*
 * 这个独立页面仅加载公开的结构入口，完全不引入默认主题。
 * 两个表格共享几何实现，各自用业务样式定义颜色、边框和焦点。
 */
const features = tableFeatures({ rowSelectionFeature, rowSortingFeature, columnOrderingFeature, columnPinningFeature, columnSizingFeature, columnResizingFeature, columnVisibilityFeature, sortedRowModel: createSortedRowModel() });
type Item = { id: string; name: string; quantity: number; material: string };
const helper = createColumnHelper<typeof features, Item>();
const columns = helper.columns([helper.accessor('name', { header: '物品', size: 180 }), helper.accessor('material', { header: '材质', size: 180 }), helper.accessor('quantity', { header: '数量', size: 180, cell: (cell) => cell.getValue().toFixed(0) })]);
const data: Item[] = Array.from({ length: 40 }, (_, index) => ({ id: String(index), name: `工作室藏品 ${index + 1}`, material: index % 2 ? '手工陶瓷' : '天然木材', quantity: 40 - index }));
function Collection({ theme, name }: { theme: string; name: string }) {
  const table = useTable({ features, data, columns, getRowId: (row) => row.id, enableMultiSort: false, sortDescFirst: false, initialState: { columnPinning: { start: ['name'], end: [] } } }, () => null);
  return <section><h2>{name}</h2><ApexTable table={table} name={name} height={260} className={theme} showSelectionColumn columnSettingsEnabled /></section>;
}
function App() {
  return <main className="structure-example"><p>独立结构样式 · 自定义品牌</p><Collection name="工作室 · 陶土主题" theme="clay" /><Collection name="资料室 · 森林主题" theme="forest" /></main>;
}
createRoot(document.getElementById('root')!).render(<App />);
