---
title: ApexTable 表格
group:
  title: 组件
  order: 1
---

# ApexTable

用原生 `useTable` 管理数据与状态，用 ApexTable 渲染表格。下面按由简到繁的顺序排列，每个示例只介绍一个主题。

## 基础渲染

### 1. 最简单的本地数据渲染

三条静态数据、两列和一个原生 `useTable` 实例。复制这个示例即可开始。

<code src="../../docs/demos/Basic.tsx"></code>

### 2. 单元格格式

用列的 `cell` 回调显示售价与库存标签。

<code src="../../docs/demos/CellRendering.tsx"></code>

### 3. 行点击与操作菜单

点击行查看物品，菜单中的编辑操作独立触发。

<code src="../../docs/demos/RowActions.tsx"></code>

## 本地交互

### 4. 行选择

启用复选框选择与选择摘要，使用稳定的行 ID。

<code src="../../docs/demos/RowSelection.tsx"></code>

### 5. 本地排序

点击库存表头切换升序、降序和默认顺序。

<code src="../../docs/demos/LocalSorting.tsx"></code>

### 6. 本地搜索

提交名称关键字过滤本地数据，重置后恢复全部数据。

<code src="../../docs/demos/LocalFiltering.tsx"></code>

### 7. 本地分页

36 条本地数据交给原生分页行模型，尝试翻页和更改每页条数。

<code src="../../docs/demos/LocalPagination.tsx"></code>

### 8. 列设置

打开表格上方的列设置，调整显隐、顺序、固定位置和列宽。

<code src="../../docs/demos/ColumnSettings.tsx"></code>

### 9. 行密度

切换紧凑、标准和宽松，观察行高变化。

<code src="../../docs/demos/Density.tsx"></code>

## 展示状态

### 10. 加载中

切换加载开关，观察骨架与数据行的切换。

<code src="../../docs/demos/Loading.tsx"></code>

### 11. 空数据

直接传入空数组，查看默认空态。

<code src="../../docs/demos/Empty.tsx"></code>

### 12. 错误与重试

初始显示模拟错误，点击重试恢复数据，再次点击“模拟失败”可重新体验。

<code src="../../docs/demos/ErrorState.tsx"></code>

## 外观与插槽

### 13. 文案覆盖

仅将选择场景改为英文，未覆盖的文案仍使用默认值。

<code src="../../docs/demos/Localization.tsx"></code>

### 14. 品牌主题

通过表格根节点的 CSS 变量覆盖颜色、字体和圆角。仅加载结构 CSS 的独立示例见 [主题与扩展](/customization)。

<code src="../../docs/demos/Customization.tsx"></code>

### 15. 工具栏插槽

在工具栏中加入业务标题，转发插槽的 DOM 属性及内置内容。

<code src="../../docs/demos/AdvancedSlots.tsx"></code>

### 16. 复选框插槽

替换真实复选框，保留属性、引用和半选状态。选择一行后可观察表头半选效果。

<code src="../../docs/demos/CheckboxSlot.tsx"></code>

### 17. 补充控件事件

勾选“禁止修改选择”后，业务事件通过 `preventDefault()` 取消复选框操作。

<code src="../../docs/demos/SlotEvents.tsx"></code>

## 进阶接入

### 18. 受控选择

使用 React state 管理选择，在表格下方同步显示选中的 ID。

<code src="../../docs/demos/ControlledSelection.tsx"></code>

### 19. 外部 atom

将选择状态交给外部 atom，按钮和表格共同修改同一份状态。

<code src="../../docs/demos/NativeCompatibility.tsx"></code>

### 20. 自定义表格 Hook

通过原生 `createTableHook` 创建项目自己的 Hook，其实例可直接交给 ApexTable。

<code src="../../docs/demos/TableHook.tsx"></code>

### 21. 一万行虚拟滚动

在固定高度内浏览一万条本地数据，只挂载可见窗口附近的行。浏览器查找只能匹配当前挂载的内容。

<code src="../../docs/demos/LocalTable.tsx"></code>

### 22. 服务端分页

模拟 500 毫秒请求延迟，接口返回当前页数据与总数。切页立即显示加载态，旧任务会在查询变化时取消。

<code src="../../docs/demos/ProductTable.tsx"></code>

### 23. 保存与恢复列偏好

调整列设置后显式保存，刷新页面恢复布局。清除操作仅移除这个示例的存储记录。

<code src="../../docs/demos/Preferences.tsx"></code>
