import test from 'node:test';
import assert from 'node:assert/strict';
import {
  brainstormReducer,
  createBrainstormFlow,
  initialBrainstormState,
} from '../app/brainstorm-domain.ts';

const taskId = 'brainstorm-test';
const at = '2026-12-18T01:00:00.000Z';

const start = () => {
  const state = initialBrainstormState();
  const created = createBrainstormFlow(
    taskId,
    '请协同形成2026年度工作报告',
    at,
  );
  state.flows[taskId] = created.flow;
  return { state, effects: created.effects };
};

const act = (state, action) =>
  brainstormReducer(state, { taskId, ...action }, at);

test('脑暴协作完成六阶段闭环并生成四项一致成果', () => {
  let transition = start();
  assert.equal(transition.effects[0].anchor, 'issue');
  transition = act(transition.state, { type: 'issue-confirm' });
  transition = act(transition.state, { type: 'participants-confirm' });
  transition = act(transition.state, { type: 'scope-confirm' });
  transition = act(transition.state, { type: 'collect' });
  assert.equal(transition.state.flows[taskId].phaseStatus, 'partial_ready');
  assert.equal(transition.state.flows[taskId].rounds[0].status, 'completed');
  assert.equal(transition.state.flows[taskId].rounds[1].status, 'pending');
  assert.equal(
    transition.state.flows[taskId].topics.filter(
      (item) => item.status === 'ready',
    ).length,
    7,
  );
  transition = act(transition.state, { type: 'inquire' });
  assert.equal(transition.effects[0].role, 'user');
  assert.match(transition.effects[0].text, /按建议先处理/);
  assert.ok(
    transition.state.flows[taskId].eventLog.some(
      (item) =>
        item.type === 'topic/prioritize' &&
        item.entityId === 'ai-government' &&
        item.to === 'confirmed_first',
    ),
  );
  assert.equal(
    transition.state.flows[taskId].conflicts.find(
      (item) => item.kind === 'ordinary',
    ).status,
    'resolved',
  );
  assert.equal(transition.state.flows[taskId].phaseStatus, 'inquiring');
  assert.equal(transition.state.flows[taskId].rounds[1].status, 'completed');
  assert.equal(transition.state.flows[taskId].rounds[2].status, 'active');
  transition = act(transition.state, { type: 'inquire' });
  assert.equal(
    transition.state.flows[taskId].phaseStatus,
    'awaiting_high_impact_decision',
  );
  assert.equal(transition.state.flows[taskId].rounds[2].status, 'completed');
  assert.equal(
    transition.state.flows[taskId].conflicts.find(
      (item) => item.kind === 'high_impact',
    ).inquiryRounds,
    2,
  );
  transition = act(transition.state, {
    type: 'decision-resolve',
    conflictId: 'conflict-ai-balance',
    optionId: 'balanced',
  });
  transition = act(transition.state, { type: 'outline-confirm' });
  transition = act(transition.state, { type: 'artifacts-generate' });
  const artifacts = transition.effects.filter(
    (item) => item.type === 'artifact',
  );
  assert.equal(artifacts.length, 4);

  const flow = transition.state.flows[taskId];
  flow.artifactIds = artifacts.map((_, index) => `artifact-${index + 1}`);
  flow.artifactMeta = artifacts.map((item, index) => ({
    artifactId: `artifact-${index + 1}`,
    evidenceIds: item.evidenceIds,
    nature: 'synthetic_working_version',
    asOf: '2026-11-30',
    verificationStatus: 'pending_review',
  }));
  transition = act(transition.state, {
    type: 'fact-gap-resolve',
    resolution: 'keep_limited',
  });
  transition = act(transition.state, { type: 'working-version-confirm' });

  assert.equal(transition.state.flows[taskId].phaseStatus, 'completed');
  assert.equal(transition.state.flows[taskId].completedPhaseIds.length, 6);
  assert.equal(transition.state.flows[taskId].decisions.length, 1);
  assert.ok(
    transition.state.flows[taskId].artifactMeta.every(
      (item) => item.verificationStatus === 'reviewed',
    ),
  );
});

test('13个岗位独立输出和两轮阶段成果均可追溯', () => {
  let transition = start();
  const initialFlow = transition.state.flows[taskId];
  assert.equal(initialFlow.contributions.length, 13);
  assert.equal(
    new Set(initialFlow.contributions.map((item) => item.position)).size,
    13,
  );
  assert.ok(
    initialFlow.contributions.every(
      (item) => item.basisStatus && item.draftImpact && item.questions.length,
    ),
  );
  assert.equal(initialFlow.rounds[0].entries.length, 13);
  assert.ok(
    initialFlow.rounds.every(
      (round) => round.artifacts.length && round.continuationReason,
    ),
  );

  for (const value of [
    { type: 'issue-confirm' },
    { type: 'participants-confirm' },
    { type: 'scope-confirm' },
    { type: 'collect' },
    { type: 'inquire' },
    { type: 'inquire' },
  ])
    transition = act(transition.state, value);

  const flow = transition.state.flows[taskId];
  assert.deepEqual(
    flow.rounds.map((round) => round.status),
    ['completed', 'completed', 'completed'],
  );
  assert.ok(
    flow.rounds
      .slice(1)
      .every((round) => round.consensus.length && round.conflicts.length),
  );
  assert.ok(
    flow.evolution.changes.some((item) => item.kind === 'corrected_boundary'),
  );
  assert.ok(
    flow.evolution.changes.some((item) => item.kind === 'formed_dependency'),
  );
});

test('关键职责和证据边界未满足时阻断推进', () => {
  let transition = start();
  transition = act(transition.state, { type: 'issue-confirm' });
  transition = act(transition.state, {
    type: 'participants-toggle',
    participantId: 'office',
  });
  const participantBlocked = act(transition.state, {
    type: 'participants-confirm',
  });
  assert.match(participantBlocked.notice, /必须保留办公室/);
  assert.equal(
    participantBlocked.state.flows[taskId].phaseStatus,
    'awaiting_participants',
  );

  const incomplete = start().state;
  const finalBlocked = act(incomplete, { type: 'working-version-confirm' });
  assert.match(finalBlocked.notice, /尚未满足/);
});

test('暂停后禁止业务推进，恢复后从原状态继续', () => {
  let transition = start();
  transition = act(transition.state, { type: 'pause' });
  assert.equal(transition.state.flows[taskId].stopped, true);
  const blocked = act(transition.state, { type: 'issue-confirm' });
  assert.match(blocked.notice, /已暂停/);
  transition = act(transition.state, { type: 'resume' });
  assert.equal(transition.state.flows[taskId].stopped, false);
  transition = act(transition.state, { type: 'issue-confirm' });
  assert.equal(
    transition.state.flows[taskId].phaseStatus,
    'awaiting_participants',
  );
});
