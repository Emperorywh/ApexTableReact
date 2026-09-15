import type { Cell, CellData, Column, Header, PaginationState, ReactTable, Row, RowData, RowSelectionState, TableFeatures, TableState } from '@tanstack/react-table';
import type { ButtonHTMLAttributes, ComponentPropsWithRef, ComponentType, CSSProperties, HTMLAttributes, InputHTMLAttributes, MouseEvent, ReactNode, Ref, SelectHTMLAttributes } from 'react';

/*
 * 元数据只增加界面信息；业务可以通过原生 columnMeta 槽与本类型交叉合并。
 * 全局声明合并保留已有业务字段，不重复定义原生尺寸或权限字段。
 */
export interface ApexColumnMeta {
  align?: 'start' | 'center' | 'end';
  flex?: number;
  pinPriority?: number;
  canReorder?: boolean;
  label?: string;
}
declare module '@tanstack/react-table' {
  /*
   * 原生声明合并必须保留全部泛型形参，即使扩展不消费这些形参。
   * 仅对这一条声明关闭未使用形参检查，其他公开类型继续严格检查。
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TFeatures extends TableFeatures, TData extends RowData, TValue extends CellData> {
    apex?: ApexColumnMeta;
  }
}
export type ApexDensity = 'compact' | 'standard' | 'comfortable';
export type ApexTrack = boolean | { size?: number; sticky?: false | 'start' | 'end' };
export interface ApexTableRef {
  focus(): void;
  scrollToRow(rowId: string): boolean;
}
export type ApexDiagnosticCode = 'invalidGeometry' | 'invalidPagination' | 'duplicateRowId' | 'duplicateColumnId' | 'unmeasurable' | 'unsupportedLayout' | 'virtualizationDisabled' | 'protectedProp';
export interface ApexDiagnostic { code: ApexDiagnosticCode; message: string }
export interface ApexLocale {
  tableName: string;
  loading: string;
  empty: string;
  noMatches: string;
  noColumns: string;
  error: string;
  retry: string;
  columnSettings: string;
  close: string;
  resetLayout: string;
  clearSelection: string;
  selectPage: string;
  selectResults: string;
  rowNumber: string;
  previousPage: string;
  nextPage: string;
  pageSize: string;
  jumpToPage: string;
  pageUnit: string;
  pinStart: string;
  pinEnd: string;
  unpin: string;
  moveUp: string;
  moveDown: string;
  width: string;
  showColumn: string;
  minOneColumn: string;
  pinSpace: string;
  unknownTotal: string;
  unsupportedLayout: string;
  invalidGeometry: string;
  invalidPagination: string;
  duplicateRowId: string;
  duplicateColumnId: string;
  unmeasurable: string;
  virtualizationDisabled: string;
  protectedProp: string;
  compact: string;
  standard: string;
  comfortable: string;
  density: string;
  menu: string;
  selectRow(id: string): string;
  sortColumn(label: string): string;
  resizeColumn(label: string): string;
  page(index: number): string;
  total(count: number): string;
  selected(count: number): string;
  perPage(count: number): string;
}

/*
 * 插槽补充属性在类型层排除状态、语义、身份和几何。
 * 完整 props 包仍包含必要属性，替换控件必须转发到对应真实元素。
 */
type Geometry = 'position' | 'display' | 'width' | 'minWidth' | 'maxWidth' | 'height' | 'minHeight' | 'maxHeight' | 'top' | 'bottom' | 'left' | 'right' | 'inset' | 'transform' | 'overflow' | 'overflowX' | 'overflowY' | 'flex' | 'flexBasis' | 'gridTemplateColumns' | 'boxSizing' | 'zIndex';
type Protected = 'id' | 'role' | 'tabIndex' | 'children' | 'style' | 'dangerouslySetInnerHTML' | 'checked' | 'defaultChecked' | 'disabled' | 'type' | 'value' | 'defaultValue' | 'min' | 'max' | 'step' | 'aria-label' | 'aria-labelledby' | 'aria-checked' | 'aria-sort' | 'aria-rowindex' | 'aria-colindex' | 'aria-rowcount' | 'aria-colcount' | 'aria-busy' | 'aria-expanded' | 'aria-controls' | 'aria-haspopup' | 'aria-hidden' | 'aria-current' | 'aria-orientation' | 'aria-valuenow' | 'aria-valuemin' | 'aria-valuemax' | 'aria-live';
export type ApexDOMExtension<T> = Omit<T, Protected> & { style?: Omit<CSSProperties, Geometry> };
export type ApexRootDOM = HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> };
export type ApexButtonDOM = ButtonHTMLAttributes<HTMLButtonElement> & { ref?: Ref<HTMLButtonElement> };
export type ApexInputDOM = InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> };
export type ApexSelectDOM = SelectHTMLAttributes<HTMLSelectElement> & { ref?: Ref<HTMLSelectElement> };
export type ApexCheckboxDOM = ApexInputDOM & { indeterminate: boolean };
export interface ApexSlotProps {
  toolbar?: { rootProps?: ApexDOMExtension<ApexRootDOM> };
  headerContent?: { rootProps?: ApexDOMExtension<ApexRootDOM>; sortButtonProps?: ApexDOMExtension<ApexButtonDOM> };
  sortIcon?: { rootProps?: ApexDOMExtension<ComponentPropsWithRef<'span'>> };
  cellContent?: { rootProps?: ApexDOMExtension<ApexRootDOM> };
  checkbox?: { controlProps?: ApexDOMExtension<ApexInputDOM> };
  resizeHandle?: { handleProps?: ApexDOMExtension<ApexRootDOM>; widthInputProps?: ApexDOMExtension<ApexInputDOM> };
  pagination?: { rootProps?: ApexDOMExtension<ComponentPropsWithRef<'nav'>>; pageButtonProps?: ApexDOMExtension<ApexButtonDOM>; pageSizeProps?: ApexDOMExtension<ApexSelectDOM>; jumpInputProps?: ApexDOMExtension<ApexInputDOM> };
  columnSettings?: { rootProps?: ApexDOMExtension<ApexRootDOM> };
  menu?: { triggerProps?: ApexDOMExtension<ApexButtonDOM>; contentProps?: ApexDOMExtension<ApexRootDOM>; itemProps?: ApexDOMExtension<ApexButtonDOM> };
  tooltip?: { triggerProps?: ApexDOMExtension<ComponentPropsWithRef<'span'>>; contentProps?: ApexDOMExtension<ApexRootDOM> };
  loading?: { rootProps?: ApexDOMExtension<ApexRootDOM> };
  empty?: { rootProps?: ApexDOMExtension<ApexRootDOM> };
  error?: { rootProps?: ApexDOMExtension<ApexRootDOM>; retryButtonProps?: ApexDOMExtension<ApexButtonDOM> };
  selectionSummary?: { rootProps?: ApexDOMExtension<ApexRootDOM> };
}
export interface ApexMenuItem { id: string; label: ReactNode; disabled?: boolean; onSelect(): void }
export interface ApexMenuSlot {
  open: boolean;
  items: readonly ApexMenuItem[];
  triggerProps: ApexButtonDOM;
  contentProps: ApexRootDOM;
  getItemProps(id: string): ApexButtonDOM;
  children: ReactNode;
}
export interface ApexTooltipSlot {
  open: boolean;
  content: ReactNode;
  triggerProps: ComponentPropsWithRef<'span'>;
  contentProps: ApexRootDOM;
  children: ReactNode;
}
/*
 * 插槽按真实 React 组件渲染，允许组件自己的 Hook、memo 和 forwardRef。
 * 不将组件对象当普通函数调用，也不让插槽 Hook 混入表格本身的调用顺序。
 * 上下文容器属性只读，原生实例及其方法仍保留原始类型和调用能力。
 */
type Slot<P> = ComponentType<Readonly<P>>;
type Native<F extends TableFeatures, D extends RowData, S> = { readonly table: ReactTable<F, D, S>; locale: ApexLocale };
export interface ApexSlots<F extends TableFeatures, D extends RowData, S = TableState<F>> {
  toolbar: Slot<Native<F, D, S> & { density: ApexDensity; setDensity(value: ApexDensity): void; openColumnSettings(): void; rootProps: ApexRootDOM; children: ReactNode }>;
  headerContent: Slot<Native<F, D, S> & { header: Header<F, D>; column: Column<F, D>; rootProps: ApexRootDOM; sortButtonProps: ApexButtonDOM; children: ReactNode; sortable: boolean }>;
  sortIcon: Slot<{ direction: false | 'asc' | 'desc'; rootProps: ComponentPropsWithRef<'span'> }>;
  cellContent: Slot<Native<F, D, S> & { cell: Cell<F, D>; rootProps: ApexRootDOM; children: ReactNode }>;
  checkbox: Slot<Native<F, D, S> & { row?: Row<F, D>; scope: 'row' | 'page' | 'results'; controlProps: ApexCheckboxDOM }>;
  resizeHandle: Slot<Native<F, D, S> & { column: Column<F, D>; resizing: boolean; handleProps: ApexRootDOM; widthInputProps: ApexInputDOM }>;
  pagination: Slot<Native<F, D, S> & { pagination: PaginationState; total: number | undefined; pageCount: number; unavailable: boolean; rootProps: ComponentPropsWithRef<'nav'>; getPageButtonProps(index: number): ApexButtonDOM; pageSizeProps: ApexSelectDOM; jumpInputProps: ApexInputDOM; children: ReactNode }>;
  columnSettings: Slot<Native<F, D, S> & { columns: Column<F, D>[]; onClose(): void; rootProps: ApexRootDOM; children: ReactNode }>;
  menu: Slot<ApexMenuSlot>;
  tooltip: Slot<ApexTooltipSlot>;
  loading: Slot<{ locale: ApexLocale; rootProps: ApexRootDOM; children: ReactNode }>;
  empty: Slot<{ locale: ApexLocale; filtered: boolean; rootProps: ApexRootDOM; children: ReactNode }>;
  error: Slot<{ locale: ApexLocale; error: unknown; diagnostic?: ApexDiagnostic; rootProps: ApexRootDOM; retryButtonProps?: ApexButtonDOM; children: ReactNode }>;
  selectionSummary: Slot<Native<F, D, S> & { rowSelection: RowSelectionState; count: number; rootProps: ApexRootDOM; children: ReactNode }>;
}
export interface ApexTableProps<F extends TableFeatures, D extends RowData, S = TableState<F>> {
  /*
   * 直接的 state 推断位置补足组合 Hook 的交叉类型推断。
   * 原生 Readonly 状态结构不变，也不要求所选状态包含任何特性切片。
   */
  table: ReactTable<F, D, S> & { readonly state: S };
  height?: number | string;
  rowHeight?: number;
  density?: ApexDensity;
  defaultDensity?: ApexDensity;
  onDensityChange?(value: ApexDensity): void;
  virtualization?: 'auto' | boolean | { overscan?: number };
  showSelectionColumn?: ApexTrack;
  showRowNumber?: ApexTrack;
  columnSettingsEnabled?: boolean;
  pagination?: false | { pageSizeOptions?: number[] };
  loading?: boolean;
  error?: unknown;
  onRetry?(): void;
  onRowClick?(row: Row<F, D>, event: MouseEvent<HTMLTableRowElement>): void;
  slots?: Partial<ApexSlots<F, D, S>>;
  slotProps?: ApexSlotProps;
  locale?: Partial<ApexLocale>;
  name?: string;
  className?: string;
  style?: CSSProperties;
  onDiagnostic?(diagnostic: ApexDiagnostic): void;
  getPopupContainer?(): HTMLElement;
}
