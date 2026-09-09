import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { memoryTestState as initialMemoryState } from './memory-test-fixture.mjs';
import { initialWorkspace } from '../app/fiscal-domain.ts';
import {
  applicationFor,
  current,
  memoryReducer as reduce,
  semanticResolution,
  eligible,
  suggestions,
  refFor,
  validRef,
  nextSlot,
  dueSlot,
  reminderItems,
  readable,
  revisionStatus,
} from '../app/memory-domain.ts';

const now = Date.parse('2026-09-08T10:00:00+08:00');
const seed = () => initialMemoryState(now);
const task = (
  s,
  text = '请在财政支付审查中核对绩效分析的实际业务含义',
  context = '财政支付审查 · ERS平台数据库费',
  refs = [],
  id = 'task-test',
) => reduce(s, { type: 'new-task', id, text, context, refs });
const get = (s, id) => s.memories.find((m) => m.id === id);
const revisedSemantic = {
  kind: 'semantic',
  term: '绩效分析',
  aliases: ['ERS电子资源利用绩效分析平台'],
  definition: '新版解释：本申请中的绩效分析属于电子资源利用分析服务。',
  context: '财政支付审查 · ERS平台数据库费',
  distinction: '不等同于人员绩效发放，仍需核对合同标的和实际用途。',
  example: '',
};
const schedule = (s) =>
  reduce(s, {
    type: 'schedule',
    schedule: {
      name: '工作规划提醒',
      enabled: true,
      cadence: 'weekly',
      weekday: 1,
      time: '09:00',
      timezone: 'Asia/Shanghai',
      planIds: ['plan-maintenance-feedback'],
    },
  });
const advance = (s) =>
  reduce(s, { type: 'advance', ms: nextSlot(s.schedules[0], s.now) - s.now });

test('A01 同名多义按语境匹配；缺少语境不会武断选择', () => {
  const s = seed();
  const alternate = structuredClone(get(s, 'term-payment-performance'));
  alternate.id = 'term-personnel-performance';
  alternate.scope = 'department';
  current(alternate).payload.definition = '人员绩效考核与待遇发放语境。';
  current(alternate).payload.context = '人员绩效发放';
  s.memories.push(alternate);
  const mem = s.memories.filter((m) => eligible(m, now));
  assert.equal(
    semanticResolution(mem, '绩效分析', '财政支付审查 · ERS平台数据库费')
      .matches[0].id,
    'term-payment-performance',
  );
  assert.equal(
    semanticResolution(mem, '绩效分析', '人员绩效发放').matches[0].id,
    'term-personnel-performance',
  );
  assert.equal(semanticResolution(mem, '绩效分析', '').ambiguous, true);
});

test('A02 用户明确解释形成个人有效记忆，包含原话定位', () => {
  const s = task(
    seed(),
    '我们这里的“蓝单”指本次支付申请的待补材料记录。适用于财政支付审查。',
  );
  const m = s.memories.find((item) => current(item).title === '蓝单');
  assert.ok(m);
  assert.equal(current(m).status, 'active');
  assert.equal(m.scope, 'personal');
  assert.equal(current(m).source.taskId, 'task-test');
  assert.ok(s.tasks[0].grants.some((g) => g.memoryId === m.id));
});

test('A03 未确认候选不进入任务执行', () => {
  let s = reduce(seed(), {
    type: 'create',
    title: '待办码',
    payload: {
      kind: 'semantic',
      term: '待办码',
      aliases: [],
      definition: '从材料中提取的待办标识，含义尚未确认。',
      context: '财政支付审查',
      distinction: '等待本人确认。',
      example: '',
    },
    candidate: true,
  });
  const candidate = s.memories.find((m) => current(m).title === '待办码');
  s = task(s, '请解释财政支付审查中的待办码', '财政支付审查');
  assert.ok(candidate);
  assert.ok(!suggestions(s, s.tasks[0]).some((m) => m.id === candidate.id));
  assert.ok(!s.tasks[0].uses.some((m) => m.memoryId === candidate.id));
});

test('A04 纠正新版本改变后续结果，旧引用和正文不变', () => {
  let s = seed();
  s = task(s, undefined, undefined, [refFor(get(s, 'term-payment-performance'))]);
  const old = s.tasks[0].uses.find(
    (u) => u.memoryId === 'term-payment-performance',
  );
  assert.ok(old);
  s = reduce(s, {
    type: 'edit',
    id: 'term-payment-performance',
    title: '绩效分析',
    payload: revisedSemantic,
    reason: '核对合同标的',
  });
  assert.ok(
    current(get(s, 'term-payment-performance')).payload.definition.includes(
      '新版解释',
    ),
  );
  assert.equal(s.tasks[0].uses[0].revisionId, old.revisionId);
  assert.equal(
    revisionStatus(
      get(s, 'term-payment-performance'),
      get(s, 'term-payment-performance').revisions[0],
    ),
    'superseded',
  );
  s = task(
    s,
    '核对绩效分析的业务含义',
    '财政支付审查 · ERS平台数据库费',
    [refFor(get(s, 'term-payment-performance'))],
    'newer',
  );
  assert.ok(s.tasks[0].messages.some((m) => m.text.includes('新版解释')));
});

test('A05 停用、过期与撤权均排除召回和显式旧引用', () => {
  for (const type of ['disabled', 'expired', 'access']) {
    let s = seed();
    const ref = refFor(get(s, 'term-payment-performance'));
    s =
      type === 'access'
        ? reduce(s, {
            type: 'access',
            id: 'term-payment-performance',
            allowed: false,
          })
        : reduce(s, {
            type: 'status',
            id: 'term-payment-performance',
            status: type,
          });
    assert.equal(validRef(s, ref), undefined);
    s = task(s);
    assert.ok(
      !suggestions(s, s.tasks[0]).some(
        (m) => m.id === 'term-payment-performance',
      ),
    );
  }
});

test('A06 同语境个人与组织解释冲突不能按范围等级自动裁决', () => {
  let s = seed();
  const conflict = structuredClone(get(s, 'term-payment-performance'));
  conflict.id = 'org-conflict';
  conflict.scope = 'department';
  current(conflict).payload.definition = '另一个不兼容含义';
  s.memories.push(conflict);
  assert.ok(
    semanticResolution(
      s.memories,
      '绩效分析',
      '财政支付审查 · ERS平台数据库费',
    ).ambiguous,
  );
  s = task(s, undefined, undefined, [
    refFor(get(s, 'term-payment-performance')),
  ]);
  assert.ok(s.tasks[0].messages.some((m) => m.text.includes('澄清前不采用')));
  assert.ok(
    !s.tasks[0].uses.some(
      (u) => u.memoryId === 'term-payment-performance',
    ),
  );
});

test('A07 同一工作的关键记录累积保留，任务与原始消息不重放', () => {
  let s = task(seed());
  const first = s.tasks[0].messages[0];
  s = reduce(s, {
    type: 'message',
    taskId: 'task-test',
    text: '补充要求：同时核对支付对象和合同标的。',
  });
  assert.equal(s.tasks.length, 2);
  assert.deepEqual(s.tasks[0].messages[0], first);
  assert.equal(s.memories.filter((m) => m.id === 'working-task-test').length, 1);
  const p = current(get(s, 'working-task-test')).payload;
  assert.ok(p.keyPoints.some((k) => k.text.includes('合同标的')));
  assert.equal(p.keyPoints[0].eventId, first.id);
  assert.ok(!('pending' in p));
});

test('A08 规划先授权并影响相关任务；不混入无关语境', () => {
  let s = task(
    seed(),
    '继续处理运维项目审核反馈',
    '财政资金穿透式监管系统运维项目申报',
  );
  assert.ok(
    s.tasks[0].pending.some((r) => r.memoryId === 'plan-maintenance-feedback'),
  );
  assert.ok(
    !s.tasks[0].uses.some((r) => r.memoryId === 'plan-maintenance-feedback'),
  );
  s = reduce(s, {
    type: 'grant',
    taskId: 'task-test',
    refs: s.tasks[0].pending,
  });
  assert.ok(s.tasks[0].messages.some((m) => m.text.includes('本次交付增加检查项')));
  const other = task(
    seed(),
    '解释深小i和i深圳的关系',
    '深圳政务服务',
  );
  assert.ok(
    !other.tasks[0].pending.some(
      (r) => r.memoryId === 'plan-maintenance-feedback',
    ),
  );
});

test('A09 同一规划供周期汇总读取，生成普通任务并关联版本', () => {
  const s = advance(schedule(seed()));
  const reminder = s.tasks.find((t) => t.type === 'reminder');
  assert.ok(reminder);
  assert.ok(reminder.planIds.includes('plan-maintenance-feedback'));
  assert.equal(
    reminder.uses[0].revisionId,
    get(s, reminder.uses[0].memoryId).current,
  );
  assert.equal(
    s.memories.filter((m) => m.id === 'plan-maintenance-feedback').length,
    1,
  );
});

test('A10 完成后不再提醒；已生成快照不重写', () => {
  let s = advance(schedule(seed()));
  const original = structuredClone(s.tasks[0]);
  const plan = get(s, 'plan-maintenance-feedback');
  s = reduce(s, {
    type: 'edit',
    id: plan.id,
    title: current(plan).title,
    payload: { ...current(plan).payload, progress: 'completed' },
    reason: '本人确认完成',
  });
  s = reduce(s, { type: 'advance', ms: 7 * 86400000 });
  assert.equal(s.tasks.filter((t) => t.type === 'reminder').length, 1);
  assert.deepEqual(s.tasks.find((t) => t.id === original.id), original);
});

test('A11 重复tick与回拨去重，暂停不会生成新运行', () => {
  let s = advance(schedule(seed()));
  const count = s.tasks.length;
  s = reduce(s, { type: 'tick', now: s.now - s.offset });
  assert.equal(s.tasks.length, count);
  s = reduce(s, { type: 'advance', ms: -1000 });
  s = reduce(s, { type: 'advance', ms: 1000 });
  assert.equal(s.tasks.length, count);
  s = reduce(s, {
    type: 'schedule',
    id: s.schedules[0].id,
    schedule: { ...s.schedules[0], enabled: false },
  });
  s = reduce(s, { type: 'advance', ms: 7 * 86400000 });
  assert.equal(s.tasks.length, count);
});

test('A12 周末、跨日按北京时间，长时间恢复只汇总最近周期', () => {
  let s = schedule(seed());
  s = reduce(s, { type: 'advance', ms: 50 * 86400000 });
  assert.equal(s.tasks.filter((t) => t.type === 'reminder').length, 1);
  const cadence = { ...s.schedules[0], cadence: 'weekdays', time: '08:30' };
  const friday = Date.parse('2026-09-11T09:00:00+08:00');
  assert.equal(
    nextSlot(cadence, friday),
    Date.parse('2026-09-14T08:30:00+08:00'),
  );
  assert.equal(
    dueSlot(cadence, Date.parse('2026-09-13T01:00:00+08:00')),
    Date.parse('2026-09-11T08:30:00+08:00'),
  );
});

test('A13 无日期规划首次回顾，未变化不重复提醒，不虚构期限', () => {
  const s = schedule(seed());
  const cadence = s.schedules[0];
  const slot = nextSlot(cadence, s.now);
  let items = reminderItems({ ...s, now: slot }, cadence, slot);
  assert.ok(items.some((m) => m.id === 'plan-maintenance-feedback'));
  cadence.snapshots['plan-maintenance-feedback'] = get(
    s,
    'plan-maintenance-feedback',
  ).current;
  items = reminderItems({ ...s, now: slot }, cadence, slot);
  assert.ok(!items.some((m) => m.id === 'plan-maintenance-feedback'));
  assert.equal(current(get(s, 'plan-maintenance-feedback')).payload.due, '');
});

test('A14 事项分工修改不影响正式职能，组织正式职能只读', () => {
  let s = seed();
  const formal = structuredClone(get(s, 'function-project-office'));
  s = reduce(s, {
    type: 'edit',
    id: 'assignment-payment-review',
    title: '财政支付审查事项分工',
    payload: {
      ...current(get(s, 'assignment-payment-review')).payload,
      entity: '本人、协办人员与超级智能体',
    },
    reason: '调整本事项分工',
  });
  assert.deepEqual(get(s, 'function-project-office'), formal);
  const before = structuredClone(get(s, 'function-project-office'));
  s = reduce(s, {
    type: 'status',
    id: 'function-project-office',
    status: 'disabled',
  });
  assert.deepEqual(get(s, 'function-project-office'), before);
});

test('A15 贡献提交不发布个人对话，采纳只创建独立组织记录', () => {
  let s = seed();
  const count = s.memories.length;
  s = reduce(s, {
    type: 'contribute',
    id: 'term-payment-performance',
    target: 'department',
    content: '经核对的绩效分析业务解释',
  });
  assert.equal(s.memories.length, count);
  s = reduce(s, {
    type: 'contribution',
    id: s.contributions[0].id,
    status: 'accepted',
  });
  const org = s.memories.find((m) => m.id.startsWith('org-'));
  assert.ok(org);
  assert.equal(current(org).source.taskId, undefined);
  assert.equal(current(org).payload.definition, '经核对的绩效分析业务解释');
});

test('A16 共享状态保留跨页引用、修改及滚动位置', () => {
  let s = task(seed());
  s = reduce(s, { type: 'scroll', taskId: 'task-test', position: 320 });
  s = reduce(s, {
    type: 'edit',
    id: 'term-payment-performance',
    title: '绩效分析',
    payload: revisedSemantic,
    reason: '更新解释',
  });
  assert.equal(s.tasks[0].savedScroll, 320);
  assert.equal(current(get(s, 'term-payment-performance')).number, 2);
});

test('删除移除正文但保留来源任务，不可重新授权旧引用', () => {
  let s = task(
    seed(),
    '我们这里的“蓝单”指本次支付申请的待补材料记录。适用于财政支付审查。',
  );
  const memory = s.memories.find((m) => current(m).title === '蓝单');
  const ref = refFor(memory);
  s = reduce(s, { type: 'delete', id: memory.id });
  assert.equal(readable(get(s, memory.id)), false);
  assert.equal(validRef(s, ref), undefined);
  assert.ok(s.tasks.find((t) => t.id === 'task-test'));
  assert.equal(current(get(s, memory.id)).source.quote, '');
});

test('语境不足的直接解释不自动推广为全局定义', () => {
  const s = task(seed(), '我们这里的“新码”指本次材料编号', '', []);
  assert.ok(!s.memories.some((m) => current(m).title === '新码'));
});

test('已明确语境不推荐另一事项的术语解释', () => {
  const s = task(
    seed(),
    '请解释CDOS和一体化数字资源管理系统的关系',
    '政务信息化运维项目申报',
  );
  assert.ok(
    !s.tasks[0].pending.some(
      (r) => r.memoryId === 'term-payment-performance',
    ),
  );
});

test('普通工作交代不重复生成情景记忆，也不重复授权本任务工作记录', () => {
  const s = task(seed());
  const refs = s.tasks[0].pending;
  assert.ok(
    refs.every(
      (r) => current(get(s, r.memoryId)).source.taskId !== 'task-test',
    ),
  );
});

test('动态任务保留命令、权限、材料筹码和未发送草稿', () => {
  let s = reduce(seed(), {
    type: 'new-task',
    id: 'settings',
    text: '先规划工作',
    refs: [],
    settings: {
      commandMode: 'plan',
      permissionMode: 'confirm',
      contexts: [{ id: 'source1', kind: '资料', label: '本次材料' }],
    },
  });
  s = reduce(s, {
    type: 'task-settings',
    taskId: 'settings',
    settings: { draftText: '还没发出的补充' },
  });
  assert.equal(s.tasks[0].commandMode, 'plan');
  assert.equal(s.tasks[0].permissionMode, 'confirm');
  assert.equal(s.tasks[0].contexts[0].label, '本次材料');
  assert.equal(s.tasks[0].draftText, '还没发出的补充');
});

test('组织采纳各类贡献时不夹带未提交的个人字段', () => {
  for (const kind of ['semantic', 'procedural', 'episodic']) {
    let s = seed();
    let id = 'term-payment-performance';
    if (kind === 'procedural') {
      const method = structuredClone(get(s, 'method-maintenance-application'));
      method.id = 'personal-method';
      method.scope = 'personal';
      method.current = 'personal-method-v1';
      method.revisions[0].id = method.current;
      s.memories.push(method);
      id = method.id;
    }
    if (kind === 'episodic') id = 'plan-maintenance-feedback';
    s = reduce(s, {
      type: 'contribute',
      id,
      target: 'department',
      content: '仅共享这段内容',
    });
    s = reduce(s, {
      type: 'contribution',
      id: s.contributions[0].id,
      status: 'accepted',
    });
    const revision = current(s.memories.find((m) => m.id.startsWith('org-')));
    assert.equal(revision.source.quote, '仅共享这段内容');
    assert.equal(revision.source.taskId, undefined);
    if (revision.payload.kind === 'semantic') {
      assert.equal(revision.payload.example, '');
      assert.equal(revision.payload.distinction, '');
    }
    if (revision.payload.kind === 'procedural') {
      assert.equal(revision.payload.method, '仅共享这段内容');
      assert.deepEqual(revision.payload.steps, []);
    }
    if (
      revision.payload.kind === 'episodic' &&
      revision.payload.subtype === 'plan'
    ) {
      assert.equal(revision.payload.goal, '仅共享这段内容');
      assert.equal(revision.payload.due, '');
      assert.equal(revision.payload.responsible, '');
    }
  }
});

test('做过的工作与过程关键记忆关联，来源可以回到原任务', () => {
  let s = task(
    seed(),
    '我们这里的“蓝单”指本次支付申请的待补材料记录。适用于财政支付审查。',
  );
  const work = get(s, 'working-task-test');
  const term = s.memories.find((m) => current(m).title === '蓝单');
  assert.ok(
    current(work).payload.memories.some((r) => r.memoryId === term.id),
  );
  assert.equal(current(work).source.taskId, 'task-test');
  s = reduce(s, {
    type: 'message',
    taskId: 'task-test',
    text: '我决定先核对合同版本，不要自动合并口径。',
  });
  s = reduce(s, {
    type: 'message',
    taskId: 'task-test',
    text: '结果反馈：已形成待补材料清单。',
  });
  const points = current(get(s, 'working-task-test')).payload.keyPoints;
  assert.ok(points.some((p) => p.kind === 'decision'));
  assert.ok(points.some((p) => p.kind === 'result'));
  assert.equal(
    s.memories.filter(
      (m) =>
        current(m).source.taskId === 'task-test' &&
        current(m).payload.kind === 'episodic',
    ).length,
    0,
  );
});

test('无新增关键内容时不改写工作记忆版本', () => {
  let s = task(seed());
  const before = structuredClone(get(s, 'working-task-test'));
  s = reduce(s, { type: 'message', taskId: 'task-test', text: '好的' });
  assert.deepEqual(get(s, 'working-task-test'), before);
  s = reduce(s, { type: 'grant', taskId: 'task-test', refs: [] });
  assert.deepEqual(get(s, 'working-task-test'), before);
});

test('相关新工作授权后复用过往关键记录，无关工作不自动建议', () => {
  let s = task(seed());
  const work = get(s, 'working-task-test');
  s = task(
    s,
    '继续核对本期支付申请',
    '财政支付审查 · ERS平台数据库费',
    [],
    'related-task',
  );
  assert.ok(s.tasks[0].pending.some((r) => r.memoryId === work.id));
  s = reduce(s, {
    type: 'grant',
    taskId: 'related-task',
    refs: [refFor(work)],
  });
  assert.ok(s.tasks[0].messages.some((m) => m.text.includes('参考你此前做过的工作')));
  const other = task(
    seed(),
    '解释深小i',
    '深圳政务服务',
    [],
    'other-task',
  );
  assert.ok(!other.tasks[0].pending.some((r) => r.memoryId === work.id));
});

test('继续已有事项更新同一份工作记忆，不重复建档', () => {
  let s = task(seed());
  s = reduce(s, {
    type: 'message',
    taskId: 'task-test',
    text: '补充要求：记录合同和支付依据的版本。',
  });
  assert.equal(
    s.memories.filter(
      (m) =>
        current(m).payload.kind === 'working' &&
        current(m).source.taskId === 'task-test',
    ).length,
    1,
  );
  assert.ok(
    current(get(s, 'working-task-test')).payload.keyPoints.some((p) =>
      p.text.includes('支付依据的版本'),
    ),
  );
});

test('深小i及大小写称谓可按公开依据理解，名称记忆不授予服务权限', () => {
  for (const term of ['深小i', '深小I']) {
    let s = seed();
    const memory = get(s, 'term-shenxiaoi');
    s = task(s, term + '是什么？', '', [refFor(memory)]);
    assert.ok(
      s.tasks[0].messages.some((message) =>
        message.text.includes('深圳面向企业和群众的AI政务助手'),
      ),
    );
    assert.ok(
      s.tasks[0].messages.some((message) =>
        message.text.includes('不代表已连接该服务'),
      ),
    );
    assert.equal(current(memory).source.taskId, undefined);
    assert.ok(current(memory).source.url.startsWith('https://www.sz.gov.cn/'));
  }
});

test('默认记忆库形成11个业务案例，五类均有代表内容', () => {
  const state = initialWorkspace(now).memory;
  const titles = new Set(state.memories.map((m) => current(m).title));
  assert.equal(titles.size, 11);
  assert.equal(state.memories.length, 12);
  const counts = Object.groupBy(
    state.memories,
    (m) => current(m).payload.kind,
  );
  assert.equal(counts.working.length, 2);
  assert.equal(counts.semantic.length, 3);
  assert.equal(counts.procedural.length, 3);
  assert.equal(counts.episodic.length, 2);
  assert.equal(counts.functional.length, 2);
  assert.ok(
    ![...titles].some((title) =>
      /材料齐套|闭合单|资金材料准备与下一阶段安排/.test(title),
    ),
  );
});

test('每条记忆都有可读来源和完整工作应用信息', () => {
  const state = initialWorkspace(now).memory;
  for (const memory of state.memories) {
    const revision = current(memory);
    const application = applicationFor(revision);
    assert.ok(readable(memory));
    assert.ok(revision.source.label.trim());
    assert.ok(application.workRole.trim());
    assert.ok(application.applicableWork.trim());
    assert.ok(application.workBenefit.trim());
    assert.ok(application.responsibilityBoundary.trim());
  }
});

test('记忆页面不再出现产品讲解和辅助验证入口', () => {
  const page = readFileSync(
    new URL('../app/memory-page.tsx', import.meta.url),
    'utf8',
  );
  for (const text of [
    '数据说明与辅助验证',
    '本地交互原型',
    '验证来源权限撤回',
    '恢复样例访问权限',
  ])
    assert.ok(!page.includes(text));
});
