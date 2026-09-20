import {
  records,
  defaultFilters,
  unitName,
  type State,
  type Row,
  type Call,
  type Filters,
} from './data.ts';
import {
  levelForTask,
  publishedRoutingPolicy,
  type AtomicTaskType,
} from '../../../shared/routing-domain.ts';

export const TOKEN_BASELINE = {
  id: 'FIXED-BASELINE-20260908',
  name: '固定基准模型（样本）',
  repository: '本地对照样本',
  revision: 'comparison-fixture-1.0',
  verified: '2026-09-08',
  source: '本地成对合成样本，非实际模型测试',
  method:
    '同材料、同交付要求、同权限；常规上下文传递，全部模型步骤使用基准模型。',
  counting:
    '输入＋输出，缓存输入已包含；按各模型计量记录计数，不折算算力或价格。',
  provenance: '成对合成计量记录；未实际运行模型对照测试。',
} as const;
export type RouteStep = {
  id: string;
  name: string;
  level: 'L0' | 'L1' | 'L2' | 'L3';
  model: string;
  modelName?: string;
  modelVersion?: string;
  atomicTaskType?: AtomicTaskType;
  policyVersion: string;
  upgradedFrom?: 'L1' | 'L2';
  fallbackUsed?: boolean;
  reason: string;
  status: '待执行' | '完成';
  callIds: string[];
  baseline: { input: number; output: number };
  receipt?: string;
  checkId?: string;
};
export type TaskComparison = {
  task: string;
  baselineId: string;
  mode: string;
  quality: '待核对' | '通过' | '未通过';
  qualityReceipt?: string;
  basis: string;
  steps: RouteStep[];
};
export function taskSeed(id: string) {
  let seed = 17;
  for (let i = 0; i < id.length; i++)
    seed = (seed * 31 + id.charCodeAt(i)) >>> 0;
  return seed;
}
// Counterfactual fixtures are keyed by task and step, never derived from measured usage.
export function makeStep(
  t: Row,
  i: number,
  level: RouteStep['level'],
  model: string,
  name: string,
): RouteStep {
  const seed = taskSeed(t.id + ':' + i);
  const taskByName: Record<string, AtomicTaskType> = {
    字段提取: '抽取',
    资料提取: '抽取',
    工作摘要: '摘要',
    资料处理与摘要: '摘要',
    结果核对与摘要: '比对',
    关键矛盾核对: '复杂推理',
  };
  return {
    id: `${t.id}-STEP-${i}`,
    name,
    level,
    model,
    atomicTaskType: taskByName[name],
    policyVersion: publishedRoutingPolicy.version,
    status: '待执行',
    callIds: [],
    reason:
      level === 'L0'
        ? '复用已授权且有效的检索结果，避免重复模型调用'
        : level === 'L1'
          ? '结构化字段提取，使用轻量处理'
          : level === 'L3'
            ? '关键矛盾核对，需要深度处理'
            : '精简输入后生成工作摘要',
    baseline: {
      input: 3200 + (seed % 5000),
      output: 750 + ((seed >>> 4) % 1500),
    },
  };
}
export function prepareComparison(s: State, t: Row, live = false) {
  s.comparisons ??= {};
  if (s.comparisons[t.id]) return;
  const smart = t.fields.modelMode === '智能模式';
  const calls = s.calls.filter((c) => c.task === t.id && c.type === '模型请求');
  const steps: RouteStep[] = [];
  if (smart) steps.push(makeStep(t, 0, 'L0', '', '检索结果整理'));
  if (live) {
    if (smart) {
      const l1 = publishedRoutingPolicy.rules.find(
        (rule) => rule.level === 'L1',
      )!;
      steps.push(makeStep(t, 1, 'L1', l1.primaryModelId, '字段提取'));
      const level = taskSeed(t.id) % 7 === 0 ? 'L3' : 'L2';
      const route = publishedRoutingPolicy.rules.find(
        (rule) => rule.level === level,
      )!;
      steps.push(
        makeStep(
          t,
          2,
          level,
          route.primaryModelId,
          level === 'L3' ? '关键矛盾核对' : '工作摘要',
        ),
      );
    } else {
      steps.push(makeStep(t, 0, 'L2', t.fields.model, '资料处理与摘要'));
      steps[0].reason = '用户指定模型，保持锁定；仅优化任务输入';
    }
  } else {
    calls.forEach((c, i) => {
      const level =
        c.model === 'ernie-4-5-21b'
          ? 'L1'
          : c.model === 'deepseek-v4-pro'
            ? 'L3'
            : 'L2';
      const step = makeStep(
        t,
        steps.length,
        level,
        c.model,
        i === 0 ? '资料提取' : '结果核对与摘要',
      );
      step.status = c.status === '进行中' ? '待执行' : '完成';
      step.callIds = [c.id];
      c.step = step.id;
      step.modelName = s.rows.find((r) => r.id === c.model)?.name;
      step.modelVersion = '2026.09';
      step.reason = smart ? step.reason : '指定模型处理，保留原始计量记录';
      step.receipt = c.metered ? `METER-${c.id}` : undefined;
      steps.push(step);
    });
    if (smart && t.status === '完成') {
      steps[0].status = '完成';
      steps[0].receipt = `REUSE-${t.id}`;
    }
  }
  s.comparisons[t.id] = {
    task: t.id,
    baselineId: TOKEN_BASELINE.id,
    mode: t.fields.modelMode,
    quality:
      live || t.status !== '完成'
        ? '待核对'
        : taskSeed(t.id) % 31 === 0
          ? '未通过'
          : '通过',
    qualityReceipt:
      !live && t.status === '完成' ? `QUALITY-${t.id}` : undefined,
    basis: `PAIR-${t.id} · 同材料、交付要求、授权范围与质量检查集 Q-2026.09`,
    steps,
  };
  // A small, deterministic set demonstrates missing comparison records.
  if (!live && taskSeed(t.id) % 37 === 0 && calls.length)
    calls[0].metered = false;
  if (!live && taskSeed(t.id) % 43 === 0) s.comparisons[t.id].baselineId = '';
}
export function routeModelProblem(s: State, step: RouteStep, unit: string) {
  const m = s.rows.find((r) => r.id === step.model);
  if (!m || m.status !== '可用')
    return '本步骤模型不可用，已暂停，未切换其他模型';
  if (m.fields.scope !== '全市单位' && m.fields.scope !== unitName(unit, s))
    return '本步骤模型不在单位授权范围内';
  return null;
}
export function finishRouteCall(
  s: State,
  t: Row,
  step: RouteStep,
  checkId: string,
): Call {
  const seed = taskSeed(step.id);
  const id = 'CALL-LIVE-' + ++s.seq;
  const single = t.fields.modelMode === '指定模型';
  const call: Call = {
    id,
    task: t.id,
    step: step.id,
    unit: t.unit,
    agent: t.fields.agent,
    model: step.model,
    date: s.now.slice(0, 10),
    hour: Number(s.now.slice(11, 13)),
    type: '模型请求',
    status: '成功',
    duration: 750 + (seed % 6000),
    input: single ? Number(t.fields.inputTokens) : 1200 + (seed % 4200),
    output: single
      ? Number(t.fields.outputTokens)
      : 250 + ((seed >>> 3) % 1500),
    cached: 0,
    metered: true,
    entry: t.fields.entry,
    taskType: t.fields.taskType,
    businessScenario: t.fields.businessScenario,
    atomicTaskType: step.atomicTaskType,
    routeLevel: step.atomicTaskType
      ? levelForTask(step.atomicTaskType)
      : step.level === 'L0'
        ? undefined
        : step.level,
    policyVersion: step.policyVersion,
    routeReason: step.reason,
    upgradedFrom: step.upgradedFrom,
    fallbackUsed: step.fallbackUsed,
    routingTokens: single ? 0 : 120,
    retryTokens: 0,
    qualityReceipt: checkId,
  };
  call.cached = Math.floor(call.input * ((seed % 4) / 5));
  s.calls.push(call);
  step.callIds.push(id);
  step.status = '完成';
  step.checkId = checkId;
  step.receipt = 'METER-' + id;
  step.modelName = s.rows.find((r) => r.id === step.model)?.name;
  step.modelVersion =
    s.rows.find((r) => r.id === step.model)?.fields.version || '2026.09';
  return call;
}
export function comparisonRows(s: State, f: Filters = defaultFilters()) {
  const byTask = new Map<string, Call[]>();
  for (const c of s.calls)
    if (c.type === '模型请求')
      byTask.set(c.task, [...(byTask.get(c.task) || []), c]);
  return records(s, 'tasks')
    .filter((t) => {
      const calls = byTask.get(t.id) || [];
      return (
        (f.unit === 'all' || t.unit === f.unit) &&
        t.fields.date >= f.from &&
        t.fields.date <= f.to &&
        (f.agent === 'all' || t.fields.agent === f.agent) &&
        (f.entry === 'all' || t.fields.entry === f.entry) &&
        (f.taskType === 'all' || t.fields.taskType === f.taskType) &&
        (f.model === 'all' || calls.some((c) => c.model === f.model)) &&
        (!f.search || [t.id, t.name].some((v) => v.includes(f.search)))
      );
    })
    .map((t) => {
      const pair = s.comparisons?.[t.id];
      const calls = byTask.get(t.id) || [];
      const callMap = new Map(calls.map((c) => [c.id, c]));
      const used = pair?.steps.flatMap((p) => p.callIds) || [];
      const reason =
        t.status !== '完成'
          ? '任务未完成：' + t.status
          : !pair || pair.baselineId !== TOKEN_BASELINE.id
            ? '缺少有效基准'
            : pair.quality !== '通过'
              ? '质量' + pair.quality
              : !pair.qualityReceipt
                ? '质量回执待补齐'
                : calls.some((c) => !c.metered)
                  ? '计量待回传'
                  : calls.some(
                        (c) => c.status === '进行中' || c.status === '安全中止',
                      )
                    ? '调用尚未有效结束'
                    : calls.some(
                          (c) =>
                            ![c.input, c.output, c.cached].every(
                              (n) => Number.isFinite(n) && n >= 0,
                            ) || c.cached > c.input,
                        )
                      ? '计量记录异常'
                      : pair.steps.some(
                            (p) =>
                              p.status !== '完成' ||
                              !p.receipt ||
                              (p.level !== 'L0' && !p.callIds.length),
                          )
                        ? '步骤回执待补齐'
                        : pair.steps.some(
                              (p) =>
                                ![p.baseline.input, p.baseline.output].every(
                                  (n) => Number.isFinite(n) && n >= 0,
                                ),
                            )
                          ? '基准计量异常'
                          : new Set(used).size !== used.length ||
                              used.length !== calls.length ||
                              used.some((id) => !callMap.has(id))
                            ? '调用关联待补齐'
                            : '';
      const steps = (pair?.steps || []).map((p) => {
        const cc = p.callIds
          .map((id) => callMap.get(id))
          .filter((c): c is Call => !!c);
        const input = cc.reduce((n, c) => n + (c.metered ? c.input : 0), 0);
        const output = cc.reduce((n, c) => n + (c.metered ? c.output : 0), 0);
        const baseline = p.baseline.input + p.baseline.output;
        const avoided = p.level === 'L0' && !cc.length ? baseline : 0;
        return {
          ...p,
          calls: cc,
          input,
          output,
          actual: input + output,
          baselineTotal: baseline,
          saved: baseline - input - output,
          avoided,
          inputSaved: avoided ? 0 : p.baseline.input - input,
          outputSaved: avoided ? 0 : p.baseline.output - output,
        };
      });
      const baseline = steps.reduce((n, p) => n + p.baselineTotal, 0);
      const actual = calls.reduce(
        (n, c) => n + (c.metered ? c.input + c.output : 0),
        0,
      );
      return {
        task: t,
        pair,
        calls,
        steps,
        reason,
        eligible: !reason,
        baseline,
        actual,
        saved: baseline - actual,
      };
    });
}
export function savingsSummary(s: State, f: Filters = defaultFilters()) {
  const rows = comparisonRows(s, f),
    eligible = rows.filter((r) => r.eligible);
  const sum = (key: 'baseline' | 'actual' | 'saved') =>
    eligible.reduce((n, r) => n + r[key], 0);
  const baseline = sum('baseline'),
    actual = sum('actual'),
    saved = sum('saved');
  const steps = eligible.flatMap((r) => r.steps);
  return {
    rows,
    eligible,
    count: eligible.length,
    excluded: rows.length - eligible.length,
    baseline,
    actual,
    saved,
    rate: baseline ? saved / baseline : null,
    sources: [
      { name: '减少模型调用', value: steps.reduce((n, p) => n + p.avoided, 0) },
      {
        name: '精简输入上下文',
        value: steps.reduce((n, p) => n + p.inputSaved, 0),
      },
      {
        name: '输出用量差异',
        value: steps.reduce((n, p) => n + p.outputSaved, 0),
      },
    ],
  };
}
export function taskTokenComparison(s: State, taskId: string) {
  const t = records(s, 'tasks').find((t) => t.id === taskId);
  if (!t) throw new Error('任务不存在');
  const row = comparisonRows(s, {
    ...defaultFilters(),
    from: t.fields.date,
    to: t.fields.date,
    search: taskId,
  }).find((r) => r.task.id === taskId)!;
  return {
    taskId,
    baseline: TOKEN_BASELINE,
    mode: row.pair?.mode,
    quality: row.pair?.quality,
    eligible: row.eligible,
    excludedReason: row.reason,
    baselineTokens: row.baseline,
    actualTokens: row.actual,
    savedTokens: row.eligible ? row.saved : null,
    steps: row.steps,
  };
}
