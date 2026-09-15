# 变更记录
## 未发布

- 接入 antd 6.6.4，新增十种内置单元格；data 模式支持 editable / onDataChange 受控编辑、列级权限、嵌套字段和计算列回写，补充数据获取示例与回归测试。

- 新增 `request` 服务端分页入口，自动管理数据、总数、分页变化、加载、错误重试与过期请求；简化服务端分页示例并导出请求类型。
- 所有 demo 统一通过 `columns`、`data` 或 `request` 和功能 props 接入，移除 TanStack、外部 atom 和 CSS 导入。
- 内置排序、过滤、分页、选择及列设置，支持原生状态回调、manual 选项和内置函数名称。
- 增加 `tableRef`、`ApexTableInstance`、`ApexTableSlots` 和常用状态类型导出，主题变量可通过 `style` 配置。
- 保留原生实例入口兼容，更新指南、API 和独立主题示例。
