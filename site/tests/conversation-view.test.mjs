import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  conversationTurns,
  turnText,
  operationTitle,
  confirmationResolution,
} from '../app/conversation-view.ts';
import {
  initialWorkspace,
  workspaceReducer,
  taskFor,
} from '../app/fiscal-domain.ts';
const initial = () => initialWorkspace(Date.parse('2026-09-08T09:00:00+08:00'));
test('连续助手事件属于一轮，用户与系统事件形成边界，所有原始锚点保留', () => {
  const s = initial();
  for (const task of s.memory.tasks) {
    const turns = conversationTurns(
      task,
      s.flows[task.id]?.operations,
      Object.values(s.artifacts),
    );
    assert.deepEqual(
      turns.flatMap((t) => t.blocks.map((b) => b.message.id)),
      task.messages.map((m) => m.id),
    );
    for (let i = 1; i < turns.length; i++)
      assert.ok(
        !(turns[i].role === 'assistant' && turns[i - 1].role === 'assistant'),
      );
    assert.equal(new Set(turns.map((t) => t.id)).size, turns.length);
  }
});
test('截图中的穿透核查、正文、成果生成和结果正文连续显示，文件归属该轮', () => {
  const s = initial(),
    f = Object.values(s.flows).find((f) => f.kind === 'payment'),
    task = taskFor(s, f.id);
  const turns = conversationTurns(
    task,
    f.operations,
    Object.values(s.artifacts),
  );
  const turn = turns.find((t) =>
    t.blocks.some((b) => b.operation?.cmd === 'check-rules'),
  );
  assert.deepEqual(
    turn.blocks.filter((b) => b.operation).map((b) => b.operation.cmd),
    ['check-rules', 'report'],
  );
  assert.equal(turn.artifacts.length, 2);
  assert.match(turnText(turn), /财政穿透式监管系统返回/);
  assert.match(turnText(turn), /审查结果已生成/);
  assert.ok(!turnText(turn).includes('本次确认的两笔申请，核对信息完整性'));
});
test('7份成果逐一关联产生事件，跨任务或失联成果不混入对话', () => {
  const s = initial();
  for (const art of Object.values(s.artifacts)) {
    const task = taskFor(s, art.taskId);
    assert.ok(task.messages.some((m) => m.id === art.originMessageId));
    assert.equal(
      conversationTurns(task, s.flows[task.id].operations, [art]).flatMap(
        (t) => t.artifacts,
      ).length,
      1,
    );
    assert.equal(
      conversationTurns(task, [], [{ ...art, taskId: 'other' }]).flatMap(
        (t) => t.artifacts,
      ).length,
      0,
    );
    assert.equal(
      conversationTurns(
        task,
        [],
        [{ ...art, originMessageId: 'missing' }],
      ).flatMap((t) => t.artifacts).length,
      0,
    );
  }
});
test('显示转换不会改写历史事件、授权、回执或业务状态', () => {
  const s = initial(),
    copy = JSON.stringify(s);
  for (const t of s.memory.tasks)
    conversationTurns(t, s.flows[t.id]?.operations, Object.values(s.artifacts));
  assert.equal(JSON.stringify(s), copy);
});
test('未知或失败执行摘要不宣称已执行，成功操作保留独立风险和回执', () => {
  const op = { cmd: 'writeback', scope: 'scope', status: '待核实' };
  assert.equal(operationTitle(op), '写入智慧财政草稿箱');
  assert.equal(
    operationTitle({ ...op, status: '成功' }),
    '已写入智慧财政草稿箱',
  );
});
test('重演中新成果仍与实际执行事件关联，不借用历史来源', () => {
  let s = workspaceReducer(initial(), { type: 'replay', kind: 'payment' });
  for (const cmd of [
    'read-payments',
    'review',
    'confirm-findings',
    'check-rules',
    'report',
  ])
    s = workspaceReducer(s, { type: 'command', taskId: 'replay-payment', cmd });
  const f = s.flows['replay-payment'];
  for (const id of f.artifactIds) {
    const a = s.artifacts[id];
    assert.ok(f.operations.some((o) => o.messageId === a.originMessageId));
  }
});
const palettes = JSON.parse(
  fs.readFileSync(
    new URL('../app/visual-tokens.json', import.meta.url),
    'utf8',
  ),
);
function luminance(h) {
  const rgb = [1, 3, 5]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function ratio(a, b) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
for (const name of ['light', 'dark'])
  test(name + '主题正文、辅助信息、操作色和状态色均达到4.5:1', () => {
    const p = palettes[name];
    for (const fg of ['text', 'muted', 'brand'])
      for (const bg of [
        'surface',
        'canvas',
        'side-surface',
        'raised',
        'hover',
        'bubble',
      ])
        assert.ok(
          ratio(p[fg], p[bg]) >= 4.5,
          `${fg}/${bg}: ${ratio(p[fg], p[bg])}`,
        );
    for (const color of ['brand', 'success', 'warning', 'danger'])
      assert.ok(ratio(p[color], p[color + '-soft']) >= 4.5, color);
    assert.ok(ratio(p.brand, p['on-brand']) >= 4.5);
    assert.ok(
      ratio(p.surface, p['side-surface']) >= 1.06,
      `surface/side-surface: ${ratio(p.surface, p['side-surface'])}`,
    );
    for (const fg of ['workspace-text', 'workspace-muted', 'workspace-brand'])
      for (const bg of [
        'workspace-center',
        'workspace-side',
        'workspace-raised',
      ])
        assert.ok(
          ratio(p[fg], p[bg]) >= 4.5,
          `${fg}/${bg}: ${ratio(p[fg], p[bg])}`,
        );
    for (const fg of ['success', 'warning', 'danger'])
      for (const bg of [
        'workspace-center',
        'workspace-side',
        'workspace-raised',
      ])
        assert.ok(
          ratio(p[fg], p[bg]) >= 4.5,
          `${fg}/${bg}: ${ratio(p[fg], p[bg])}`,
        );
  });

test('工作台强聚焦配色保持浅色侧栏更深、深色侧栏更亮', () => {
  const light = palettes.light;
  const dark = palettes.dark;
  assert.ok(
    luminance(light['workspace-side']) < luminance(light['workspace-center']),
    '浅色工作台侧栏应比主内容区更深',
  );
  assert.ok(
    luminance(dark['workspace-side']) > luminance(dark['workspace-center']),
    '深色工作台侧栏应比主内容区更亮',
  );
  assert.ok(ratio(light['workspace-side'], light['workspace-center']) >= 1.25);
  assert.ok(ratio(dark['workspace-side'], dark['workspace-center']) >= 1.4);
});

test('工作台全部页面共享同一表面层级', () => {
  const workbench = fs.readFileSync(
    new URL('../app/fiscal-workbench.tsx', import.meta.url),
    'utf8',
  );
  const refinement = fs.readFileSync(
    new URL('../app/visual-refinement.css', import.meta.url),
    'utf8',
  );
  const memoryPage = fs.readFileSync(
    new URL('../app/memory-page.tsx', import.meta.url),
    'utf8',
  );
  const settingsPage = fs.readFileSync(
    new URL('../app/settings-page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(workbench, /fw-app fw-page-\$\{page\}/);
  assert.doesNotMatch(workbench, /fw-task-page/);
  assert.match(
    refinement,
    /\.fw-app\s*\{[\s\S]*--ui-center:\s*var\(--ui-workspace-center\)/,
  );
  assert.match(
    refinement,
    /\.fw-app\s+:is\(\s*\.fw-sidebar,[\s\S]*background:\s*var\(--ui-side\)/,
  );
  assert.match(
    refinement,
    /\.fw-app\s+:is\(\.fw-main,[\s\S]*background:\s*var\(--ui-center\)/,
  );
  assert.match(refinement, /\.fw-library-list-pane/);
  assert.match(memoryPage, /fw-memory-list-pane/);
  assert.match(memoryPage, /fw-memory-detail-pane/);
  assert.match(settingsPage, /fw-settings-page/);
  assert.match(settingsPage, /fw-settings-content/);
  assert.match(settingsPage, /data-settings-nav/);
});

test('工作台抬升控件和纸张预览各自保持正确表面', () => {
  const refinement = fs.readFileSync(
    new URL('../app/visual-refinement.css', import.meta.url),
    'utf8',
  );
  assert.match(
    refinement,
    /\.fw-app :is\(\.fw-nav-search,[\s\S]*background:\s*var\(--ui-raised\)/,
  );
  assert.match(
    refinement,
    /\.fw-app :is\(\.fw-catalog-list > button, \.fw-auto-item\)/,
  );
  assert.match(refinement, /\.fw-paper\s*\{[^}]*background:\s*#ffffff;/s);
});

test('历史确认请求关联后续执行，显示已确认但保留原始鉴权记录', () => {
  let s = workspaceReducer(initial(), { type: 'replay', kind: 'payment' });
  s = workspaceReducer(s, {
    type: 'memory',
    action: {
      type: 'task-settings',
      taskId: 'replay-payment',
      settings: { permissionMode: 'confirm' },
    },
  });
  s = workspaceReducer(s, {
    type: 'command',
    taskId: 'replay-payment',
    cmd: 'read-payments',
  });
  const before = s.flows['replay-payment'];
  assert.equal(
    confirmationResolution(before.operations[0], before.operations),
    undefined,
  );
  s = workspaceReducer(s, { ...before.pending, confirmed: true });
  const ops = s.flows['replay-payment'].operations;
  assert.equal(confirmationResolution(ops[0], ops)?.id, ops[1].id);
  assert.equal(ops[0].status, '待确认');
});
