import { useIntl, usePrefersColor, useSiteData } from 'dumi';
import React, { useEffect, useId, useRef, useState } from 'react';
import './index.less';

/*
 * 只覆盖文档站点的主题切换插槽，偏好保存及跟随系统继续交给 dumi。
 * 自绘菜单避免原生下拉选项使用操作系统外观，保持亮暗主题样式一致。
 */
const modes = ['light', 'dark', 'auto'] as const;
type ColorMode = typeof modes[number];

function ColorIcon({ mode }: { mode: ColorMode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {mode === 'light' ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></> : mode === 'dark' ? <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" /> : <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></>}
    </svg>
  );
}

export default function ColorSwitch() {
  const intl = useIntl();
  const { themeConfig } = useSiteData();
  const [, preference, setPreference] = usePrefersColor();
  const selected: ColorMode = preference ?? themeConfig.prefersColor.default;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();
  const label = (mode: ColorMode) => intl.formatMessage({ id: `header.color.mode.${mode}` });

  /*
   * 打开后聚焦当前选项，点击外部或焦点离开时收起菜单。
   * 监听器随菜单关闭清理，避免路由切换后残留全局事件。
   */
  useEffect(() => {
    if (!open) return;
    itemRefs.current[modes.indexOf(selected)]?.focus();
    const handleOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, [open, selected]);

  function closeMenu() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  /*
   * 菜单支持方向键循环、首尾跳转和退出后焦点恢复。
   * 阻止点击冒泡到默认页头，保证手机菜单内也能正常切换。
   */
  return (
    <div
      className="apex-docs-color-switch"
      ref={rootRef}
      onClick={(event) => event.stopPropagation()}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          event.stopPropagation();
          closeMenu();
        }
      }}
    >
      <button
        className="apex-docs-color-trigger"
        type="button"
        ref={triggerRef}
        aria-label={`切换主题，当前：${label(selected)}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title={label(selected)}
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <ColorIcon mode={selected} />
      </button>
      {open && (
        <div className="apex-docs-color-menu" id={menuId} role="menu" aria-label="主题模式">
          {modes.map((mode, index) => (
            <button
              className="apex-docs-color-option"
              key={mode}
              type="button"
              role="menuitemradio"
              aria-checked={selected === mode}
              tabIndex={-1}
              ref={(element) => { itemRefs.current[index] = element; }}
              onClick={() => {
                setPreference(mode);
                closeMenu();
              }}
              onKeyDown={(event) => {
                const next = event.key === 'ArrowDown' ? (index + 1) % modes.length
                  : event.key === 'ArrowUp' ? (index + modes.length - 1) % modes.length
                  : event.key === 'Home' ? 0 : event.key === 'End' ? modes.length - 1 : undefined;
                if (next !== undefined) {
                  event.preventDefault();
                  itemRefs.current[next]?.focus();
                }
              }}
            >
              <ColorIcon mode={mode} />
              <span>{label(mode)}</span>
              <span className="apex-docs-color-check" aria-hidden="true">{selected === mode ? '✓' : ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
