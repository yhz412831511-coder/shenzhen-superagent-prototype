export type AdminRole =
  | '市级运营管理员'
  | '单位管理员'
  | '能力运营岗'
  | '安全运营岗'
  | '领导只读';
export const roles: AdminRole[] = [
  '市级运营管理员',
  '单位管理员',
  '能力运营岗',
  '安全运营岗',
  '领导只读',
];
export function mayManage(role: AdminRole, page: string) {
  if (role === '领导只读') return false;
  if (role === '市级运营管理员') return true;
  if (role === '单位管理员') return false;
  if (role === '能力运营岗')
    return [
      'agents',
      'skills',
      'plugins',
      'models',
      'evaluations',
      'routing',
      'intake',
    ].includes(page);
  return ['alerts', 'rules', 'audit', 'sandboxes', 'connectors'].includes(page);
}
export const governanceActionNames: Record<string, string> = {
  edit: '配置变更',
  evaluate: '评测',
  trial: '试用',
  publish: '发布',
  rollback: '回退',
  receive: '接收快照',
  'skill-test': '快照评测',
  approve: '审批',
  'skill-publish': '组织发布',
  return: '退回',
};
export type Governance = {
  revision: number;
  version: number;
  live: number;
  previous: number;
  stage: '草稿' | '评测通过' | '评测未通过' | '试用中' | '已发布' | '已回退';
  budget: number;
  route: string;
  scope: string;
  quality: string;
  skill: '待接收' | '待评测' | '待审批' | '已批准' | '已发布' | '已退回';
  skillVersion: string;
  events: { at: string; object: string; action: string; result: string }[];
  error: string;
};
export const initialGovernance = (): Governance => ({
  revision: 1,
  version: 2,
  live: 1,
  previous: 1,
  stage: '草稿',
  budget: 30000,
  route: '分级路由',
  scope: '市政务服务管理局',
  quality: '待评测',
  skill: '待接收',
  skillVersion: '未发布',
  events: [],
  error: '',
});
export type GovernanceAction = {
  revision: number;
  role: AdminRole;
  type:
    | 'edit'
    | 'evaluate'
    | 'trial'
    | 'publish'
    | 'rollback'
    | 'receive'
    | 'skill-test'
    | 'approve'
    | 'skill-publish'
    | 'return';
  budget?: number;
  route?: string;
  scope?: string;
};
export function changeGovernance(
  old: Governance,
  a: GovernanceAction,
): Governance {
  const s = structuredClone(old);
  s.error = '';
  const skill = [
    'receive',
    'skill-test',
    'approve',
    'skill-publish',
    'return',
  ].includes(a.type);
  const deny = (reason: string) => ({ ...s, error: reason });
  if (a.revision !== s.revision) return deny('记录已更新，未重复执行。');
  if (!mayManage(a.role, skill ? 'intake' : 'routing'))
    return deny('当前岗位没有该操作权限。');
  if (
    !skill &&
    a.type !== 'edit' &&
    ((a.budget !== undefined && a.budget !== s.budget) ||
      (a.route !== undefined && a.route !== s.route) ||
      (a.scope !== undefined && a.scope !== s.scope))
  )
    return deny('配置有未保存修改，请先保存为新版本，旧评测不能用于新范围。');
  const required = s.route === '指定模型' ? 36200 : 24600;
  if (a.type === 'edit') {
    if (!a.budget || a.budget < 1000 || a.budget > 100000)
      return deny('预算需在1,000—100,000 Token之间。');
    if (!['分级路由', '指定模型'].includes(a.route || ''))
      return deny('请选择有效路由。');
    if (!['市政务服务管理局', '全市已授权单位'].includes(a.scope || ''))
      return deny('请选择已登记的发布范围。');
    s.version++;
    s.budget = a.budget;
    s.route = a.route!;
    s.scope = a.scope!;
    s.stage = '草稿';
    s.quality = '配置已变，旧评测不再适用';
  } else if (a.type === 'evaluate') {
    if (!['草稿', '评测未通过', '已回退'].includes(s.stage))
      return deny('当前版本无待评测变更。');
    s.quality =
      s.budget >= required
        ? '通过：3/3 样本满足证据、确认和预算门'
        : `未通过：预算不足，当前路由完整核验需${required.toLocaleString()} Token`;
    s.stage = s.budget >= required ? '评测通过' : '评测未通过';
  } else if (a.type === 'trial') {
    if (s.stage !== '评测通过') return deny('须先通过当前版本评测。');
    s.stage = '试用中';
  } else if (a.type === 'publish') {
    if (s.stage !== '试用中') return deny('须先在已授权范围试用并核对结果。');
    s.previous = s.live;
    s.live = s.version;
    s.stage = '已发布';
  } else if (a.type === 'rollback') {
    if (s.stage !== '已发布') return deny('没有可回退的本次发布。');
    s.live = s.previous;
    s.stage = '已回退';
  } else if (a.type === 'receive') {
    if (s.skill !== '待接收' && s.skill !== '已退回')
      return deny('该快照已接收。');
    s.skill = '待评测';
  } else if (a.type === 'skill-test') {
    if (s.skill !== '待评测') return deny('先接收个人提交的快照。');
    s.skill = '待审批';
  } else if (a.type === 'approve') {
    if (s.skill !== '待审批') return deny('当前快照尚未评测通过。');
    s.skill = '已批准';
  } else if (a.type === 'skill-publish') {
    if (s.skill !== '已批准') return deny('须获得独立审批后再发布组织版本。');
    s.skill = '已发布';
    s.skillVersion = 'ORG-PAYMENT-METHOD-2.0';
  } else if (a.type === 'return') {
    if (s.skill === '已发布') return deny('已发布版本不能作为待审材料退回。');
    s.skill = '已退回';
  }
  s.revision++;
  s.events.unshift({
    at: new Date(
      Date.parse('2026-09-25T09:30:00Z') + s.revision * 60000,
    ).toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }),
    object: skill ? '个人快照PS-PAYMENT-v1' : `会务策略v${s.version}`,
    action: a.type,
    result: skill ? s.skill : s.stage,
  });
  return s;
}
export const meetingSamples = [
  {
    id: 'M13-REPLAY',
    name: '第13次 · 原策略回放',
    policy: 'meeting-policy-1.0',
    date: '2026-09-25 16:00',
    input: 26000,
    output: 6000,
    retry: 3000,
    routing: 1200,
    quality: '3/3 通过',
    source: 'M13-MINUTES-v2 + COR-13-01',
  },
  {
    id: 'M14-EVAL',
    name: '第14次 · 候选策略评测',
    policy: 'meeting-policy-2.0',
    date: '2026-09-25 17:00',
    input: 18000,
    output: 5000,
    retry: 0,
    routing: 1600,
    quality: '3/3 通过',
    source: '同一固定输入、相同质量门；非当前对话日志',
  },
];

import type { State, Row } from './admin/data.ts';
export function scopeAdminState(full: State, role: AdminRole): State {
  if (role !== '单位管理员') return full;
  const rows = full.rows.filter((r) => r.unit === 'u1' || r.unit === 'all');
  const ids = new Set(rows.map((r) => r.id));
  return {
    ...full,
    rows,
    calls: full.calls.filter((r) => r.unit === 'u1'),
    audit: full.audit.filter((a) => ids.has(a.record) || a.unit === 'u1'),
    comparisons: Object.fromEntries(
      Object.entries(full.comparisons || {}).filter(([id]) => ids.has(id)),
    ),
    safety: full.safety
      ? {
          ...full.safety,
          grants: full.safety.grants.filter((g) => g.unit === 'u1'),
          checks: full.safety.checks.filter((c) => c.unit === 'u1'),
          events: full.safety.events.filter((e) => ids.has(e.task)),
        }
      : undefined,
  };
}
export function submitUnitRequest(
  full: State,
  role: AdminRole,
  page: 'applications' | 'tickets',
  amount: number,
  purpose: string,
): State {
  if (role !== '单位管理员') throw Error('仅单位管理员可提交本单位申请。');
  if (purpose.trim().length < 8) throw Error('请填写至少8字的具体用途或问题。');
  if (
    page === 'applications' &&
    (!Number.isInteger(amount) || amount < 1 || amount > 500)
  )
    throw Error('申请数量应为1—500的整数。');
  const s = structuredClone(full);
  const id = 'UNIT-REQUEST-' + ++s.seq;
  const row: Row = {
    id,
    page,
    name: page === 'applications' ? '本单位新增席位申请' : '本单位服务问题',
    unit: 'u1',
    status: page === 'applications' ? '待审批' : '待分派',
    version: '1.0',
    revision: 1,
    history: [{ time: s.now, action: '提交', detail: purpose }],
    fields: {
      amount: String(amount),
      purpose,
      material: '在线需求说明：' + purpose,
      owner: '单位管理员',
      date: s.now.slice(0, 10),
      source: '本单位自助申请',
      category: '使用咨询',
      due: '2026-09-10',
      feedback: '待处理',
    },
  };
  s.rows.unshift(row);
  s.audit.unshift({
    id: 'AUD-' + s.seq,
    time: s.now,
    record: id,
    page,
    action: '单位提交',
    result: '成功',
    detail: purpose,
    actor: '单位管理员 / u1',
  });
  return s;
}
