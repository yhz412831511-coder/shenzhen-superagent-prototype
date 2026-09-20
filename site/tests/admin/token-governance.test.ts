import test from 'node:test';
import assert from 'node:assert/strict';
import { groups, pages } from '../../app/products/admin/admin/catalog.ts';
import { mayManage } from '../../app/products/admin/governance.ts';
import {
  beginRoutingTrial,
  completeRoutingEvaluation,
  initialTokenGovernanceState,
  publishRoutingCandidate,
  requestRoutingEvaluation,
  saveRoutingRule,
} from '../../app/products/admin/token-governance.ts';
import {
  atomicTaskGroups,
  atomicTaskTypes,
  defaultRoutingConfig,
  publishedRoutingPolicy,
} from '../../app/shared/routing-domain.ts';

await test('原子任务分类固定为轻中重三级，后台只保留一个路由入口', () => {
  assert.deepEqual(
    atomicTaskGroups.map((group) => group.tasks.length),
    [4, 4, 3],
  );
  assert.equal(atomicTaskTypes.length, 11);
  assert.equal(
    groups.some((group) => String(group.name) === '策略与发布'),
    false,
  );
  assert.equal(
    groups.find((group) => group.name === 'Token与评测')?.pages.length,
    4,
  );
  assert.equal(
    pages.some((page) => String(page.id) === 'improvement'),
    false,
  );
  assert.equal(
    pages.some((page) => String(page.id) === 'policies'),
    false,
  );
});

await test('主备模型重复被拒绝，候选配置变化使旧评测失效', () => {
  const initial = initialTokenGovernanceState();
  const rule = structuredClone(initial.published.rules[0]);
  assert.throws(
    () =>
      saveRoutingRule(initial, {
        ...rule,
        fallbackModelId: rule.primaryModelId,
      }),
    /不能相同/,
  );
  let state = saveRoutingRule(initial, {
    ...rule,
    fallbackModelId: 'qwen-3-5-9b',
  });
  state = requestRoutingEvaluation(state);
  assert.equal(state.evaluations[0].status, '待执行');
  state = saveRoutingRule(state, {
    ...rule,
    fallbackModelId: 'glm-5-3-flash',
  });
  assert.equal(state.candidate?.status, '候选');
  assert.equal(
    state.evaluations.some(
      (item) => item.id === `EVAL-ROUTE-${state.candidate?.version}`,
    ),
    false,
  );
});

await test('路由必须评测、试用后发布，并同步用户端之后新建任务的默认策略', () => {
  let state = initialTokenGovernanceState();
  const rule = structuredClone(
    state.published.rules.find((item) => item.taskType === '摘要')!,
  );
  state = saveRoutingRule(state, { ...rule, primaryModelId: 'qwen-3-5-9b' });
  assert.throws(() => publishRoutingCandidate(state), /试用/);
  state = requestRoutingEvaluation(state);
  state = completeRoutingEvaluation(state);
  state = beginRoutingTrial(state);
  const oldVersion = publishedRoutingPolicy.version;
  state = publishRoutingCandidate(state);
  assert.notEqual(state.published.version, oldVersion);
  assert.equal(publishedRoutingPolicy.version, state.published.version);
  assert.equal(
    publishedRoutingPolicy.rules.find((item) => item.taskType === '摘要')
      ?.primaryModelId,
    'qwen-3-5-9b',
  );
  assert.equal(defaultRoutingConfig.L1.primaryModelId, 'ernie-4-5-21b');
});

await test('任务路由只有市级与能力运营岗位可配置，单位管理员只读', () => {
  assert.equal(mayManage('市级运营管理员', 'routing'), true);
  assert.equal(mayManage('能力运营岗', 'routing'), true);
  assert.equal(mayManage('单位管理员', 'routing'), false);
  assert.equal(mayManage('领导只读', 'routing'), false);
});
