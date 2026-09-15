# ApexTableReact

基于 **TanStack Table v9 原生实例** 的 React 业务表格界面。包含虚拟滚动、服务器分页界面、跨页 ID 选择、列设置、固定降级、插槽、独立主题和可选列偏好。

包名为 `apex-table-react`，当前为 **0.1.0-rc.0，未发布 npm**。2026-09-14 官方 registry 查询名称返回 404，不代表已经取得名称归属。

## 快速开始

运行 `pnpm build`、`pnpm pack --pack-destination .artifacts`，将生成的 tarball 安装到消费项目。

```tsx
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import { ApexTable } from 'apex-table-react';
import 'apex-table-react/styles/structure.css';
import 'apex-table-react/styles/theme.css';

/*
 * 列和数据只在原生实例中配置一次。
 * 原生 helper.columns 保留异构列的值推断，不需要 Apex 适配协议。
 */
const features = tableFeatures({});
const helper = createColumnHelper<typeof features, { id: string; name: string }>();
const columns = helper.columns([helper.accessor('name', { header: '商品名称' })]);
const data = [{ id: 'a', name: '陶瓷马克杯' }];

export default function Example() {
  const table = useTable({ features, data, columns, getRowId: (row) => row.id }, () => null);
  return <ApexTable table={table} height={360} />;
}
```

支持 React 18/19、Node ≥20、现代 ESM。开发基线 React 19.3.0、Table 9.2.4、Virtual 3.14.12。JS 不隐式加载 CSS，不在模块导入时访问浏览器存储。

## 文档

- [接入与数据职责](docs/guide.md)
- [公开 API](docs/api.md)
- [主题、插槽和偏好](docs/customization.md)
- [服务器商品列表](docs/demos/ProductTable.tsx)
- [本地一万/十万行](docs/demos/LocalTable.tsx)
- [显式本地分页](docs/demos/LocalPagination.tsx)
- [完整控件插槽](docs/demos/AdvancedSlots.tsx)
- [受控列偏好与存储回退](docs/demos/Preferences.tsx)
- [完整文案替换与展示状态](docs/demos/Localization.tsx)
- [原生切片、状态所有者和兼容性观察](docs/demos/NativeCompatibility.tsx)
- [完整规格](docs/SPEC_ApexTableReact.md)

## 开发与验证

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
pnpm docs:build
pnpm run doctor
```

遵守 AGENT.md，不新增单元测试或 E2E 测试。使用严格类型检查、构建和浏览器实际操作验证。


只加载结构 CSS 的双主题页面位于 examples/structure-only，文档构建自动生成独立页面。

首版为平铺单层表头、固定行高和单列交互排序。分组/树形/展开、编辑、合并、列虚拟化、自动行高、导出、未知总数分页界面、RTL、SSR 水合和移动卡片不在首版承诺内。

MIT，见 [LICENSE](LICENSE)。
