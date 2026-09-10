import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBrainstormFlow } from '../app/brainstorm-domain.ts';
import { brainstormProgress } from '../app/brainstorm-selectors.ts';
import { targetKey } from '../app/task-workspace-model.ts';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('统一输入器提供脑暴协作入口，任务创建后模式锁定', () => {
  const composer = read('../app/task-composer.tsx');
  const workbench = read('../app/fiscal-workbench.tsx');
  assert.match(composer, /协作方式/);
  assert.match(composer, /多岗位贡献、询证与用户裁决/);
  assert.match(workbench, /collaborationMode/);
  assert.match(workbench, /lockedCollaborationMode=\{page === 'task'\}/);
});

test('对话卡、任务概览和三栏审阅均接入现有任务壳', () => {
  const conversation = read('../app/fiscal-components.tsx');
  const workspace = read('../app/task-workspace.tsx');
  assert.match(conversation, /BrainstormAttachment/);
  assert.match(conversation, /BrainstormMonitorSections/);
  assert.match(workspace, /BrainstormObjectView/);
  assert.match(
    workspace,
    /\['round','evolution','review'\]\.includes\(target\.entity\)/,
  );
  assert.match(workspace, /\['round','evolution','review'\]/);
});

test('融合版在原任务框架中呈现完整协作故事', () => {
  const components = read('../app/brainstorm-components.tsx');
  assert.match(components, /查看13岗完整输出/);
  assert.match(components, /进入第二轮询证/);
  assert.match(components, /用户裁决与版本变化/);
  assert.match(components, /从初步汇集到两轮岗位互证/);
  assert.match(components, /新增准入条件/);
});

test('脑暴进度固定为六个业务阶段', () => {
  const { flow } = createBrainstormFlow('progress', '年度工作报告');
  const progress = brainstormProgress(flow);
  assert.equal(progress.length, 6);
  assert.deepEqual(
    progress.map((item) => item.title),
    [
      '议题准备',
      '材料盘点与授权',
      '主题贡献',
      '协同询证',
      '决策与大纲收敛',
      '统稿、审校与交付',
    ],
  );
});

test('脑暴下钻对象按实体维度复用标签而不发生碰撞', () => {
  assert.notEqual(
    targetKey({ kind: 'brainstorm', entity: 'role', id: 'shared' }),
    targetKey({ kind: 'brainstorm', entity: 'topic', id: 'shared' }),
  );
});
