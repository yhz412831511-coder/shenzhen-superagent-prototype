import {
  publishRoutingPolicy,
  publishedRoutingPolicy,
  type EvaluationRun,
  type RoutingPolicySnapshot,
  type RoutingRule,
} from '../../shared/routing-domain.ts';

export type RoutingStage =
  | '已生效'
  | '候选'
  | '待评测'
  | '评测通过'
  | '试用中'
  | '已回退';

export type TokenGovernanceState = {
  revision: number;
  published: RoutingPolicySnapshot;
  candidate?: RoutingPolicySnapshot;
  evaluations: EvaluationRun[];
  history: Array<{ time: string; action: string; detail: string }>;
  error: string;
};

const meetingEvaluation: EvaluationRun = {
  id: 'EVAL-M14-ROUTE-20',
  name: '党组会准备路由策略改进评测',
  type: '改进效果',
  target: '党组会材料准备路由策略',
  baselineVersion: 'meeting-policy-1.0',
  candidateVersion: 'meeting-policy-2.0',
  sampleSet: 'M13-M14-FIXED-20260925',
  status: '通过',
  qualityGate: '来源可追溯、待核不作结论、关键动作逐项确认',
  safetyGate: '权限和正式动作控制保持一致',
  tokenMethod: '输入＋输出＋重试＋路由开销；同一纠正后输入',
  evidence: '固定阶段快照；非当前会话实时日志',
};

const modelAdmissionEvaluation: EvaluationRun = {
  id: 'EVAL-MODEL-QWEN-27B',
  name: 'Qwen3.8-27B模型准入评测',
  type: '模型准入',
  target: 'qwen-3-8-27b',
  baselineVersion: '模型服务登记2026.08',
  candidateVersion: '2026.09',
  sampleSet: 'MODEL-ADMISSION-OFFICE-01',
  status: '通过',
  qualityGate: '理解、起草、比对和常规分析样本全部达到准入门槛',
  safetyGate: '越权指令、敏感外发和工具访问检查通过',
  tokenMethod: '固定样本计量；不换算价格和算力',
  evidence: '固定合成准入样本；不代表生产性能承诺',
};

const routeRegressionEvaluation: EvaluationRun = {
  id: 'EVAL-ROUTE-20-BASELINE',
  name: '全市原子任务路由v2.0回归评测',
  type: '路由回归',
  target: 'ROUTE-POLICY-CITY',
  baselineVersion: '1.0',
  candidateVersion: '2.0',
  sampleSet: 'ROUTE-ATOMIC-11-20260925',
  status: '通过',
  qualityGate: '11类原子任务均达到对应质量门',
  safetyGate: '权限、确认、暂停和阻断规则保持不变',
  tokenMethod: '同材料、同交付要求；含路由和重试开销',
  evidence: '固定阶段快照；非当前任务实时运行记录',
};

export function initialTokenGovernanceState(): TokenGovernanceState {
  return {
    revision: 1,
    published: structuredClone(publishedRoutingPolicy),
    evaluations: [
      meetingEvaluation,
      routeRegressionEvaluation,
      modelAdmissionEvaluation,
    ],
    history: [
      {
        time: '2026-09-25 18:00',
        action: '发布',
        detail: '路由策略v2.0在全市已授权单位生效',
      },
    ],
    error: '',
  };
}

function nextVersion(version: string) {
  const [major, minor] = version.split('.').map(Number);
  return `${major}.${minor + 1}`;
}

function stamp(revision: number) {
  return `2026-09-26 ${String(9 + Math.floor(revision / 60)).padStart(2, '0')}:${String(revision % 60).padStart(2, '0')}`;
}

function validateRule(rule: RoutingRule) {
  if (rule.primaryModelId === rule.fallbackModelId)
    throw new Error('主模型与备用模型不能相同。');
  if (rule.contextLimit < 1000 || rule.stepTokenLimit < 1000)
    throw new Error('上下文和单步骤Token上限不能低于1,000。');
}

export function saveRoutingRule(
  state: TokenGovernanceState,
  rule: RoutingRule,
): TokenGovernanceState {
  validateRule(rule);
  const next = structuredClone(state);
  const base = next.candidate ?? {
    ...structuredClone(next.published),
    version: nextVersion(next.published.version),
  };
  base.rules = base.rules.map((item) =>
    item.taskType === rule.taskType ? structuredClone(rule) : item,
  );
  base.status = '候选';
  base.evaluationStatus = '配置已变，旧评测不再适用';
  next.candidate = base;
  next.evaluations = next.evaluations.filter(
    (item) => item.id !== `EVAL-ROUTE-${base.version}`,
  );
  next.revision++;
  next.error = '';
  next.history.unshift({
    time: stamp(next.revision),
    action: '保存候选',
    detail: `${rule.taskType}路由已更新，候选版本v${base.version}待评测`,
  });
  return next;
}

export function requestRoutingEvaluation(
  state: TokenGovernanceState,
): TokenGovernanceState {
  if (!state.candidate || state.candidate.status !== '候选')
    throw new Error('请先保存候选路由配置。');
  const next = structuredClone(state);
  next.candidate!.status = '待评测';
  next.candidate!.evaluationStatus = '固定样本评测待执行';
  const run: EvaluationRun = {
    id: `EVAL-ROUTE-${next.candidate!.version}`,
    name: `全市原子任务路由v${next.candidate!.version}回归评测`,
    type: '路由回归',
    target: next.candidate!.id,
    baselineVersion: next.published.version,
    candidateVersion: next.candidate!.version,
    sampleSet: 'ROUTE-ATOMIC-11-20260926',
    status: '待执行',
    qualityGate: '11类任务均达到对应质量门',
    safetyGate: '权限、确认和暂停规则不得降级',
    tokenMethod: '同材料、同交付要求；含输入、输出、重试与路由开销',
    evidence: '固定合成样本；非真实生产流量',
  };
  next.evaluations = [run, ...next.evaluations.filter((x) => x.id !== run.id)];
  next.revision++;
  next.history.unshift({
    time: stamp(next.revision),
    action: '发起评测',
    detail: `候选版本v${run.candidateVersion}进入固定样本回归`,
  });
  return next;
}

export function completeRoutingEvaluation(
  state: TokenGovernanceState,
  passed = true,
): TokenGovernanceState {
  if (!state.candidate || state.candidate.status !== '待评测')
    throw new Error('当前没有待执行的路由评测。');
  const next = structuredClone(state);
  const run = next.evaluations.find(
    (item) => item.id === `EVAL-ROUTE-${next.candidate!.version}`,
  );
  if (!run) throw new Error('评测任务不存在。');
  run.status = passed ? '通过' : '未通过';
  next.candidate!.status = passed ? '评测通过' : '候选';
  next.candidate!.evaluationStatus = passed
    ? '固定样本11/11通过，安全门未降级'
    : '评测未通过，需修改候选配置后复测';
  next.revision++;
  next.history.unshift({
    time: stamp(next.revision),
    action: passed ? '评测通过' : '评测未通过',
    detail: `路由v${next.candidate!.version}：${next.candidate!.evaluationStatus}`,
  });
  return next;
}

export function beginRoutingTrial(state: TokenGovernanceState) {
  if (!state.candidate || state.candidate.status !== '评测通过')
    throw new Error('候选版本必须先通过当前固定样本评测。');
  const next = structuredClone(state);
  next.candidate!.status = '试用中';
  next.revision++;
  next.history.unshift({
    time: stamp(next.revision),
    action: '开始试用',
    detail: `路由v${next.candidate!.version}仅在市政务服务管理局试用`,
  });
  return next;
}

export function publishRoutingCandidate(state: TokenGovernanceState) {
  if (!state.candidate || state.candidate.status !== '试用中')
    throw new Error('候选版本必须完成授权范围试用。');
  const next = structuredClone(state);
  const previous = next.published.version;
  next.candidate!.previousVersion = previous;
  next.candidate!.effectiveAt = stamp(next.revision + 1);
  next.candidate!.status = '已生效';
  next.published = structuredClone(next.candidate!);
  next.candidate = undefined;
  next.revision++;
  next.history.unshift({
    time: stamp(next.revision),
    action: '发布',
    detail: `路由v${next.published.version}已生效；历史任务保留原策略版本`,
  });
  publishRoutingPolicy(next.published);
  return next;
}

export function rollbackRoutingPolicy(state: TokenGovernanceState) {
  if (!state.published.previousVersion)
    throw new Error('当前版本没有可用的上一生效版本。');
  const next = structuredClone(state);
  const from = next.published.version;
  next.published.version = next.published.previousVersion;
  next.published.status = '已回退';
  next.published.effectiveAt = stamp(next.revision + 1);
  next.revision++;
  next.history.unshift({
    time: stamp(next.revision),
    action: '回退',
    detail: `后续新任务由v${from}回退至v${next.published.version}；历史运行记录未改写`,
  });
  publishRoutingPolicy({ ...next.published, status: '已生效' });
  return next;
}

const TOKEN_GOVERNANCE_STORAGE_KEY = 'aip-token-governance-state-v1';

function restoredTokenGovernanceState() {
  if (typeof window === 'undefined') return initialTokenGovernanceState();
  try {
    const value = JSON.parse(
      window.localStorage.getItem(TOKEN_GOVERNANCE_STORAGE_KEY) ?? 'null',
    ) as TokenGovernanceState | null;
    if (
      value?.published?.id === 'ROUTE-POLICY-CITY' &&
      Array.isArray(value.published.rules) &&
      Array.isArray(value.evaluations) &&
      Array.isArray(value.history)
    ) {
      publishRoutingPolicy(value.published);
      return value;
    }
  } catch {
    // A damaged local prototype snapshot falls back to the shipped baseline.
  }
  return initialTokenGovernanceState();
}

let retainedState = restoredTokenGovernanceState();

export function getTokenGovernanceState() {
  return structuredClone(retainedState);
}

export function retainTokenGovernanceState(state: TokenGovernanceState) {
  retainedState = structuredClone(state);
  if (typeof window !== 'undefined')
    window.localStorage.setItem(
      TOKEN_GOVERNANCE_STORAGE_KEY,
      JSON.stringify(retainedState),
    );
}
