import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPartyFlow,
  partyTransition,
  PARTY_PROMPT,
} from '../app/party-domain.ts';
import {
  initialWorkspace,
  workspaceReducer,
  taskFor,
} from '../app/fiscal-domain.ts';

const id = 'party-test';
function setup() {
  let flow = createPartyFlow(id).flow;
  let effects = [];
  const act = (action) => {
    const result = partyTransition(flow, {
      taskId: id,
      revision: flow.revision,
      ...action,
    });
    flow = result.flow;
    effects = result.effects;
    return flow;
  };
  const review = (selected = ['oa', 'topics', 'tracking']) => {
    act({ type: 'systems-confirm', selected });
    act({ type: 'plan-confirm' });
    act({ type: 'collect-finish' });
    act({ type: 'gap', choice: 'provisional' });
  };
  return {
    act,
    review,
    get flow() {
      return flow;
    },
    get effects() {
      return effects;
    },
  };
}

test('system selection neither grants permission nor approves formal sending', () => {
  const c = setup();
  c.act({ type: 'systems-confirm', selected: ['inspection'] });
  assert.equal(c.flow.stage, 'systems');
  assert.match(c.flow.feedback, /不可用/);
  c.act({ type: 'systems-confirm', selected: ['oa'] });
  c.act({ type: 'send' });
  assert.equal(c.flow.stage, 'plan');
  assert.equal(c.flow.requestId, undefined);
});

test('excluded sources change the plan and actual report, unavailable OA cannot send', () => {
  const c = setup();
  c.review(['topics']);
  const report = c.effects.find((effect) => effect.name?.includes('核查报告'));
  assert.match(report.body, /不提供完成率/);
  assert.doesNotMatch(report.body, /85%|72%/);
  c.act({ type: 'prepare-send' });
  assert.equal(c.flow.stage, 'review');
  assert.match(c.flow.feedback, /只能保留工作稿/);
});

test('waiting preserves the decision point and does not manufacture a finished artifact', () => {
  const c = setup();
  c.act({ type: 'systems-confirm', selected: ['oa', 'topics'] });
  c.act({ type: 'plan-confirm' });
  c.act({ type: 'collect-finish' });
  c.act({ type: 'gap', choice: 'wait' });
  assert.equal(c.flow.stage, 'waiting');
  assert.equal(c.effects.filter((e) => e.type === 'artifact').length, 0);
  c.act({ type: 'gap', choice: 'exclude' });
  assert.equal(c.flow.stage, 'review');
  assert.equal(c.effects.filter((e) => e.type === 'artifact').length, 4);
});

test('preview is read only; refusal produces no request; repeated confirm produces one request', () => {
  const c = setup();
  c.review();
  c.act({ type: 'prepare-send' });
  assert.equal(c.flow.requestId, undefined);
  c.act({ type: 'cancel-send' });
  assert.equal(c.flow.stage, 'review');
  assert.equal(c.flow.requestId, undefined);
  c.act({ type: 'prepare-send' });
  const revision = c.flow.revision;
  c.act({ type: 'send' });
  const request = c.flow.requestId;
  c.act({ type: 'send', revision });
  assert.equal(c.flow.requestId, request);
  assert.equal(c.flow.stage, 'sending');
  assert.match(c.flow.feedback, /未重复执行/);
});

test('change recipient invalidates confirmation, preserves source work, new draft matches new recipients', () => {
  const c = setup();
  c.review();
  c.act({ type: 'prepare-send' });
  c.act({
    type: 'revise',
    meetingAt: c.flow.meetingAt,
    cutoff: '2026-09-23T17:00',
    extraTopic: '',
    recipients: ['办公室'],
  });
  assert.equal(c.flow.planVersion, 2);
  assert.equal(c.flow.stage, 'plan');
  assert.equal(c.flow.reuseEvidence, true);
  c.act({ type: 'send' });
  assert.equal(c.flow.requestId, undefined);
  c.act({ type: 'plan-confirm' });
  c.act({ type: 'collect-finish' });
  assert.equal(c.flow.stage, 'review');
  const notice = c.effects.find((e) => e.notice);
  assert.match(notice.body, /接收范围：办公室/);
  assert.match(notice.body, /17:00/);
  assert.doesNotMatch(notice.body, /政策法规处/);
});

test('last-minute system failure blocks send and unknown result only queries original request', () => {
  const c = setup();
  c.review();
  c.act({ type: 'prepare-send' });
  c.act({ type: 'exercise', outcome: 'unknown', oaUnavailable: true });
  c.act({ type: 'send' });
  assert.equal(c.flow.requestId, undefined);
  c.act({ type: 'exercise', outcome: 'unknown', oaUnavailable: false });
  c.act({ type: 'send' });
  c.act({ type: 'send-finish' });
  const request = c.flow.requestId;
  assert.equal(c.flow.stage, 'unknown');
  assert.equal(c.flow.receipt, undefined);
  c.act({ type: 'retry' });
  assert.equal(c.flow.stage, 'unknown');
  c.act({ type: 'query-receipt' });
  assert.equal(c.flow.requestId, request);
  assert.equal(c.flow.stage, 'sent');
  assert.match(c.flow.receipt, /^LOCAL-OA-/);
  assert.match(c.effects.find((e) => e.type === 'remember').text, /合成回执/);
});

test('definite failure requires fresh confirmation and internal only branch never sends', () => {
  const c = setup();
  c.review();
  c.act({ type: 'exercise', outcome: 'failure', oaUnavailable: false });
  c.act({ type: 'prepare-send' });
  c.act({ type: 'send' });
  c.act({ type: 'send-finish' });
  assert.equal(c.flow.stage, 'failed');
  assert.equal(c.flow.receipt, undefined);
  c.act({ type: 'retry' });
  assert.equal(c.flow.stage, 'confirm');
  c.act({ type: 'internal' });
  assert.equal(c.flow.stage, 'internal');
  c.act({ type: 'send' });
  assert.equal(c.flow.stage, 'internal');
});

test('invalid dates are rejected and unsupported text does not fake completion', () => {
  const c = setup();
  c.review();
  c.act({ type: 'say', text: '材料截止改为99:99' });
  assert.equal(c.flow.planVersion, 1);
  assert.match(c.flow.feedback, /有效/);
  c.act({ type: 'say', text: '替我发出正式会议决定' });
  assert.equal(c.flow.stage, 'review');
  assert.equal(c.flow.requestId, undefined);
});

test('workspace appends immutable records, retains old artifacts and automatically stores sourced personal memory', () => {
  let state = workspaceReducer(initialWorkspace(), {
    type: 'new-task',
    id,
    text: PARTY_PROMPT,
  });
  const act = (action) => {
    state = workspaceReducer(state, {
      type: 'party',
      action: { taskId: id, revision: state.party[id].revision, ...action },
    });
  };
  const firstAnchor = state.party[id].anchor;
  act({ type: 'systems-confirm', selected: ['oa', 'topics', 'tracking'] });
  assert.equal(state.party[id].decisions[0].anchor, firstAnchor);
  act({ type: 'plan-confirm' });
  act({ type: 'collect-finish' });
  act({ type: 'gap', choice: 'provisional' });
  const oldIds = [...state.party[id].artifacts];
  const oldBodies = oldIds.map((key) => state.artifacts[key].body);
  state = workspaceReducer(state, {
    type: 'say',
    taskId: id,
    text: '材料截止改为17:00',
  });
  act({ type: 'plan-confirm' });
  act({ type: 'collect-finish' });
  assert.deepEqual(
    oldIds.map((key) => state.artifacts[key].body),
    oldBodies,
  );
  assert.equal(
    Object.values(state.artifacts).filter((a) => a.taskId === id).length,
    8,
  );
  assert.equal(state.party[id].artifacts.length, 4);
  act({ type: 'prepare-send' });
  act({ type: 'send' });
  act({ type: 'send-finish' });
  const memory = state.memory.memories.find((m) => m.id === 'working-' + id);
  assert.ok(memory);
  assert.equal(memory.scope, 'personal');
  const revision = memory.revisions.at(-1);
  assert.equal(revision.source.taskId, id);
  assert.match(revision.source.quote, /合成回执/);
  assert.ok(
    taskFor(state, id).messages.some((m) => m.id === revision.source.eventId),
  );
  assert.ok(
    taskFor(state, id).messages.every(
      (m, i, list) => !i || Date.parse(m.at) >= Date.parse(list[i - 1].at),
    ),
  );
  const count = state.memory.memories.length;
  act({ type: 'send-finish' });
  assert.equal(state.memory.memories.length, count);
});

test('draft edits stay separate from confirmed scope and block accidental execution', () => {
  const c = setup();
  c.act({ type: 'draft', selected: ['oa', 'resources'] });
  assert.deepEqual(c.flow.selectionDraft, ['oa', 'resources']);
  assert.deepEqual(c.flow.selected, ['oa', 'topics', 'tracking']);
  c.review();
  c.act({ type: 'prepare-send' });
  c.act({ type: 'draft', plan: { recipients: ['办公室'] } });
  c.act({ type: 'send' });
  assert.equal(c.flow.requestId, undefined);
  assert.match(c.flow.feedback, /未保存/);
  c.act({ type: 'draft', discardPlan: true });
  c.act({ type: 'send' });
  assert.equal(c.flow.stage, 'sending');
});
