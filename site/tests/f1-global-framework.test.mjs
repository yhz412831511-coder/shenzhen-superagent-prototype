import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('新对话支持选择项目或保持独立，并在创建时记录项目归属', () => {
  const source = read('../app/fiscal-workbench.tsx');

  assert.match(source, /不在项目中工作/);
  assert.match(source, /placeholder="搜索项目"/);
  assert.match(source, /state\.folders\.map\(\(name\) =>/);
  assert.ok(source.includes("type: 'folder'"));
  assert.ok(source.includes('taskId: id'));
  assert.match(source, /<span>项目<\/span>/);
  assert.match(source, /aria-expanded=\{projectsOpen\}/);
  assert.match(
    source,
    /aria-label=\{`\$\{expanded \? '收起' : '展开'\}项目\$\{name\}`\}/,
  );
  assert.match(source, /<span>最近对话<\/span>/);
});

test('能力扩展第一层包含四类对象且各类共用全部与已获取视图', () => {
  const source = read('../app/fiscal-workbench.tsx');
  const catalog = read('../app/fiscal-components.tsx');
  const agents = read('../app/professional-intelligence-page.tsx');

  for (const label of ['智能体', '技能', '插件', '连接器']) {
    assert.ok(source.includes(`'${label}'`));
  }
  assert.match(source, />\s*全部\s*<\/button>/);
  assert.match(source, />\s*已获取\s*<\/button>/);
  assert.match(source, /ownedOnly=\{ownedOnly\}/);
  assert.ok(catalog.includes('ownedOnly ?? mine'));
  assert.ok(agents.includes('!ownedOnly || item.owned'));
});

test('我的知识以本地、云端和知识库为第一层并保持知识库只读介绍边界', () => {
  const source = read('../app/fiscal-components.tsx');

  for (const label of ['本地', '云端', '知识库']) {
    assert.ok(source.includes(`'${label}'`));
  }
  assert.match(source, /当前可见的知识库/);
  assert.match(source, /此页只查看内容介绍，不会自动选用知识库/);
  assert.doesNotMatch(source, /使用该知识库新建任务/);
});
