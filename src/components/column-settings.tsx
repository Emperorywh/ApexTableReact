import { useLayoutEffect, useRef, useState } from 'react';
import type { ApexRootDOM } from '../types';
import { useUI } from '../internal/context';
import { focusWithoutScroll, mergeDOM } from '../internal/dom';
import { clampWidth, columnLabel } from '../internal/runtime';
import type { RuntimeColumn, RuntimeTable } from '../internal/runtime';
import type { Track } from '../internal/layout';

/*
 * 面板维护原生分区顺序：固定区修改 pinning 数组，中间区修改 columnOrder。
 * 锁定仅约束面板动作，不拦截业务直接设置的合法状态。
 */
export function ColumnSettings({ table, tracks, width, onClose }: { table: RuntimeTable; tracks: Track[]; width: number; onClose(): void }) {
  const { locale, slots, slotProps, root } = useUI();
  const panel = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const columns = table.getAllLeafColumns();
  const visibleCount = columns.filter((column) => column.getIsVisible?.() !== false).length;
  const pinning = table.atoms.columnPinning?.get();
  const ordered = [...(pinning?.start ?? []), ...columns.filter((column) => !column.getIsPinned?.()).map((column) => column.id), ...(pinning?.end ?? [])].map((id) => columns.find((column) => column.id === id)).filter((column): column is RuntimeColumn => !!column);
  /*
   * 在移除面板 DOM 之前检查焦点归属，才能恢复有效的触发器。
   * 外部点击已经取得新焦点时，不覆盖外部焦点。
   */
  useLayoutEffect(() => {
    const previous = document.activeElement;
    panel.current?.querySelector<HTMLElement>('button')?.focus();
    const outside = (event: PointerEvent) => {
      if (!panel.current?.contains(event.target as Node) && !(event.target as Element)?.closest('[data-apex-settings-trigger]')) onClose();
    };
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('pointerdown', outside);
      if (panel.current?.contains(document.activeElement)) focusWithoutScroll(previous instanceof HTMLElement && previous.isConnected ? previous : root.current);
    };
  }, [onClose, root]);
  const move = (column: RuntimeColumn, delta: number) => {
    const region = column.getIsPinned?.() ?? false;
    const regionColumns = ordered.filter((item) => (item.getIsPinned?.() ?? false) === region);
    const index = regionColumns.indexOf(column);
    const target = regionColumns[index + delta];
    if (!target || target.columnDef.meta?.apex?.canReorder === false) return;
    const ids = regionColumns.map((item) => item.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    if (region) table.setColumnPinning((old) => ({ ...old, [region]: ids }));
    else table.setColumnOrder(ids);
  };
  const pin = (column: RuntimeColumn, position: false | 'start' | 'end') => {
    const current = column.getIsPinned?.();
    const pinnedWidth = tracks.filter((track) => track.pin && track.column !== column).reduce((sum, track) => sum + track.size, 0);
    if (position && !current && pinnedWidth + (column.getSize?.() ?? 150) > width - 160) { setMessage(locale.pinSpace); return; }
    setMessage('');
    column.pin(position);
  };
  const rootProps = mergeDOM<ApexRootDOM>({ ref: panel, className: 'apex-table-column-settings', role: 'dialog', 'aria-label': locale.columnSettings, onKeyDown: (event) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
  }, onBlur: (event) => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) onClose(); } }, slotProps.columnSettings?.rootProps);
  const children = <>
    <div className="apex-table-panel-title"><strong>{locale.columnSettings}</strong><button type="button" aria-label={locale.close} onClick={onClose}>×</button></div>
    <div className="apex-table-column-list">{ordered.map((column) => {
      const shown = column.getIsVisible?.() !== false;
      const renderedSize = tracks.find((track) => track.column === column)?.size ?? column.getSize?.();
      const locked = !column.getCanHide?.() || (shown && visibleCount <= 1);
      const region = ordered.filter((item) => (item.getIsPinned?.() ?? false) === (column.getIsPinned?.() ?? false));
      const position = region.indexOf(column);
      const canMove = !!table.setColumnOrder && column.columnDef.meta?.apex?.canReorder !== false;
      return <div className="apex-table-column-option" key={column.id}>
        <label title={locked && shown && visibleCount <= 1 ? locale.minOneColumn : undefined}><input type="checkbox" checked={shown} disabled={locked} onChange={() => column.toggleVisibility()} />{columnLabel(column)}</label>
        <div className="apex-table-column-actions">
          <button type="button" aria-label={`${locale.moveUp} ${columnLabel(column)}`} disabled={!canMove || position === 0 || region[position - 1]?.columnDef.meta?.apex?.canReorder === false} onClick={() => move(column, -1)}>↑</button>
          <button type="button" aria-label={`${locale.moveDown} ${columnLabel(column)}`} disabled={!canMove || position === region.length - 1 || region[position + 1]?.columnDef.meta?.apex?.canReorder === false} onClick={() => move(column, 1)}>↓</button>
          {column.getCanPin && <select aria-label={`${locale.pinStart} ${columnLabel(column)}`} value={column.getIsPinned() || ''} disabled={!column.getCanPin()} onChange={(event) => pin(column, event.currentTarget.value as '' | 'start' | 'end' || false)}><option value="">{locale.unpin}</option><option value="start">{locale.pinStart}</option><option value="end">{locale.pinEnd}</option></select>}
          {typeof column.getSize === 'function' && <input key={`${column.id}-${renderedSize}`} type="number" step="any" aria-label={`${locale.width} ${columnLabel(column)}`} defaultValue={renderedSize} min={column.columnDef.minSize ?? 20} max={column.columnDef.maxSize} disabled={!column.getCanResize?.()} onBlur={(event) => {
            const value = event.currentTarget.valueAsNumber;
            if (Number.isFinite(value) && value !== renderedSize) table.setColumnSizing((old) => ({ ...old, [column.id]: clampWidth(column, value) }));
            else event.currentTarget.value = String(renderedSize);
          }} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} />}
        </div>
      </div>;
    })}</div>
    <div role="status" className="apex-table-panel-message">{message}</div>
    <button type="button" onClick={() => { table.resetColumnVisibility?.(); table.resetColumnOrder?.(); table.resetColumnPinning?.(); table.resetColumnSizing?.(); setMessage(''); }}>{locale.resetLayout}</button>
  </>;
  return slots.columnSettings ? <slots.columnSettings {...{ table, columns, locale, onClose, rootProps, children }} /> : <div {...rootProps}>{children}</div>;
}
