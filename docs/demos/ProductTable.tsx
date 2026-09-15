import { ApexTableReact } from 'apex-table-react';
import type { ApexColumnDef } from 'apex-table-react';

/*
 * request 返回当前页和准确总数，组件自动管理分页、加载和错误重试。
 * 模拟数据仅用于演示，实际业务可在 request 中调用自己的分页接口。
 */
type Item = { id: string; name: string; stock: number };
const inventory: Item[] = Array.from({ length: 53 }, (_, index) => ({ id: String(index), name: `商品 ${index + 1}`, stock: 100 - index }));
const columns: ApexColumnDef<Item>[] = [
  { accessorKey: 'name', header: '物品名称' },
  { accessorKey: 'stock', header: '库存' },
];
export default function ProductTable() {
  /*
   * 内联请求函数无需 useCallback，重新渲染不会重复加载。
   * 页码从零开始，初始页大小通过 initialState 配置。
   */
  return <ApexTableReact columns={columns} getRowId={(row) => row.id} height={380}
    request={async ({ pageIndex, pageSize }) => {
      /*
       * 定时器仅用于模拟接口延迟，由 resolve 完成等待。
       * 执行器不返回定时器编号，避免返回 Promise 不会使用的值。
       */
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 500);
      });
      const start = pageIndex * pageSize;
      return { data: inventory.slice(start, start + pageSize), rowCount: inventory.length };
    }}
    initialState={{ pagination: { pageIndex: 0, pageSize: 5 } }} pagination={{ pageSizeOptions: [5, 10, 20] }} />;
}
