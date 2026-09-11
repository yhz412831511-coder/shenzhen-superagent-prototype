import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  builtOrganizationCarriers,
  carriersForUnit,
  organizationCarriers,
  organizationUnits,
  plannedOrganizationCarriers,
  searchOrganization,
} from '../app/professional-intelligence-domain.ts';
import { brainstormParticipants } from '../app/brainstorm-fixtures.ts';
import { initialWorkspace, workspaceReducer } from '../app/fiscal-domain.ts';

const pageSource = readFileSync(
  new URL('../app/professional-intelligence-page.tsx', import.meta.url),
  'utf8',
);

test('组织登记冻结15个单位、14个可下探载体和26个静态载体', () => {
  assert.equal(organizationUnits.length, 15);
  assert.equal(organizationCarriers.length, 40);
  assert.equal(builtOrganizationCarriers.length, 14);
  assert.equal(plannedOrganizationCarriers.length, 26);
  assert.equal(new Set(organizationCarriers.map((item) => item.id)).size, 40);
});

test('26个静态载体只有官方名称和证据，不携带虚构详情或任务能力', () => {
  for (const carrier of plannedOrganizationCarriers) {
    assert.ok(carrier.formalName && carrier.officialUrl && carrier.verifiedAt);
    assert.equal(carrier.summary, undefined);
    assert.equal(carrier.services, undefined);
    assert.equal(carrier.relatedSceneAgentIds, undefined);
    assert.equal(carrier.sourceIds, undefined);
  }
});

test('资金监管保持跨职能且没有虚构资金监管处', () => {
  const carrier = organizationCarriers.find(
    (item) => item.id === 'fiscal-fund-supervision-digital-person',
  );
  assert.equal(carrier?.displayName, '资金监管');
  assert.equal(carrier?.mountStatus, 'cross_functional');
  assert.equal(carrier?.formalName.includes('处'), false);
  assert.match(carrier?.summary || '', /具体组织挂载待确认/);
});

test('脑暴13岗一一绑定政数局13个可下探载体，项目统筹不重复', () => {
  assert.equal(brainstormParticipants.length, 13);
  assert.equal(
    new Set(brainstormParticipants.map((item) => item.organizationCarrierId)).size,
    13,
  );
  assert.equal(
    brainstormParticipants.find((item) => item.id === 'project-planning')
      ?.organizationCarrierId,
    'project-coordination-digital-person',
  );
  for (const participant of brainstormParticipants) {
    const carrier = builtOrganizationCarriers.find(
      (item) => item.id === participant.organizationCarrierId,
    );
    assert.equal(carrier?.unitId, 'zsj');
  }
});

test('搜索可定位单位、可下探载体和静态载体', () => {
  assert.deepEqual(searchOrganization('财政局'), ['finance']);
  assert.deepEqual(searchOrganization('项目统筹处'), ['zsj']);
  assert.deepEqual(searchOrganization('智慧监管和科技处'), ['market-regulation']);
  assert.deepEqual(searchOrganization('不存在的名称'), []);
  assert.equal(carriersForUnit('market-regulation').length, 2);
});

test('用户端去除数量说明和单位内数字人字样，静态节点不渲染按钮', () => {
  assert.equal(pageSource.includes('14个岗位数字人可查看详情'), false);
  assert.equal(pageSource.includes('数字人'), false);
  assert.match(pageSource, /item\.buildStatus === 'built'/);
  assert.match(pageSource, /pi-static-carrier/);
});

test('目录分为14个组织载体和10个场景工作智能体', () => {
  const state = initialWorkspace(Date.parse('2026-09-11T09:00:00+08:00'));
  assert.equal(
    state.catalog.filter((item) => item.kind === '组织智能载体').length,
    14,
  );
  assert.equal(
    state.catalog.filter((item) => item.kind === '场景工作智能体').length,
    10,
  );
});

test('新任务兼容旧agentId并写入一个场景和多个去重载体', () => {
  const state = initialWorkspace(Date.parse('2026-09-11T09:00:00+08:00'));
  const next = workspaceReducer(state, {
    type: 'new-task',
    id: 'professional-intelligence-task',
    text: '整理本次工作',
    agentId: 'government-disclosure',
    sceneAgentId: 'government-disclosure',
    roleAgentIds: [
      'role-carrier-office',
      'role-carrier-office',
      'project-coordination-digital-person',
    ],
  });
  assert.equal(next.flows['professional-intelligence-task'].agentId, 'government-disclosure');
  assert.equal(next.flows['professional-intelligence-task'].sceneAgentId, 'government-disclosure');
  assert.deepEqual(next.flows['professional-intelligence-task'].roleAgentIds, [
    'role-carrier-office',
    'project-coordination-digital-person',
  ]);
});
