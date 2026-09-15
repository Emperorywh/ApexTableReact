import { createRoot } from 'react-dom/client';
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { ApexTable } from 'apex-table-react';
import 'apex-table-react/styles/structure.css';
import './brand.css';

/*
 * 这个独立页面仅加载公开的结构入口，完全不引入默认主题。
 * 两个最小本地表格只对比品牌外观，不叠加排序、选择或列设置。
 */
const features = tableFeatures({});
type Item = { id: string; name: string; quantity: number; material: string };
const helper = createColumnHelper<typeof features, Item>();
const columns = helper.columns([helper.accessor('name', { header: '物品' }), helper.accessor('material', { header: '材质' }), helper.accessor('quantity', { header: '数量', cell: (cell) => cell.getValue().toFixed(0) })]);
const data: Item[] = [
  { id: 'cup', name: '陶瓷杯', material: '手工陶瓷', quantity: 36 },
  { id: 'tray', name: '木托盘', material: '天然木材', quantity: 12 },
  { id: 'vase', name: '陶花瓶', material: '手工陶瓷', quantity: 24 },
];
function Collection({ theme, name }: { theme: string; name: string }) {
  const table = useTable({ features, data, columns }, () => null);
  return <section><h2>{name}</h2><ApexTable table={table} name={name} height={230} className={theme} /></section>;
}
function App() {
  return <main className="structure-example"><p>独立结构样式 · 自定义品牌</p><Collection name="工作室 · 陶土主题" theme="clay" /><Collection name="资料室 · 森林主题" theme="forest" /></main>;
}
createRoot(document.getElementById('root')!).render(<App />);
