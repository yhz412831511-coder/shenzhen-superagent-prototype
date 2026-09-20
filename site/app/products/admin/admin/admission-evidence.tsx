import type { Row, State } from './data';
import type { PageId } from './catalog';
import { admissionReports } from './admission';
import { Badge } from './ui';

export function AdmissionEvidence({
  state,
  row,
  openPage,
}: {
  state: State;
  row: Row;
  openPage: (page: PageId, id?: string) => void;
}) {
  const evidence = admissionReports(state, row);
  if (
    !['systems', 'agents', 'skills', 'plugins', 'connectors'].includes(row.page)
  )
    return null;
  if (
    !['systems', 'agents', 'connectors'].includes(row.page) &&
    !evidence.groups.some((g) => g.reports.length)
  )
    return null;
  return (
    <section
      className="admission-reports"
      aria-label={`${row.name}准入评测依据`}
    >
      <div className="admission-report-heading">
        <b>
          {row.page === 'systems' || row.page === 'connectors'
            ? '安全准入依据'
            : evidence.published
              ? '发布版本依据'
              : '待发布版本评测'}{' '}
          · v{evidence.version}
        </b>
        {evidence.published && row.version !== evidence.version && (
          <small>另有提交版本 v{row.version}，评测单独核对</small>
        )}
      </div>
      {evidence.groups.map(({ kind, title, reports }) => (
        <div key={kind} className="admission-report-group">
          {reports.length ? (
            reports.map((report) => (
              <details key={report.id}>
                <summary>
                  <span>{title}</span>
                  <Badge>{report.status}</Badge>
                  <span className="admission-report-expand">查看报告</span>
                </summary>
                <div className="admission-report-content">
                  <dl>
                    <div>
                      <dt>报告编号</dt>
                      <dd>{report.id}</dd>
                    </div>
                    <div>
                      <dt>受测版本</dt>
                      <dd>v{report.fields.targetVersion}</dd>
                    </div>
                    <div>
                      <dt>测试集</dt>
                      <dd>{report.fields.testSet || '记录待补齐'}</dd>
                    </div>
                    <div>
                      <dt>评测日期</dt>
                      <dd>{report.fields.date || '记录待补齐'}</dd>
                    </div>
                    <div>
                      <dt>责任岗位</dt>
                      <dd>{report.fields.owner || '待分派'}</dd>
                    </div>
                  </dl>
                  <p>
                    <b>评测结论：</b>
                    {report.fields.report || '报告尚未生成'}
                  </p>
                  <p>
                    <b>未通过项：</b>
                    {report.fields.failures || '记录待补齐'}
                  </p>
                  {report.fields.rectification && (
                    <p>
                      <b>整改记录：</b>
                      {report.fields.rectification}
                    </p>
                  )}
                  <button onClick={() => openPage('evaluations', report.id)}>
                    进入评测管理 →
                  </button>
                </div>
              </details>
            ))
          ) : (
            <div className="admission-report-missing">
              <span>{title}</span>
              <Badge>待补齐</Badge>
            </div>
          )}
        </div>
      ))}
      {evidence.historyCount > 0 && (
        <small>
          其他版本报告 {evidence.historyCount} 份，不作为 v{evidence.version}{' '}
          的准入依据。
          <button onClick={() => openPage(row.page, row.id)}>
            查看版本记录
          </button>
        </small>
      )}
    </section>
  );
}
