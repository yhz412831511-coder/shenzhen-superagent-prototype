import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialWorkspace,
  workspaceReducer as reduce,
} from '../app/fiscal-domain.ts';

const taskId = 'brainstorm-workspace';
const create = () =>
  reduce(initialWorkspace(), {
    type: 'new-task',
    id: taskId,
    text: '请组织多岗位协同形成2026年度工作报告',
    collaborationMode: 'brainstorm',
    refs: [],
  });
const action = (state, value) =>
  reduce(state, { type: 'brainstorm', action: { taskId, ...value } });

function generated(optionId = 'balanced') {
  let state = create();
  for (const value of [
    { type: 'issue-confirm' },
    { type: 'participants-confirm' },
    { type: 'scope-confirm' },
    { type: 'collect' },
    { type: 'inquire' },
    { type: 'decision-resolve', conflictId: 'conflict-ai-balance', optionId },
    { type: 'outline-confirm' },
    { type: 'artifacts-generate' },
  ])
    state = action(state, value);
  return state;
}

test('从统一输入器创建脑暴任务，不污染既有Flow或专业智能目录', () => {
  const before = initialWorkspace();
  const state = create();
  assert.equal(state.memory.tasks[0].collaborationMode, 'brainstorm');
  assert.equal(state.memory.tasks[0].title, '2026年度工作报告');
  assert.equal(state.flows[taskId], undefined);
  assert.ok(state.brainstorm.flows[taskId]);
  assert.deepEqual(state.catalog, before.catalog);
  assert.equal(
    state.memory.tasks[0].messages.filter((item) => item.role === 'assistant')
      .length,
    1,
  );
});

test('四项成果进入统一成果库，并保持同一任务和来源边界', () => {
  const state = generated();
  const flow = state.brainstorm.flows[taskId];
  assert.equal(flow.artifactIds.length, 4);
  assert.ok(
    flow.artifactIds.every((id) => state.artifacts[id].taskId === taskId),
  );
  assert.ok(
    state.artifacts[flow.artifactIds[0]].body.includes(
      '工作版本 · 合成示例内容',
    ),
  );
  assert.ok(state.artifacts[flow.artifactIds[3]].body.includes('采用平衡主线'));
});

test('创新选项改变主稿，移除未核数值会同步改写成果版本', () => {
  let state = generated('innovation');
  let flow = state.brainstorm.flows[taskId];
  const reportId = flow.artifactIds[0];
  assert.match(state.artifacts[reportId].body, /前瞻性更强/);
  state = action(state, {
    type: 'fact-gap-resolve',
    resolution: 'remove_from_draft',
  });
  flow = state.brainstorm.flows[taskId];
  assert.doesNotMatch(state.artifacts[reportId].body, /96\.4%/);
  assert.match(state.artifacts[reportId].body, /不写入未核定数值/);
  assert.equal(state.artifacts[reportId].version, flow.version);
});

test('脑暴任务暂停沿用统一顶栏事件，且不会推进当前步骤', () => {
  let state = create();
  const status = state.brainstorm.flows[taskId].phaseStatus;
  state = reduce(state, { type: 'stop', taskId, stopped: true });
  assert.equal(state.brainstorm.flows[taskId].stopped, true);
  state = action(state, { type: 'issue-confirm' });
  assert.equal(state.brainstorm.flows[taskId].phaseStatus, status);
  assert.match(state.notice, /已暂停/);
});
