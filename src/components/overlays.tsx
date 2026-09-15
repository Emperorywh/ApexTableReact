import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import type { ApexButtonDOM, ApexMenuItem, ApexMenuSlot, ApexTooltipSlot } from '../types';
import { useUI } from '../internal/context';
import { focusWithoutScroll, mergeDOM } from '../internal/dom';

/*
 * 浮层不复制行 DOM；触发器离开视区或卸载即关闭。
 * 只有焦点仍属于菜单时才恢复焦点，悬停提示始终不夺取焦点。
 */
function useOverlay(interactive: boolean) {
  const ui = useUI();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const close = useCallback((restore = false) => {
    if (restore && interactive && content.current?.contains(document.activeElement)) {
      const node = trigger.current;
      const viewport = ui.viewport.current?.getBoundingClientRect();
      const rect = node?.getBoundingClientRect();
      const visible = node?.isConnected && rect && rect.width > 0 && (!viewport || rect.bottom > viewport.top + 44 && rect.top < viewport.bottom && rect.right > viewport.left && rect.left < viewport.right);
      focusWithoutScroll(visible ? node : ui.root.current);
    }
    setOpen(false);
  }, [interactive, ui.root, ui.viewport]);
  useLayoutEffect(() => { close(true); }, [ui.closeSignal, close]);
  useLayoutEffect(() => {
    if (!open || !trigger.current) return;
    const rect = trigger.current.getBoundingClientRect();
    const bounds = content.current?.getBoundingClientRect();
    setPosition({ left: Math.max(8, Math.min(rect.left, window.innerWidth - (bounds?.width ?? 220) - 8)), top: rect.bottom + (bounds?.height ?? 0) > window.innerHeight - 8 ? Math.max(8, rect.top - (bounds?.height ?? 0) - 4) : rect.bottom + 4 });
    if (interactive) content.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')?.focus();
  }, [open, interactive]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!content.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) close(false); };
    const scroll = () => close(true);
    const focus = (event: FocusEvent) => { if (!content.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) close(false); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', focus);
    ui.viewport.current?.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', scroll);
    const viewport = ui.viewport.current;
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', focus); viewport?.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll); };
  }, [open, close, ui.viewport]);
  useLayoutEffect(() => () => {
    if (interactive && content.current?.contains(document.activeElement)) focusWithoutScroll(ui.root.current?.isConnected ? ui.root.current : null);
  }, [interactive, ui.root]);
  return { ...ui, open, setOpen, close, trigger, content, position };
}
export function ApexMenu({ items, children, label }: { items: readonly ApexMenuItem[]; children?: ReactNode; label?: string }) {
  const overlay = useOverlay(true);
  const { locale, slots, slotProps, open, setOpen, close, trigger, content, position } = overlay;
  const id = useId();
  const triggerProps = mergeDOM<ApexButtonDOM>({ ref: (node) => { trigger.current = node; }, type: 'button', 'aria-label': label ?? locale.menu, 'aria-haspopup': 'menu', 'aria-expanded': open, 'aria-controls': open ? id : undefined, onClick: () => setOpen(!open), onKeyDown: (event) => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true); } if (event.key === 'Escape') close(true); } }, slotProps.menu?.triggerProps);
  const contentProps = mergeDOM<ApexMenuSlot['contentProps']>({ ref: content, id, role: 'menu', className: 'apex-table-menu', style: { position: 'fixed', ...position }, onKeyDown: (event) => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
    if (event.key === 'Tab') { close(true); return; }
    const nodes = Array.from(content.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? []);
    const current = nodes.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? nodes.length - 1 : event.key === 'ArrowDown' ? (current + 1) % nodes.length : event.key === 'ArrowUp' ? (current - 1 + nodes.length) % nodes.length : -1;
    if (next >= 0) { event.preventDefault(); nodes[next]?.focus(); }
  } }, slotProps.menu?.contentProps);
  const getItemProps = (itemId: string) => {
    const item = items.find((entry) => entry.id === itemId);
    return mergeDOM<ApexButtonDOM>({ role: 'menuitem', type: 'button', tabIndex: -1, disabled: !item || item.disabled, onClick: () => { item?.onSelect(); close(true); } }, slotProps.menu?.itemProps);
  };
  const context = { open, items, triggerProps, contentProps, getItemProps, children: children ?? locale.menu };
  if (slots.menu) return <slots.menu {...context} />;
  const menu = open && <div {...contentProps}>{items.map((item) => <button type="button" key={item.id} {...getItemProps(item.id)}>{item.label}</button>)}</div>;
  const container = open ? overlay.getPopupContainer?.() : undefined;
  return <><button type="button" {...triggerProps}>{context.children}</button>{container ? createPortal(menu, container) : menu}</>;
}
export function ApexTooltip({ content: text, children }: { content: ReactNode; children: ReactNode }) {
  const overlay = useOverlay(false);
  const { slots, slotProps, open, setOpen, close, trigger, content, position } = overlay;
  const id = useId();
  const triggerProps = mergeDOM<ApexTooltipSlot['triggerProps']>({ ref: (node) => { trigger.current = node; }, className: 'apex-table-tooltip-trigger', tabIndex: 0, 'aria-describedby': open ? id : undefined, onMouseEnter: () => setOpen(true), onMouseLeave: () => close(), onFocus: () => setOpen(true), onBlur: () => close(), onKeyDown: (event) => { if (event.key === 'Escape') close(); } }, slotProps.tooltip?.triggerProps);
  const contentProps = mergeDOM<ApexTooltipSlot['contentProps']>({ ref: content, id, role: 'tooltip', className: 'apex-table-tooltip', style: { position: 'fixed', ...position } }, slotProps.tooltip?.contentProps);
  if (slots.tooltip) return <slots.tooltip {...{ open, content: text, triggerProps, contentProps, children }} />;
  const tooltip = open && <div {...contentProps}>{text}</div>;
  const container = open ? overlay.getPopupContainer?.() : undefined;
  return <><span {...triggerProps}>{children}</span>{container ? createPortal(tooltip, container) : tooltip}</>;
}
