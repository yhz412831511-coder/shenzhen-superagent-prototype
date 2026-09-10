export type WorkspaceTarget =
  | { kind: 'system' | 'artifact' | 'operation' | 'operation-group' | 'capability' | 'file'; id: string; annotationId?: string }
  | { kind: 'brainstorm'; id: string; entity: 'role' | 'topic' | 'conflict' | 'fact' | 'review'; annotationId?: string };
export type BrowserTab = { id: string; history: WorkspaceTarget[]; cursor: number };
export type Annotation = {
  id: string; target: WorkspaceTarget; title: string; version: string;
  mode: '文字' | '元素' | '区域'; quote: string; location: string; text: string;
  x: number; y: number; width: number; height: number;
};
export type SandboxFile = { path: string; data: number[]; mime: string };
export const targetKey = (target: WorkspaceTarget) => target.kind === 'brainstorm' ? `${target.kind}:${target.entity}:${target.id}` : `${target.kind}:${target.id}`;
export function openBrowserTarget(tabs: BrowserTab[], target: WorkspaceTarget) {
  const existing = tabs.find(tab => tab.history[tab.cursor] && targetKey(tab.history[tab.cursor]) === targetKey(target));
  if (existing) return { tabs, active: existing.id };
  const id = 'tab-' + targetKey(target);
  const uniqueId = tabs.some(t => t.id === id) ? id + '-' + Date.now() : id;
  return { tabs: [...tabs, { id: uniqueId, history: [target], cursor: 0 }], active: uniqueId };
}
export function navigateTab(tab: BrowserTab, target: WorkspaceTarget): BrowserTab {
  return { ...tab, history: [...tab.history.slice(0, tab.cursor + 1), target], cursor: tab.cursor + 1 };
}
export function annotationsText(notes: Annotation[]) {
  return '请协助处理以下标注意见：\n\n' + notes.map((n, i) =>
    (i + 1) + '. ' + n.title + '（' + n.version + '）\n定位：' + n.mode + ' · ' + n.location + '\n引用：' + (n.quote || '框选区域') + '\n意见：' + n.text
  ).join('\n\n');
}
export function safeFilename(name: string) { return Array.from(name).map(c => c.charCodeAt(0) < 32 || c === '/' || c === '\\' ? '_' : c).join('').replace(/^\.+/, '_') || '未命名'; }
export function validSandboxPath(path: string) {
  return path.startsWith('/task/') && !path.split('/').some(p => p === '..' || p === '.') && !path.includes('\0');
}
