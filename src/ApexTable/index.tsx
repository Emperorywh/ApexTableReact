import { forwardRef, memo, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ForwardedRef, ReactElement, RefAttributes } from 'react';
import type { Cell, Header, RowData, TableFeatures, TableState } from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { ApexDensity, ApexDiagnostic, ApexRootDOM, ApexTableProps, ApexTableRef } from '../types';
import { zhCN } from '../locale';
import { UIContext, useUI } from '../internal/context';
import { diagnostic, focusWithoutScroll, hasProtectedProps, isInteractive, mergeDOM } from '../internal/dom';
import { calculateLayout, trackStyle } from '../internal/layout';
import type { Track } from '../internal/layout';
import { columnLabel } from '../internal/runtime';
import type { RuntimeProps, RuntimeRow, RuntimeTable } from '../internal/runtime';
import { HeaderCheckbox, RowCheckbox, SelectionSummary } from '../components/selection';
import { ResizeHandle } from '../components/resize';
import { Pagination } from '../components/pagination';
import { ColumnSettings } from '../components/column-settings';

/*
 * 渲染层接收原生实例，仅订阅影响模型和列布局的切片。
 * 行选择与拖动临时状态由局部控件订阅，避免刷新整个业务单元格区域。
 */
const emptySlots: NonNullable<RuntimeProps['slots']> = {};
const emptySlotProps: NonNullable<RuntimeProps['slotProps']> = {};
const densityHeights = { compact: 40, standard: 48, comfortable: 64 };
type ModelState = Pick<TableState<TableFeatures>, 'sorting' | 'columnFilters' | 'globalFilter' | 'pagination' | 'columnOrder' | 'columnVisibility' | 'columnSizing' | 'columnPinning'>;
const selectModelState = (state: TableState<TableFeatures>): ModelState => ({ sorting: state.sorting, columnFilters: state.columnFilters, globalFilter: state.globalFilter, pagination: state.pagination, columnOrder: state.columnOrder, columnVisibility: state.columnVisibility, columnSizing: state.columnSizing, columnPinning: state.columnPinning });

const CellContent = memo(function CellContent({ table, cell }: { table: RuntimeTable; cell: Cell<TableFeatures, RowData> }) {
  const { locale, slots, slotProps, root } = useUI();
  const node = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => () => {
    if (node.current?.contains(document.activeElement) && root.current?.isConnected) focusWithoutScroll(root.current);
  }, [root]);
  const rootProps = mergeDOM<ApexRootDOM>({ ref: node, className: 'apex-table-cell-content' }, slotProps.cellContent?.rootProps);
  /*
   * 插槽每次获得本次传入的原生 React 实例，不能保留旧外层对象。
   * 未变化的原生 cell 复用渲染元素，避免仅实例外层变化就执行业务渲染器。
   */
  const children = useMemo(() => <table.FlexRender cell={cell} />, [table.FlexRender, cell]);
  return slots.cellContent ? <slots.cellContent {...{ table, cell, locale, rootProps, children }} /> : <div {...rootProps}>{children}</div>;
}, (previous, next) => previous.cell === next.cell && previous.table === next.table);

function HeaderCell({ table, track, header, index, tableId }: { table: RuntimeTable; track: Track; header?: Header<TableFeatures, RowData>; index: number; tableId: string }) {
  const { slots, slotProps, locale, root } = useUI();
  const element = useRef<HTMLTableCellElement>(null);
  useLayoutEffect(() => () => {
    if (element.current?.contains(document.activeElement) && root.current?.isConnected) focusWithoutScroll(root.current);
  }, [root]);
  const column = track.column!;
  const direction = column.getIsSorted?.() ?? false;
  const sortable = column.getCanSort?.() ?? false;
  const iconProps = mergeDOM({ 'aria-hidden': true as const, className: 'apex-table-sort-icon' }, slotProps.sortIcon?.rootProps);
  const icon = slots.sortIcon ? <slots.sortIcon direction={direction} rootProps={iconProps} /> : <span {...iconProps}>{direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : '↕'}</span>;
  const rootProps = mergeDOM<ApexRootDOM>({ className: 'apex-table-header-content' }, slotProps.headerContent?.rootProps);
  const sortButtonProps = mergeDOM({ type: 'button' as const, className: 'apex-table-sort-button', disabled: !sortable, 'aria-label': locale.sortColumn(columnLabel(column)), onClick: () => column.toggleSorting?.(undefined, false) }, slotProps.headerContent?.sortButtonProps);
  const children = <>{header ? <table.FlexRender header={header} /> : columnLabel(column)}{sortable && icon}</>;
  return <th ref={element} role="columnheader" scope="col" id={`${tableId}-col-${index}`} aria-colindex={index + 1} aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : sortable ? 'none' : undefined} className="apex-table-header-cell" data-column-id={column.id} data-pinned={track.sticky || undefined} data-align={column.columnDef.meta?.apex?.align} style={trackStyle(track)}>
    {slots.headerContent && header ? <slots.headerContent {...{ table, header, column, locale, rootProps, sortButtonProps, sortable, children }} /> : <div {...rootProps}>{sortable ? <button {...sortButtonProps} type="button">{children}</button> : children}</div>}
    <ResizeHandle table={table} column={column} renderedSize={track.size} />
  </th>;
}
const DataRow = memo(function DataRow({ table, row, index, offset, tracks, tableId, onRowClick }: { table: RuntimeTable; row: RuntimeRow; index: number; offset: number; tracks: Track[]; tableId: string; onRowClick: RuntimeProps['onRowClick'] }) {
  const { root } = useUI();
  const node = useRef<HTMLTableRowElement>(null);
  useLayoutEffect(() => () => {
    if (node.current?.contains(document.activeElement) && root.current?.isConnected) focusWithoutScroll(root.current);
  }, [root]);
  const nativeCells = row.getAllCells();
  const cells = useMemo(() => new Map(nativeCells.map((cell) => [cell.column.id, cell])), [nativeCells]);
  const children = tracks.map((track, colIndex) => <td role="cell" key={`${track.kind}:${track.key}`} headers={`${tableId}-col-${colIndex}`} aria-colindex={colIndex + 1} className="apex-table-cell" data-column-id={track.kind === 'column' ? track.key : undefined} data-apex-track={track.kind} data-pinned={track.sticky || undefined} data-align={track.column?.columnDef.meta?.apex?.align} style={trackStyle(track)}>
    {track.kind === 'selection' ? <RowCheckbox table={table} row={row} /> : track.kind === 'number' ? offset + index + 1 : cells.has(track.key) ? <CellContent table={table} cell={cells.get(track.key)!} /> : null}
  </td>);
  const render = (selected: boolean) => <tr ref={node} role="row" aria-rowindex={offset + index + 2} className="apex-table-row" data-row-id={row.id} data-selected={selected || undefined} onClick={(event) => {
    if (!event.defaultPrevented && !isInteractive(event.target) && !window.getSelection()?.toString()) onRowClick?.(row, event);
  }}>{children}</tr>;
  return table.atoms.rowSelection ? <table.Subscribe source={table.atoms.rowSelection} selector={(state) => !!state[row.id]}>{render}</table.Subscribe> : render(false);
}, (a, b) => a.row === b.row && a.index === b.index && a.offset === b.offset && a.tracks === b.tracks && a.tableId === b.tableId && a.table === b.table && a.onRowClick === b.onRowClick);

function BodyState({ props, error, filtered, rows, height }: { props: RuntimeProps; error?: ApexDiagnostic; filtered: boolean; rows: number; height: number }) {
  const { slots, slotProps, locale } = useUI();
  if (error || (!props.loading && (props.error !== null && props.error !== undefined) && props.error !== false && props.error !== '')) {
    const rootProps = mergeDOM<ApexRootDOM>({ className: 'apex-table-error', role: 'alert' }, slotProps.error?.rootProps);
    const retryButtonProps = !error && props.onRetry ? mergeDOM({ type: 'button' as const, onClick: props.onRetry }, slotProps.error?.retryButtonProps) : undefined;
    const children = <><strong>{error?.message ?? locale.error}</strong>{retryButtonProps && <button {...retryButtonProps} type="button">{locale.retry}</button>}</>;
    return slots.error ? <slots.error {...{ locale, error: error ?? props.error, diagnostic: error, rootProps, retryButtonProps, children }} /> : <div {...rootProps}>{children}</div>;
  }
  if (props.loading) {
    const rootProps = mergeDOM<ApexRootDOM>({ className: 'apex-table-skeleton', role: 'status', 'aria-label': locale.loading }, slotProps.loading?.rootProps);
    const children = <><span className="apex-table-visually-hidden">{locale.loading}</span>{Array.from({ length: Math.min(16, Math.max(3, Math.ceil(height / rows))) }).map((_, index) => <div key={index} className="apex-table-skeleton-row" aria-hidden="true"><span /><span /><span /><span /></div>)}</>;
    return slots.loading ? <slots.loading {...{ locale, rootProps, children }} /> : <div {...rootProps}>{children}</div>;
  }
  const rootProps = mergeDOM<ApexRootDOM>({ className: 'apex-table-empty', role: 'status' }, slotProps.empty?.rootProps);
  const children = props.table.getAllLeafColumns().every((column) => column.getIsVisible?.() === false) ? locale.noColumns : filtered ? locale.noMatches : locale.empty;
  return slots.empty ? <slots.empty {...{ locale, filtered, rootProps, children }} /> : <div {...rootProps}>{children}</div>;
}

function Surface({ props, model, imperativeRef }: { props: RuntimeProps; model: ModelState; imperativeRef: ForwardedRef<ApexTableRef> }) {
  const { table } = props;
  const root = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const tableId = useId();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, measured: false });
  const [internalDensity, setInternalDensity] = useState<ApexDensity>(props.defaultDensity ?? 'standard');
  const [settings, setSettings] = useState(false);
  const closeSettings = useCallback(() => setSettings(false), []);
  const density = props.density ?? internalDensity;
  const rowHeight = props.rowHeight ?? densityHeights[density];
  const validHeight = Number.isFinite(rowHeight) && rowHeight >= 32;
  const safeHeight = validHeight ? rowHeight : 48;
  const locale = useMemo(() => ({ ...zhCN, ...Object.fromEntries(Object.entries(props.locale ?? {}).filter(([, value]) => value !== undefined)) }), [props.locale]);
  const slots = props.slots ?? emptySlots;
  const slotProps = props.slotProps ?? emptySlotProps;
  const closeSignal = useMemo(() => ({}), [model.sorting, model.columnFilters, model.globalFilter, model.pagination?.pageIndex, model.pagination?.pageSize]);
  const ui = useMemo(() => ({ root, viewport, locale, slots, slotProps, closeSignal, getPopupContainer: props.getPopupContainer }), [locale, slots, slotProps, closeSignal, props.getPopupContainer]);
  const rowModel = table.getRowModel();
  const rows = rowModel.rows;
  const hasPagination = typeof table.getPaginatedRowModel === 'function' && typeof table.getPageCount === 'function';
  const rawOverscan = typeof props.virtualization === 'object' ? props.virtualization.overscan ?? 8 : 8;
  const validOverscan = Number.isInteger(rawOverscan) && rawOverscan >= 0;
  const overscan = validOverscan ? rawOverscan : 8;
  const virtual = props.virtualization === undefined || props.virtualization === 'auto' ? !hasPagination || rows.length > 200 : props.virtualization !== false;
  const tracks = useMemo(() => calculateLayout(table, dimensions.width, props.showSelectionColumn ?? false, props.showRowNumber ?? false), [table.store, table.options.columns, table.options.defaultColumn, model.columnOrder, model.columnVisibility, model.columnSizing, model.columnPinning, dimensions.width, props.showSelectionColumn, props.showRowNumber]);
  const width = tracks.reduce((sum, track) => sum + track.size, 0);
  const coreRows = table.getCoreRowModel().rows;
  const identityError = useMemo(() => {
    const ids = new Set<string>();
    if (coreRows.some((row) => !row.id || ids.size === ids.add(row.id).size)) return 'duplicateRowId';
    const columns = table.getAllFlatColumns();
    const columnIds = new Set<string>();
    if (columns.some((column) => !column.id || columnIds.size === columnIds.add(column.id).size)) return 'duplicateColumnId';
    return undefined;
  }, [coreRows, table.options.columns, table.store]);
  const headers = table.getHeaderGroups();
  const nestedRows = useMemo(() => coreRows.some((row) => row.subRows?.length), [coreRows]);
  const unsupported = headers.length > 1 || nestedRows || !!table.atoms.grouping?.get()?.length;
  const badPagination = model.pagination && (!Number.isInteger(model.pagination.pageIndex) || model.pagination.pageIndex < 0 || !Number.isInteger(model.pagination.pageSize) || model.pagination.pageSize < 1);
  const invalid = !validHeight || !validOverscan || tracks.some((track) => !Number.isFinite(track.size) || track.size <= 0) || (typeof props.height === 'number' && (!Number.isFinite(props.height) || props.height <= 0));
  const unmeasurable = dimensions.measured && dimensions.width > 0 && dimensions.height <= 44;
  /*
   * 分页与几何配置分别诊断，让调用方能定位实际无效的原生切片。
   * 只停止不可靠的界面操作，不通过 setter 改写传入的非法值。
   */
  const errorCode = identityError ?? (badPagination ? 'invalidPagination' : invalid ? 'invalidGeometry' : unsupported ? 'unsupportedLayout' : unmeasurable ? 'unmeasurable' : undefined);
  const configError = errorCode ? diagnostic(errorCode, locale[errorCode]) : undefined;
  const failed = (props.error !== null && props.error !== undefined) && props.error !== false && props.error !== '';
  const unavailable = !!configError || !!props.loading || failed;
  const hasColumns = tracks.some((track) => track.kind === 'column');
  const filtered = !!model.columnFilters?.length || ((model.globalFilter !== null && model.globalFilter !== undefined) && model.globalFilter !== '' && model.globalFilter !== false);
  const canRender = !unavailable && hasColumns && dimensions.width > 0 && dimensions.height > 0;
  const virtualizer = useVirtualizer({ count: canRender && virtual ? rows.length : 0, getScrollElement: () => viewport.current, estimateSize: () => safeHeight, getItemKey: (index) => rows[index]?.id ?? index, overscan, scrollMargin: 44, enabled: canRender && virtual });
  const items = virtualizer.getVirtualItems();
  /*
   * 隐藏后恢复时，虚拟窗口可能晚于容器尺寸重新建立。
   * 等占位轨道已经挂载再恢复锚点，避免滚动目标被临时空表体钳制为零。
   */
  const anchorReady = canRender && (!virtual || items.length > 0);
  const range = virtual ? items.map((item) => item.index) : canRender ? rows.map((_, index) => index) : [];
  const top = items.length ? Math.max(0, items[0].start - 44) : 0;
  const bottom = items.length ? Math.max(0, virtualizer.getTotalSize() - (items[items.length - 1].end - 44)) : 0;
  const anchor = useRef<{ id?: string; index: number; offset: number }>({ index: 0, offset: 0 });
  const previousQuery = useRef({ source: table.store, sorting: model.sorting, filters: model.columnFilters, global: model.globalFilter, page: model.pagination });
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      const next = { width: element.clientWidth, height: element.clientHeight, measured: true };
      setDimensions((old) => old.measured && old.width === next.width && old.height === next.height ? old : next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const previous = previousQuery.current;
    const changed = previous.source !== table.store || previous.sorting !== model.sorting || previous.filters !== model.columnFilters || previous.global !== model.globalFilter || previous.page?.pageIndex !== model.pagination?.pageIndex || previous.page?.pageSize !== model.pagination?.pageSize;
    previousQuery.current = { source: table.store, sorting: model.sorting, filters: model.columnFilters, global: model.globalFilter, page: model.pagination };
    if (!viewport.current) return;
    if (changed) { viewport.current.scrollTop = 0; anchor.current = { index: 0, offset: 0 }; }
    else if (anchorReady) {
      const match = anchor.current.id ? rows.findIndex((row) => row.id === anchor.current.id) : anchor.current.index;
      const index = Math.max(0, Math.min(rows.length - 1, match < 0 ? anchor.current.index : match));
      viewport.current.scrollTop = index * safeHeight + Math.min(anchor.current.offset, safeHeight - 1);
    }
    viewport.current.scrollLeft = Math.min(viewport.current.scrollLeft, Math.max(0, width - viewport.current.clientWidth));
  }, [rows, safeHeight, model.sorting, model.columnFilters, model.globalFilter, model.pagination, table.store, canRender, anchorReady, width]);
  useLayoutEffect(() => { virtualizer.measure(); }, [safeHeight, virtualizer]);
  useEffect(() => { closeSettings(); }, [table.store, closeSettings]);
  useEffect(() => {
    const report = props.onDiagnostic ?? ((event: ApexDiagnostic) => console.warn(`ApexTable: ${event.message}`));
    if (errorCode) report(diagnostic(errorCode, locale[errorCode]));
    if (!virtual && rows.length > 1000) report(diagnostic('virtualizationDisabled', locale.virtualizationDisabled));
    if (hasProtectedProps(slotProps)) report(diagnostic('protectedProp', locale.protectedProp));
  }, [errorCode, virtual, rows.length, props.onDiagnostic, locale, slotProps]);
  useImperativeHandle(imperativeRef, () => ({ focus: () => focusWithoutScroll(root.current), scrollToRow: (rowId) => {
    if (!canRender) return false;
    const index = rows.findIndex((row) => row.id === rowId);
    if (index < 0 || !viewport.current) return false;
    viewport.current.scrollTop = index * safeHeight;
    return true;
  } }), [rows, safeHeight, canRender]);
  const setDensity = (next: ApexDensity) => { if (props.density === undefined) setInternalDensity(next); props.onDensityChange?.(next); };
  const toolbarProps = mergeDOM<ApexRootDOM>({ className: 'apex-table-toolbar' }, slotProps.toolbar?.rootProps);
  const toolbarChildren = <><SelectionSummary table={table} />{props.columnSettingsEnabled && <button data-apex-settings-trigger type="button" aria-expanded={settings} onClick={() => setSettings(!settings)}>{locale.columnSettings}</button>}</>;
  const nativeOffset = table.options.manualPagination && model.pagination ? model.pagination.pageIndex * model.pagination.pageSize : hasPagination && model.pagination ? model.pagination.pageIndex * model.pagination.pageSize : 0;
  const totalRows = unavailable ? undefined : hasPagination ? table.getPageCount() < 0 ? undefined : table.getRowCount() : rows.length;
  const headerMap = new Map(headers.flatMap((group) => group.headers).map((header) => [header.column.id, header]));
  return <UIContext.Provider value={ui}>
    <div ref={root} className={['apex-table', props.className].filter(Boolean).join(' ')} style={{ ...props.style, height: props.height ?? '100%', '--apex-geometry-row-height': `${safeHeight}px` } as CSSProperties} tabIndex={-1} data-density={density} aria-busy={props.loading || undefined}>
      {(slots.toolbar || table.atoms.rowSelection || props.columnSettingsEnabled) && (slots.toolbar ? <slots.toolbar {...{ table, locale, density, setDensity, openColumnSettings: () => setSettings(true), rootProps: toolbarProps, children: toolbarChildren }} /> : <div {...toolbarProps}>{toolbarChildren}</div>)}
      {settings && <ColumnSettings table={table} width={dimensions.width} tracks={tracks} onClose={closeSettings} />}
      <div ref={viewport} className="apex-table-viewport" onScroll={(event) => {
        /*
         * display:none 可能先产生滚动归零事件，再通知尺寸观察器。
         * 读取实时可见尺寸，并忽略虚拟轨道尚未恢复时的临时滚动事件。
         */
        if (!anchorReady || !event.currentTarget.clientWidth || event.currentTarget.clientHeight <= 44) return;
        const index = Math.min(rows.length - 1, Math.max(0, Math.floor(event.currentTarget.scrollTop / safeHeight)));
        anchor.current = { id: rows[index]?.id, index, offset: event.currentTarget.scrollTop % safeHeight };
      }}>
        <table role="table" aria-label={props.name ?? locale.tableName} aria-rowcount={totalRows === undefined ? -1 : totalRows + 1} aria-colcount={tracks.length} className="apex-table-grid" style={{ width: Math.max(width, dimensions.width) }}>
          <thead role="rowgroup" className="apex-table-header"><tr role="row" aria-rowindex={1}>
            {tracks.map((track, index) => track.kind === 'column' ? <HeaderCell key={`column:${track.key}`} table={table} track={track} index={index} tableId={tableId} header={headerMap.get(track.key)} /> : <th role="columnheader" scope="col" key={track.key} id={`${tableId}-col-${index}`} aria-colindex={index + 1} className="apex-table-header-cell" data-pinned={track.sticky || undefined} style={trackStyle(track)}>{track.kind === 'selection' ? <HeaderCheckbox table={table} unavailable={unavailable} /> : locale.rowNumber}</th>)}
          </tr></thead>
          <tbody role="rowgroup" className="apex-table-body">
            {canRender && rows.length > 0 && <>
              {top > 0 && <tr aria-hidden="true" role="presentation" className="apex-table-spacer" style={{ height: top }}><td /></tr>}
              {range.map((index) => <DataRow key={rows[index].id} table={table} row={rows[index]} index={index} offset={nativeOffset} tracks={tracks} tableId={tableId} onRowClick={props.onRowClick} />)}
              {bottom > 0 && <tr aria-hidden="true" role="presentation" className="apex-table-spacer" style={{ height: bottom }}><td /></tr>}
            </>}
          </tbody>
        </table>
        {(unavailable || !rows.length || !hasColumns) && <BodyState props={props} error={configError} filtered={filtered} rows={safeHeight} height={dimensions.height} />}
      </div>
      {props.pagination !== false && hasPagination && <Pagination table={table} unavailable={unavailable} pageSizeOptions={props.pagination ? props.pagination.pageSizeOptions : undefined} />}
    </div>
  </UIContext.Provider>;
}
function ApexTableImpl(props: RuntimeProps, ref: ForwardedRef<ApexTableRef>) {
  return <props.table.Subscribe selector={selectModelState}>{(model) => <Surface props={props} model={model} imperativeRef={ref} />}</props.table.Subscribe>;
}

/*
 * forwardRef 在 React 18 与 19 均可用，公开调用签名保留三项原生泛型。
 * 内部转换不创建新实例，传给所有插槽的仍是调用方传入的 table。
 */
export const ApexTable = forwardRef(ApexTableImpl) as <F extends TableFeatures, D extends RowData, S = TableState<F>>(props: ApexTableProps<F, D, S> & RefAttributes<ApexTableRef>) => ReactElement;
