import { useState } from 'react';
import { createColumnHelper, createPaginatedRowModel, rowPaginationFeature, rowSelectionFeature, tableFeatures, useTable } from '@tanstack/react-table';
import { ApexMenu, ApexTable } from '../../src';
import type { ApexSlots } from '../../src';
import './demo.css';
import '../../src/styles/structure.css';
import '../../src/styles/theme.css';

/*
 * 组件插槽转发完整 DOM props 包，每个真实控件只调用合并后的事件一次。
 * 原生选择/分页由实例负责，业务仅选择是否取消或停止事件传播。
 */
const features = tableFeatures({ rowSelectionFeature, rowPaginationFeature, paginatedRowModel: createPaginatedRowModel() });
type Item = { id: string; name: string };
const helper = createColumnHelper<typeof features, Item>();
const data: Item[] = [{ id: 'a', name: '陶瓷杯' }, { id: 'b', name: '亚麻桌布' }, { id: 'c', name: '玻璃花瓶' }];
const columns = helper.columns([helper.accessor('name', { header: '物品名称' }), helper.display({ id: 'actions', header: '自定义菜单', cell: (cell) => <ApexMenu items={[{ id: 'select', label: `选择 ${cell.row.original.name}`, onSelect: () => cell.row.toggleSelected(true) }, { id: 'disabled', label: '无权限操作', disabled: true, onSelect: () => undefined }]} /> })]);
const slots: Partial<ApexSlots<typeof features, Item, null>> = {
  toolbar: ({ rootProps, children }) => <div {...rootProps}><strong>自定义控件示例</strong>{children}</div>,
  checkbox: ({ controlProps }) => { const { indeterminate, ref, ...props } = controlProps; return <input {...props} ref={(node) => { if (node) node.indeterminate = indeterminate; if (typeof ref === 'function') return ref(node); if (ref) ref.current = node; }} />; },
  menu: ({ open, items, triggerProps, contentProps, getItemProps }) => <><button type="button" {...triggerProps}>更多 ▾</button>{open && <div {...contentProps}>{items.map((item) => <button type="button" key={item.id} {...getItemProps(item.id)}>{item.label}</button>)}</div>}</>,
  pagination: ({ rootProps, pageCount, getPageButtonProps, pageSizeProps, jumpInputProps, locale, unavailable, total }) => <nav {...rootProps}><span>{unavailable ? '—' : locale.total(total ?? 0)}</span>{Array.from({ length: pageCount }, (_, index) => <button type="button" key={index} {...getPageButtonProps(index)}>{index + 1}</button>)}<select {...pageSizeProps}><option value={2}>2 条/页</option><option value={3}>3 条/页</option></select><label>{locale.jumpToPage}<input {...jumpInputProps} /></label></nav>,
  error: ({ rootProps, retryButtonProps }) => <div {...rootProps}><strong>业务结果暂不可用</strong><span>这是替换后的错误区域。</span>{retryButtonProps && <button type="button" {...retryButtonProps}>重新载入</button>}</div>,
};
export default function AdvancedSlots() {
  const [strategy, setStrategy] = useState('allow');
  const [error, setError] = useState(false);
  const table = useTable({ features, data, columns, getRowId: (row) => row.id, initialState: { pagination: { pageIndex: 0, pageSize: 2 } } }, () => null);
  return <div className="apex-demo"><div className="apex-demo-query"><label>复选框事件策略<select value={strategy} onChange={(event) => setStrategy(event.currentTarget.value)}><option value="allow">正常提交</option><option value="cancel">preventDefault 取消</option><option value="propagation">仅 stopPropagation</option></select></label><button type="button" onClick={() => setError(true)}>展示自定义错误</button></div><ApexTable table={table} height={330} showSelectionColumn error={error ? new Error('业务演示错误') : undefined} onRetry={() => setError(false)} slots={slots} slotProps={{ checkbox: { controlProps: { onChange: (event) => { if (strategy === 'cancel') event.preventDefault(); if (strategy === 'propagation') event.stopPropagation(); } } } }} /></div>;
}

