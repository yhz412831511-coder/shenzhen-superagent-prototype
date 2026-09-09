import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  canUsePersonalItem,
  formatFileSize,
  initialPersonalLibraryItems,
  knowledgeBaseContext,
  knowledgeBaseProfiles,
  personalItemContext,
} from '../app/library-domain.ts';
import {
  initialWorkspace,
  workspaceReducer,
} from '../app/fiscal-domain.ts';

test('资料库默认包含三项本地资料和三项云资料', () => {
  assert.equal(
    initialPersonalLibraryItems.filter((item) => item.storage === 'local').length,
    3,
  );
  assert.equal(
    initialPersonalLibraryItems.filter((item) => item.storage === 'cloud').length,
    3,
  );
  for (const item of initialPersonalLibraryItems) {
    assert.ok(item.name && item.location && item.source && item.modifiedAt);
    assert.ok(item.sizeLabel && item.access && item.boundaries.length >= 2);
  }
  const unavailable = initialPersonalLibraryItems.find(
    (item) => item.availability === 'reauthorize',
  );
  assert.ok(unavailable);
  assert.equal(canUsePersonalItem(unavailable), false);
  assert.equal(unavailable.summary, undefined);
  assert.equal(unavailable.preview, undefined);
});

test('知识库固定为五库结构且运维流程标识保持不变', () => {
  assert.deepEqual(
    knowledgeBaseProfiles.map((item) => item.name),
    [
      '市中台乐享知识库',
      '财政局公开库',
      '财政发展中心库',
      '全市公开信息库',
      '财政政策法规库',
    ],
  );
  assert.equal(
    knowledgeBaseProfiles.find((item) => item.name === '财政发展中心库')
      .catalogId,
    'finance-knowledge',
  );
  const catalog = initialWorkspace().catalog.filter(
    (item) => item.kind === '知识库',
  );
  assert.equal(catalog.length, 5);
  assert.deepEqual(
    new Set(catalog.map((item) => item.id)),
    new Set(knowledgeBaseProfiles.map((item) => item.catalogId)),
  );
  for (const item of knowledgeBaseProfiles) {
    assert.ok(item.level && item.sourceType && item.maintainer);
    assert.ok(item.connectionStatus && item.updatedAt && item.accessScope);
    assert.ok(item.searchableScope && item.capabilities.length >= 3);
    assert.ok(item.sourceLabel && item.boundaries.length >= 2);
  }
});

test('本地选择只增加元数据，云空间连接只形成待授权记录', () => {
  const initial = initialWorkspace(Date.parse('2026-09-09T09:00:00+08:00'));
  const localItem = {
    id: 'local-sample-1',
    name: 'sample.docx',
    storage: 'local',
    itemType: '文件',
    format: 'DOCX 文件',
    location: '本机 / 本人新选择',
    source: '本人通过资料库选择',
    modifiedAt: '2026-09-09 09:00',
    sizeLabel: '2.0 KB',
    availability: 'available',
    availabilityLabel: '本机可用',
    access: '仅本人当前工作区可读',
    summary: '已记录文件元数据，文件内容未上传。',
    recentUses: [],
    boundaries: ['只记录元数据。', '不自动上传。'],
  };
  const withLocal = workspaceReducer(initial, {
    type: 'library-add-local',
    item: localItem,
  });
  assert.deepEqual(withLocal.library.personalItems[0], localItem);
  assert.match(withLocal.notice, /文件内容未上传/);
  assert.equal(withLocal.artifacts['local-sample-1'], undefined);

  const withCloud = workspaceReducer(withLocal, {
    type: 'library-request-cloud',
    name: '个人参考资料',
    location: '财政工作 / 参考资料',
    access: '本人只读',
  });
  const cloud = withCloud.library.personalItems[0];
  assert.equal(cloud.availability, 'pending');
  assert.equal(cloud.summary, undefined);
  assert.equal(cloud.preview, undefined);
  assert.equal(canUsePersonalItem(cloud), false);
  assert.match(withCloud.notice, /完成授权后才可使用/);
});

test('个人资料和知识库形成不同任务筹码', () => {
  const personal = initialPersonalLibraryItems[0];
  const knowledge = knowledgeBaseProfiles[0];
  assert.deepEqual(personalItemContext(personal), {
    id: personal.id,
    kind: '资料',
    label: personal.name,
  });
  assert.deepEqual(knowledgeBaseContext(knowledge), {
    id: knowledge.catalogId,
    kind: '知识库',
    label: knowledge.name,
  });
  assert.equal(formatFileSize(10054), '9.8 KB');
});

test('资料库页只展示个人和知识库对象，不自动枚举任务成果', () => {
  const source = readFileSync(
    new URL('../app/fiscal-components.tsx', import.meta.url),
    'utf8',
  );
  const librarySource = source.slice(
    source.indexOf('export function Library'),
    source.indexOf('export function Automations'),
  );
  assert.match(librarySource, /个人/);
  assert.match(librarySource, /本地资料/);
  assert.match(librarySource, /云资料/);
  assert.match(librarySource, /知识库/);
  assert.equal(librarySource.includes('state.artifacts'), false);
  assert.equal(librarySource.includes('工作材料与成果'), false);
  assert.equal(librarySource.includes('本处室知识'), false);
});
