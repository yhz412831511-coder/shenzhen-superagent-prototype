import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('首页使用左对齐任务入口并移除装饰机器人图标', () => {
  const component = read('../app/fiscal-workbench.tsx');

  assert.match(component, /<header className="fw-home-intro">/);
  assert.match(component, /className="fw-home-kicker">你好，林思远/);
  assert.match(component, /className="fw-recents-list"/);
  assert.match(component, /className="fw-recent-task"/);
  assert.doesNotMatch(component, /className="fw-home-icon"/);
});

test('首页保持原任务数据与打开行为', () => {
  const component = read('../app/fiscal-workbench.tsx');

  assert.match(component, /\{filteredTasks\.map\(\(t\) => \(/);
  assert.match(component, /onClick=\{\(\) => openTask\(t\.id\)\}/);
  assert.match(component, /folder \? '项目内的工作' : '最近的工作'/);
  assert.match(component, /\{!folder && composer\(true\)\}/);
});

test('一级能力目录保持确认名称并为专业智能使用独立页面', () => {
  const component = read('../app/fiscal-workbench.tsx');

  assert.match(component, /\{ id: 'agents', title: '专业智能', icon: Bot \}/);
  assert.match(component, /\{ id: 'skills', title: '工作技能', icon: Zap \}/);
  assert.match(
    component,
    /\{ id: 'extensions', title: '系统与工具', icon: PlugZap \}/,
  );
  assert.match(
    component,
    /page === 'agents'[\s\S]*?<ProfessionalIntelligencePage/,
  );
  assert.match(component, /\['skills', 'extensions'\]\.includes\(page\)/);
  assert.match(component, /page === 'skills' \? 'Skill' : '插件'/);
});

test('首页采用任务指挥界面的尺寸与连续清单', () => {
  const css = read('../app/visual-refinement.css');

  assert.match(css, /\.fw-home-inner\s*\{[^}]*width:\s*min\(100%, 940px\)/s);
  assert.match(css, /\.fw-home-intro\s*\{[^}]*text-align:\s*left/s);
  assert.match(
    css,
    /\.fw-home-intro h1\s*\{[^}]*font-size:\s*24px[^}]*font-weight:\s*600/s,
  );
  assert.match(
    css,
    /\.fw-recent-task\s*\{[^}]*min-height:\s*54px[^}]*grid-template-columns:\s*28px minmax\(0, 1fr\) 16px/s,
  );
  assert.match(
    css,
    /\.fw-recent-copy strong,[\s\S]*?text-overflow:\s*ellipsis[\s\S]*?white-space:\s*nowrap/s,
  );
});

test('首页移动端使用16px边距和22px标题', () => {
  const css = read('../app/visual-refinement.css');

  assert.match(
    css,
    /@media \(max-width:\s*700px\)[\s\S]*?\.fw-home\s*\{[^}]*padding:\s*24px 16px 32px/s,
  );
  assert.match(
    css,
    /@media \(max-width:\s*700px\)[\s\S]*?\.fw-home-intro h1\s*\{[^}]*font-size:\s*22px/s,
  );
});

test('旧首页视觉覆盖已从基础样式表清理', () => {
  const css = read('../app/fiscal.css');

  assert.doesNotMatch(css, /\.fw-home-greeting/);
  assert.doesNotMatch(css, /\.fw-home-icon/);
  assert.doesNotMatch(css, /\.fw-recents\s*>\s*button/);
});
