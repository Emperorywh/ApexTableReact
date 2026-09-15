import { useCallback, useMemo, useState } from 'react';
import { createColumnHelper, createPaginatedRowModel, rowPaginationFeature, sortFn_basic, tableFeatures, useTable } from '@tanstack/react-table';
import { ApexMenu, ApexTable, ApexTooltip } from '../../src';
import type { ApexDiagnostic, ApexLocale, ApexSlotProps } from '../../src';
import { localFeatures } from './model';
import './demo.css';
import '../../src/styles/structure.css';
import '../../src/styles/theme.css';

/*
 * 完整文案对象由公开类型逐项检查，数量和可访问名称也由业务提供。
 * 外部演示控件保留中文，表格区域及其内置弹层可整套切换为英文。
 */
const enUS: ApexLocale = {
  tableName: 'Inventory', loading: 'Loading…', empty: 'No data', noMatches: 'No matching results', noColumns: 'No visible columns. Choose columns in Column settings.',
  error: 'Unable to load data', retry: 'Try again', columnSettings: 'Column settings', close: 'Close', resetLayout: 'Restore defaults', clearSelection: 'Clear selection',
  selectPage: 'Select eligible rows on this page', selectResults: 'Select all matching rows', rowNumber: 'No.', previousPage: 'Previous page', nextPage: 'Next page',
  pageSize: 'Rows per page', jumpToPage: 'Go to', pageUnit: 'page', pinStart: 'Pin left', pinEnd: 'Pin right', unpin: 'Unpin',
  moveUp: 'Move up', moveDown: 'Move down', width: 'Column width', showColumn: 'Show column', minOneColumn: 'Keep at least one information column visible', pinSpace: 'Pinned columns must leave at least 160px in the center',
  unknownTotal: 'An exact total is unavailable. Replace or hide pagination.', unsupportedLayout: 'Only flat, single-level headers have a complete interface in this release.',
  invalidGeometry: 'Invalid dimensions: rows must be at least 32px; track and column widths must be finite and positive.', invalidPagination: 'Invalid pagination: pageIndex must be a nonnegative integer and pageSize a positive integer.', duplicateRowId: 'Row IDs must be nonempty and unique.',
  duplicateColumnId: 'Column IDs must be nonempty and unique.', unmeasurable: 'The table body needs an explicit height or a measurable flex container.',
  virtualizationDisabled: 'Virtualization is disabled for a large dataset. Mounting every row may be slow.', protectedProp: 'Slot extensions cannot override protected semantics, state or geometry.',
  compact: 'Compact', standard: 'Standard', comfortable: 'Comfortable', density: 'Row density', menu: 'More actions',
  selectRow: (id) => `Select row ${id}`, sortColumn: (label) => `Sort ${label}`, resizeColumn: (label) => `Resize ${label}`,
  page: (index) => `Page ${index + 1}`, total: (count) => `${count.toLocaleString('en-US')} items`,
  selected: (count) => `${count.toLocaleString('en-US')} selected`, perPage: (count) => `${count} per page`,
};
const features = tableFeatures({ ...localFeatures, rowPaginationFeature, paginatedRowModel: createPaginatedRowModel() });
type Item = { id: string; name: string; quantity: number };
const helper = createColumnHelper<typeof features, Item>();
const data: Item[] = [{ id: 'cup', name: 'Ceramic cup', quantity: 12 }, { id: 'vase', name: 'Glass vase', quantity: 6 }, { id: 'cloth', name: 'Linen cloth', quantity: 20 }, { id: 'bag', name: 'Canvas bag', quantity: 9 }];
const continuousHelper = createColumnHelper<typeof localFeatures, Item>();
const continuousColumns = continuousHelper.columns([continuousHelper.accessor('name', { header: 'Product' }), continuousHelper.accessor('quantity', { header: 'Quantity' })]);
const scenarios = { data: '正常数据', loading: '加载中', error: '请求失败', empty: '没有数据', filtered: '筛选无结果', columns: '全部列隐藏', unknown: '未知总数', geometry: '非法行高', pagination: '非法分页', rowId: '重复行 ID', columnId: '重复列 ID', grouped: '分组表头', height: '表体高度不足', large: '大数据关闭虚拟化', protected: '冲突插槽属性' };
type Scenario = keyof typeof scenarios;

/*
 * 场景切换重建业务原生实例，便于直接观察各展示边界与恢复结果。
 * 诊断只写观察面板，不修正原生状态，也不把诊断通知当成请求错误重试。
 */
function LocaleScope({ scenario, english, retry, narrow, recover }: { scenario: Scenario; english: boolean; retry: boolean; narrow: boolean; recover(): void }) {
  const [notice, setNotice] = useState('');
  const [diagnostics, setDiagnostics] = useState<ApexDiagnostic[]>([]);
  const report = useCallback((event: ApexDiagnostic) => setDiagnostics((old) => old.some((item) => item.code === event.code && item.message === event.message) ? old : [...old, event]), []);
  const columns = useMemo(() => {
    const leaf = helper.columns([
      helper.accessor('name', { id: scenario === 'columnId' ? 'quantity' : 'name', header: 'Product', cell: (cell) => <ApexTooltip content={`Details for ${cell.getValue()}`}>{cell.getValue()}</ApexTooltip>, filterFn: (row, id, query: string) => row.getValue<string>(id).toLowerCase().includes(query) }),
      helper.accessor('quantity', { header: 'Quantity' }),
      helper.display({ id: 'actions', header: 'Actions', cell: (cell) => <ApexMenu items={[{ id: 'view', label: 'View details', onSelect: () => setNotice(`Opened ${cell.row.id}`) }, { id: 'archive', label: 'Archive', disabled: true, onSelect: () => {} }]} /> }),
    ]);
    return scenario === 'grouped' ? [helper.group({ id: 'inventory', header: 'Inventory group', columns: leaf })] : leaf;
  }, [scenario]);
  const rows = useMemo(() => scenario === 'empty' ? [] : scenario === 'rowId' ? data.map((row, index) => index === 1 ? { ...row, id: 'cup' } : row) : scenario === 'large' ? Array.from({ length: 1001 }, (_, index) => ({ id: `item-${index}`, name: `Item ${index}`, quantity: index })) : data, [scenario]);
  const manual = scenario === 'unknown' || scenario === 'large';
  const table = useTable({ features, data: rows, columns, getRowId: (row) => row.id, defaultColumn: { size: 160, minSize: 64, maxSize: 480, sortFn: sortFn_basic }, autoResetPageIndex: false, manualPagination: manual, pageCount: scenario === 'unknown' ? -1 : undefined, initialState: { pagination: scenario === 'pagination' ? { pageIndex: -1, pageSize: 0 } : { pageIndex: 0, pageSize: 2 }, columnFilters: scenario === 'filtered' ? [{ id: 'name', value: 'missing' }] : [], columnVisibility: scenario === 'columns' ? { name: false, quantity: false, actions: false } : {} } }, () => null);
  const conflicts = useMemo<ApexSlotProps>(() => scenario === 'protected' ? JSON.parse('{"checkbox":{"controlProps":{"aria-label":"Invalid override"}}}') : {}, [scenario]);
  return <><div style={{ width: narrow ? 480 : '100%', maxWidth: '100%' }}><ApexTable table={table} locale={english ? enUS : undefined} height={scenario === 'height' ? 110 : 380} rowHeight={scenario === 'geometry' ? 20 : undefined} showSelectionColumn showRowNumber columnSettingsEnabled pagination={manual && scenario !== 'unknown' ? false : { pageSizeOptions: [2, 10, 20] }} virtualization={scenario === 'large' ? false : 'auto'} loading={scenario === 'loading'} error={scenario === 'error' ? new Error('Example request failed') : undefined} onRetry={retry ? recover : undefined} onDiagnostic={report} slotProps={conflicts} /></div><p role="status">{notice}</p><details open><summary>当前诊断文案</summary><pre>{JSON.stringify(diagnostics, null, 2)}</pre></details></>;
}
/*
 * 连续列表显式使用不含分页特性的原生组合，全选名称因而对应完整结果。
 * 仅隐藏分页控件不会移除原生分页语义，所以这里创建独立业务实例。
 */
function ContinuousLocale({ english, narrow }: { english: boolean; narrow: boolean }) {
  const table = useTable({ features: localFeatures, data, columns: continuousColumns, getRowId: (row) => row.id, defaultColumn: { size: 160, sortFn: sortFn_basic } }, () => null);
  return <div style={{ width: narrow ? 480 : '100%', maxWidth: '100%' }}><ApexTable table={table} locale={english ? enUS : undefined} height={380} showSelectionColumn showRowNumber columnSettingsEnabled pagination={false} /></div>;
}
export default function Localization() {
  const [scenario, setScenario] = useState<Scenario>('data');
  const [english, setEnglish] = useState(true);
  const [paginated, setPaginated] = useState(true);
  const [retry, setRetry] = useState(true);
  const [narrow, setNarrow] = useState(false);
  return <div className="apex-demo"><div className="apex-demo-query"><label>展示场景<select disabled={!paginated} value={scenario} onChange={(event) => setScenario(event.currentTarget.value as Scenario)}>{Object.entries(scenarios).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label><input type="checkbox" checked={english} onChange={(event) => setEnglish(event.currentTarget.checked)} />使用完整英文文案</label><label><input type="checkbox" checked={paginated} onChange={(event) => { setPaginated(event.currentTarget.checked); setScenario('data'); }} />分页示例（关闭后查看连续列表）</label><label><input type="checkbox" checked={retry} onChange={(event) => setRetry(event.currentTarget.checked)} />提供请求重试</label><label><input type="checkbox" checked={narrow} onChange={(event) => setNarrow(event.currentTarget.checked)} />480px 容器</label></div>{paginated ? <LocaleScope key={`${scenario}-${english}`} scenario={scenario} english={english} retry={retry} narrow={narrow} recover={() => setScenario('data')} /> : <ContinuousLocale key={String(english)} english={english} narrow={narrow} />}</div>;
}
