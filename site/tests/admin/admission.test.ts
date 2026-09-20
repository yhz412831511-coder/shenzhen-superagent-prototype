import test from 'node:test';
import assert from 'node:assert/strict';
import { createSafetyState } from '../../app/products/admin/admin/safety.ts';
import { getRow } from '../../app/products/admin/admin/data.ts';
import { admissionReports } from '../../app/products/admin/admin/admission.ts';

await test('准入下钻按发布版本列出性能、安全两类报告', () => {
  const s = createSafetyState();
  const evidence = admissionReports(s, getRow(s, 'AG-1'));
  assert.equal(evidence.version, '1.0');
  assert.equal(evidence.published, true);
  assert.deepEqual(
    evidence.groups.map((g) => [g.kind, g.reports[0].status]),
    [
      ['性能', '通过'],
      ['安全', '通过'],
    ],
  );
});
await test('新提交版本不替换已发布版本依据；未发布时不借用旧报告', () => {
  const s = createSafetyState(),
    row = getRow(s, 'AG-1');
  row.version = '2.0';
  assert.equal(admissionReports(s, row).version, '1.0');
  row.fields.liveVersion = '';
  const e = admissionReports(s, row);
  assert.equal(e.version, '2.0');
  assert.equal(e.published, false);
  assert.equal(e.historyCount, 2);
  assert.ok(e.groups.every((g) => g.reports.length === 0));
});
await test('缺失、失败和待复测报告保留原状态，不自动补成通过', () => {
  const s = createSafetyState();
  assert.ok(
    admissionReports(s, getRow(s, 'AG-8')).groups.every(
      (g) => !g.reports.length,
    ),
  );
  getRow(s, 'EVAL-0-安全').status = '待复测';
  getRow(s, 'EVAL-0-性能').status = '未通过';
  assert.deepEqual(
    admissionReports(s, getRow(s, 'AG-1')).groups.map(
      (g) => g.reports[0].status,
    ),
    ['未通过', '待复测'],
  );
});

await test('系统和连接器单独核对安全报告，连接正常不生成安全通过结论', () => {
  const s = createSafetyState();
  for (const page of ['systems', 'connectors']) {
    const row = s.rows.find((r) => r.page === page)!;
    const e = admissionReports(s, row);
    assert.deepEqual(
      e.groups.map((g) => g.kind),
      ['安全'],
    );
    assert.equal(e.groups[0].reports.length, 0);
    assert.equal(
      e.groups[0].title,
      page === 'systems' ? '接入安全评估报告' : '连接器安全检查报告',
    );
  }
});
