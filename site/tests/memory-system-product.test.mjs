import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KIND_MANAGEMENT,
  createInitialMemoryState,
  inferMemoryKind,
  memoryReducer,
} from '../app/products/memory-system/domain.ts';
import { aiMemoryStories } from '../app/shared/story-corpus.ts';

const getMemory = (state, id) =>
  state.memories.find((memory) => memory.id === id);

test('MS01 五类记忆有独立管理定义，关键管理对象齐全', () => {
  const state = createInitialMemoryState();
  assert.deepEqual(
    [...new Set(state.memories.map((memory) => memory.kind))].sort(),
    ['M1', 'M2', 'M3', 'M4', 'M5'],
  );
  assert.deepEqual(Object.keys(KIND_MANAGEMENT), [
    'M1',
    'M2',
    'M3',
    'M4',
    'M5',
  ]);
  for (const definition of Object.values(KIND_MANAGEMENT)) {
    assert.ok(definition.question);
    assert.ok(definition.job);
    assert.ok(definition.result);
    assert.ok(definition.guardrail);
    assert.ok(definition.fields.length >= 4);
  }
  assert.ok(state.sources.length >= 4);
  assert.ok(state.grants.length >= 3);
  assert.ok(state.jobs.some((job) => job.name === '冷热数据自动处理'));
  assert.ok(state.issues.length >= 3);
  assert.ok(state.audit.length >= 3);
});

test('MS02 自然语言新增会建议五类之一，但不冒充组织事实', () => {
  assert.equal(inferMemoryKind('下周三截止，到期前提醒我跟踪补件'), 'M4');
  assert.equal(inferMemoryKind('先核对口径再检查附件的步骤'), 'M2');
  assert.equal(inferMemoryKind('凭证冲突时不能直接认定符合，这是历史退回教训'), 'M5');
  let state = createInitialMemoryState();
  state = memoryReducer(state, {
    type: 'add',
    kind: 'M4',
    text: '下周三前继续跟踪验收材料，到期前一天提醒我。',
  });
  const added = state.memories[0];
  assert.equal(added.kind, 'M4');
  assert.equal(added.scope, '本人私有；仅在具体任务授权后调用');
  assert.match(added.evidence, /未自动升级为组织事实/);
  assert.equal(added.protected, true);
});

test('MS03 纠正生成新版本，旧版和来源仍保留', () => {
  const initial = createInitialMemoryState();
  const before = structuredClone(getMemory(initial, 'm13-correction'));
  const state = memoryReducer(initial, {
    type: 'correct',
    id: 'm13-correction',
    text: '技术验收完成不代表手续材料齐套，仅适用于第13—14次会务。',
  });
  const after = getMemory(state, 'm13-correction');
  assert.equal(after.version, String(Number(before.version) + 1));
  assert.equal(after.history.length, before.history.length + 1);
  assert.deepEqual(
    after.history.slice(0, before.history.length),
    before.history,
  );
  assert.equal(after.source, before.source);
  assert.equal(after.history.at(-1).reason, '本人纠正形成新版本');
});

test('MS04 M2贡献形成不可变独立快照，个人后续修改不覆盖快照', () => {
  let state = createInitialMemoryState();
  const originalOrganization = structuredClone(getMemory(state, 'fiscal-org'));
  const personalBefore = getMemory(state, 'fiscal-personal');
  state = memoryReducer(state, {
    type: 'contribute',
    id: 'fiscal-personal',
  });
  const snapshot = state.contributions.find(
    (item) =>
      item.personalMemoryId === 'fiscal-personal' &&
      item.personalVersion === personalBefore.version,
  );
  assert.ok(snapshot);
  assert.equal(snapshot.status, '待组织评测');
  state = memoryReducer(state, { type: 'correct', id: 'fiscal-personal' });
  assert.equal(snapshot.personalVersion, personalBefore.version);
  assert.deepEqual(getMemory(state, 'fiscal-org'), originalOrganization);
});

test('MS05 停用、归档、撤回和删除进入不同的生命周期结果', () => {
  const seed = createInitialMemoryState();
  const disabled = memoryReducer(seed, {
    type: 'toggle-active',
    id: 'ops-method',
  });
  const archived = memoryReducer(seed, { type: 'archive', id: 'ops-method' });
  const withdrawn = memoryReducer(seed, {
    type: 'withdraw',
    id: 'ops-method',
  });
  const deleted = memoryReducer(seed, {
    type: 'delete-derived',
    id: 'ops-method',
  });
  assert.deepEqual(
    [
      getMemory(disabled, 'ops-method').retention,
      getMemory(archived, 'ops-method').retention,
      getMemory(withdrawn, 'ops-method').retention,
      getMemory(deleted, 'ops-method').retention,
    ],
    ['保留', '归档', '撤回', '待删除'],
  );
  assert.match(getMemory(deleted, 'ops-method').content, /删除流程/);
  assert.match(getMemory(archived, 'ops-method').content, /核对/);
});

test('MS06 冷热自动评估不改变当前工作、未完承诺和有效权限的层级', () => {
  const seed = createInitialMemoryState();
  const protectedBefore = new Map(
    seed.memories
      .filter((memory) => memory.protected)
      .map((memory) => [memory.id, memory.tier]),
  );
  const state = memoryReducer(seed, { type: 'run-temperature' });
  for (const [id, tier] of protectedBefore) {
    assert.equal(getMemory(state, id).tier, tier);
  }
  assert.equal(getMemory(state, 'm13-commitment').state, '有效');
  assert.equal(getMemory(state, 'm13-commitment').protected, true);
  assert.equal(state.jobs[0].name, '冷热数据自动处理');
  assert.match(state.jobs[0].result, /当前工作、未完承诺和有效权限未迁移/);

  const blockedArchive = memoryReducer(seed, {
    type: 'archive',
    id: 'm13-commitment',
  });
  assert.equal(getMemory(blockedArchive, 'm13-commitment').state, '有效');
  assert.match(blockedArchive.notice, /生命周期保护/);
});

test('MS07 本人标记M4完成后，源回执核验前仍保持活跃与保护', () => {
  const state = memoryReducer(createInitialMemoryState(), {
    type: 'complete-commitment',
    id: 'm13-commitment',
  });
  const commitment = getMemory(state, 'm13-commitment');
  assert.equal(commitment.state, '有效');
  assert.equal(commitment.tier, '热');
  assert.equal(commitment.quality, '待重算');
  assert.equal(commitment.protected, true);
  assert.match(commitment.protectedReason, /尚未取得权威来源回执/);
});

test('MS08 撤销AI授权后下一次读取立即阻断，历史调用仍保留', () => {
  const seed = createInitialMemoryState();
  const historyCount = seed.calls.length;
  const state = memoryReducer(seed, {
    type: 'revoke-grant',
    id: 'grant-meeting',
  });
  assert.equal(
    state.grants.find((grant) => grant.id === 'grant-meeting').status,
    '已撤销',
  );
  assert.equal(state.calls.length, historyCount + 1);
  assert.equal(state.calls[0].result, '已阻断');
  assert.match(state.calls[0].evidence, /未返回记忆正文或缓存内容/);
  assert.equal(state.permissionPropagation, true);
  assert.ok(state.audit.some((entry) => entry.action === '撤销AI调用授权'));
});

test('MS09 权威来源撤权会收缩当前视图、失效缓存并保留审计', () => {
  const state = memoryReducer(createInitialMemoryState(), {
    type: 'propagate-source-revocation',
  });
  assert.equal(
    state.sources.find((source) => source.id === 'source-meeting').status,
    '权限已收缩',
  );
  assert.equal(getMemory(state, 'm13-episode').state, '已停用');
  assert.equal(getMemory(state, 'm13-correction').quality, '已失效');
  assert.equal(state.calls[0].result, '已阻断');
  assert.match(state.jobs[0].result, /缓存失效/);
  assert.equal(state.audit[0].actor, '权威来源');
});

test('MS10 摘要失败先降级，安全重试通过后才发布', () => {
  const seed = createInitialMemoryState();
  assert.equal(
    seed.jobs.find((job) => job.id === 'job-summary').status,
    '已降级',
  );
  const state = memoryReducer(seed, { type: 'retry-job', id: 'job-summary' });
  assert.equal(
    state.jobs.find((job) => job.id === 'job-summary').status,
    '已完成',
  );
  assert.equal(
    state.issues.find((issue) => issue.id === 'issue-summary-gap').status,
    '已解决',
  );
  assert.match(state.notice, /保留回执限制/);
});

test('MS11 跨周期续接产生五类记忆最小必要证据包', () => {
  const state = memoryReducer(createInitialMemoryState(), {
    type: 'generate-meeting-pack',
  });
  assert.equal(state.meetingPackGenerated, true);
  assert.equal(state.calls[0].result, '已提供');
  assert.match(state.calls[0].evidence, /M1\/M2\/M3\/M4\/M5/);
  assert.match(state.calls[0].coverage, /第13—14次会议/);
});

test('MS12 五条固定合成案例可按故事下钻，撤权与个人组织版本边界不变', () => {
  const state = createInitialMemoryState();
  for (const story of aiMemoryStories) {
    const evidenceIds = story.evidence
      .map((item) => item.memoryId)
      .filter(Boolean);
    const memories = state.memories.filter(
      (memory) =>
        story.taskIds.includes(memory.taskId) || evidenceIds.includes(memory.id),
    );
    if (story.id !== 'annual-brainstorm') assert.ok(memories.length > 0, story.id);
    assert.ok(
      state.calls.some((call) => call.storyId === story.id),
      `调用记录缺少${story.id}`,
    );
    assert.ok(
      state.audit.some((entry) => entry.storyId === story.id),
      `审计记录缺少${story.id}`,
    );
  }
  const revoked = memoryReducer(state, {
    type: 'revoke-grant',
    id: 'grant-superagent',
  });
  assert.equal(
    revoked.grants.find((grant) => grant.id === 'grant-superagent').status,
    '已撤销',
  );
  assert.equal(getMemory(revoked, 'fiscal-org').kind, 'M2');
  assert.notEqual(
    getMemory(revoked, 'fiscal-org').owner,
    getMemory(revoked, 'fiscal-personal').owner,
  );
});
