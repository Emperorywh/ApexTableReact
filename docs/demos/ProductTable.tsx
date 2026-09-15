import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { createColumnHelper, functionalUpdate, useTable } from '@tanstack/react-table';
import type { ColumnFiltersState, PaginationState, RowSelectionState, SortingState, Updater } from '@tanstack/react-table';
import { ApexMenu, ApexTable, ApexTooltip } from '../../src';
import { createLocalColumnPreferences } from '../../src/adapters/local-column-preferences';
import { defaultColumn, matches, normalize, serverFeatures, validConditions } from './model';
import type { BusinessCondition } from './model';
import './demo.css';
import '../../src/styles/structure.css';
import '../../src/styles/theme.css';

/*
 * 此处数据和接口均为可公开的内存模拟，置顶只改变业务字段。
 * 商品图片由共享演示资源目录提供，供文档示例直接加载。
 * 请求序号防护同时覆盖成功与失败，身份通过 key 同步重建实例。
 */
type Product = { id: string; name: string; code: string; category: string; brand: string; status: string; pinned: boolean; price: number; stock: number; image: string; tags: string[]; locked: boolean };
const names = ['莫兰迪晴雨伞', '山野便携保温杯', '原木桌面收纳盒', '云感柔软抽纸', '清透氨基酸洗手液', '城市漫游帆布包', '暮光香氛礼盒', '细纹陶瓷马克杯'];
const initialProducts: Product[] = Array.from({ length: 328 }, (_, index) => ({ id: String(index + 1), name: names[index % names.length], code: `SP${String(index + 1).padStart(5, '0')}`, category: ['日用百货', '个护清洁', '居家好物', '礼品文创'][index % 4], brand: ['山野', '清风', '简物', '漫集'][index % 4], status: index % 7 ? '上架' : '下架', pinned: index % 11 === 0, price: 19.9 + index % 80, stock: 420 - index, image: `/demo-assets/product-${index % 4}.svg`, tags: ['新品', '热销', '精选'].slice(0, index % 3 + 1), locked: index % 17 === 0 }));
type Query = { sorting: SortingState; columnFilters: ColumnFiltersState; globalFilter: string; pagination: PaginationState; rowSelection: RowSelectionState; notice: string };
type Action = { type: 'sorting'; updater: Updater<SortingState> } | { type: 'columnFilters'; updater: Updater<ColumnFiltersState> } | { type: 'globalFilter'; updater: Updater<string> } | { type: 'pagination'; updater: Updater<PaginationState> } | { type: 'rowSelection'; updater: Updater<RowSelectionState> } | { type: 'notice'; value: string };
const initialQuery: Query = { sorting: [], columnFilters: [], globalFilter: '', pagination: { pageIndex: 0, pageSize: 20 }, rowSelection: {}, notice: '' };
function reducer(state: Query, action: Action): Query {
  if (action.type === 'notice') return { ...state, notice: action.value };
  if (action.type === 'rowSelection') return { ...state, rowSelection: functionalUpdate(action.updater, state.rowSelection) };
  if (action.type === 'pagination') {
    /*
     * 不修改 updater 返回的对象，调用方可能复用该原生状态对象。
     * 页大小变化只在业务 reducer 中生成新的归零分页切片。
     */
    const nextPagination = functionalUpdate(action.updater, state.pagination);
    const pagination = nextPagination.pageSize !== state.pagination.pageSize ? { ...nextPagination, pageIndex: 0 } : nextPagination;
    if (JSON.stringify(pagination) === JSON.stringify(state.pagination)) return state;
    return { ...state, pagination };
  }
  if (action.type === 'sorting') {
    const sorting = functionalUpdate(action.updater, state.sorting);
    return JSON.stringify(sorting) === JSON.stringify(state.sorting) ? state : { ...state, sorting, pagination: { ...state.pagination, pageIndex: 0 } };
  }
  const next = action.type === 'globalFilter' ? normalize(functionalUpdate(action.updater, state.globalFilter).trim()) : functionalUpdate(action.updater, state.columnFilters);
  if (JSON.stringify(next) === JSON.stringify(state[action.type])) return state;
  return { ...state, [action.type]: next, pagination: { ...state.pagination, pageIndex: 0 }, rowSelection: {}, notice: Object.keys(state.rowSelection).length ? '查询已更新，已清空选择' : '' };
}
function queryProducts(products: Product[], query: Query) {
  const result = products.filter((product) => (!query.globalFilter || normalize(`${product.name} ${product.code} ${product.brand}`).includes(query.globalFilter)) && query.columnFilters.every((filter) => matches(product[filter.id as keyof Product], filter.value as BusinessCondition[])));
  const sorting = query.sorting[0];
  if (sorting) result.sort((a, b) => {
    const x = a[sorting.id as keyof Product]; const y = b[sorting.id as keyof Product];
    const compare = typeof x === 'number' && typeof y === 'number' ? x - y : normalize(String(x)) < normalize(String(y)) ? -1 : normalize(String(x)) > normalize(String(y)) ? 1 : 0;
    return sorting.desc ? -compare : compare;
  });
  return { data: result.slice(query.pagination.pageIndex * query.pagination.pageSize, (query.pagination.pageIndex + 1) * query.pagination.pageSize), rowCount: result.length };
}
const helper = createColumnHelper<typeof serverFeatures, Product>();
function ProductScope({ identity }: { identity: string }) {
  const [query, dispatch] = useReducer(reducer, initialQuery);
  const [search, setSearch] = useState('');
  const [composing, setComposing] = useState(false);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ key: string; data: Product[]; rowCount: number; loading: boolean; error?: Error }>({ key: '', data: [], rowCount: 0, loading: true });
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const pendingIds = useRef(new Set<string>());
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [filterError, setFilterError] = useState('');
  const products = useRef(initialProducts.map((product) => ({ ...product })));
  const sequence = useRef(0);
  const requestOrdinal = useRef(0);
  const writeSequence = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const alive = useRef(true);
  const failNext = useRef(false);
  const failWrite = useRef(false);
  const [requestCount, setRequestCount] = useState(0);
  const requestKey = JSON.stringify([identity, query.sorting, query.columnFilters, query.globalFilter, query.pagination, revision]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; sequence.current++; writeSequence.current++; timers.current.forEach(clearTimeout); timers.current.clear(); }; }, []);
  useEffect(() => {
    if (composing) return;
    const timer = setTimeout(() => dispatch({ type: 'globalFilter', updater: search }), 250);
    return () => clearTimeout(timer);
  }, [search, composing]);
  useEffect(() => {
    const current = ++sequence.current;
    const ordinal = ++requestOrdinal.current;
    const fail = failNext.current; failNext.current = false;
    const capturedQuery = query;
    setRequestCount((count) => count + 1);
    setResult((old) => ({ ...old, key: requestKey, loading: true, error: undefined }));
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      if (!alive.current || current !== sequence.current) return;
      if (fail) { setResult({ key: requestKey, data: [], rowCount: 0, loading: false, error: new Error('模拟请求失败') }); return; }
      const next = queryProducts(products.current, capturedQuery);
      const last = Math.max(0, Math.ceil(next.rowCount / capturedQuery.pagination.pageSize) - 1);
      if (capturedQuery.pagination.pageIndex > last) { dispatch({ type: 'pagination', updater: { ...capturedQuery.pagination, pageIndex: last } }); return; }
      const invalid = new Set(products.current.filter((product) => product.locked).map((product) => product.id));
      dispatch({ type: 'rowSelection', updater: (old) => Object.fromEntries(Object.entries(old).filter(([id]) => !invalid.has(id))) });
      setResult({ ...next, key: requestKey, loading: false });
    }, ordinal % 2 ? 520 : 160);
    timers.current.add(timer);
    /*
     * 模拟不可取消的服务器响应，旧成功和失败确实会返回。
     * 请求序号负责丢弃旧结果，整表卸载仍清理所有待执行定时器。
     */
    return () => { sequence.current++; };
  }, [requestKey]);
  const save = useCallback((product: Product) => {
    /*
     * 同步集合阻止同一行在 React 提交前重复保存，其他行仍能独立操作。
     * 身份卸载通过代次使旧写入失效，失败保留原来的业务值。
     */
    if (pendingIds.current.has(product.id)) return;
    pendingIds.current.add(product.id);
    const task = writeSequence.current;
    const fail = failWrite.current;
    failWrite.current = false;
    setPending((old) => ({ ...old, [product.id]: true }));
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      if (!alive.current || task !== writeSequence.current) return;
      pendingIds.current.delete(product.id);
      setPending((old) => { const next = { ...old }; delete next[product.id]; return next; });
      if (fail) { dispatch({ type: 'notice', value: '置顶保存失败，已保留原值，可重试' }); return; }
      products.current = products.current.map((row) => row.id === product.id ? { ...row, pinned: !product.pinned } : row);
      dispatch({ type: 'notice', value: '置顶已保存，正在刷新当前查询' });
      setRevision((old) => old + 1);
    }, 450);
    timers.current.add(timer);
  }, []);
  /*
   * 图片失败只隐藏像素内容，始终保留固定占位。
   * 同一商品更新资源后，成功加载会恢复可见性，避免沿用失败时的样式。
   */
  const columns = useMemo(() => helper.columns([
    helper.accessor('image', { header: '图片', size: 72, enableSorting: false, enableHiding: false, cell: (cell) => <img className="apex-demo-product-image" src={cell.getValue()} width={36} height={36} alt="" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} onLoad={(event) => { event.currentTarget.style.visibility = ''; }} /> }),
    helper.accessor('code', { header: '商品编号', size: 132, cell: (cell) => <a href={`#product-${cell.row.id}`} onClick={(event) => { event.preventDefault(); dispatch({ type: 'notice', value: `商品详情：${cell.row.original.name}` }); }}>{cell.getValue()}</a> }),
    helper.accessor('name', { header: '商品名称', size: 220, meta: { apex: { flex: 1, pinPriority: 10 } }, cell: (cell) => <ApexTooltip content={`${cell.getValue()} · 商品 ${cell.row.id}`}><span>{cell.getValue()}</span></ApexTooltip> }),
    helper.accessor('status', { header: '状态', size: 90, cell: (cell) => <span className="apex-demo-status" data-active={cell.getValue() === '上架'}>{cell.getValue()}</span> }),
    helper.accessor('pinned', { header: '置顶', size: 88, enableSorting: false, cell: (cell) => <button type="button" role="switch" aria-checked={cell.getValue()} aria-label={`置顶 ${cell.row.original.name} ${cell.row.id}`} className="apex-demo-switch" disabled={pending[cell.row.id]} onClick={() => save(cell.row.original)}>{pending[cell.row.id] ? '…' : <span />}</button> }),
    helper.accessor('category', { header: '目录', size: 120 }),
    helper.accessor('brand', { header: '品牌', size: 100 }),
    helper.accessor('price', { header: '售价', size: 100, meta: { apex: { align: 'end' } }, cell: (cell) => `¥ ${cell.getValue().toFixed(2)}` }),
    helper.accessor('stock', { header: '库存', size: 96, meta: { apex: { align: 'end' } } }),
    helper.accessor('tags', { header: '标签', size: 190, enableSorting: false, cell: (cell) => <span className="apex-demo-tags">{cell.getValue().map((tag) => <span key={tag}>{tag}</span>)}</span> }),
    helper.display({ id: 'actions', header: '操作', size: 134, enablePinning: true, cell: (cell) => <span className="apex-demo-actions"><button type="button" onClick={() => dispatch({ type: 'notice', value: `编辑入口：${cell.row.original.name}` })}>编辑</button><ApexMenu items={[{ id: 'detail', label: '查看详情', onSelect: () => dispatch({ type: 'notice', value: `商品 ${cell.row.id} 的详情` }) }, { id: 'delete', label: '删除模拟商品', onSelect: () => { products.current = products.current.filter((product) => product.id !== cell.row.id); dispatch({ type: 'rowSelection', updater: (old) => { const next = { ...old }; delete next[cell.row.id]; return next; } }); setRevision((old) => old + 1); } }]} /></span> }),
  ]), [pending, save]);
  const table = useTable({ features: serverFeatures, data: result.data, columns, defaultColumn, getRowId: (row) => row.id, state: query, onSortingChange: (updater) => dispatch({ type: 'sorting', updater }), onColumnFiltersChange: (updater) => dispatch({ type: 'columnFilters', updater }), onGlobalFilterChange: (updater) => dispatch({ type: 'globalFilter', updater }), onPaginationChange: (updater) => dispatch({ type: 'pagination', updater }), onRowSelectionChange: (updater) => dispatch({ type: 'rowSelection', updater }), manualPagination: true, manualSorting: true, manualFiltering: true, rowCount: result.rowCount, enableMultiSort: false, sortDescFirst: false, autoResetPageIndex: false, columnResizeMode: 'onEnd', enableRowSelection: (row) => !row.original.locked, initialState: { columnPinning: { start: ['image', 'code'], end: ['actions'] } } }, () => null);
  useEffect(() => {
    const preferences = createLocalColumnPreferences({ namespace: 'apex-demo', userId: 'demo-user', tenantId: identity, tableId: 'products', schemaVersion: 1, onDiagnostic: () => dispatch({ type: 'notice', value: '列偏好暂不可用，继续使用当前布局' }) });
    const restored = preferences.load({ columns: table.getAllLeafColumns(), initialState: table.initialState });
    if (restored.columnOrder) table.setColumnOrder(restored.columnOrder);
    if (restored.columnVisibility) table.setColumnVisibility(restored.columnVisibility);
    if (restored.columnSizing) table.setColumnSizing(restored.columnSizing);
    if (restored.columnPinning) table.setColumnPinning(restored.columnPinning);
    let previous = table.store.state;
    const subscription = table.store.subscribe((state) => {
      if (state.columnOrder !== previous.columnOrder || state.columnVisibility !== previous.columnVisibility || state.columnSizing !== previous.columnSizing || state.columnPinning !== previous.columnPinning) preferences.save(state);
      previous = state;
    });
    return () => { subscription.unsubscribe(); preferences.dispose(); };
  }, [identity, table.store]);
  const loading = result.key !== requestKey || result.loading;
  /*
   * 故障入口只改动示例内存中的图片地址，仍经过同一业务刷新路径。
   * 恢复操作重新提供已有本地资源，不改变固定性能用例或资源清单。
   */
  const changeImage = (broken: boolean) => {
    const id = result.data[0]?.id;
    if (!id) return;
    products.current = products.current.map((product) => product.id === id ? { ...product, image: broken ? '/demo-assets/missing-example.svg' : `/demo-assets/product-${(Number(id) - 1) % 4}.svg` } : product);
    setRevision((old) => old + 1);
  };
  const submitPrice = () => {
    const empty = priceRange.min.trim() === '' && priceRange.max.trim() === '';
    const conditions: BusinessCondition[] = empty ? [] : [{ operator: 'between', value: [Number(priceRange.min), Number(priceRange.max)] }];
    if (!empty && (!priceRange.min.trim() || !priceRange.max.trim() || !validConditions(conditions))) { setFilterError('请输入完整且下限不大于上限的有限数值区间'); return; }
    setFilterError('');
    table.setColumnFilters((old) => [...old.filter((filter) => filter.id !== 'price'), ...(empty ? [] : [{ id: 'price', value: conditions }])]);
  };
  return <div className="apex-demo">
    <div className="apex-demo-query"><label>搜索商品<input value={search} placeholder="名称、编号或品牌" onCompositionStart={() => setComposing(true)} onCompositionEnd={(event) => { setComposing(false); setSearch(event.currentTarget.value); }} onChange={(event) => setSearch(event.currentTarget.value)} /></label><label>商品状态<select aria-label="商品状态" onChange={(event) => { const value = event.currentTarget.value; table.setColumnFilters((old) => [...old.filter((filter) => filter.id !== 'status'), ...(value ? [{ id: 'status', value: [{ operator: 'in', value: [...new Set([value])] }] }] : [])]); }}><option value="">全部状态</option><option>上架</option><option>下架</option></select></label><button type="button" onClick={() => setRevision((old) => old + 1)}>刷新</button><button type="button" onClick={() => { failNext.current = true; setRevision((old) => old + 1); }}>模拟请求失败</button><button type="button" onClick={() => { failWrite.current = true; dispatch({ type: 'notice', value: '下一次置顶保存将失败' }); }}>模拟保存失败</button></div>
    <form className="apex-demo-query" onSubmit={(event) => { event.preventDefault(); submitPrice(); }}><label>最低售价<input type="number" step="any" value={priceRange.min} onChange={(event) => { const value = event.currentTarget.value; setPriceRange((old) => ({ ...old, min: value })); }} /></label><label>最高售价<input type="number" step="any" value={priceRange.max} onChange={(event) => { const value = event.currentTarget.value; setPriceRange((old) => ({ ...old, max: value })); }} /></label><button type="submit">应用售价区间</button><span role="status">{filterError}</span></form>
    <details><summary>图片展示边界</summary><div className="apex-demo-query"><button type="button" disabled={loading || !result.data.length} onClick={() => changeImage(true)}>模拟首行图片失败</button><button type="button" disabled={loading || !result.data.length} onClick={() => changeImage(false)}>恢复首行图片</button></div></details>
    <ApexTable table={table} height={590} name="商品列表" showSelectionColumn showRowNumber columnSettingsEnabled loading={loading} error={result.key === requestKey ? result.error : undefined} onRetry={() => setRevision((old) => old + 1)} onRowClick={(row) => dispatch({ type: 'notice', value: `已打开商品：${row.original.name}（${row.id}）` })} />
    <div className="apex-demo-notice" role="status">{query.notice || '翻页与排序保留选择，搜索与状态筛选清空选择。'}<span>请求次数 {requestCount}</span></div>
  </div>;
}
export default function ProductTable() {
  const [identity, setIdentity] = useState('north');
  return <><div className="apex-demo-heading"><div><span>PRODUCT INVENTORY</span><h2>商品管理</h2><p>清晰呈现每一件商品，专注日常运营。</p></div><label>业务空间 <select value={identity} onChange={(event) => setIdentity(event.currentTarget.value)}><option value="north">北区商城</option><option value="south">南区商城</option></select></label></div><ProductScope key={identity} identity={identity} /></>;
}
