import type { CheckboxProps, ColorPickerProps, ConfigProviderProps, DatePickerProps, ImageProps, InputNumberProps, InputProps, RadioGroupProps, SelectProps, SwitchProps, TimePickerProps } from 'antd';

/*
 * 内置编辑器只接管数据绑定，其他外观与交互属性沿用 antd 类型。
 * 值与变更事件由表格统一管理，避免业务属性覆盖数据回写通道。
 */
type Binding = 'value' | 'defaultValue' | 'checked' | 'defaultChecked' | 'onChange' | 'onChangeComplete' | 'onClear' | 'open' | 'defaultOpen' | 'onOpenChange';
type EditorProps<P> = Omit<P, Binding>;
export type ApexSelectValue = string | number | (string | number)[];
export interface ApexEditorPropsMap {
  Checkbox: EditorProps<CheckboxProps>;
  ColorPicker: Omit<EditorProps<ColorPickerProps>, 'mode'>;
  DatePicker: Omit<EditorProps<DatePickerProps>, 'multiple'>;
  Input: EditorProps<InputProps>;
  InputNumber: EditorProps<InputNumberProps<string | number>>;
  Radio: EditorProps<RadioGroupProps>;
  Select: Omit<EditorProps<SelectProps<ApexSelectValue>>, 'labelInValue'>;
  Switch: EditorProps<SwitchProps>;
  TimePicker: EditorProps<TimePickerProps>;
  Image: Omit<ImageProps, 'src'> & { inputProps?: EditorProps<InputProps> };
}
export type ApexEditorType = keyof ApexEditorPropsMap;
export interface ApexCellContext<D> {
  row: D;
  rowId: string;
  rowIndex: number;
  columnId: string;
  value: unknown;
}

/*
 * 列按组件名称形成可辨识联合类型，组件属性和行回调均保留推断。
 * 计算列可指定写入字段或不可变更新函数，日期与时间存储为格式化字符串。
 */
export type ApexCellEditor<D = unknown> = {
  [K in ApexEditorType]: {
    type: K;
    props?: ApexEditorPropsMap[K] | ((context: ApexCellContext<D>) => ApexEditorPropsMap[K]);
    editable?: boolean | ((context: ApexCellContext<D>) => boolean);
    field?: string | readonly string[];
    setValue?(row: D, value: unknown): D;
  } & (K extends 'DatePicker' | 'TimePicker' ? { valueFormat?: string } : unknown)
}[ApexEditorType];
export interface ApexCellChange<D> extends ApexCellContext<D> {
  previousValue: unknown;
  previousRow: D;
}
export type ApexEditorConfig = Pick<ConfigProviderProps, 'locale' | 'theme' | 'componentSize' | 'direction' | 'prefixCls'>;
