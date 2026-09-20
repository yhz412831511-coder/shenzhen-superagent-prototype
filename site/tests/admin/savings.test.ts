import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSafetyState,
  advanceSafety,
} from '../../app/products/admin/admin/safety.ts';
import {
  defaultFilters,
  getRow,
  records,
  units,
  type State,
} from '../../app/products/admin/admin/data.ts';
import {
  savingsSummary,
  comparisonRows,
  taskTokenComparison,
  TOKEN_BASELINE,
} from '../../app/products/admin/admin/savings.ts';
const tick = (s: State, n: number) => {
  for (let i = 0; i < n; i++) s = advanceSafety(s);
  return s;
};
const one = (s: State) => savingsSummary(s).eligible[0];
await test('基准固定版本，首页、单位、任务、步骤和三种来源逐层相等', () => {
  const s = createSafetyState(),
    m = savingsSummary(s);
  assert.equal(TOKEN_BASELINE.revision, 'comparison-fixture-1.0');
  assert.ok(m.count > 0);
  assert.equal(m.saved, m.baseline - m.actual);
  assert.equal(
    m.sources.reduce((n, r) => n + r.value, 0),
    m.saved,
  );
  assert.equal(
    units.reduce(
      (n, u) =>
        n + savingsSummary(s, { ...defaultFilters(), unit: u.id }).saved,
      0,
    ),
    m.saved,
  );
  for (const row of m.eligible) {
    assert.equal(
      row.saved,
      row.steps.reduce((n, p) => n + p.saved, 0),
    );
    assert.equal(
      row.actual,
      row.calls.reduce((n, c) => n + c.input + c.output, 0),
    );
  }
});
await test('缓存包含在输入中，改变缓存命中不会改变Token节省', () => {
  const s = createSafetyState(),
    before = savingsSummary(s);
  for (const c of s.calls) c.cached = c.input;
  assert.equal(savingsSummary(s).saved, before.saved);
});
await test('实际模型替换不赋予节省系数，基准不由实际用量反推', () => {
  const s = createSafetyState(),
    r = one(s),
    before = structuredClone(r.pair);
  for (const c of s.calls.filter(
    (c) => c.task === r.task.id && c.type === '模型请求',
  ))
    c.model = 'ernie-4-5-21b';
  assert.equal(taskTokenComparison(s, r.task.id).savedTokens, r.saved);
  s.calls.find((c) => c.id === r.calls[0].id)!.input += 5000;
  assert.deepEqual(s.comparisons![r.task.id], before);
  assert.equal(taskTokenComparison(s, r.task.id).savedTokens, r.saved - 5000);
});
await test('负收益保留且抵减净值，不把结果裁零', () => {
  const s = createSafetyState(),
    r = one(s),
    m = savingsSummary(s);
  const extra = r.baseline + 100000;
  s.calls.find((c) => c.id === r.calls[0].id)!.output += extra;
  assert.ok(taskTokenComparison(s, r.task.id).savedTokens! < 0);
  assert.equal(savingsSummary(s).saved, m.saved - extra);
});
await test('失败、阻断、取消、暂停、计量缺失和质量不合格均不纳入', () => {
  for (const kind of [
    '失败',
    '已阻断',
    '已取消',
    '暂停',
    '待回传',
    '质量',
    '基准',
    '质量回执',
    '步骤回执',
  ]) {
    const s = createSafetyState(),
      r = one(s),
      pair = s.comparisons![r.task.id];
    if (kind === '待回传')
      s.calls.find((c) => c.id === r.calls[0].id)!.metered = false;
    else if (kind === '质量') pair.quality = '未通过';
    else if (kind === '基准') pair.baselineId = '';
    else if (kind === '质量回执') pair.qualityReceipt = undefined;
    else if (kind === '步骤回执') pair.steps[0].receipt = undefined;
    else getRow(s, r.task.id).status = kind;
    const detail = taskTokenComparison(s, r.task.id);
    assert.equal(detail.eligible, false, kind);
    assert.equal(detail.savedTokens, null, kind);
    assert.ok(detail.excludedReason);
  }
});
await test('重试和升级都进入相同步骤，关联不全拒绝比较', () => {
  const s = createSafetyState(),
    r = one(s),
    c = structuredClone(r.calls[0]);
  c.id += '-RETRY';
  c.model = 'deepseek-v4-pro';
  c.status = '失败';
  s.calls.push(c);
  assert.equal(taskTokenComparison(s, r.task.id).eligible, false);
  s.comparisons![r.task.id].steps.find((p) =>
    p.callIds.includes(r.calls[0].id),
  )!.callIds.push(c.id);
  assert.equal(
    taskTokenComparison(s, r.task.id).savedTokens,
    r.saved - c.input - c.output,
  );
});
await test('模型筛选选择完整任务，不能只截取该模型调用', () => {
  const s = createSafetyState(),
    r = one(s);
  s.calls.find((c) => c.id === r.calls[0].id)!.model = 'ONLY-MODEL';
  const filtered = savingsSummary(s, {
    ...defaultFilters(),
    model: 'ONLY-MODEL',
  });
  assert.equal(filtered.count, 1);
  assert.equal(filtered.actual, r.actual);
  assert.ok(filtered.eligible[0].calls.length > 1);
});
await test('日期、单位、任务类型和无数据条件符合口径', () => {
  const s = createSafetyState();
  const f = {
    ...defaultFilters(),
    unit: 'u2',
    taskType: '政策检索',
    from: '2026-09-02',
  };
  for (const r of comparisonRows(s, f)) {
    assert.equal(r.task.unit, 'u2');
    assert.equal(r.task.fields.taskType, '政策检索');
    assert.ok(r.task.fields.date >= f.from);
  }
  const empty = savingsSummary(s, {
    ...f,
    from: '2099-01-01',
    to: '2099-01-01',
  });
  assert.equal(empty.count, 0);
  assert.equal(empty.rate, null);
});
await test('动态路由产生真实步骤与计量；未完成不抢先增加节省', () => {
  const initial = createSafetyState();
  const smart = records(initial, 'tasks').find(
    (t) => t.fields.live === '是' && t.fields.modelMode === '智能模式',
  )!;
  assert.ok(smart);
  const s3 = tick(initial, 3);
  assert.equal(taskTokenComparison(s3, smart.id).eligible, false);
  assert.ok(s3.calls.some((c) => c.task === smart.id && c.step));
  const s = tick(initial, 6);
  const ready = savingsSummary(s).eligible.filter(
    (r) => r.task.fields.live === '是' && r.pair!.mode === '智能模式',
  );
  assert.ok(ready.length > 0);
  assert.ok(
    ready.some((r) =>
      r.steps.some((p) => p.level === 'L0' && p.callIds.length === 0),
    ),
  );
  assert.ok(ready.some((r) => new Set(r.calls.map((c) => c.model)).size > 1));
  for (const r of ready)
    for (const p of r.steps) {
      assert.ok(p.receipt);
      assert.ok(p.checkId);
    }
});
await test('路由处理中停用能力、模型或隔离环境，禁止后续模型调用', () => {
  for (const kind of ['能力', '模型', '环境']) {
    let s = tick(createSafetyState(), 3);
    const t = records(s, 'tasks').find(
      (t) =>
        t.fields.live === '是' &&
        t.fields.stage === '受控执行' &&
        s.comparisons![t.id].steps.some(
          (p) => p.status === '待执行' && p.level === 'L2',
        ),
    )!;
    assert.ok(t);
    const ids = s.calls.filter((c) => c.task === t.id).map((c) => c.id);
    if (kind === '能力') getRow(s, t.fields.agent).fields.enabled = '否';
    if (kind === '模型') getRow(s, 'qwen-3-8-27b').status = '暂不可用';
    if (kind === '环境') getRow(s, t.fields.sandbox).status = '已隔离';
    s = advanceSafety(s);
    assert.deepEqual(
      s.calls.filter((c) => c.task === t.id).map((c) => c.id),
      ids,
      kind,
    );
    assert.equal(taskTokenComparison(s, t.id).eligible, false);
  }
});
await test('指定模型保持锁定，任务间映射独立；模型授权范围实际生效', () => {
  const initial = createSafetyState();
  const fixed = records(initial, 'tasks').find((t) => t.fields.live === '是')!;
  getRow(initial, 'ernie-4-5-21b').fields.scope = '不存在的单位';
  const s = tick(initial, 3);
  assert.ok(
    s.calls
      .filter((c) => c.task === fixed.id && c.type === '模型请求')
      .every((c) => c.model === 'qwen-3-8-27b'),
  );
  const limited = createSafetyState();
  getRow(limited, 'ernie-4-5-21b').fields.scope = '不存在的单位';
  const smart = records(limited, 'tasks').find(
    (t) => t.fields.live === '是' && t.fields.modelMode === '智能模式',
  )!;
  assert.equal(
    tick(limited, 3).calls.filter((c) => c.task === smart.id).length,
    0,
  );
});
await test('基准、暂停快照和复位可复现，只读查询不修改原始状态', () => {
  const s = createSafetyState(),
    snap = structuredClone(s);
  const before = JSON.stringify(s);
  taskTokenComparison(s, one(s).task.id);
  savingsSummary(s);
  assert.equal(JSON.stringify(s), before);
  tick(s, 5);
  assert.deepEqual(s, snap);
  assert.deepEqual(createSafetyState(), snap);
  assert.equal(
    JSON.stringify(taskTokenComparison(s, one(s).task.id)).includes('content'),
    false,
  );
});
