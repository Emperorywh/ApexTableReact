---
title: 快速开始
nav:
  title: 使用指南
  order: 1
---

# 接入指南

当前候选尚未公开发布，使用仓库 `pnpm pack` 生成的 tarball。业务从 `@tanstack/react-table` 导入原生 API，Apex 接收原生实例。最小接入见 README，完整示例见 [组件演示](/components/apex-table)。

## 本地与服务器

本地连续列表显式注册 columnFilteringFeature、globalFilteringFeature、rowSortingFeature，以及 `filteredRowModel: createFilteredRowModel()`、`sortedRowModel: createSortedRowModel()`。不注册分页模型即可连续浏览。

服务器列表注册状态特性，使用 `manualPagination/manualSorting/manualFiltering: true` 和准确 rowCount。业务根据原生状态发请求，Apex 不二次处理服务器当前页。

本地分页增加 rowPaginationFeature 和 `paginatedRowModel: createPaginatedRowModel()`。`pagination={false}` 仅隐藏 Apex 控件，不更改原生模型。

原生 API 以安装的 9.2.4 声明为准，参考 [官方 v9 快速开始](https://tanstack.com/table/latest/docs/framework/react/quick-start)。不要直接套用 v8 useReactTable。

## 尺寸与交互

提供明确 height，或使用有确定高度且 min-height:0 的 flex 父容器。隐藏容器暂停虚拟窗口，ResizeObserver 在重新显示时恢复。默认行高 48px，compact 40px，comfortable 64px；rowHeight 覆盖密度且必须 ≥32，不能只改 CSS 高度。

连续列表默认虚拟化，分页结果超过 200 行才自动开启。overscan 默认上下各 8 行。普通浏览器查找只能覆盖已挂载窗口，业务搜索覆盖全量数据。

跨页选择用稳定 getRowId。分页表头调用原生页内全选，连续列表调用全部筛选结果全选。摘要清空调用 resetRowSelection(true)，恢复初始值使用 resetRowSelection()。

商品示例翻页/排序保留选择，搜索/筛选清空，身份按 key 重建；核心不强加这些业务策略。普通内容触发行点击，复选框负责选择，按钮/链接等不连带点击；自定义交互区可添加 data-apex-interactive。

查询变化即传 loading，隐藏旧行和旧总数。业务递增请求序号同时丢弃旧成功/失败，完成时一起提交 data、rowCount、error、loading。开关等待保存成功才更新值。

## v9 实际名称

9.2.4 使用 **columnResizing** 临时切片、setColumnResizing 和 resetHeaderSizeInfo(true)。规格部分段落的 columnSizingInfo 为旧名称；实现不新增同义状态。固定位置是 start/end，比较器是 sortFn。

异构列数组使用原生 helper.columns([...])，保留各列值推断。Apex 不需要类型断言或列转换。
