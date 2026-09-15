import { useEffect, useMemo, useRef, useState } from 'react';
import { columnOrderingFeature, columnPinningFeature, columnResizingFeature, columnSizingFeature, columnVisibilityFeature, createColumnHelper, functionalUpdate, tableFeatures, useTable } from '@tanstack/react-table';
import { ApexTable } from '../../src';
import { createLocalColumnPreferences } from '../../src/adapters/local-column-preferences';
import type { ColumnPreferenceSlices } from '../../src/adapters/local-column-preferences';
import './demo.css';
import '../../src/styles/structure.css';
import '../../src/styles/theme.css';

/*
 * 布局由业务 React state 受控，适配器仅返回原生切片，不接管实例回调。
 * 身份、版本和允许列变化使用独立生命周期，旧待写任务在卸载时取消。
 */
const features = tableFeatures({ columnOrderingFeature, columnPinningFeature, columnResizingFeature, columnSizingFeature, columnVisibilityFeature });
type Product = { id: string; name: string; price: number; brand: string };
const helper = createColumnHelper<typeof features, Product>();
const data: Product[] = [{ id: 'p1', name: '陶瓷马克杯', price: 69, brand: '简物' }, { id: 'p2', name: '亚麻桌布', price: 129, brand: '山野' }];
const initialLayout: ColumnPreferenceSlices = { columnOrder: [], columnVisibility: {}, columnSizing: {}, columnPinning: { start: ['name'], end: [] } };
type StorageMode = 'normal' | 'broken' | 'denied' | 'quota';
type MigrationMode = 'none' | 'rename' | 'throw' | 'invalid';
/*
 * 列 ID 改名是业务结构迁移，示例显式改写四个原生切片中的旧售价 ID。
 * 输入先按未知数据检查，迁移结果仍由适配器按当前列权限和尺寸范围清理。
 */
function migrateLegacy(value: unknown, previousVersion: string | number) {
  if (previousVersion !== 0 || !value || typeof value !== 'object' || Array.isArray(value)) throw new Error('不支持的旧偏好版本');
  const state = value as Record<string, unknown>;
  const rename = (id: unknown) => id === 'unitPrice' ? 'price' : id;
  const ids = (input: unknown) => Array.isArray(input) ? input.map(rename) : input;
  const fields = (input: unknown) => input && typeof input === 'object' && !Array.isArray(input) ? Object.fromEntries(Object.entries(input).map(([id, item]) => [rename(id), item])) : input;
  const pins = state.columnPinning;
  return { ...state, columnOrder: ids(state.columnOrder), columnVisibility: fields(state.columnVisibility), columnSizing: fields(state.columnSizing), columnPinning: pins && typeof pins === 'object' && !Array.isArray(pins) ? { start: ids((pins as Record<string, unknown>).start), end: ids((pins as Record<string, unknown>).end) } : pins };
}
function PreferenceScope({ tenant, version, brand, mode, migration }: { tenant: string; version: number; brand: boolean; mode: StorageMode; migration: MigrationMode }) {
  const [layout, setLayout] = useState<ColumnPreferenceSlices>(initialLayout);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('尚未读取列偏好');
  const [stored, setStored] = useState('尚未检查存储');
  const restored = useRef<ColumnPreferenceSlices | null>(null);
  const preferences = useRef<ReturnType<typeof createLocalColumnPreferences> | null>(null);
  const createPreferences = useMemo(() => () => createLocalColumnPreferences({ namespace: 'apex-preference-example', userId: 'demo-user', tenantId: tenant, tableId: 'controlled-products', schemaVersion: version, storage: {
    getItem(key) { if (mode === 'denied') throw new Error('模拟禁止存储'); if (mode === 'broken') return '{损坏的数据'; return window.localStorage.getItem(key); },
    setItem(key, value) { if (mode === 'quota' || mode === 'denied') throw new Error('模拟存储写入失败'); window.localStorage.setItem(key, value); },
    removeItem(key) { if (mode === 'denied') throw new Error('模拟禁止存储'); window.localStorage.removeItem(key); },
  }, migrate: migration === 'none' ? undefined : (state, previousVersion) => {
    if (migration === 'throw') throw new Error('模拟业务迁移失败');
    if (migration === 'invalid') return null;
    const next = migrateLegacy(state, previousVersion);
    setNotice(`已迁移旧结构版本 ${previousVersion} 的售价 ID`);
    return next;
  }, onDiagnostic: (event) => setNotice(`偏好 ${event.code}：已保留可用的初始或内存布局`) }), [tenant, version, mode, migration]);
  const columns = useMemo(() => helper.columns([
    helper.accessor('name', { header: '名称', size: 200, enableHiding: false, meta: { apex: { canReorder: false } } }),
    helper.accessor('price', { header: '售价', size: 120, minSize: 80, maxSize: 360, cell: (cell) => `¥ ${cell.getValue()}` }),
    ...(brand ? [helper.accessor('brand', { header: '品牌', size: 150 })] : []),
  ]), [brand]);
  const table = useTable({ features, data, columns, getRowId: (row) => row.id, initialState: initialLayout, state: layout,
    onColumnOrderChange: (updater) => setLayout((old) => ({ ...old, columnOrder: functionalUpdate(updater, old.columnOrder ?? []) })),
    onColumnVisibilityChange: (updater) => setLayout((old) => ({ ...old, columnVisibility: functionalUpdate(updater, old.columnVisibility ?? {}) })),
    onColumnSizingChange: (updater) => setLayout((old) => ({ ...old, columnSizing: functionalUpdate(updater, old.columnSizing ?? {}) })),
    onColumnPinningChange: (updater) => setLayout((old) => ({ ...old, columnPinning: functionalUpdate(updater, old.columnPinning ?? { start: [], end: [] }) })),
  }, () => null);
  const reload = () => { if (!preferences.current) return; setNotice('已读取当前身份与结构版本的列偏好'); const next = preferences.current.load({ columns: table.getAllLeafColumns(), initialState: initialLayout }); restored.current = next; setLayout(next); };
  /*
   * StrictMode 可能先清理再重新建立副作用，每次建立都创建可用的新适配器。
   * 引用只用于生命周期，不把已经 dispose 的对象带入第二次建立过程。
   */
  useEffect(() => { const instance = createPreferences(); preferences.current = instance; reload(); setReady(true); return () => { instance.dispose(); if (preferences.current === instance) preferences.current = null; }; }, [createPreferences, table.store]);
  useEffect(() => { if (ready && layout !== restored.current) preferences.current?.save(layout); }, [ready, layout]);
  const stale = () => {
    /*
     * 这条可见操作只写本示例的假数据，展示删除列和越界宽度的清理。
     * 允许列仍来自实例，不让保存记录重新引入已移除的品牌或旧列。
     */
    if (!preferences.current) return;
    try { window.localStorage.setItem(preferences.current.key, JSON.stringify({ formatVersion: 1, schemaVersion: version, state: { columnOrder: ['retired', 'price', 'name', 'brand'], columnVisibility: { name: false, price: true, retired: false }, columnSizing: { price: 9999 }, columnPinning: { start: ['retired', 'name'], end: ['brand'] } } })); reload(); } catch { setNotice('浏览器禁止存储，继续使用当前内存布局'); }
  };
  /*
   * 外部清空绕过适配器 clear，模拟另一个页面删除同身份记录后重新读取。
   * 存储观察只在点击时读取本示例键，方便核对恢复不写回与随后显式保存。
   */
  const inspectStorage = () => { if (!preferences.current) return; try { setStored(window.localStorage.getItem(preferences.current.key) ?? '没有存储记录'); } catch { setStored('浏览器禁止读取存储'); } };
  const legacy = () => {
    if (!preferences.current) return;
    try { window.localStorage.setItem(preferences.current.key, JSON.stringify({ formatVersion: 1, schemaVersion: 0, state: { columnOrder: ['retired', 'unitPrice', 'name', 'brand'], columnVisibility: { name: false, unitPrice: true, retired: false }, columnSizing: { unitPrice: 9999 }, columnPinning: { start: ['retired', 'name'], end: ['unitPrice', 'brand'] } } })); reload(); inspectStorage(); } catch { setNotice('浏览器禁止存储，继续使用当前内存布局'); }
  };
  const externalClear = () => { if (!preferences.current) return; try { window.localStorage.removeItem(preferences.current.key); reload(); inspectStorage(); } catch { setNotice('浏览器禁止存储，继续使用当前内存布局'); } };
  return <div className="apex-demo"><div className="apex-demo-query"><button type="button" onClick={reload}>重新读取</button><button type="button" onClick={() => { preferences.current?.flush(); inspectStorage(); }}>立即保存</button><button type="button" onClick={() => { preferences.current?.clear(); reload(); inspectStorage(); }}>清除当前身份偏好</button><button type="button" onClick={stale}>载入含旧列与越界宽度的记录</button><button type="button" onClick={legacy}>载入旧版本售价 ID 记录</button><button type="button" onClick={externalClear}>模拟其他页面清空</button><button type="button" onClick={inspectStorage}>检查当前存储</button></div><ApexTable table={table} height={260} columnSettingsEnabled name="受控列偏好示例" /><p role="status">{notice}</p><details><summary>查看业务持有的原生布局切片</summary><pre>{JSON.stringify(layout, null, 2)}</pre></details><details><summary>查看最近一次存储读取</summary><pre>{stored}</pre></details></div>;
}
export default function Preferences() {
  const [tenant, setTenant] = useState('north');
  const [version, setVersion] = useState(1);
  const [brand, setBrand] = useState(true);
  const [mode, setMode] = useState<StorageMode>('normal');
  const [migration, setMigration] = useState<MigrationMode>('none');
  return <div><div className="apex-demo-query"><label>偏好空间<select value={tenant} onChange={(event) => setTenant(event.currentTarget.value)}><option value="north">北区</option><option value="south">南区</option></select></label><label>结构版本<select value={version} onChange={(event) => setVersion(Number(event.currentTarget.value))}><option value={1}>1</option><option value={2}>2</option></select></label><label><input type="checkbox" checked={brand} onChange={(event) => setBrand(event.currentTarget.checked)} />允许品牌列</label><label>存储环境<select value={mode} onChange={(event) => setMode(event.currentTarget.value as StorageMode)}><option value="normal">正常</option><option value="broken">损坏的记录</option><option value="denied">禁止访问</option><option value="quota">写入配额不足</option></select></label><label>结构迁移<select value={migration} onChange={(event) => setMigration(event.currentTarget.value as MigrationMode)}><option value="none">未提供迁移</option><option value="rename">迁移旧售价 ID</option><option value="throw">迁移抛出异常</option><option value="invalid">迁移返回非法结构</option></select></label></div><PreferenceScope key={`${tenant}-${version}-${brand}-${mode}-${migration}`} tenant={tenant} version={version} brand={brand} mode={mode} migration={migration} /></div>;
}
