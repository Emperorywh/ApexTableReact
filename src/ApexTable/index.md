---
title: ApexTable 表格
group:
  title: 组件
  order: 1
---

# ApexTable

用原生 `useTable` 管理模型与状态，用 Apex 渲染完整业务表格。默认浅色主题、固定行高和一个滚动区域，支持 React 18/19。

## 完整文案与展示状态

英文文案对象覆盖内置名称、提示与数量格式化。切换场景可查看空态、错误、布局诊断和恢复行为；关闭“提供请求重试”时错误界面只展示提示。

<code src="../../docs/demos/Localization.tsx"></code>

## 商品服务器列表

搜索支持中文输入法；分页与排序保留明确选中的 ID，筛选清空选择。模拟错误、保存失败和业务空间切换均可直接操作。

<code src="../../docs/demos/ProductTable.tsx"></code>

## 本地连续浏览

1 万行业务单元格与 10 万行基础单元格使用独立的文档示例数据生成器。搜索覆盖完整数据，浏览器查找只覆盖挂载的虚拟窗口。

<code src="../../docs/demos/LocalTable.tsx"></code>

## 显式本地分页

原生分页行模型处理完整数据排序、筛选后的结果，表头全选范围为当前页。

<code src="../../docs/demos/LocalPagination.tsx"></code>

## 主题、插槽和外部 atom

<code src="../../docs/demos/Customization.tsx"></code>

## 完整控件插槽

<code src="../../docs/demos/AdvancedSlots.tsx"></code>

## 受控列偏好与恢复边界

<code src="../../docs/demos/Preferences.tsx"></code>

## 原生状态与兼容性观察

<code src="../../docs/demos/NativeCompatibility.tsx"></code>
