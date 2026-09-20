'use client';
import { savingsSummary, taskTokenComparison, TOKEN_BASELINE } from './savings';
import { useEffect, useRef } from 'react';
import { safetySummary, taskSafetyChain } from './safety';
import { flushSync } from 'react-dom';
import { type State, metrics } from './data';
import { pages, type PageId } from './catalog';
import { type Navigate } from './views';
export function useAdminTools(state: State, go: Navigate) {
  const ref = useRef({ state, go });
  useEffect(() => {
    ref.current = { state, go };
  }, [state, go]);
  useEffect(() => {
    type Tool = {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    };
    const registry = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: Tool,
            options: { signal: AbortSignal },
          ) => unknown;
        };
      }
    ).modelContext;
    if (!registry) return;
    const controller = new AbortController();
    const obj = (input: unknown, keys: string[]) => {
      if (
        !input ||
        typeof input !== 'object' ||
        Array.isArray(input) ||
        Object.keys(input).some((k) => !keys.includes(k))
      )
        throw new Error('参数不符合允许范围');
      return input as Record<string, string>;
    };
    const tools: Tool[] = [
      {
        name: 'get_task_safety_chain',
        title: '查询任务安全全过程',
        description:
          '只读查询脱敏授权、检查依据、执行回执和处置关联，不执行审批或恢复。',
        inputSchema: {
          type: 'object',
          properties: { taskId: { type: 'string' } },
          required: ['taskId'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: (input) => {
          const p = obj(input, ['taskId']);
          if (typeof p.taskId !== 'string' || !p.taskId.trim())
            throw new Error('请提供任务编号');
          return {
            ...taskSafetyChain(ref.current.state, p.taskId),
            tokenComparison: taskTokenComparison(ref.current.state, p.taskId),
          };
        },
      },

      {
        name: 'get_governance_state',
        title: '读取管理摘要',
        description: '返回统计摘要与目录，不返回任务正文或个人内容。',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: (input) => {
          obj(input, []);
          const m = metrics(ref.current.state);
          const { ops: _, ...summary } = m;
          const security = safetySummary(ref.current.state);
          const savings = savingsSummary(ref.current.state);
          return {
            summary,
            tokenSavings: {
              baseline: TOKEN_BASELINE,
              baselineTokens: savings.baseline,
              actualTokens: savings.actual,
              savedTokens: savings.saved,
              rate: savings.rate,
              included: savings.count,
              excluded: savings.excluded,
            },
            pages,
            revision: ref.current.state.revision,
            safety: {
              high: security.high,
              pendingRestriction: security.pendingRestriction,
              overdue: security.overdue,
              checks: security.checks.length,
              running: security.running,
              systems: security.systems.length,
            },
          };
        },
      },
      {
        name: 'find_management_records',
        title: '查询管理记录',
        description: '按名称或编号查记录摘要，不返回敏感内容。',
        inputSchema: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: (input) => {
          const p = obj(input, ['query']);
          if (typeof p.query !== 'string' || !p.query.trim())
            throw new Error('请提供查询词');
          return ref.current.state.rows
            .filter((r) => [r.id, r.name].some((v) => v.includes(p.query)))
            .slice(0, 30)
            .map((r) => ({
              id: r.id,
              name: r.name,
              page: r.page,
              status: r.status,
            }));
        },
      },
      {
        name: 'open_management_page',
        title: '定位管理页面',
        description: '定位目录或记录，不执行审批、发布或处置。',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'string', enum: pages.map((p) => p.id) },
            id: { type: 'string' },
          },
          required: ['page'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: (input) => {
          const p = obj(input, ['page', 'id']);
          if (!pages.some((pg) => pg.id === p.page))
            throw new Error('目录不存在');
          if (
            p.id &&
            !ref.current.state.rows.some(
              (r) => r.id === p.id && r.page === p.page,
            )
          )
            throw new Error('记录与目录不匹配');
          flushSync(() => ref.current.go(p.page as PageId, p.id));
          return { opened: p.page, id: p.id };
        },
      },
    ];
    for (const tool of tools)
      try {
        Promise.resolve(
          registry.registerTool(tool, { signal: controller.signal }),
        ).catch(() => {});
      } catch {}
    return () => controller.abort();
  }, []);
}
