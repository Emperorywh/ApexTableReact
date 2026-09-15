import { createContext, useContext } from 'react';
import type { RefObject } from 'react';
import type { ApexLocale, ApexSlotProps } from '../types';
import type { RuntimeSlots } from './runtime';
import { zhCN } from '../locale';

/*
 * 上下文只承载界面扩展与有效焦点容器，不复制原生表格状态。
 * 业务单元格内的菜单和提示复用同一局部主题与浮层生命周期。
 */
export interface UIContextValue {
  locale: ApexLocale;
  slots: RuntimeSlots;
  slotProps: ApexSlotProps;
  root: RefObject<HTMLDivElement | null>;
  viewport: RefObject<HTMLDivElement | null>;
  getPopupContainer?: () => HTMLElement;
  closeSignal?: object;
}
export const UIContext = createContext<UIContextValue>({ locale: zhCN, slots: {}, slotProps: {}, root: { current: null }, viewport: { current: null } });
export function useUI() { return useContext(UIContext); }
