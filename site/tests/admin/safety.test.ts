import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSafetyState,
  taskBatchSize,
  UPDATE_INTERVAL_MS,
  advanceSafety,
  connectorReady,
  evaluateTask,
  publishedPassed,
  safetySummary,
  taskSafetyChain,
} from '../../app/products/admin/admin/safety.ts';
import {
  getRow,
  records,
  defaultFilters,
  type State,
} from '../../app/products/admin/admin/data.ts';
import {
  beginOperation,
  settleOperation,
  createRecord,
} from '../../app/products/admin/admin/business.ts';
function op(
  s: State,
  id: string,
  key: string,
  values: Record<string, string> = { note: '核对授权及执行结果' },
  fail = false,
) {
  const b = beginOperation(s, id, key, values, getRow(s, id).revision);
  return settleOperation(b.state, b.operation, fail);
}
const latest = (s: State) =>
  records(s, 'tasks').filter((t) => t.fields.live === '是')[0];
const tick = (s: State, n: number) => {
  for (let i = 0; i < n; i++) s = advanceSafety(s);
  return s;
};
await test('V3系统准入与连接器为独立对象，所有安全记录可反向追溯', () => {
  const s = createSafetyState();
  assert.equal(records(s, 'systems').length, 4);
  assert.equal(
    records(s, 'connectors').filter((c) => c.fields.systemId === 'SYS-1')
      .length,
    2,
  );
  for (const c of s.safety!.checks) {
    assert.ok(getRow(s, c.task));
    for (const id of c.ruleIds) assert.ok(getRow(s, id));
    for (const e of c.evidence) assert.ok(getRow(s, e.objectId));
  }
  for (const a of records(s, 'alerts')) {
    const c = s.safety!.checks.find((c) => c.id === a.fields.evidence)!;
    assert.ok(c);
    assert.equal(c.task, a.fields.task);
    assert.ok(c.ruleIds.includes(a.fields.rule));
    assert.equal(c.action, a.fields.actionType);
  }
});
await test('确定性批次经历接收、检查、执行、回执，逐次变更可复现', () => {
  const start = createSafetyState(),
    id = latest(start).id;
  let s = advanceSafety(start);
  assert.equal(getRow(s, id).fields.stage, '安全检查');
  assert.equal(s.calls.filter((c) => c.task === id).length, 0);
  s = advanceSafety(s);
  assert.equal(getRow(s, id).fields.stage, '受控执行');
  assert.equal(s.calls.filter((c) => c.task === id).length, 1);
  s = advanceSafety(s);
  assert.equal(getRow(s, id).fields.stage, '结果完成');
  assert.equal(s.calls.filter((c) => c.task === id).length, 2);
  assert.deepEqual(s, tick(start, 3));
  assert.equal(start.now, '2026-09-08 10:00:00');
});
await test('暂停系统只限制后续请求，已发出的工具调用结果保留', () => {
  let s = tick(createSafetyState(), 2);
  const id = latest(s).id;
  const old = s.calls.filter((c) => c.task !== id && c.status !== '进行中');
  s = op(s, 'SYS-1', 'systemPause');
  s = advanceSafety(s);
  assert.equal(getRow(s, id).status, '已阻断');
  assert.equal(s.calls.find((c) => c.task === id)!.status, '成功');
  assert.equal(s.calls.filter((c) => c.task === id).length, 1);
  assert.deepEqual(
    s.calls.filter((c) => old.some((o) => o.id === c.id)),
    old,
  );
});
await test('授权失效、停用账号、停用能力、连接异常均阻断后续新执行', () => {
  for (const variant of ['expiry', 'account', 'agent', 'connector', 'scope']) {
    let s = createSafetyState();
    const t = latest(s);
    if (variant === 'expiry') getRow(s, 'SYS-1').fields.expires = '2026-09-07';
    if (variant === 'account') getRow(s, 'ACCOUNT-' + t.unit).status = '停用';
    if (variant === 'agent') getRow(s, 'AG-1').fields.enabled = '否';
    if (variant === 'connector')
      getRow(s, 'CONNECTORS-1').fields.connection = '连接异常';
    if (variant === 'scope') getRow(s, 'SYS-1').fields.scope = '市交通运输局';
    s = tick(s, 2);
    assert.equal(getRow(s, t.id).status, '已阻断', variant);
    assert.equal(s.calls.filter((c) => c.task === t.id).length, 0, variant);
  }
});
await test('沙箱隔离成功后终止执行，不形成成功回执或自动重放', () => {
  let s = tick(createSafetyState(), 2);
  const t = latest(s);
  s = op(s, t.fields.sandbox, 'isolate');
  s = advanceSafety(s);
  assert.equal(getRow(s, t.id).fields.stage, '安全中止');
  assert.equal(s.calls.find((c) => c.task === t.id)?.status, '安全中止');
  s = op(s, t.fields.sandbox, 'restore');
  s = tick(s, 2);
  assert.notEqual(getRow(s, t.id).fields.stage, '结果完成');
});
await test('等待确认和越权阻断不发起调用，当前规则不能绕过硬授权', () => {
  const s = createSafetyState(),
    t = latest(s);
  assert.equal(evaluateTask(s, t, 'confirm').outcome, '转人工确认');
  assert.equal(evaluateTask(s, t, 'blocked').outcome, '阻断');
  const r = getRow(s, 'RULE-3');
  r.fields.liveConfig = JSON.stringify({
    tag: '全部数据',
    condition: '全部操作',
    action: '逐项确认',
    scope: '全市单位',
  });
  assert.equal(evaluateTask(s, t, 'blocked').outcome, '阻断');
});
await test('生效规则修改影响后续判定，草稿不影响现网', () => {
  const s = createSafetyState(),
    t = latest(s),
    r = getRow(s, 'RULE-1');
  r.fields.riskLevel = '红线';
  r.fields.action = '全局阻断';
  r.fields.condition = '全部操作';
  r.status = '草稿';
  assert.equal(evaluateTask(s, t, 'normal').outcome, '允许');
  r.fields.liveConfig = JSON.stringify({
    riskLevel: '红线',
    tag: '全部数据',
    condition: '全部操作',
    action: '全局阻断',
    scope: '全市单位',
  });
  assert.equal(evaluateTask(s, t, 'normal').outcome, '阻断');
});
await test('新提交能力版本不覆盖已发布版本的历史评测依据', () => {
  let s = createSafetyState();
  s = op(s, 'AG-1', 'newVersion', { description: '待评测的新版本' });
  assert.equal(publishedPassed(s, getRow(s, 'AG-1')), true);
  getRow(s, 'AG-1').fields.liveVersion = '2.0';
  assert.equal(publishedPassed(s, getRow(s, 'AG-1')), false);
});
await test('系统审核与开通分离，失败不显示已接入，重复回执不重复生效', () => {
  let s = createSafetyState();
  s = op(s, 'SYS-3', 'systemApprove');
  assert.equal(getRow(s, 'SYS-3').status, '待开通');
  getRow(s, 'CONNECTORS-3').fields.enabled = '是';
  getRow(s, 'CONNECTORS-3').fields.connection = '正常';
  s = op(s, 'SYS-3', 'systemOpen', { note: '核对授权' }, true);
  assert.equal(getRow(s, 'SYS-3').status, '待开通');
  const b = beginOperation(
    s,
    'SYS-3',
    'systemOpen',
    { note: '重试' },
    getRow(s, 'SYS-3').revision,
  );
  s = settleOperation(b.state, b.operation);
  assert.equal(getRow(s, 'SYS-3').status, '已接入');
  assert.throws(() => settleOperation(s, b.operation), /已处理/);
});
await test('系统恢复检查授权、有效期和连接状态，恢复不修改历史任务', () => {
  let s = op(createSafetyState(), 'SYS-1', 'systemPause');
  getRow(s, 'SYS-1').fields.expires = '2026-01-01';
  assert.throws(() => op(s, 'SYS-1', 'systemResume'), /到期/);
  getRow(s, 'SYS-1').fields.expires = '2026-12-31';
  for (const c of records(s, 'connectors').filter(
    (c) => c.fields.systemId === 'SYS-1',
  ))
    c.fields.connection = '连接异常';
  assert.throws(() => op(s, 'SYS-1', 'systemResume'), /连接/);
  getRow(s, 'CONNECTORS-1').fields.connection = '正常';
  const before = records(s, 'tasks');
  s = op(s, 'SYS-1', 'systemResume');
  assert.deepEqual(records(s, 'tasks'), before);
});
await test('新增系统有完整登记、退回、补充再提交路径及无效日期校验', () => {
  let s = createSafetyState();
  s = createRecord(s, 'systems', {
    name: '组织协作系统',
    unit: '市政务服务管理局',
    provider: '系统建设方',
    purpose: '组织查询',
    dataScope: '资料摘要',
    permissions: '只读查询',
    scope: '全市单位',
    expires: '2026-12-31',
    material: '接入授权.pdf',
  });
  const r = records(s, 'systems').at(-1)!;
  assert.equal(r.status, '草稿');
  assert.equal(r.fields.items, undefined);
  assert.equal(r.fields.connection, undefined);
  s = op(s, r.id, 'systemSubmit');
  s = op(s, r.id, 'return');
  assert.equal(getRow(s, r.id).status, '待补充');
  assert.throws(
    () =>
      op(s, r.id, 'systemEdit', {
        provider: '系统建设方',
        purpose: '只读',
        dataScope: '摘要',
        permissions: '查询',
        scope: '全市单位',
        expires: '2026-02-30',
        material: '说明',
      }),
    /有效/,
  );
});
await test('同一风险对象持续异常合并告警，统计不依赖告警关闭', () => {
  let s = createSafetyState();
  getRow(s, 'SYS-1').status = '已暂停';
  s = tick(s, 22);
  const live = records(s, 'alerts').filter((a) =>
    a.id.startsWith('ALERT-LIVE'),
  );
  assert.ok(live.some((a) => Number(a.fields.occurrences) > 1));
  const m = safetySummary(s);
  const count = m.checks.filter((c) => c.outcome === '阻断').length;
  for (const a of records(s, 'alerts')) a.status = '已关闭';
  assert.equal(
    safetySummary(s).checks.filter((c) => c.outcome === '阻断').length,
    count,
  );
});
await test('技术失败与安全中止分开计数；输入输出及缓存口径一致', () => {
  const s = tick(createSafetyState(), 18),
    m = safetySummary(s);
  assert.equal(m.modelCalls + m.toolCalls, m.calls.length);
  assert.equal(m.failed, m.calls.filter((c) => c.status === '失败').length);
  assert.equal(
    m.scale.input + m.scale.output,
    m.calls
      .filter((c) => c.metered)
      .reduce((n, c) => n + c.input + c.output, 0),
  );
  assert.ok(
    m.calls
      .filter((c) => c.type === '模型请求')
      .every((c) => c.cached <= c.input),
  );
});
await test('当前环境状态不随期间筛选消失；日期与单位限制期间记录', () => {
  const s = createSafetyState(),
    f = {
      ...defaultFilters(),
      from: '2026-09-02',
      to: '2026-09-07',
      unit: 'u2',
    };
  const m = safetySummary(s, f);
  assert.ok(m.boxes.length);
  assert.ok(
    m.checks.every(
      (c) => c.unit === 'u2' && c.time.slice(0, 10) <= '2026-09-07',
    ),
  );
  assert.ok(m.calls.every((c) => c.unit === 'u2'));
});
await test('查询快照与原状态隔离，重置不保留动态记录，安全链只含元信息', () => {
  const s = createSafetyState(),
    snap = structuredClone(s);
  const next = tick(s, 3);
  assert.deepEqual(s, snap);
  assert.notDeepEqual(next, snap);
  assert.deepEqual(createSafetyState(), s);
  const chain = taskSafetyChain(s, 'TASK-0001');
  assert.equal(chain.task.stage, '已阻断');
  assert.ok(chain.checks.length);
  assert.throws(() => taskSafetyChain(s, 'SYS-1'), /任务不存在/);
  assert.equal(JSON.stringify(chain).includes('content'), false);
});
await test('当前可访问必须系统与连接器共同有效', () => {
  const s = createSafetyState(),
    c = getRow(s, 'CONNECTORS-1');
  assert.equal(connectorReady(s, c), true);
  getRow(s, 'SYS-1').status = '已暂停';
  assert.equal(connectorReady(s, c), false);
});
await test('小范围规则仅作用试点单位，旧检查失效后不套用草稿', () => {
  const s = createSafetyState(),
    r = getRow(s, 'RULE-1'),
    t = latest(s);
  r.status = '待发布';
  r.version = '1.1';
  r.fields.checkVersion = '1.1';
  r.fields.pilot = '市政务服务管理局';
  r.fields.tag = '全部数据';
  r.fields.condition = '全部操作';
  r.fields.riskLevel = '红线';
  r.fields.action = '全局阻断';
  assert.equal(evaluateTask(s, t, 'normal').outcome, '阻断');
  r.fields.pilot = '市交通运输局';
  assert.equal(evaluateTask(s, t, 'normal').outcome, '允许');
  r.fields.pilot = '市政务服务管理局';
  r.version = '1.2';
  assert.equal(evaluateTask(s, t, 'normal').outcome, '允许');
});

await test('市级任务采用完整明细批量推进，跨单位统计和独立环境一致', () => {
  const initial = createSafetyState();
  assert.equal(records(initial, 'tasks').length, 1440 + taskBatchSize(0));
  const s = tick(initial, 4);
  assert.equal(
    records(s, 'tasks').length,
    records(initial, 'tasks').length +
      [1, 2, 3, 4].reduce((sum, tick) => sum + taskBatchSize(tick), 0),
  );
  const active = records(s, 'tasks').filter((t) =>
    ['任务进入', '安全检查', '受控执行'].includes(t.fields.stage),
  );
  assert.equal(
    new Set(active.map((t) => t.fields.sandbox)).size,
    active.length,
  );
  assert.ok(new Set(active.map((t) => t.unit)).size >= 6);
  const total = safetySummary(s);
  const parts = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'].map((unit) =>
    safetySummary(s, { ...defaultFilters(), unit }),
  );
  assert.equal(
    parts.reduce((n, p) => n + p.tasks.length, 0),
    total.tasks.length,
  );
  assert.equal(
    parts.reduce((n, p) => n + p.calls.length, 0),
    total.calls.length,
  );
  assert.equal(
    parts.reduce((n, p) => n + p.scale.input + p.scale.output, 0),
    total.scale.input + total.scale.output,
  );
});
await test('批量任务逐条遵守系统暂停，已结束记录不变且同一异常归并', () => {
  let s = tick(createSafetyState(), 4);
  const previousCalls = s.calls.filter((c) => c.status !== '进行中');
  s = op(s, 'SYS-1', 'systemPause');
  const before = new Set(s.calls.map((c) => c.id));
  s = tick(s, 5);
  assert.equal(s.calls.filter((c) => !before.has(c.id)).length, 0);
  const byId = new Map(s.calls.map((c) => [c.id, c]));
  for (const c of previousCalls) assert.deepEqual(byId.get(c.id), c);
  const alerts = records(s, 'alerts').filter((a) =>
    a.fields.riskKey?.includes('系统与连接器授权未通过'),
  );
  assert.ok(alerts.some((a) => Number(a.fields.occurrences) > 1));
  assert.equal(
    new Set(alerts.map((a) => a.fields.riskKey)).size,
    alerts.length,
  );
});

await test('10秒更新与批次波动可复现，耗时和Token来自不同任务明细', () => {
  assert.equal(UPDATE_INTERVAL_MS, 10000);
  const sizes = Array.from({ length: 16 }, (_, i) => taskBatchSize(i));
  assert.ok(new Set(sizes).size >= 8);
  assert.ok(sizes.every((n) => n >= 16 && n <= 36));
  const initial = createSafetyState();
  const result = tick(initial, 6);
  assert.equal(result.now, '2026-09-08 10:01:00');
  const calls = result.calls.filter(
    (c) => c.id.startsWith('CALL-LIVE-') && c.type === '模型请求',
  );
  assert.ok(new Set(calls.map((c) => c.input)).size > 10);
  assert.ok(new Set(calls.map((c) => c.duration)).size > 10);
  assert.ok(calls.every((c) => c.cached <= c.input && c.output > 0));
  const tasks = records(result, 'tasks').filter(
    (t) => t.fields.live === '是' && t.status === '完成',
  );
  for (const t of tasks) {
    const duration = result.calls
      .filter((c) => c.task === t.id)
      .reduce((n, c) => n + c.duration, 0);
    assert.ok(Math.abs(Number(t.fields.duration) * 1000 - duration) <= 5);
  }
});
