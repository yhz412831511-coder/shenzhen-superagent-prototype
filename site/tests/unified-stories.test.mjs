import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialWorkspace,
  workspaceReducer as reduce,
} from '../app/fiscal-domain.ts';
import {
  aiMemoryStories,
  aiMemoryStoryForTask,
  memoryCases,
  MEMORY_KINDS,
} from '../app/shared/story-corpus.ts';
import {
  initialGovernance,
  changeGovernance,
  scopeAdminState,
  submitUnitRequest,
  mayManage,
  meetingSamples,
} from '../app/products/admin/governance.ts';
import { createSafetyState } from '../app/products/admin/admin/safety.ts';
import { readFileSync } from 'node:fs';
const readSource = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const next = (s, type, extra = {}) =>
  reduce(s, {
    type: 'party',
    action: { type, taskId: 'p14', revision: s.party.p14.revision, ...extra },
  });
function sent() {
  let s = reduce(initialWorkspace(), {
    type: 'new-task',
    id: 'p14',
    text: '准备第14次党组会',
  });
  for (const [type, extra] of [
    ['systems-confirm', { selected: ['oa', 'topics', 'tracking'] }],
    ['plan-confirm', {}],
    ['collect-finish', {}],
    ['gap', { choice: 'provisional' }],
    ['prepare-send', {}],
    ['send', {}],
    ['send-finish', {}],
  ])
    s = next(s, type, extra);
  return s;
}
const notes =
  '会后记录：会议决定请基础设施处核对验收材料，9月25日16:00前补充手续清单；统计完成率仍待核。';
test('党组会第13、14次任务概览展示系统调用并支持下钻', () => {
  const monitor = readSource('../app/fiscal-components.tsx');
  const workspace = readSource('../app/task-workspace.tsx');
  assert.match(monitor, /partySystemTargetId/);
  assert.match(monitor, /PARTY_HISTORY_SYSTEMS/);
  assert.match(monitor, /系统调用/);
  assert.match(workspace, /PartySystemPage/);
  assert.match(workspace, /partySystemFromTargetId/);
});
test('M14 minutes are versioned; submission is not approval; stale double click cannot resubmit', () => {
  let s = sent();
  const original = structuredClone(s.artifacts);
  s = next(s, 'say', { text: notes });
  assert.equal(s.party.p14.stage, 'minutes');
  const first = s.party.p14.minutesArtifact;
  s = next(s, 'minutes-review');
  const stale = s.party.p14.revision;
  s = next(s, 'say', { text: notes + '补充记录：暂不引用完成率。' });
  assert.equal(s.party.p14.minutesVersion, 2);
  assert.equal(s.party.p14.stage, 'minutes');
  assert.ok(s.artifacts[first]);
  s = reduce(s, {
    type: 'party',
    action: { taskId: 'p14', revision: stale, type: 'minutes-submit' },
  });
  assert.equal(s.party.p14.stage, 'minutes');
  s = next(s, 'minutes-review');
  s = next(s, 'minutes-submit');
  assert.equal(s.party.p14.stage, 'minutes-sending');
  s = next(s, 'minutes-finish');
  assert.equal(s.party.p14.stage, 'minutes-submitted');
  assert.equal(s.party.p14.approvalSource, undefined);
  const count = Object.keys(s.artifacts).length;
  s = next(s, 'minutes-submit');
  assert.equal(Object.keys(s.artifacts).length, count);
  s = next(s, 'say', { text: '已审定纪要' });
  assert.equal(s.party.p14.stage, 'minutes-submitted');
  s = next(s, 'say', {
    text: '已审定纪要，依据：M14-APPROVAL-01。会议决定由基础设施处9月25日16:00前补齐清单，其他事项继续待核。',
  });
  assert.equal(s.party.p14.stage, 'closed');
  for (const [id, a] of Object.entries(original))
    assert.deepEqual(s.artifacts[id], a);
  assert.match(
    s.memory.memories.find((m) => m.id === 'working-p14').revisions.at(-1)
      .source.quote,
    /待核验/,
  );
});
test('unknown minute result queries original; unavailable connector blocks; failure requires fresh confirmation', () => {
  for (const outcome of ['failure', 'unknown']) {
    let s = sent();
    s = next(s, 'say', { text: notes });
    s = next(s, 'exercise', { outcome, oaUnavailable: false });
    s = next(s, 'minutes-review');
    s = next(s, 'minutes-submit');
    s = next(s, 'minutes-finish');
    assert.equal(
      s.party.p14.stage,
      outcome === 'failure' ? 'minutes-failed' : 'minutes-unknown',
    );
    s = next(s, 'minutes-submit');
    assert.equal(
      s.party.p14.stage,
      outcome === 'failure' ? 'minutes-failed' : 'minutes-unknown',
    );
    if (outcome === 'unknown') {
      s = next(s, 'minutes-query');
      assert.equal(s.party.p14.stage, 'minutes-submitted');
    } else {
      s = next(s, 'minutes-retry');
      assert.equal(s.party.p14.stage, 'minutes-confirm');
      s = next(s, 'exercise', { outcome: 'success', oaUnavailable: true });
      s = next(s, 'minutes-submit');
      assert.equal(s.party.p14.stage, 'minutes-confirm');
      assert.match(s.party.p14.feedback, /未提交/);
    }
  }
});
test('all memory links resolve to historical stories and replacements never become current', () => {
  const s = initialWorkspace();
  assert.equal(
    new Set(memoryCases.map((m) => m.kind)).size,
    MEMORY_KINDS.length,
  );
  for (const m of memoryCases) {
    assert.ok(
      s.memory.tasks.some((t) => t.id === m.taskId),
      m.id,
    );
    assert.ok(m.evidence && m.history.length && m.scope);
    for (const id of m.related)
      assert.ok(
        memoryCases.some((x) => x.id === id),
        id,
      );
  }
  assert.equal(memoryCases.find((m) => m.id === 'm13-old').state, '已替代');
  const p = memoryCases.find((m) => m.id === 'fiscal-personal'),
    o = memoryCases.find((m) => m.id === 'fiscal-org');
  assert.notEqual(p.owner, o.owner);
  assert.notEqual(p.version, o.version);
});
test('五条合成故事共用证据定义，并可由任务或脑暴上下文解析', () => {
  const workspace = initialWorkspace();
  const ids = aiMemoryStories.map((story) => story.id);
  assert.deepEqual(ids, [
    'policy-consultation',
    'training-speech',
    'party-meeting',
    'annual-brainstorm',
    'maintenance-application',
  ]);
  assert.equal(
    aiMemoryStoryForTask('policy-consultation-history')?.evidence.length,
    4,
  );
  assert.equal(
    aiMemoryStoryForTask('training-speech-history')?.interaction,
    'guided',
  );
  assert.equal(aiMemoryStoryForTask('party-history')?.interaction, 'existing');
  assert.equal(
    aiMemoryStoryForTask('maintenance-history')?.interaction,
    'static',
  );
  assert.equal(
    aiMemoryStoryForTask('unrelated-task', true)?.id,
    'annual-brainstorm',
  );
  assert.equal(aiMemoryStoryForTask('annual-history'), undefined);
  for (const taskId of [
    'policy-consultation-history',
    'training-speech-history',
    'party-history',
    'maintenance-history',
  ]) {
    const story = aiMemoryStoryForTask(taskId);
    const ids = story.evidence.flatMap((item) =>
      item.memoryId ? [item.memoryId] : [],
    );
    assert.ok(ids.length > 0, taskId);
    assert.ok(
      ids.every((id) => workspace.memory.memories.some((memory) => memory.id === id)),
      taskId,
    );
  }
});

test('惠企咨询按固定多轮核对收尾，续聊不创建助手或外部调用', () => {
  let s = initialWorkspace();
  const task = s.memory.tasks.find((item) => item.id === 'policy-consultation-history');
  assert.match(task.messages.at(-1).text, /构建企业问答助手/);
  assert.match(task.messages[1].text, /已识别/);
  assert.match(task.messages[2].text, /处理计划/);
  assert.match(task.messages[3].text, /本地核对/);
  assert.match(task.messages[4].text, /补充情况/);
  assert.match(task.messages[5].text, /可继续核对/);
  assert.match(task.messages[5].text, /待补证核查/);
  assert.match(task.messages[5].text, /存在材料冲突/);
  assert.equal(s.flows['policy-consultation-history'].operations.length, 3);
  assert.ok(
    s.flows['policy-consultation-history'].operations.every(
      (operation) => !operation.system,
    ),
  );
  assert.equal(
    Object.values(s.artifacts).filter(
      (artifact) => artifact.taskId === 'policy-consultation-history',
    ).length,
    0,
  );
  const beforeArtifacts = Object.keys(s.artifacts).length;
  s = reduce(s, {
    type: 'say',
    taskId: 'policy-consultation-history',
    text: '请直接帮我构建新的企业问答助手并连接深I企。',
  });
  assert.equal(Object.keys(s.artifacts).length, beforeArtifacts);
  assert.equal(s.storyRounds['policy-consultation-history'], undefined);
  assert.match(
    s.memory.tasks.find((item) => item.id === 'policy-consultation-history').messages.at(-1).text,
    /不会创建助手、连接深I企或自动沉淀组织经验/,
  );
});

test('培训讲稿以主任审阅后的送审工作稿收尾，党组会与运维既有骨架不回退', () => {
  let s = initialWorkspace();
  const training = s.memory.tasks.find((task) => task.id === 'training-speech-history');
  assert.match(training.messages[1].text, /已识别/);
  assert.match(training.messages[2].text, /处理计划/);
  assert.match(training.messages[3].text, /历年案例沿革/);
  assert.match(training.messages[5].text, /逐项核对/);
  assert.match(training.messages[8].text, /修订讲稿工作稿 v2/);
  assert.equal(s.flows['training-speech-history'].operations.length, 3);
  assert.equal(
    Object.values(s.artifacts).filter(
      (artifact) => artifact.taskId === 'training-speech-history',
    ).length,
    4,
  );
  const partyBefore = structuredClone(s.memory.tasks.find((task) => task.id === 'party-history').messages);
  const maintenanceBefore = structuredClone(s.flows['maintenance-history'].operations);
  s = reduce(s, {
    type: 'say',
    taskId: 'training-speech-history',
    text: '补充案例更新依据，并重新核对当前口径后送审。',
  });
  const round = s.storyRounds['training-speech-history'];
  assert.equal(round.mode, '送审工作稿');
  const artifact = s.artifacts[round.artifact];
  assert.match(artifact.body, /不产生正式讲稿、组织口径、对外发布/);
  assert.deepEqual(
    s.memory.tasks.find((task) => task.id === 'party-history').messages,
    partyBefore,
  );
  assert.deepEqual(s.flows['maintenance-history'].operations, maintenanceBefore);
});
test('every seeded story continues in place with immutable past and branch-specific outcomes', () => {
  for (const id of [
    'data-history',
    'party-history',
    'payment-history',
    'maintenance-history',
  ]) {
    let s = initialWorkspace();
    const task = s.memory.tasks.find((t) => t.id === id),
      past = structuredClone(task.messages),
      arts = structuredClone(s.artifacts),
      count = s.memory.tasks.length;
    s = reduce(s, {
      type: 'say',
      taskId: id,
      text: id === 'data-history' ? '改为内部版报告' : '补充材料版本核查要求',
    });
    assert.equal(s.memory.tasks.length, count);
    assert.deepEqual(
      s.memory.tasks.find((t) => t.id === id).messages.slice(0, past.length),
      past,
    );
    for (const [key, a] of Object.entries(arts))
      assert.deepEqual(s.artifacts[key], a);
    assert.ok(s.storyRounds[id]);
    if (id === 'data-history') {
      assert.equal(s.storyRounds[id].receiver, '');
      s = reduce(s, {
        type: 'story-choice',
        taskId: id,
        version: s.storyRounds[id].version,
        choice: 'submit',
      });
      assert.equal(s.storyRounds[id].receipt, undefined);
    }
  }
});
test('combination risk blocks fine detail; new scope invalidates old submission confirmation', () => {
  let s = initialWorkspace();
  const seeded = s.memory.tasks.find((t) => t.id === 'data-history');
  assert.ok(
    seeded.messages.some((message) =>
      /主动停止报告生成与外发/.test(message.text),
    ),
  );
  assert.ok(
    seeded.messages.some((message) =>
      /脱敏.*删除独居情况与办件明细/.test(message.text),
    ),
  );
  assert.ok(
    seeded.messages.some((message) => /重新生成聚合报告v2/.test(message.text)),
  );
  const flow = s.flows['data-history'];
  assert.equal(flow.kind, 'analysis');
  assert.equal(flow.operations.length, 12);
  assert.deepEqual(
    [
      ...new Set(
        flow.operations
          .filter((operation) => operation.system)
          .map((operation) => operation.system),
      ),
    ],
    ['resources', 'population', 'civilAffairs', 'governmentServices'],
  );
  for (const [cmd, system, evidence] of [
    ['read-resource-catalog', 'resources', /资源供给与服务覆盖底表/],
    ['read-population-summary', 'population', /年龄区间和街道归属/],
    ['read-civil-affairs-summary', 'civilAffairs', /独居服务标记/],
    ['read-service-cases', 'governmentServices', /办件数量/],
  ]) {
    const operation = flow.operations.find((item) => item.cmd === cmd);
    assert.equal(operation?.system, system);
    assert.equal(operation?.risk, '低');
    assert.equal(operation?.status, '成功');
    assert.match(operation?.detail || '', evidence);
  }
  assert.ok(
    seeded.messages.some((message) =>
      /4个来源.*一体化数字资源管理系统.*人口基础信息服务.*民政服务数据接口.*一体化政务服务平台/s.test(
        message.text,
      ),
    ),
  );
  assert.equal(
    flow.operations.find(
      (operation) => operation.cmd === 'check-derived-privacy',
    ).status,
    '已阻止',
  );
  assert.equal(
    flow.operations.find(
      (operation) => operation.cmd === 'submit-sanitized-report',
    ).receipt,
    'LOCAL-DATA-v2',
  );
  s = reduce(s, {
    type: 'say',
    taskId: 'data-history',
    text: '继续输出个人画像明细并外发',
  });
  assert.equal(s.storyRounds['data-history'], undefined);
  s = reduce(s, {
    type: 'say',
    taskId: 'data-history',
    text: '改为全区聚合报告',
  });
  const v = s.storyRounds['data-history'].version;
  s = reduce(s, {
    type: 'story-choice',
    taskId: 'data-history',
    version: v,
    choice: 'prepare',
  });
  s = reduce(s, { type: 'say', taskId: 'data-history', text: '改为内部版' });
  s = reduce(s, {
    type: 'story-choice',
    taskId: 'data-history',
    version: v,
    choice: 'submit',
  });
  assert.equal(s.storyRounds['data-history'].receipt, undefined);
});
test('unit scope excludes other organizations and unit requests cannot approve themselves', () => {
  const full = createSafetyState(),
    s = scopeAdminState(full, '单位管理员');
  assert.ok(s.rows.every((r) => ['u1', 'all'].includes(r.unit)));
  assert.ok(s.safety.checks.every((c) => c.unit === 'u1'));
  assert.ok(s.safety.grants.every((c) => c.unit === 'u1'));
  assert.ok(s.calls.every((c) => c.unit === 'u1'));
  assert.equal(mayManage('单位管理员', 'applications'), false);
  assert.throws(() =>
    submitUnitRequest(
      full,
      '领导只读',
      'applications',
      10,
      '增加财政审核岗位使用席位',
    ),
  );
  const next = submitUnitRequest(
    full,
    '单位管理员',
    'applications',
    10,
    '增加财政审核岗位使用席位',
  );
  assert.equal(next.rows[0].unit, 'u1');
  assert.equal(next.rows[0].status, '待审批');
  assert.equal(full.rows.length + 1, next.rows.length);
});
test('policy quality gate, revision invalidation, trial, release and rollback', () => {
  let s = initialGovernance();
  const a = (type, extra = {}) =>
    (s = changeGovernance(s, {
      type,
      role: '市级运营管理员',
      revision: s.revision,
      ...extra,
    }));
  a('publish');
  assert.equal(s.live, 1);
  a('edit', { budget: 1000, route: '分级路由', scope: '市政务服务管理局' });
  a('evaluate');
  assert.equal(s.stage, '评测未通过');
  a('trial');
  assert.equal(s.stage, '评测未通过');
  a('edit', { budget: 30000, route: '分级路由', scope: '市政务服务管理局' });
  a('evaluate');
  a('trial');
  const versionBefore = s.version;
  a('publish', { route: '指定模型' });
  assert.match(s.error, /未保存修改/);
  assert.equal(s.live, 1);
  assert.equal(s.version, versionBefore);
  a('publish');
  assert.equal(s.live, s.version);
  a('rollback');
  assert.equal(s.live, 1);
  for (const sample of meetingSamples)
    assert.ok(sample.input + sample.output + sample.retry + sample.routing > 0);
});
test('personal snapshot needs evaluation and approval; organization publication independent of personal memory', () => {
  let s = initialGovernance();
  const original = structuredClone(memoryCases);
  for (const type of ['skill-publish', 'approve'])
    s = changeGovernance(s, { type, role: '能力运营岗', revision: s.revision });
  assert.equal(s.skill, '待接收');
  for (const type of ['receive', 'skill-test', 'approve', 'skill-publish'])
    s = changeGovernance(s, { type, role: '能力运营岗', revision: s.revision });
  assert.equal(s.skillVersion, 'ORG-PAYMENT-METHOD-2.0');
  assert.deepEqual(memoryCases, original);
  const denied = changeGovernance(s, {
    type: 'edit',
    role: '领导只读',
    revision: s.revision,
    budget: 30000,
    route: '分级路由',
    scope: '市政务服务管理局',
  });
  assert.match(denied.error, /权限/);
});
