import { useEffect, useMemo, useRef, useState } from 'react';
import { useTable } from '@tanstack/react-table';
import type { ColumnFiltersState } from '@tanstack/react-table';
import { ApexTable } from '../../src';
import type { ApexDensity, ApexTableRef } from '../../src';
import { createLocalColumns, defaultColumn, generateRows, localFeatures, localDatasets } from './local-data';
import type { LocalDemoId } from './local-data';
import './demo.css';
import '../../src/styles/structure.css';
import '../../src/styles/theme.css';

/*
 * 本地示例完整持有数据，默认连续虚拟滚动，操作范围来自原生最终行模型。
 * 批量计算先显示忙碌状态并等待真实绘制机会，避免界面缺少操作反馈。
 */
function LocalScope({ scenario }: { scenario: LocalDemoId }) {
  const [data, setData] = useState(() => generateRows(scenario));
  const columns = useMemo(() => createLocalColumns(scenario, (rowId, enabled) => setData((old) => old.map((row) => row.id === rowId ? { ...row, enabled } : row))), [scenario]);
  const [busy, setBusy] = useState(false);
  const [density, setDensity] = useState<ApexDensity>('standard');
  /*
   * 容器可见性和宽度由业务控制，保留同一个原生实例以观察测量恢复。
   * 隐藏时不卸载整张示例，便于核对滚动锚点和虚拟窗口的实际变化。
   */
  const [hidden, setHidden] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [query, setQuery] = useState('');
  const [composing, setComposing] = useState(false);
  const tableRef = useRef<ApexTableRef>(null);
  const operation = useRef(0);
  const frames = useRef(new Set<number>());
  const table = useTable({ features: localFeatures, data, columns, defaultColumn, getRowId: (row) => row.id, enableMultiSort: false, sortDescFirst: false, columnResizeMode: 'onEnd', globalFilterFn: (row, id, value: string) => String(row.getValue(id) ?? '').normalize('NFC').toLowerCase().includes(value.normalize('NFC').trim().toLowerCase()), initialState: { columnPinning: { start: [localDatasets[scenario].business ? 'image' : 'text0'], end: [localDatasets[scenario].enumeration > 1 ? `enum${localDatasets[scenario].enumeration - 1}` : 'group'] } } }, () => null);
  const schedule = (action: () => void) => {
    const sequence = ++operation.current;
    setBusy(true);
    /*
     * 每帧执行后立即从集合移除，长期交互不累计已完成的回调编号。
     * 卸载只取消尚未执行的回调，业务提交仍由最后一次操作负责。
     */
    const frame = (callback: () => void) => { const id = requestAnimationFrame(() => { frames.current.delete(id); callback(); }); frames.current.add(id); };
    frame(() => { frame(() => {
      if (sequence !== operation.current) return;
      action();
      setBusy(false);
    }); });
  };
  useEffect(() => () => { operation.current++; frames.current.forEach(cancelAnimationFrame); }, []);
  useEffect(() => {
    /*
     * 空搜索与原生初始值等价，不在首次挂载后追加一次无意义的忙碌刷新。
     * 也避免用户已经滚动后，被这次延迟的空查询重新带回顶部。
     */
    if (composing || query === (table.atoms.globalFilter.get() ?? '')) return;
    const timer = setTimeout(() => schedule(() => table.setGlobalFilter(query)), 250);
    return () => clearTimeout(timer);
  }, [query, composing]);
  const filter = (value: string) => schedule(() => table.setColumnFilters(value ? [{ id: 'bucket', value: [{ operator: 'between', value: [0, Number(value) - 1] }] }] : [] as ColumnFiltersState));
  return <div className="apex-demo">
    <div className="apex-demo-query"><label>搜索全部本地数据<input value={query} placeholder="试试：组00" onCompositionStart={() => setComposing(true)} onCompositionEnd={(event) => { setComposing(false); setQuery(event.currentTarget.value); }} onChange={(event) => setQuery(event.currentTarget.value)} /></label><label>命中范围<select aria-label="命中范围" onChange={(event) => filter(event.currentTarget.value)}><option value="">全部数据</option><option value="1">1%</option><option value="10">10%</option><option value="90">90%</option></select></label><label>密度<select aria-label="密度" value={density} onChange={(event) => setDensity(event.currentTarget.value as ApexDensity)}><option value="compact">紧凑 · 40px</option><option value="standard">标准 · 48px</option><option value="comfortable">宽松 · 64px</option></select></label><button type="button" onClick={() => schedule(() => table.toggleAllRowsSelected(true))}>全选筛选结果</button><button type="button" onClick={() => schedule(() => table.resetRowSelection(true))}>清空全部选择</button><button type="button" onClick={() => tableRef.current?.scrollToRow(data[data.length - 1].id)}>定位最后一行</button></div>
    <div className="apex-demo-query"><label><input type="checkbox" checked={hidden} onChange={(event) => setHidden(event.currentTarget.checked)} />暂时隐藏表格容器</label><label><input type="checkbox" checked={narrow} onChange={(event) => setNarrow(event.currentTarget.checked)} />使用 480px 窄容器</label></div>
    <div style={{ display: hidden ? 'none' : undefined, width: narrow ? 480 : '100%', maxWidth: '100%' }}><ApexTable ref={tableRef} table={table} height={620} showSelectionColumn columnSettingsEnabled density={density} onDensityChange={setDensity} loading={busy} /></div>
    <div className="apex-demo-notice"><span>{data.length.toLocaleString()} 行 · {localDatasets[scenario].columns} 列 · 浏览器查找只覆盖已挂载内容</span></div>
  </div>;
}
export default function LocalTable() {
  const [scenario, setScenario] = useState<LocalDemoId>('business');
  return <><div className="apex-demo-heading"><div><span>LOCAL EXPLORER</span><h2>本地数据浏览</h2><p>统一行高，连续滚动，原生筛选与选择。</p></div><select aria-label="数据规模" value={scenario} onChange={(event) => setScenario(event.currentTarget.value as LocalDemoId)}><option value="business">1 万行 × 30 列 · 业务单元格</option><option value="basic">10 万行 × 30 列 · 基础单元格</option></select></div><LocalScope key={scenario} scenario={scenario} /></>;
}
