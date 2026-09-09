import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('首页与任务续聊共用完整输入器壳体', () => {
  const component = read('../app/task-composer.tsx');

  assert.match(component, /className="task-composer"/);
  assert.match(component, /data-variant=\{variant\}/);
  assert.match(component, /className="task-composer__context-row"/);
  assert.match(component, /className="task-composer__input"/);
  assert.match(component, /className="task-composer__toolbar-left"/);
  assert.match(component, /className="task-composer__toolbar-right"/);
  assert.match(component, /className="task-composer__send"/);
  assert.doesNotMatch(component, /composer-shell/);
});

test('输入器使用完整圆角、克制焦点和统一尺寸', () => {
  const css = read('../app/visual-refinement.css');

  assert.match(
    css,
    /\.task-composer\s*\{[^}]*overflow:\s*clip[^}]*border-radius:\s*14px[^}]*background:\s*var\(--ui-raised\)/s,
  );
  assert.match(
    css,
    /\.task-composer\[data-variant='large'\]\s*\{[^}]*border-radius:\s*16px/s,
  );
  assert.match(
    css,
    /\.task-composer:focus-within\s*\{[^}]*0 0 0 3px var\(--ui-brand-soft\)/s,
  );
  assert.match(
    css,
    /\.task-composer__input\s*\{[^}]*height:\s*50px[^}]*font-size:\s*var\(--conversation-font-body\)/s,
  );
  assert.match(
    css,
    /\.task-composer\[data-variant='large'\] \.task-composer__input\s*\{[^}]*height:\s*84px/s,
  );
  assert.match(
    css,
    /\.task-composer__toolbar\s*\{[^}]*min-height:\s*42px[^}]*flex-wrap:\s*nowrap/s,
  );
});

test('移动端工具栏保持触控尺寸并在极窄宽度整组换行', () => {
  const css = read('../app/visual-refinement.css');

  assert.match(
    css,
    /@media \(max-width:\s*700px\)[\s\S]*?\.task-composer__toolbar \[data-slot='button'\]\s*\{[^}]*min-height:\s*44px/s,
  );
  assert.match(
    css,
    /@media \(max-width:\s*359px\)[\s\S]*?\.task-composer__toolbar\s*\{[^}]*flex-wrap:\s*wrap/s,
  );
  assert.match(
    css,
    /@media \(max-width:\s*359px\)[\s\S]*?\.task-composer__toolbar-left,[\s\S]*?width:\s*100%/s,
  );
});

test('输入器旧外壳规则已从全局样式中移除', () => {
  const css = [
    read('../app/globals.css'),
    read('../app/fiscal.css'),
    read('../app/visual-refinement.css'),
  ].join('\n');
  const dropdown = read('../components/ui/dropdown-menu.tsx');

  assert.doesNotMatch(css, /composer-shell/);
  assert.match(dropdown, /<MenuPrimitive\.Portal>/);
});
