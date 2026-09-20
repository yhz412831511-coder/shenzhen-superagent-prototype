import { records, type Row, type State } from './data.ts';

/** Published evidence stays bound to the live version, even during a new submission. */
export function admissionReports(s: State, row: Row) {
  const version = row.fields.liveVersion || row.version;
  const all = records(s, 'evaluations').filter(
    (e) => e.fields.target === row.id,
  );
  return {
    version,
    published: !!row.fields.liveVersion,
    historyCount: all.filter((e) => e.fields.targetVersion !== version).length,
    groups: (row.page === 'systems' || row.page === 'connectors'
      ? ['安全']
      : ['性能', '安全']
    ).map((kind) => ({
      kind,
      title:
        row.page === 'systems'
          ? '接入安全评估报告'
          : row.page === 'connectors'
            ? '连接器安全检查报告'
            : `${kind}评测报告`,
      reports: all.filter(
        (e) => e.fields.targetVersion === version && e.fields.kind === kind,
      ),
    })),
  };
}
