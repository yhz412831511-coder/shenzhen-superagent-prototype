import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  initialWorkspace,
  taskFor,
  workspaceReducer,
} from '../app/fiscal-domain.ts';
import { fiscalAgent } from '../app/fiscal-catalog.ts';
import { taskProgress } from '../app/task-progress.ts';

const now = Date.parse('2026-09-08T09:00:00+08:00');
const initial = () => initialWorkspace(now);

test('历史业务任务展示完整业务步骤且全部完成', () => {
  const s = initial();
  const maintenance = s.flows['maintenance-history'];
  const payment = s.flows['payment-history'];
  const maintenanceProgress = taskProgress(
    taskFor(s, maintenance.id),
    maintenance,
  );
  const paymentProgress = taskProgress(taskFor(s, payment.id), payment);
  assert.equal(maintenanceProgress.length, 7);
  assert.equal(paymentProgress.length, 6);
  assert.ok(maintenanceProgress.every((step) => step.status === 'completed'));
  assert.ok(paymentProgress.every((step) => step.status === 'completed'));
  assert.deepEqual(
    maintenanceProgress.map((step) => step.title),
    [
      '读取并确认交办要求',
      '获取运维申报办理指引',
      '建立申报并完善基础信息',
      '关联并同步运维资产',
      '整理并上传申报材料',
      '获取费用估算并完成提交',
      '决定是否创建审核反馈追踪',
    ],
  );
});

test('支付审查阶段只保留一个执行中步骤', () => {
  let s = workspaceReducer(initial(), { type: 'replay', kind: 'payment' });
  let f = s.flows['replay-payment'];
  let progress = taskProgress(taskFor(s, f.id), f);
  assert.deepEqual(progress.map((step) => step.status), [
    'in_progress',
    'not_started',
    'not_started',
    'not_started',
    'not_started',
    'not_started',
  ]);
  s = workspaceReducer(s, {
    type: 'command',
    taskId: f.id,
    cmd: 'read-payments',
  });
  f = s.flows['replay-payment'];
  progress = taskProgress(taskFor(s, f.id), f);
  assert.deepEqual(progress.slice(0, 3).map((step) => step.status), [
    'completed',
    'in_progress',
    'not_started',
  ]);
  assert.equal(
    progress.filter((step) => step.status === 'in_progress').length,
    1,
  );
});

test('等待、异常和暂停仍是执行中并显示原因', () => {
  const s = workspaceReducer(initial(), { type: 'replay', kind: 'payment' });
  const task = taskFor(s, 'replay-payment');
  const waiting = structuredClone(s.flows['replay-payment']);
  waiting.status = '等待本人确认';
  assert.equal(taskProgress(task, waiting)[0].statusDetail, '等待本人确认');

  const failed = structuredClone(waiting);
  failed.status = '执行失败';
  assert.equal(
    taskProgress(task, failed)[0].statusDetail,
    '执行失败，等待重试',
  );

  const stopped = structuredClone(waiting);
  stopped.stopped = true;
  assert.equal(taskProgress(task, stopped)[0].statusDetail, '任务已暂停');
});

test('审核反馈使用五项业务步骤并停留在材料完善', () => {
  const s = initial();
  const task = taskFor(s, 'maintenance-history');
  const flow = {
    ...structuredClone(s.flows['maintenance-history']),
    id: task.id,
    kind: 'feedback',
    stage: 'feedback',
    status: '等待本人处理',
    historical: false,
  };
  const progress = taskProgress(task, flow);
  assert.deepEqual(progress.map((step) => step.status), [
    'completed',
    'completed',
    'completed',
    'in_progress',
    'not_started',
  ]);
  assert.equal(progress[3].statusDetail, '等待本人处理');
});

test('专业咨询完成后五项步骤全部完成', () => {
  const s = workspaceReducer(initial(), {
    type: 'new-task',
    id: 'consult-progress',
    text: '请说明财政支付审查的办理要求',
    agentId: fiscalAgent,
    refs: [],
  });
  const flow = s.flows['consult-progress'];
  const progress = taskProgress(taskFor(s, flow.id), flow);
  assert.equal(progress.length, 5);
  assert.ok(progress.every((step) => step.status === 'completed'));
});

test('普通新任务生成五项业务进度', () => {
  const s = workspaceReducer(initial(), {
    type: 'new-task',
    id: 'generic-progress',
    text: '整理本周工作简报',
    refs: [],
  });
  const progress = taskProgress(taskFor(s, 'generic-progress'));
  assert.equal(progress.length, 5);
  assert.deepEqual(progress.map((step) => step.status), [
    'completed',
    'in_progress',
    'not_started',
    'not_started',
    'not_started',
  ]);
  assert.match(progress[0].title, /工作简报/);
});

test('任务进度只保留业务步骤并实现三态视觉', () => {
  const component = readFileSync(
    new URL('../app/fiscal-components.tsx', import.meta.url),
    'utf8',
  );
  const css = readFileSync(
    new URL('../app/visual-refinement.css', import.meta.url),
    'utf8',
  );
  const monitor = component.slice(
    component.indexOf('export function Monitor'),
    component.indexOf('export function CatalogModal'),
  );
  assert.doesNotMatch(
    monitor,
    /查看此前|提交来源|定位当前待办|安全与授权|fw-monitor-attention/,
  );
  assert.match(monitor, /任务进度/);
  assert.match(css, /text-decoration:\s*line-through/);
  assert.match(css, /fw-task-progress-spin/);
  assert.match(css, /data-reduced-motion='true'.*fw-task-progress/s);
});
