import {
  prepareComparison,
  finishRouteCall,
  routeModelProblem,
  taskSeed,
} from './savings.ts';
import {
  initialAdminState,
  units,
  makeRow,
  records,
  number,
  unitName,
  metrics,
  filteredCalls,
  defaultFilters,
  TODAY,
  type State,
  type Row,
  type Filters,
} from './data.ts';
import type {
  GateEvidence,
  SafetyCheck,
  RuntimeStage,
} from './safety-types.ts';
import { riskPolicyFor } from '../../../shared/risk-policy.ts';

const find = (s: State, id?: string) => s.rows.find((r) => r.id === id);
export const inScope = (s: State, scope: string, unit: string) =>
  scope === '全市单位' || scope === unitName(unit, s);
export const publishedPassed = (s: State, r: Row) =>
  r.fields.enabled === '是' &&
  !!r.fields.liveVersion &&
  ['性能', '安全'].every((kind) =>
    records(s, 'evaluations').some(
      (e) =>
        e.fields.target === r.id &&
        e.fields.targetVersion === r.fields.liveVersion &&
        e.fields.kind === kind &&
        e.status === '通过',
    ),
  );
export function connectorReady(s: State, c: Row, unit = c.unit) {
  const sys = find(s, c.fields.systemId);
  return (
    !!sys &&
    sys.status === '已接入' &&
    sys.fields.review === '通过' &&
    sys.fields.expires >= s.now.slice(0, 10) &&
    c.fields.expires >= s.now.slice(0, 10) &&
    c.fields.enabled === '是' &&
    c.fields.connection === '正常' &&
    inScope(s, sys.fields.scope, unit) &&
    inScope(s, c.fields.scope, unit)
  );
}
export function systemProblem(
  s: State,
  sys: Row,
  requireConnected = false,
): string | null {
  if (sys.fields.review !== '通过') return '接入审核尚未通过';
  if (sys.fields.expires < s.now.slice(0, 10))
    return '系统授权已到期，请更新材料并重新审核';
  const cs = records(s, 'connectors').filter(
    (c) => c.fields.systemId === sys.id,
  );
  if (!cs.length) return '尚未关联连接器，请先在连接器管理中关联并检查';
  if (
    requireConnected &&
    !cs.some(
      (c) =>
        c.fields.connection === '正常' &&
        c.fields.enabled === '是' &&
        c.fields.expires >= s.now.slice(0, 10),
    )
  )
    return '没有授权有效且连接正常的连接器';
  return null;
}
export function gateEvidence(s: State, t: Row): GateEvidence[] {
  const grant = s.safety?.grants.find(
    (g) => g.user === t.fields.user && g.unit === t.unit,
  );
  const account = records(s, 'accounts').find((a) => a.unit === t.unit);
  const seat = records(s, 'seats').find((a) => a.unit === t.unit);
  const agent = find(s, t.fields.agent),
    connector = find(s, t.fields.connector),
    system = find(s, t.fields.system),
    box = find(s, t.fields.sandbox);
  return [
    {
      label: '人员授权',
      objectId: account?.id ?? '',
      result:
        grant?.status === '已授权' &&
        account?.status === '启用' &&
        !!seat &&
        number(seat, 'opened') > 0
          ? '通过'
          : '不通过',
      detail: grant
        ? `${grant.label} · ${grant.scope}；授权记录 ${grant.id}，${grant.approvedBy}`
        : '授权记录待补齐',
    },
    {
      label: '能力发布依据',
      objectId: agent?.id ?? '',
      result:
        agent &&
        publishedPassed(s, agent) &&
        inScope(s, agent.fields.scope, t.unit)
          ? '通过'
          : '不通过',
      detail: agent
        ? `${agent.name} · 已发布版本 ${agent.fields.liveVersion || '无'}，性能与安全双评测；范围 ${agent.fields.scope}`
        : '能力记录待补齐',
    },
    {
      label: '系统与连接器授权',
      objectId: system?.id ?? '',
      result:
        connector &&
        connectorReady(s, connector, t.unit) &&
        t.fields.system === connector.fields.systemId
          ? '通过'
          : '不通过',
      detail:
        system && connector
          ? `${system.name}：${system.status}；${connector.name}：${connector.fields.connection}；有效期 ${connector.fields.expires}`
          : '系统或连接器记录待补齐',
    },
    {
      label: '沙箱运行',
      objectId: box?.id ?? '',
      result:
        box &&
        ['运行中', '闲置'].includes(box.status) &&
        (box.status !== '运行中' || box.fields.task === t.id) &&
        box.unit === t.unit
          ? '通过'
          : '不通过',
      detail: box
        ? `${box.name} · ${box.status} · ${box.fields.network}；个人成果独立保留`
        : '环境记录待补齐',
    },
  ];
}
export function effectiveRule(s: State, r: Row, unit: string) {
  if (
    r.status === '待发布' &&
    r.fields.checkVersion === r.version &&
    r.fields.pilot === unitName(unit, s)
  )
    return {
      config: {
        riskLevel: r.fields.riskLevel,
        tag: r.fields.tag,
        condition: r.fields.condition,
        action: r.fields.action,
        scope: r.fields.pilot,
      },
      version: r.version,
    };
  return {
    config: r.fields.liveConfig ? JSON.parse(r.fields.liveConfig) : null,
    version: r.fields.liveVersion,
  };
}
export function evaluateTask(
  s: State,
  t: Row,
  intent: string,
): Omit<SafetyCheck, 'id' | 'receipt'> {
  const evidence = gateEvidence(s, t);
  const failed = evidence.find((e) => e.result !== '通过');
  const action =
    intent === 'confirm'
      ? '文件导出'
      : intent === 'blocked'
        ? '系统写入'
        : '数据访问';
  const risk =
    failed || intent === 'blocked'
      ? '红线'
      : intent === 'confirm'
        ? '高风险'
        : intent === 'masked'
          ? '中风险'
        : '低风险';
  const policy = riskPolicyFor(risk === '红线' ? '红线' : risk.replace('风险', '') as '低' | '中' | '高');
  let control = policy.control;
  let outcome: SafetyCheck['outcome'] =
    failed || intent === 'blocked'
      ? '阻断'
      : intent === 'confirm'
        ? '转人工确认'
        : intent === 'masked'
          ? '脱敏'
          : '允许';
  let reason = failed
    ? `${failed.label}未通过：${failed.detail}`
    : intent === 'blocked'
      ? '请求的写入接口超出已批准的只读授权范围'
      : intent === 'confirm'
        ? '受限材料导出需逐项确认，尚未执行'
        : intent === 'masked'
          ? '移除敏感标识后在授权范围内使用'
          : '人员、能力、系统和环境满足当前访问要求';
  const matched = records(s, 'rules').filter((r) => {
    if (!r.fields.liveConfig || !r.fields.liveVersion) return false;
    const config = effectiveRule(s, r, t.unit).config;
    const tag =
      intent === 'confirm'
        ? '受限材料'
        : intent === 'masked'
          ? '个人敏感信息'
          : '全部数据';
    return (
      inScope(s, config.scope, t.unit) &&
      (config.tag === '全部数据' || config.tag === tag) &&
      (config.riskLevel === (risk === '红线' ? '红线' : risk.replace('风险', '')) ||
        (config.riskLevel === '红线' && config.condition === '全部操作') ||
        (config.condition === '高风险操作'
          ? risk === '高风险'
        : config.condition === '超出授权范围'
          ? !!failed || intent === 'blocked'
          : true)) &&
      (r.fields.category === action ||
        (r.fields.category === '高风险确认' && risk === '高风险'))
    );
  });
  if (!failed && intent !== 'blocked' && matched.length) {
    const configs = matched.map((r) => effectiveRule(s, r, t.unit).config);
    if (configs.some((c) => c.action === '全局阻断')) {
      outcome = '阻断';
      control = '全局阻断';
    } else if (configs.some((c) => c.action === '本人确认')) {
      outcome = '转人工确认';
      control = '本人确认';
    } else if (configs.some((c) => c.action === '限域允许')) {
      control = '限域允许';
    }
    else if (configs.some((c) => c.action === '脱敏')) outcome = '脱敏';
    reason = `命中当前生效规则：${matched.map((r) => r.name).join('、')}；${outcome === '转人工确认' ? '等待人工确认，未执行' : outcome}`;
  }
  const defaults = records(s, 'rules').filter(
    (r) =>
      r.fields.category ===
      (failed?.label === '沙箱运行' ? '沙箱访问' : action),
  );
  const rules = matched.length ? matched : outcome !== '允许' ? defaults : [];
  return {
    task: t.id,
    unit: t.unit,
    time: s.now,
    action,
    risk,
    control,
    outcome,
    reason,
    ruleIds: rules.map((r) => r.id),
    ruleVersions: rules.map(
      (r) => effectiveRule(s, r, t.unit).version || '未生效',
    ),
    evidence,
  };
}
function event(s: State, t: Row, stage: RuntimeStage, detail: string) {
  s.safety!.events.push({
    id: 'RUN-' + ++s.seq,
    task: t.id,
    time: s.now,
    stage,
    detail,
  });
  t.fields.stage = stage;
}
function recordCheck(s: State, check: Omit<SafetyCheck, 'id' | 'receipt'>) {
  const id = 'CHECK-' + ++s.seq;
  const c: SafetyCheck = { ...check, id, receipt: 'GATE-' + s.seq };
  s.safety!.checks.push(c);
  s.rows.push(
    makeRow(
      'audit',
      id,
      check.action,
      check.unit,
      check.outcome === '阻断'
        ? '已阻断'
        : check.outcome === '转人工确认'
          ? '待确认'
          : '已放行',
      {
        risk: check.risk,
        control: check.control,
        result: check.outcome,
        task: check.task,
        rule: check.ruleIds.join('、'),
        date: check.time.slice(0, 10),
        time: check.time,
        actor: '安全执行网关',
        material: check.reason,
        kind: '安全执行',
        tag: check.outcome === '脱敏' ? '个人敏感信息' : '受控操作',
        receipt: c.receipt,
      },
    ),
  );
  return c;
}
function alertFor(s: State, t: Row, c: SafetyCheck) {
  const failed = c.evidence.find((e) => e.result !== '通过');
  const riskObject = failed?.objectId || t.fields.system;
  const key = [
    t.unit,
    t.fields.agent,
    riskObject,
    c.action,
    c.reason.split('：')[0],
  ].join('|');
  const prior = records(s, 'alerts').find(
    (a) => a.fields.riskKey === key && a.status !== '已关闭',
  );
  if (prior) {
    prior.fields.occurrences = String(number(prior, 'occurrences') + 1);
    prior.fields.lastSeen = s.now;
    prior.fields.latestTask = t.id;
    return;
  }
  s.rows.push(
    makeRow(
      'alerts',
      'ALERT-LIVE-' + ++s.seq,
      c.action + '安全检查需处理',
      t.unit,
      '待处理',
      {
        level: c.risk === '红线' || c.risk === '高风险' ? '高危' : '中危',
        owner: '未分派',
        task: t.id,
        sandbox: t.fields.sandbox,
        evidence: c.id,
        result: c.outcome === '阻断' ? '执行前已阻断' : '等待人工确认，未执行',
        actionType: c.action,
        rule: c.ruleIds[0] || '',
        restriction: '未限制',
        material: c.reason,
        rectification: '',
        review: '',
        due: s.now.slice(0, 10) + ' 18:00',
        date: s.now.slice(0, 10),
        riskKey: key,
        occurrences: '1',
        lastSeen: s.now,
      },
    ),
  );
}
export function createSafetyState(): State {
  const s = initialAdminState(1440);
  s.safety = { grants: [], checks: [], events: [], tick: 0 };
  [
    '公文协同系统',
    '政务知识服务系统',
    '业务事项查询系统',
    '组织资料归档系统',
  ].forEach((name, i) => {
    s.rows.push(
      makeRow(
        'systems',
        'SYS-' + (i + 1),
        name,
        ['u1', 'u2', 'u3', 'u4'][i],
        i < 2 ? '已接入' : i === 2 ? '待审核' : '草稿',
        {
          provider: '对应系统建设方',
          owner: '能力运营岗',
          purpose: [
            '公文资料授权查询',
            '政务知识检索',
            '业务事项核对',
            '组织资料归档',
          ][i],
          permissions: '只读查询、指定接口',
          dataScope: '已授权的组织资料摘要',
          scope: '全市单位',
          expires: '2026-12-31',
          material: '系统接入申请及授权范围说明.pdf',
          review: i < 2 ? '通过' : '待审核',
          approval:
            i < 2 ? '市级运营管理员 · 2026-09-01 · 接入范围审核通过' : '待审核',
          enabled: i < 2 ? '是' : '否',
          receipt: i < 2 ? 'SYS-OPEN-' + (i + 1) : '待执行',
        },
      ),
    );
  });
  records(s, 'connectors').forEach((c, i) => {
    c.fields.systemId = 'SYS-' + (i + 1);
    c.fields.system = find(s, c.fields.systemId)!.name;
  });
  // Two independently granted connectors can serve the same system.
  const extra = structuredClone(records(s, 'connectors')[0]);
  extra.id = 'CONNECTORS-4';
  extra.name = '公文目录查询连接器';
  extra.fields.permissions = '只读查询、目录接口';
  s.rows.push(extra);
  // Historical snapshots remain separate from current authorization/connection state.
  const tasks = records(s, 'tasks');
  s.rows = s.rows.filter((r) => r.page !== 'audit');
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    t.fields.system = 'SYS-1';
    t.fields.connector = 'CONNECTORS-1';
    t.fields.user = t.unit + '-USER-' + ((Math.floor(i / 12) % 40) + 1);
    const grant = {
      id: 'GRANT-' + t.fields.user,
      user: t.fields.user,
      label: '用户 ' + String((Math.floor(i / 12) % 40) + 1).padStart(3, '0'),
      unit: t.unit,
      status: '已授权' as const,
      scope: '本单位授权任务',
      approvedBy: '单位管理员',
      approvedAt: '2026-09-01 09:00',
    };
    if (!s.safety.grants.some((g) => g.id === grant.id))
      s.safety.grants.push(grant);
    t.fields.time =
      t.fields.date +
      ' ' +
      String(6 + Math.floor((i % 24) / 6)).padStart(2, '0') +
      ':' +
      String(i % 60).padStart(2, '0') +
      ':00';
    for (const call of s.calls.filter((c) => c.task === t.id))
      call.hour = 6 + Math.floor((i % 24) / 6);
    const outcome: SafetyCheck['outcome'] =
      i === 0 || i === 2 || i === 3
        ? '阻断'
        : i === 1
          ? '转人工确认'
          : i % 9 === 0
            ? '脱敏'
            : '允许';
    const action =
      i === 3
        ? '系统写入'
        : i === 2
          ? '沙箱访问'
          : i === 0
            ? '工具使用'
            : i === 1
              ? '文件导出'
              : '数据访问';
    const rule = records(s, 'rules').find((r) => r.fields.category === action)!;
    const ev = gateEvidence(s, t).map((e) => ({
      ...e,
      result: '通过',
      detail:
        e.label === '系统与连接器授权'
          ? '接入审批和连接授权在检查时有效 · SYS-OPEN-1'
          : e.label === '沙箱运行'
            ? '检查时任务独立环境正常，政务网络隔离规则有效；个人成果独立保留'
            : e.detail,
    }));
    if (i === 2)
      ev[3] = {
        ...ev[3],
        result: '不通过',
        detail: '请求跨越任务环境访问边界，网关拒绝',
      };
    const c = recordCheck(s, {
      task: t.id,
      unit: t.unit,
      time: t.fields.time,
      action,
      risk:
        i === 2
          ? '红线'
          : i === 1 || i === 3
            ? '高风险'
            : i === 0
              ? '中风险'
              : '低风险',
      control:
        i === 2
          ? '全局阻断'
          : i === 1 || i === 3
            ? '本人确认'
            : i === 0
              ? '限域允许'
              : '允许',
      outcome,
      reason:
        outcome === '阻断'
          ? '操作超出授权边界，执行网关已阻断'
          : outcome === '转人工确认'
            ? '文件导出需逐项确认，尚未执行'
            : outcome === '脱敏'
              ? '敏感标识移除后执行'
              : '检查时授权与运行环境均满足要求',
      ruleIds: [rule.id],
      ruleVersions: [rule.fields.liveVersion],
      evidence: ev,
    });
    if (i < 4) {
      s.calls = s.calls.filter(
        (call) => call.task !== t.id || call.type === '模型请求',
      );
      t.status = outcome === '阻断' ? '已阻断' : '等待确认';
      const a = find(s, 'ALERT-' + (i + 1))!;
      a.fields.rule = rule.id;
      a.fields.actionType = action;
      a.fields.evidence = c.id;
      a.fields.result =
        outcome === '阻断' ? '执行前已阻断' : '等待人工确认，未执行';
      a.fields.occurrences = '1';
      a.fields.lastSeen = t.fields.time;
      a.fields.due = TODAY + (i === 0 ? ' 09:30' : ' 18:00');
    }
    t.fields.stage =
      t.status === '已阻断'
        ? '已阻断'
        : t.status === '等待确认'
          ? '等待确认'
          : t.status === '失败'
            ? '技术异常'
            : '结果完成';
    s.safety.events.push({
      id: 'RUN-SEED-' + i,
      task: t.id,
      time: t.fields.time,
      stage: t.fields.stage as RuntimeStage,
      detail: c.reason,
    });
    c.callId = s.calls.find(
      (call) => call.task === t.id && call.type === '工具调用',
    )?.id;
  }
  const b = find(s, 'BOX-1')!;
  b.status = '闲置';
  // Preconfigured task environments support concurrent units without sharing an active sandbox.
  for (const unit of units) {
    const template = records(s, 'sandboxes').find((b) => b.unit === unit.id)!;
    for (let i = 0; i < 24; i++) {
      const box = structuredClone(template);
      box.id = `BOX-POOL-${unit.id}-${i + 1}`;
      box.name = `${unit.name}任务环境 ${String(i + 1).padStart(2, '0')}`;
      box.status = '闲置';
      box.fields = {
        ...box.fields,
        task: '',
        retention: '无',
        restriction: '基础访问规则',
        error: '无',
        resource: '0%',
      };
      s.rows.push(box);
    }
  }
  for (const task of records(s, 'tasks')) prepareComparison(s, task);
  queueBatch(s);
  return s;
}
export const UPDATE_INTERVAL_MS = 10_000;
export function taskBatchSize(tick: number) {
  return tick === 0 ? 24 : 16 + ((tick * 17 + Math.floor(tick / 4) * 11) % 21);
}
function queueBatch(s: State) {
  const offset = records(s, 'tasks').filter(
    (t) => t.fields.live === '是',
  ).length;
  for (let i = 0; i < taskBatchSize(s.safety!.tick); i++)
    queueTask(s, offset + i);
}
function queueTask(s: State, tick: number) {
  const unitIds = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'];
  const unit = unitIds[tick % unitIds.length];
  const grants = s.safety!.grants.filter((g) => g.unit === unit);
  const g = grants[Math.floor(tick / unitIds.length) % grants.length];
  const reserved = new Set(
    records(s, 'tasks')
      .filter((t) =>
        ['任务进入', '安全检查', '受控执行'].includes(t.fields.stage),
      )
      .map((t) => t.fields.sandbox),
  );
  const box =
    records(s, 'sandboxes').find(
      (b) => b.unit === unit && b.status === '闲置' && !reserved.has(b.id),
    ) ?? records(s, 'sandboxes').find((b) => b.unit === unit)!;
  if (!box) return;
  // Frequent ordinary work, with reproducible low-frequency exception paths.
  const slot = tick % 48;
  const intent =
    slot === 13
      ? 'confirm'
      : slot === 29
        ? 'blocked'
        : slot === 37
          ? 'failure'
          : slot % 9 === 1
            ? 'masked'
            : 'normal';
  const t = makeRow(
    'tasks',
    'TASK-LIVE-' + ++s.seq,
    intent === 'confirm'
      ? '授权文件导出'
      : intent === 'blocked'
        ? '业务记录写入'
        : '组织资料查询',
    unit,
    '待执行',
    {
      agent: 'AG-1',
      system: 'SYS-1',
      connector: 'CONNECTORS-1',
      sandbox: box.id,
      user: g.user,
      userLabel: g.label,
      date: s.now.slice(0, 10),
      time: s.now,
      duration: '0',
      taskType: '资料查询',
      entry: '超级智能体',
      model: 'qwen-3-8-27b',
      modelMode: tick % 4 === 0 ? '指定模型' : '智能模式',
      intent,
      toolDuration: String(650 + ((tick * 7919 + 173) % 3250)),
      modelDuration: String(850 + ((tick * 3571 + 419) % 7150)),
      inputTokens: String(1100 + ((tick * 1297 + 211) % 6500)),
      outputTokens: String(280 + ((tick * 617 + 97) % 1500)),
      live: '是',
      privacy: '仅执行元信息，不包含任务正文',
      error: '无',
    },
  );
  s.rows.push(t);
  prepareComparison(s, t, true);
  event(s, t, '任务进入', '已接收任务，等待授权和环境检查');
}
export function advanceSafety(state: State): State {
  const s = structuredClone(state);
  if (!s.safety) return s;
  const clock = new Date(s.now.replace(' ', 'T') + '+08:00');
  clock.setSeconds(clock.getSeconds() + UPDATE_INTERVAL_MS / 1000);
  s.now = clock.toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
  s.safety.tick++;
  for (const t of records(s, 'tasks').filter((t) => t.fields.live === '是')) {
    if (t.fields.stage === '任务进入') {
      event(s, t, '安全检查', '正在核对人员、能力、系统、连接器与环境');
      continue;
    }
    if (t.fields.stage === '安全检查') {
      const c = recordCheck(s, evaluateTask(s, t, t.fields.intent));
      if (['阻断', '转人工确认'].includes(c.outcome)) {
        t.status = c.outcome === '阻断' ? '已阻断' : '等待确认';
        event(s, t, t.status as RuntimeStage, c.reason);
        alertFor(s, t, c);
        continue;
      }
      const firstStep = s.comparisons?.[t.id]?.steps.find(
        (p) => p.level !== 'L0' && p.status === '待执行',
      );
      const modelError = firstStep
        ? routeModelProblem(s, firstStep, t.unit)
        : '缺少路由记录';
      if (modelError) {
        t.status = '失败';
        t.fields.error = modelError;
        event(s, t, '技术异常', t.fields.error);
        continue;
      }
      t.status = '运行中';
      const box = find(s, t.fields.sandbox)!;
      box.status = '运行中';
      box.fields.task = t.id;
      box.fields.lastActive = s.now;
      box.fields.resource = String(18 + (number(t, 'toolDuration') % 64)) + '%';
      const id = 'CALL-LIVE-' + ++s.seq;
      c.callId = id;
      s.calls.push({
        id,
        task: t.id,
        unit: t.unit,
        agent: t.fields.agent,
        model: t.fields.model,
        date: s.now.slice(0, 10),
        hour: Number(s.now.slice(11, 13)),
        type: '工具调用',
        status: '进行中',
        duration: 0,
        input: 0,
        output: 0,
        cached: 0,
        metered: true,
        entry: t.fields.entry,
        taskType: t.fields.taskType,
      });
      event(s, t, '受控执行', '安全检查已放行，工具请求已经发出');
      continue;
    }
    if (t.fields.stage === '受控执行') {
      const box = find(s, t.fields.sandbox)!;
      const call = s.calls.find(
        (c) => c.task === t.id && c.status === '进行中',
      );
      if (
        ['已隔离', '已停止', '已回收'].includes(box.status) ||
        ['暂停', '已停止'].includes(t.status)
      ) {
        if (call) call.status = '安全中止';
        t.status = '暂停';
        event(s, t, '安全中止', '执行被环境限制终止；不会自动重放');
        continue;
      }
      if (call) {
        call.status = t.fields.intent === 'failure' ? '失败' : '成功';
        call.duration =
          t.fields.intent === 'failure' ? 12000 : number(t, 'toolDuration');
      }
      if (t.fields.intent === 'failure') {
        t.status = '失败';
        t.fields.error = '工具响应超时';
        event(s, t, '技术异常', '工具请求已发出但超时，未作为安全阻断统计');
      } else {
        // Every subsequent model request gets a fresh authorization decision.
        const c = recordCheck(s, evaluateTask(s, t, 'normal'));
        if (c.outcome === '阻断' || c.outcome === '转人工确认') {
          t.status = c.outcome === '阻断' ? '已阻断' : '等待确认';
          event(s, t, t.status as RuntimeStage, c.reason);
          alertFor(s, t, c);
        } else {
          const pair = s.comparisons![t.id];
          for (const step of pair.steps.filter(
            (p) => p.level === 'L0' && p.status === '待执行',
          )) {
            step.status = '完成';
            step.receipt = 'REUSE-' + step.id;
            step.checkId = c.id;
          }
          const step = pair.steps.find(
            (p) => p.level !== 'L0' && p.status === '待执行',
          );
          if (step) {
            const problem = routeModelProblem(s, step, t.unit);
            if (problem) {
              t.status = '失败';
              t.fields.error = problem;
              event(s, t, '技术异常', problem);
              if (box.status === '运行中') box.status = '闲置';
              continue;
            }
            const call = finishRouteCall(s, t, step, c.id);
            c.callId = call.id;
            if (
              pair.mode === '智能模式' &&
              step.level === 'L2' &&
              taskSeed(t.id) % 17 === 0 &&
              step.callIds.length === 1
            ) {
              call.status = '失败';
              step.status = '待执行';
              step.reason += '；首次质量检查未通过，保留消耗并重试';
              event(s, t, '受控执行', '本步骤检查未通过，等待再次校验后重试');
              continue;
            }
            if (pair.steps.some((p) => p.status === '待执行')) {
              event(
                s,
                t,
                '受控执行',
                step.name + '已完成，下一步骤等待安全检查',
              );
              continue;
            }
          }
          pair.quality = taskSeed(t.id) % 31 === 0 ? '未通过' : '通过';
          pair.qualityReceipt = 'QUALITY-' + t.id;
          t.status = '完成';
          t.fields.duration = (
            s.calls
              .filter((call) => call.task === t.id)
              .reduce((n, call) => n + call.duration, 0) / 1000
          ).toFixed(2);
          event(s, t, '结果完成', '已收到完成与计量回执；成果保留在个人空间');
        }
      }
      if (box.status === '运行中' && box.fields.task === t.id) {
        box.status = '闲置';
        box.fields.resource = '0%';
      }
    }
  }
  queueBatch(s);
  s.revision++;
  return s;
}
export function safetySummary(s: State, f: Filters = defaultFilters()) {
  const scope = (r: { unit: string }) =>
    f.unit === 'all' || r.unit === f.unit || r.unit === 'all';
  const tasks = records(s, 'tasks').filter(
    (t) => scope(t) && t.fields.date >= f.from && t.fields.date <= f.to,
  );
  const checks = (s.safety?.checks ?? []).filter(
    (c) =>
      scope(c) && c.time.slice(0, 10) >= f.from && c.time.slice(0, 10) <= f.to,
  );
  const alerts = records(s, 'alerts').filter(scope),
    boxes = records(s, 'sandboxes').filter(scope),
    systems = records(s, 'systems').filter(scope),
    agents = records(s, 'agents').filter(scope),
    connectors = records(s, 'connectors').filter(scope),
    grants = (s.safety?.grants ?? []).filter(scope);
  const calls = filteredCalls(s, f),
    ended = calls.filter((c) => !['进行中', '安全中止'].includes(c.status)),
    ok = calls.filter((c) => c.status === '成功');
  const open = alerts.filter((a) => a.status !== '已关闭');
  return {
    scale: metrics(s, f),
    tasks,
    checks,
    alerts,
    boxes,
    systems,
    agents,
    connectors,
    grants,
    calls,
    high: open.filter((a) => a.fields.level === '高危').length,
    pendingRestriction: open.filter((a) => a.fields.restriction !== '已限制')
      .length,
    overdue: open.filter(
      (a) =>
        (a.fields.due.length === 10 ? a.fields.due + ' 23:59' : a.fields.due) <
        s.now,
    ).length,
    running: records(s, 'tasks').filter(
      (t) => scope(t) && t.status === '运行中',
    ).length,
    success: ended.length ? (ok.length / ended.length) * 100 : null,
    latency: ok.length
      ? ok.reduce((n, c) => n + c.duration, 0) / ok.length / 1000
      : null,
    modelCalls: calls.filter((c) => c.type === '模型请求').length,
    toolCalls: calls.filter((c) => c.type === '工具调用').length,
    failed: calls.filter((c) => c.status === '失败').length,
  };
}
export function taskSafetyChain(s: State, id: string) {
  const t = find(s, id);
  if (!t || t.page !== 'tasks') throw new Error('任务不存在');
  const checks = s.safety?.checks.filter((c) => c.task === id) ?? [],
    events = s.safety?.events.filter((e) => e.task === id) ?? [];
  const alerts = records(s, 'alerts').filter(
    (a) => a.fields.task === id || a.fields.latestTask === id,
  );
  return {
    task: {
      id: t.id,
      name: t.name,
      unit: t.unit,
      status: t.status,
      stage: t.fields.stage,
    },
    checks,
    events,
    alerts: alerts.map((a) => ({
      id: a.id,
      name: a.name,
      status: a.status,
      owner: a.fields.owner,
      restriction: a.fields.restriction,
      result: a.fields.result,
      due: a.fields.due,
      review: a.fields.review,
      history: a.history,
    })),
    calls: s.calls
      .filter((c) => c.task === id)
      .map((c) => ({
        id: c.id,
        type: c.type,
        status: c.status,
        duration: c.duration,
      })),
  };
}
