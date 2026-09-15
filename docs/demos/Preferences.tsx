import { useEffect, useRef, useState } from 'react';
import { createColumnHelper, tableFeatures, useTable, columnOrderingFeature, columnPinningFeature, columnResizingFeature, columnSizingFeature, columnVisibilityFeature } from '@tanstack/react-table';
import { ApexTable } from '@';
import { createLocalColumnPreferences } from '@/adapters/local-column-preferences';
import type { ColumnPreferenceSlices } from '@/adapters/local-column-preferences';
import './demo.css';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * 本地偏好只保存列布局，使用显式保存和恢复展示适配器的基本接入。
 * 本示例独立声明数据、列和所需特性，源码引用统一使用 @。
 */
const features = tableFeatures({ columnOrderingFeature, columnPinningFeature, columnResizingFeature, columnSizingFeature, columnVisibilityFeature });
type Item = { id: string; name: string; stock: number };
const data: Item[] = [
  { id: 'cup', name: '陶瓷杯', stock: 36 },
  { id: 'cloth', name: '亚麻桌布', stock: 12 },
  { id: 'vase', name: '玻璃花瓶', stock: 24 },
];
const helper = createColumnHelper<typeof features, Item>();
const columns = helper.columns([
  helper.accessor('id', { header: '编号', size: 120 }),
  helper.accessor('name', { header: '物品名称', size: 220, enableHiding: false }),
  helper.accessor('stock', { header: '库存', size: 160 }),
]);
export default function Preferences() {
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('正在恢复列布局');
  const preferences = useRef<ReturnType<typeof createLocalColumnPreferences> | null>(null);
  const table = useTable({ features, data, columns, defaultColumn: { minSize: 80, maxSize: 400 } }, () => null);
  const applyLayout = (layout: ColumnPreferenceSlices) => {
    table.setColumnOrder(layout.columnOrder ?? []);
    table.setColumnVisibility(layout.columnVisibility ?? {});
    table.setColumnSizing(layout.columnSizing ?? {});
    table.setColumnPinning(layout.columnPinning ?? { start: [], end: [] });
  };
  /*
   * 每次副作用建立时创建适配器，卸载时取消待写任务并释放引用。
   * 自动恢复只读取本示例的存储键，后续点击保存才会写入浏览器。
   */
  useEffect(() => {
    const instance = createLocalColumnPreferences({
      namespace: 'apex-learning-demos', userId: 'demo-user', tenantId: 'demo-tenant',
      tableId: 'column-layout', schemaVersion: 1,
      onDiagnostic: () => setNotice('浏览器存储不可用，仍可在当前页面调整布局。'),
    });
    preferences.current = instance;
    setNotice('已恢复布局；调整列设置后点击保存，刷新页面可再次恢复。');
    applyLayout(instance.load({ columns: table.getAllLeafColumns() }));
    setReady(true);
    return () => { instance.dispose(); preferences.current = null; };
  }, [table.store]);
  const save = () => {
    setNotice('已保存当前列布局。');
    preferences.current?.save({
      columnOrder: table.atoms.columnOrder.get(),
      columnVisibility: table.atoms.columnVisibility.get(),
      columnSizing: table.atoms.columnSizing.get(),
      columnPinning: table.atoms.columnPinning.get(),
    });
    preferences.current?.flush();
  };
  const clear = () => {
    setNotice('已清除本示例保存的布局并恢复默认列。');
    preferences.current?.clear();
    applyLayout({});
  };
  return <div className="apex-demo">
    <div className="apex-demo-query">
      <button type="button" disabled={!ready} onClick={save}>保存列布局</button>
      <button type="button" disabled={!ready} onClick={clear}>清除并恢复默认</button>
    </div>
    <ApexTable table={table} height={300} columnSettingsEnabled />
    <p role="status">{notice}</p>
  </div>;
}
