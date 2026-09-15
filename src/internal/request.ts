import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { RowData } from '@tanstack/react-table';
import type { ApexTableReactLocalProps, ApexTableReactRequestProps, ApexTableRequestResult, OnChangeFn, PaginationState } from '../types';

/*
 * 请求 Hook 只管理分页和接口状态，列、选择、插槽等能力复用普通数据组件。
 * 初始分页沿用原生默认值，受控分页仍可通过 state 和回调按需接入。
 */
export function useRequestProps<D extends RowData>(props: ApexTableReactRequestProps<D>): ApexTableReactLocalProps<D> {
  const { request, onPaginationChange, ...options } = props;
  const [internalPagination, setInternalPagination] = useState<PaginationState>(() => ({ pageIndex: 0, pageSize: 10, ...props.initialState?.pagination }));
  const pagination = props.state?.pagination ?? internalPagination;
  const [attempt, setAttempt] = useState(0);
  const query = useMemo(() => ({ pageIndex: pagination.pageIndex, pageSize: pagination.pageSize, attempt }), [pagination.pageIndex, pagination.pageSize, attempt]);
  const [result, setResult] = useState<ApexTableRequestResult<D> & { query: typeof query | null; error?: unknown }>(() => ({ data: [], rowCount: 0, query: null }));
  const requestRef = useRef(request);
  /*
   * 保存最新已提交的请求函数，允许业务直接传内联函数而不触发循环请求。
   * 仅首次挂载、分页值变化和重试发起请求，函数引用变化本身不刷新数据。
   */
  useLayoutEffect(() => { requestRef.current = request; }, [request]);
  const changePagination = useCallback<OnChangeFn<PaginationState>>((updater) => {
    setInternalPagination((previous) => typeof updater === 'function' ? updater(props.state?.pagination ?? previous) : updater);
    onPaginationChange?.(updater);
  }, [onPaginationChange, props.state?.pagination]);
  const retry = useCallback(() => setAttempt((previous) => previous + 1), []);
  useEffect(() => {
    /*
     * 非法分页交给既有诊断界面处理，不将无效参数发送给业务接口。
     * 清理时同时取消请求并禁止旧结果提交，接口忽略取消信号也不会覆盖新页。
     */
    if (!Number.isInteger(query.pageIndex) || query.pageIndex < 0 || !Number.isInteger(query.pageSize) || query.pageSize < 1) return;
    const controller = new AbortController();
    let active = true;
    const run = async () => {
      try {
        const next = await requestRef.current({ pageIndex: query.pageIndex, pageSize: query.pageSize, signal: controller.signal });
        if (!active) return;
        if (!Array.isArray(next?.data) || !Number.isInteger(next.rowCount) || next.rowCount < 0) throw new Error('request 必须返回数据数组 data 和非负整数 rowCount');
        setResult({ data: next.data, rowCount: next.rowCount, query });
      } catch (error) {
        if (active) setResult({ data: [], rowCount: 0, query, error: error || new Error('请求失败') });
      }
    };
    void run();
    return () => { active = false; controller.abort(); };
  }, [query]);
  /*
   * 查询改变的首次渲染立即隐藏旧页和旧总数，不等待副作用更新加载标记。
   * 请求失败使用已有错误插槽和重试按钮，重试继续请求当前分页。
   */
  const loading = result.query !== query;
  return { ...options, data: result.data, rowCount: result.rowCount, manualPagination: true, state: { ...props.state, pagination }, onPaginationChange: changePagination, loading, error: loading ? undefined : result.error, onRetry: retry };
}
