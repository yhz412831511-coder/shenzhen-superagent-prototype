import test from 'node:test';
import { createSafetyState } from '../../app/products/admin/admin/safety.ts';
import assert from 'node:assert/strict';
import { groups, pages } from '../../app/products/admin/admin/catalog.ts';
import {
  initialAdminState,
  getRow,
  records,
  metrics,
  defaultFilters,
  filteredCalls,
  type State,
  number,
} from '../../app/products/admin/admin/data.ts';
import {
  actions,
  beginOperation,
  settleOperation,
  evaluationPassed,
  createRecord,
} from '../../app/products/admin/admin/business.ts';
function values(
  s: State,
  id: string,
  key: string,
  extra: Record<string, string> = {},
) {
  const r = getRow(s, id);
  const spec = actions(s, r).find((a) => a.key === key);
  assert.ok(spec, 'action ' + key);
  return Object.fromEntries(
    (spec.fields ?? []).map((f) => [
      f.key,
      extra[f.key] ??
        (f.key === 'note'
          ? '核对范围、责任和处理结果'
          : (f.type === 'select'
              ? f.options?.includes(r.fields[f.key])
                ? r.fields[f.key]
                : f.options?.[0]
              : r.fields[f.key]) || '已核对并提交材料'),
    ]),
  );
}
function run(
  s: State,
  id: string,
  key: string,
  extra: Record<string, string> = {},
  fail = false,
) {
  const b = beginOperation(
    s,
    id,
    key,
    values(s, id, key, extra),
    getRow(s, id).revision,
  );
  return settleOperation(b.state, b.operation, fail);
}
await test('七组目录和26个页面均唯一，数据对象覆盖全部管理目录', () => {
  assert.equal(groups.length, 7);
  assert.equal(pages.length, 26);
  assert.equal(new Set(pages.map((p) => p.id)).size, 26);
  const s = createSafetyState();
  for (const p of pages.filter(
    (p) => !['overview', 'usage', 'routing', 'intake'].includes(p.id),
  ))
    assert.ok(records(s, p.id).length, p.id);
});
await test('席位批准与开通分离，失败不增加开通数，重试只增加一次', () => {
  let s = initialAdminState();
  const before = number(getRow(s, 'SEAT-u1'), 'opened');
  s = run(s, 'APP-u1', 'approve');
  assert.equal(number(getRow(s, 'SEAT-u1'), 'approved'), before + 20);
  assert.equal(number(getRow(s, 'SEAT-u1'), 'opened'), before);
  const b = beginOperation(
    s,
    'APP-u1',
    'open',
    {},
    getRow(s, 'APP-u1').revision,
  );
  assert.equal(number(getRow(b.state, 'SEAT-u1'), 'opened'), before);
  assert.throws(() => beginOperation(b.state, 'APP-u1', 'open'));
  s = settleOperation(b.state, b.operation, true);
  assert.equal(getRow(s, 'APP-u1').status, '开通失败');
  s = run(s, 'APP-u1', 'open');
  assert.equal(number(getRow(s, 'SEAT-u1'), 'opened'), before + 20);
  assert.equal(number(getRow(s, 'SEAT-u1'), 'approved'), before + 20);
  assert.throws(() => beginOperation(s, 'APP-u1', 'open'));
});
await test('退回补充后重新审核，拒绝记录不可重复批准', () => {
  let s = run(initialAdminState(), 'APP-u1', 'return');
  assert.equal(getRow(s, 'APP-u1').status, '待补充');
  s = run(s, 'APP-u1', 'supplement');
  assert.match(getRow(s, 'APP-u1').fields.material, /补充/);
  s = run(s, 'APP-u1', 'reject');
  assert.throws(() => beginOperation(s, 'APP-u1', 'approve'));
});
await test('新专业智能体必须当前版本双评测通过；整改复测后方可发布', () => {
  let s = initialAdminState();
  assert.equal(evaluationPassed(s, getRow(s, 'AG-7')), false);
  assert.throws(() => beginOperation(s, 'AG-7', 'publish'));
  s = run(s, 'AG-7', 'evaluate');
  assert.equal(getRow(s, 'AG-7').status, '待整改');
  const failed = records(s, 'evaluations').find(
    (r) => r.fields.target === 'AG-7' && r.status === '未通过',
  )!;
  assert.ok(failed);
  s = run(s, failed.id, 'rectify', {
    rectification: '修正工具访问范围校验并补充执行检查',
  });
  s = run(s, failed.id, 'retest');
  assert.ok(evaluationPassed(s, getRow(s, 'AG-7')));
  s = run(s, 'AG-7', 'publish');
  assert.equal(getRow(s, 'AG-7').fields.enabled, '是');
  assert.equal(getRow(s, 'AG-7').fields.liveVersion, '1.0');
});
await test('发布新版本使旧评测失效但原现网版本继续可用', () => {
  let s = run(initialAdminState(), 'AG-1', 'newVersion', {
    description: '完善材料检查步骤',
  });
  assert.equal(getRow(s, 'AG-1').version, '1.1');
  assert.equal(getRow(s, 'AG-1').fields.liveVersion, '1.0');
  assert.equal(getRow(s, 'AG-1').fields.enabled, '是');
  assert.equal(evaluationPassed(s, getRow(s, 'AG-1')), false);
  s = run(s, 'AG-1', 'approve');
  assert.throws(() => beginOperation(s, 'AG-1', 'publish'));
});
await test('能力停用与恢复不重放原任务，模型停用影响不改历史调用', () => {
  let s = initialAdminState();
  const calls = structuredClone(s.calls);
  s = run(s, 'AG-1', 'disable');
  assert.equal(getRow(s, 'AG-1').fields.enabled, '否');
  s = run(s, 'AG-1', 'enable');
  assert.equal(getRow(s, 'AG-1').fields.enabled, '是');
  assert.deepEqual(s.calls, calls);
});
await test('各类建设成果可发起评测，新增来源统一进入市级待审核', () => {
  let s = createRecord(initialAdminState(), 'plugins', {
    name: '格式转换插件',
    unit: '市政务服务管理局',
    provider: '软件服务商',
    description: '格式转换',
    permissions: '指定文件夹只读',
    scope: '全市单位',
  });
  const r = records(s, 'plugins').at(-1)!;
  assert.equal(r.status, '待审核');
  s = run(s, r.id, 'approve');
  assert.ok(actions(s, getRow(s, r.id)).some((a) => a.key === 'evaluate'));
});
await test('沙箱隔离需回执；失败不生效，回收不得影响运行任务或保留证据', () => {
  let s = initialAdminState();
  const b = beginOperation(s, 'BOX-1', 'isolate', { note: '核对异常访问' });
  assert.equal(getRow(b.state, 'BOX-1').status, '运行中');
  s = settleOperation(b.state, b.operation, true);
  assert.equal(getRow(s, 'BOX-1').status, '运行中');
  assert.throws(() => run(s, 'BOX-1', 'recycle'), /任务/);
  assert.throws(() => run(s, 'BOX-4', 'recycle'), /证据/);
  s = run(s, 'BOX-1', 'isolate');
  assert.equal(getRow(s, 'TASK-0001').status, '暂停');
  assert.equal(getRow(s, 'BOX-1').status, '已隔离');
  s = run(s, 'BOX-1', 'restore');
  assert.equal(getRow(s, 'TASK-0001').status, '暂停');
});
await test('停止后回收环境，个人空间和成果记录不变', () => {
  let s = initialAdminState();
  const space = structuredClone(getRow(s, 'SPACE-1'));
  s = run(s, 'BOX-1', 'stop');
  s = run(s, 'BOX-1', 'recycle');
  assert.equal(getRow(s, 'BOX-1').status, '已回收');
  assert.deepEqual(getRow(s, 'SPACE-1'), space);
  assert.equal(getRow(s, 'TASK-0001').status, '已停止');
});
await test('个人空间配额不能小于已用容量，恢复服务不访问内容', () => {
  let s = initialAdminState();
  assert.throws(() => run(s, 'SPACE-2', 'capacity', { quota: '1' }), /已使用/);
  s = run(s, 'SPACE-2', 'recoverService');
  assert.equal(getRow(s, 'SPACE-2').status, '正常');
  assert.ok(!('content' in getRow(s, 'SPACE-2').fields));
});
await test('Token统计可核对，缓存不重复计量，无回执不当零', () => {
  const s = initialAdminState();
  const f = defaultFilters();
  const m = metrics(s, f);
  const cc = filteredCalls(s, f).filter((c) => c.metered);
  assert.equal(
    m.input + m.output,
    cc.reduce((n, c) => n + c.input + c.output, 0),
  );
  assert.ok(m.cached > 0);
  assert.ok(m.unmetered > 0);
  assert.equal(m.calls, filteredCalls(s, f).length);
  const sums = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'].map((unit) =>
    metrics(s, { ...f, unit }),
  );
  assert.equal(
    sums.reduce((n, m) => n + m.input + m.output, 0),
    m.input + m.output,
  );
});
await test('额度变更与增额审批不修改历史消耗，也不停止任务', () => {
  let s = initialAdminState();
  const before = structuredClone(s.calls);
  const taskStatus = records(s, 'tasks').map((t) => t.status);
  s = run(s, 'QUOTA-u1', 'adjustQuota', { quota: '1', threshold: '80' });
  assert.deepEqual(s.calls, before);
  assert.deepEqual(
    records(s, 'tasks').map((t) => t.status),
    taskStatus,
  );
  s = run(s, 'QUOTA-u1', 'approveIncrease');
  assert.equal(getRow(s, 'QUOTA-u1').fields.quota, '2000001');
  assert.throws(() => beginOperation(s, 'QUOTA-u1', 'approveIncrease'));
});
await test('工单与关联告警分别闭环，单位反馈记录完整', () => {
  let s = initialAdminState();
  for (const key of ['assign', 'resolve', 'feedback', 'close'])
    s = run(s, 'TICKET-1', key);
  assert.equal(getRow(s, 'TICKET-1').status, '已关闭');
  assert.equal(getRow(s, 'ALERT-1').status, '待处理');
  assert.ok(getRow(s, 'TICKET-1').fields.unitFeedback);
});
await test('告警恢复检查失败保持限制，通过后关闭不减少历史拦截', () => {
  let s = initialAdminState();
  const blocked = metrics(s).blocked;
  s = run(s, 'ALERT-1', 'assign');
  s = run(s, 'ALERT-1', 'restrict');
  s = run(s, 'ALERT-1', 'getRemediation');
  s = run(s, 'ALERT-1', 'retestAlert', {}, true);
  assert.equal(getRow(s, 'ALERT-1').status, '待复测');
  assert.equal(getRow(s, 'BOX-1').status, '已隔离');
  s = run(s, 'ALERT-1', 'retestAlert');
  s = run(s, 'ALERT-1', 'restoreAlert');
  assert.equal(getRow(s, 'ALERT-1').status, '已关闭');
  assert.equal(metrics(s).blocked, blocked);
  assert.equal(getRow(s, 'TASK-0001').status, '暂停');
});
await test('规则编辑使旧检查失效，标签与条件改变匹配结果', () => {
  let s = initialAdminState();
  s = run(s, 'RULE-1', 'editRule', {
    tag: '全部数据',
    condition: '全部操作',
    action: '逐项确认',
  });
  s = run(s, 'RULE-1', 'checkRule');
  const wide = JSON.parse(getRow(s, 'RULE-1').fields.checkResult).matched;
  s = run(s, 'RULE-1', 'editRule', {
    tag: '受限材料',
    condition: '高风险操作',
    action: '阻断',
  });
  assert.equal(getRow(s, 'RULE-1').fields.checkVersion, '');
  assert.throws(() => beginOperation(s, 'RULE-1', 'pilotRule'));
  s = run(s, 'RULE-1', 'checkRule');
  assert.ok(JSON.parse(getRow(s, 'RULE-1').fields.checkResult).matched < wide);
});
await test('规则发布需检查和小范围应用，回退保留历史且不撤销业务', () => {
  let s = initialAdminState();
  const ops = structuredClone(records(s, 'audit'));
  s = run(s, 'RULE-1', 'editRule', { condition: '高风险操作' });
  s = run(s, 'RULE-1', 'checkRule');
  s = run(s, 'RULE-1', 'pilotRule');
  s = run(s, 'RULE-1', 'publishRule');
  assert.equal(getRow(s, 'RULE-1').fields.liveVersion, '1.1');
  s = run(s, 'RULE-1', 'rollbackRule');
  assert.equal(getRow(s, 'RULE-1').fields.liveVersion, '1.0');
  assert.deepEqual(records(s, 'audit'), ops);
  assert.ok(getRow(s, 'RULE-1').history.length >= 6);
});
await test('组织经验更新保留旧发布版，审核后发布，撤回停止使用', () => {
  let s = run(initialAdminState(), 'EXP-1', 'editContent', {
    content: '更新后的组织检查步骤',
  });
  assert.equal(getRow(s, 'EXP-1').fields.liveVersion, '1.0');
  s = run(s, 'EXP-1', 'approveContent');
  s = run(s, 'EXP-1', 'publishContent');
  assert.equal(getRow(s, 'EXP-1').fields.liveVersion, '1.1');
  s = run(s, 'EXP-1', 'withdraw');
  assert.equal(getRow(s, 'EXP-1').fields.enabled, '否');
});
await test('同步失败可重试，记忆管理不暴露个人内容', () => {
  let s = run(initialAdminState(), 'KN-2', 'sync');
  assert.equal(getRow(s, 'KN-2').status, '同步失败');
  s = run(s, 'KN-2', 'sync');
  assert.equal(getRow(s, 'KN-2').status, '待发布');
  for (const r of records(s, 'memory'))
    assert.equal(r.fields.content, undefined);
});
await test('模型服务范围变更不承担任务路由，也不静默改变已有任务', () => {
  let s = initialAdminState();
  const tasks = structuredClone(records(s, 'tasks'));
  s = run(s, 'qwen-3-8-27b', 'configureModel', {
    scope: '市政务服务管理局',
  });
  assert.deepEqual(records(s, 'tasks'), tasks);
  assert.equal(getRow(s, 'qwen-3-8-27b').fields.scope, '市政务服务管理局');
  assert.equal(getRow(s, 'qwen-3-8-27b').fields.L2, undefined);
});
await test('连接授权日期和岗位权限校验，保护统一管理角色', () => {
  let s = initialAdminState();
  assert.throws(
    () => run(s, 'CONNECTORS-1', 'authorize', { expires: 'bad' }),
    /日期/,
  );
  s = run(s, 'CONNECTORS-1', 'authorize', { expires: '2026-12-31' });
  assert.equal(getRow(s, 'CONNECTORS-1').fields.connection, '待检查');
  s = run(s, 'CONNECTORS-1', 'checkConnection');
  assert.equal(getRow(s, 'CONNECTORS-1').fields.connection, '正常');
  assert.deepEqual(actions(s, getRow(s, 'ROLE-1')), []);
});
await test('过期修订与重复回执拒绝，复位得到同一初始记录', () => {
  const s = initialAdminState();
  assert.throws(
    () => beginOperation(s, 'APP-u1', 'approve', { note: 'x' }, 99),
    /更新/,
  );
  const b = beginOperation(s, 'APP-u1', 'approve', { note: '核对' });
  const done = settleOperation(b.state, b.operation);
  assert.throws(() => settleOperation(done, b.operation));
  assert.deepEqual(initialAdminState(), initialAdminState());
  assert.equal(getRow(s, 'APP-u1').status, '待审批');
});
await test('评测任务先显示执行进度，失败回执后可重试且不提前通过', () => {
  let s = initialAdminState();
  const b = beginOperation(s, 'AG-7', 'evaluate');
  const pending = records(b.state, 'evaluations').filter(
    (e) => e.fields.target === 'AG-7',
  );
  assert.equal(pending.length, 2);
  assert.ok(
    pending.every((e) => e.status === '评测中' && e.fields.progress === '0'),
  );
  assert.equal(evaluationPassed(b.state, getRow(b.state, 'AG-7')), false);
  s = settleOperation(b.state, b.operation, true);
  assert.ok(actions(s, getRow(s, 'AG-7')).some((a) => a.key === 'evaluate'));
});
await test('规则变更检查始终保留未授权访问硬阻断', () => {
  let s = run(initialAdminState(), 'RULE-1', 'editRule', {
    condition: '全部操作',
    action: '逐项确认',
  });
  s = run(s, 'RULE-1', 'checkRule');
  const check = JSON.parse(getRow(s, 'RULE-1').fields.checkResult);
  for (const op of records(s, 'audit').filter((r) => r.status === '已阻断'))
    assert.equal(
      check.outcomes.find((o: { id: string }) => o.id === op.id).outcome,
      '阻断',
    );
});
await test('告警限制不能被环境恢复绕过，关闭告警保留独立人工隔离', () => {
  let s = run(initialAdminState(), 'BOX-1', 'isolate');
  s = run(s, 'ALERT-1', 'assign');
  s = run(s, 'ALERT-1', 'restrict');
  assert.throws(() => run(s, 'BOX-1', 'restore'), /告警限制/);
  for (const key of ['getRemediation', 'retestAlert', 'restoreAlert'])
    s = run(s, 'ALERT-1', key);
  assert.equal(getRow(s, 'BOX-1').status, '已隔离');
  assert.equal(getRow(s, 'BOX-1').fields.restriction, '网络隔离');
});
await test('单位登记建立独立席位和额度记录，账号不能重复', () => {
  const s = createRecord(initialAdminState(), 'accounts', {
    name: '市公共服务中心',
    contact: '单位联系人',
    account: 'public_service_admin',
  });
  const a = records(s, 'accounts').at(-1)!;
  assert.ok(a.unit.startsWith('unit-'));
  assert.equal(
    records(s, 'seats').find((r) => r.unit === a.unit)!.fields.opened,
    '0',
  );
  assert.equal(
    records(s, 'quotas').find((r) => r.unit === a.unit)!.fields.quota,
    '0',
  );
  assert.throws(
    () =>
      createRecord(s, 'accounts', {
        name: '市公共服务中心',
        contact: '联系人',
        account: 'public_service_admin',
      }),
    /已存在/,
  );
});
