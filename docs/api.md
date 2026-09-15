---
title: API
nav:
  title: API
  order: 2
---

# Apex 扩展 API

columns/data/options/state/initialState/atoms/callbacks 全部留在原生 table 中。Apex 不创建第二个实例，不覆盖 options 和方法。

| 属性 | 默认 | 说明 |
| --- | --- | --- |
| table | 必填 | ReactTable 泛型从实例推断，支持 createTableHook 兼容实例 |
| height | 100% | 像素或 CSS 高度，需要可测父容器 |
| rowHeight | 随密度 | 有限数且 ≥32，覆盖密度 |
| density/defaultDensity/onDensityChange | standard | 可受控的 Apex UI 状态 |
| showSelectionColumn | false | true 或 {size,sticky}；默认 44px/start |
| showRowNumber | false | true 或 {size,sticky}；默认 48px/false |
| columnSettingsEnabled | false | 显隐、宽度、固定、面板调序、恢复默认 |
| pagination | 随原生特性 | false 或 {pageSizeOptions}；默认 10/20/50/100/200 |
| virtualization | auto | true/false/{overscan}，默认上下各 8 行 |
| loading/error/onRetry | 无 | 配置错误 → loading → 非空 error → 行模型 |
| name/locale | 简体中文 | 表格名称、内置文案及格式化函数 |
| slots/slotProps | 无 | 替换控件/补充公开 DOM 包 |
| onRowClick | 无 | (nativeRow,event)；不隐含选择或跳转 |
| className/style | 无 | 根级外观 |
| getPopupContainer | 当前位置 | 浮层挂载容器 |
| onDiagnostic | 无 | 几何、分页参数、身份、能力和受保护属性诊断 |

ref 提供 focus() 与 scrollToRow(rowId):boolean。目标须在当前结果中，不存在时返回 false 并保持位置，不跨页请求。

非法 pageIndex/pageSize 使用 invalidPagination 诊断；修正原生状态后恢复显示。诊断不隐式改写切片，不调用业务请求重试。

columnDef.meta.apex 支持 align(start/center/end)、flex、pinPriority、canReorder、label。使用原生 columnMeta 类型槽时，将业务类型与 {apex?:ApexColumnMeta} 交叉。

flex 只作用于未固定且无用户 sizing 覆盖的列，分配剩余宽度，不修改原生 getSize/size。无 flex 时余量留白。窄容器保留 160px 中间区，释放低优先级 sticky，原生固定状态与顺序不变。

ApexMenu：items 为只读 {id,label,disabled?,onSelect} 数组，支持方向键、Home/End、Escape、Tab 和外部关闭。ApexTooltip：content/children，悬停或聚焦展示且不夺取焦点。表格内控件继承当前表格插槽和浮层容器。

headerContent/cellContent 接收原生 header/cell 与已经通过 table.FlexRender 生成的 children，避免重复调用渲染器。原生 core table 上下文关系保持原样。

error 可独立使用且不要求 onRetry。默认显示本地化通用文案，业务详情通过插槽展示。全隐藏、部分 columnOrder、复杂过滤值和多列原生排序合法，Apex 不篡改状态；首版仅提供单列交互。未知总数、分组、树形、多级表头尚无完整首版界面。
