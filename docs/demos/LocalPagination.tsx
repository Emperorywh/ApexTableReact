import { createColumnHelper, tableFeatures, useTable, rowPaginationFeature, createPaginatedRowModel } from '@tanstack/react-table';
import { ApexTable } from '@';
import '@/styles/structure.css';
import '@/styles/theme.css';

/*
 * 本地分页只注册分页特性及其行模型，完整数据始终保存在内存中。
 * 本示例独立声明数据、列和所需特性，源码引用统一使用 @。
 */
const features = tableFeatures({ rowPaginationFeature, paginatedRowModel: createPaginatedRowModel() });
type Item = { id: string; name: string; stock: number };
const data: Item[] = Array.from({ length: 36 }, (_, index) => ({ id: String(index), name: `物品 ${index + 1}`, stock: 100 - index }));
const helper = createColumnHelper<typeof features, Item>();
const columns = helper.columns([
  helper.accessor('name', { header: '物品名称' }),
  helper.accessor('stock', { header: '库存' }),
]);
export default function LocalPagination() {
  const table = useTable({
    features, data, columns,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
  }, () => null);
  return <ApexTable table={table} height={380} pagination={{ pageSizeOptions: [5, 10, 20] }} />;
}
