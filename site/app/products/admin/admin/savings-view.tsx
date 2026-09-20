'use client';
import { useMemo, useRef } from 'react';
import { ArrowRight, TrendingDown, RefreshCw } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Panel, Stat, Badge, token, fmt, Pick } from './ui';
import { type State, type Filters, unitName, records } from './data';
import { savingsSummary, taskTokenComparison, TOKEN_BASELINE } from './savings';
import type { Navigate } from './views';
import './savings.css';

export type SavingsViewState = {
  group: 'unit' | 'agent' | 'taskType';
  page: number;
  list: string;
  task?: string;
  snapshot?: State;
};
export const initialSavingsView = (): SavingsViewState => ({
  group: 'unit',
  page: 1,
  list: '全部任务',
});
export const signedToken = (n: number) =>
  (n < 0 ? '增加 ' : '节省 ') + token(Math.abs(n));
const pct = (n: number | null) =>
  n === null ? '—' : (Math.abs(n) * 100).toFixed(1) + '%';
export function SavingsStrip({
  state,
  filters,
  go,
}: {
  state: State;
  filters: Filters;
  go: Navigate;
}) {
  const m = useMemo(() => savingsSummary(state, filters), [state, filters]);
  return (
    <button
      className="savings-strip"
      onClick={() =>
        go('usage', undefined, { ...filters, usageView: 'savings' })
      }
    >
      <span className="savings-strip-icon">
        <TrendingDown size={24} />
      </span>
      <span>
        <small>
          {m.saved < 0 ? 'Token净增加（测算）' : '节省Token（测算）'}
        </small>
        <strong>{m.count ? token(Math.abs(m.saved)) : '—'}</strong>
      </span>
      <span>
        <small>较基准{m.saved < 0 ? '增加' : '减少'}</small>
        <b>{pct(m.rate)}</b>
      </span>
      <span>
        <small>纳入比较任务</small>
        <b>
          {fmt(m.count)} <em>项</em>
        </b>
      </span>
      <span className="savings-strip-link">
        <small>基准：全部使用 固定基准模型（样本）</small>
        <b>
          查看节省分析 <ArrowRight size={16} />
        </b>
      </span>
    </button>
  );
}
export function SavingsAnalysis({
  state: s,
  filters: f,
  go,
  view: v,
  setView,
  patchFilter,
}: {
  state: State;
  filters: Filters;
  go: Navigate;
  view: SavingsViewState;
  setView: (v: SavingsViewState) => void;
  patchFilter: (f: Partial<Filters>) => void;
}) {
  const returnFocus = useRef<HTMLElement | null>(null);
  const m = useMemo(() => savingsSummary(s, f), [s, f]);
  const update = (patch: Partial<SavingsViewState>) =>
    setView({ ...v, ...patch });
  const filtered = m.rows.filter(
    (r) =>
      v.list === '全部任务' ||
      (v.list === '已纳入比较' ? r.eligible : !r.eligible),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / 25));
  const page = Math.min(v.page, pageCount);
  const visible = filtered.slice((page - 1) * 25, page * 25);
  const trend = [...new Set(m.rows.map((r) => r.task.fields.date))]
    .sort()
    .map((date) => {
      const rows = m.eligible.filter((r) => r.task.fields.date === date);
      return {
        date,
        name: date.slice(5),
        baseline: rows.reduce((n, r) => n + r.baseline, 0),
        actual: rows.reduce((n, r) => n + r.actual, 0),
      };
    });
  const daily = f.from === f.to;
  const points = daily
    ? Array.from({ length: 24 }, (_, hour) => {
        const rows = m.eligible.filter(
          (r) => Number(r.task.fields.time.slice(11, 13)) === hour,
        );
        return {
          name: String(hour).padStart(2, '0') + ':00',
          baseline: rows.reduce((n, r) => n + r.baseline, 0),
          actual: rows.reduce((n, r) => n + r.actual, 0),
        };
      }).filter((p) => p.baseline || p.actual)
    : trend;
  const groups = new Map<
    string,
    { id: string; name: string; value: number; count: number }
  >();
  for (const r of m.eligible) {
    const id = v.group === 'unit' ? r.task.unit : r.task.fields[v.group];
    const name =
      v.group === 'unit'
        ? unitName(id, s)
        : v.group === 'agent'
          ? records(s, 'agents').find((a) => a.id === id)?.name || id
          : id;
    const row = groups.get(id) || { id, name, value: 0, count: 0 };
    row.value += r.saved;
    row.count++;
    groups.set(id, row);
  }
  const ranking = [...groups.values()].sort((a, b) => b.value - a.value);
  const detail =
    v.task && v.snapshot ? taskTokenComparison(v.snapshot, v.task) : null;
  const selectedTask = v.snapshot?.rows.find((t) => t.id === v.task);
  return (
    <div className="savings-analysis">
      <div className="metrics">
        <Stat
          label="基准用量"
          value={token(m.baseline)}
          note="相同任务全部使用 固定基准模型（样本）"
        />
        <Stat
          label="当前用量"
          value={token(m.actual)}
          note="仅纳入比较任务 · 含重试与升级"
        />
        <Stat
          label={m.saved < 0 ? 'Token净增加（测算）' : '净节省Token（测算）'}
          value={token(Math.abs(m.saved))}
          note={`${m.count}项任务纳入 · ${m.excluded}项暂未纳入`}
        />
        <Stat
          label={m.saved < 0 ? '较基准增加' : '较基准减少'}
          value={pct(m.rate)}
          note="净差额 ÷ 基准用量"
        />
      </div>
      <div className="savings-context">
        <Badge>任务级比较</Badge>
        <span>
          {f.from} 至 {f.to} ·{' '}
          {f.unit === 'all' ? '全市单位' : unitName(f.unit, s)} ·
          缓存输入不重复扣减
        </span>
      </div>
      {f.model !== 'all' && (
        <p className="savings-note">
          模型筛选选出实际使用该模型的任务；以下包含这些任务的全部模型调用。
        </p>
      )}
      <div className="savings-charts">
        <Panel
          title="Token用量对比"
          aside={<span>基准与当前 · 同一组任务</span>}
        >
          {m.count ? (
            <div className="savings-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points}>
                  <CartesianGrid strokeDasharray="3 5" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(n) => token(Number(n))} width={66} />
                  <Tooltip formatter={(n) => token(Number(n))} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="baseline"
                    name="基准Token"
                    stroke="#8b9cba"
                    fill="#edf0f5"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    name="当前Token"
                    stroke="#267bce"
                    fill="#d9eafa"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="savings-empty">当前范围暂无可比较任务</div>
          )}
        </Panel>
        <Panel
          title="节省贡献"
          aside={
            <Pick
              label="贡献排名维度"
              value={v.group}
              onChange={(group) =>
                update({ group: group as SavingsViewState['group'] })
              }
              options={[
                { value: 'unit', label: '按单位' },
                { value: 'agent', label: '按智能体' },
                { value: 'taskType', label: '按任务类型' },
              ]}
            />
          }
        >
          <div className="savings-ranks">
            {ranking.length ? (
              ranking.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => patchFilter({ [v.group]: r.id })}
                >
                  <span className="savings-rank-num">{i + 1}</span>
                  <span className="savings-rank-name">
                    {r.name}
                    <small>{r.count}项任务</small>
                    <i
                      style={{
                        width: `${Math.max(2, (Math.abs(r.value) / Math.max(1, ...ranking.map((g) => Math.abs(g.value)))) * 100)}%`,
                      }}
                    />
                  </span>
                  <b className={r.value < 0 ? 'savings-negative' : ''}>
                    {signedToken(r.value)}
                  </b>
                </button>
              ))
            ) : (
              <div className="savings-empty">当前范围暂无贡献记录</div>
            )}
          </div>
        </Panel>
      </div>
      <Panel title="节省来源" aside={<span>各项净差额之和＝净节省Token</span>}>
        <div className="savings-source-layout">
          <div className="savings-source-chart">
            {m.count ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={m.sources}
                  layout="vertical"
                  margin={{ left: 8, right: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 5" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(n) => token(Number(n))}
                  />
                  <YAxis type="category" dataKey="name" width={112} />
                  <Tooltip formatter={(n) => token(Number(n))} />
                  <ReferenceLine x={0} stroke="#66758a" />
                  <Bar
                    dataKey="value"
                    name="Token净差额"
                    fill="#267bce"
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="savings-empty">当前范围暂无节省来源记录</div>
            )}
          </div>
          <div className="savings-source-values">
            {m.sources.map((r) => (
              <div key={r.name}>
                <span>{r.name}</span>
                <b>{signedToken(r.value)}</b>
              </div>
            ))}
            <small>模型大小和缓存命中不直接换算为Token节省。</small>
          </div>
        </div>
      </Panel>
      <Panel
        title="任务对比明细"
        aside={
          <Pick
            label="比较状态筛选"
            value={v.list}
            onChange={(list) => update({ list, page: 1 })}
            options={['全部任务', '已纳入比较', '暂未纳入']}
          />
        }
      >
        <div className="table-scroll">
          <table className="savings-table">
            <thead>
              <tr>
                {[
                  '任务／单位',
                  '路由模式',
                  '基准Token',
                  '当前Token',
                  '净差额',
                  '质量与计量',
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.task.id}>
                  <td>
                    <button
                      className="record-link"
                      onClick={(event) => {
                        returnFocus.current = event.currentTarget;
                        update({
                          task: r.task.id,
                          snapshot: structuredClone(s),
                        });
                      }}
                    >
                      {r.task.name}
                    </button>
                    <small>
                      {r.task.id} · {unitName(r.task.unit, s)}
                    </small>
                  </td>
                  <td>{r.pair?.mode || r.task.fields.modelMode}</td>
                  <td>{r.pair?.baselineId ? fmt(r.baseline) : '—'}</td>
                  <td>
                    {r.calls.some((c) => !c.metered) ? '待回传' : fmt(r.actual)}
                  </td>
                  <td
                    className={
                      r.saved < 0 && r.eligible ? 'savings-negative' : ''
                    }
                  >
                    {r.eligible ? signedToken(r.saved) : '—'}
                  </td>
                  <td>
                    <Badge>{r.eligible ? '质量通过' : r.reason}</Badge>
                    <small>{r.eligible ? '计量已回传' : '暂未纳入比较'}</small>
                  </td>
                </tr>
              ))}
              {!visible.length && (
                <tr>
                  <td colSpan={6} className="savings-empty">
                    未找到符合条件的任务
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="savings-pagination">
          <span>共{filtered.length}项 · 每页25项</span>
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => update({ page: page - 1 })}
          >
            上一页
          </Button>
          <span>
            {page} / {pageCount}
          </span>
          <Button
            variant="outline"
            disabled={page >= pageCount}
            onClick={() => update({ page: page + 1 })}
          >
            下一页
          </Button>
        </div>
      </Panel>
      <details className="savings-method">
        <summary>比较基准与计量口径</summary>
        <p>
          精确计量：基准 {fmt(m.baseline)} − 当前 {fmt(m.actual)} ＝ 净节省{' '}
          {fmt(m.saved)} Token。卡片采用四舍五入显示。
        </p>
        <p>{TOKEN_BASELINE.method}</p>
        <p>
          {TOKEN_BASELINE.counting}{' '}
          重试与升级全部计入；未完成、质量未通过或计量缺失不计入净节省。安全阻断不作为节省。
        </p>
        <p>
          Token用量页包含全部已回传消耗；本页只对同一组符合条件的任务比较。不同模型的Token计数不代表相同算力或价格。
        </p>
        <p>{TOKEN_BASELINE.provenance}</p>
        <p>
          {TOKEN_BASELINE.source} · 样本日期 {TOKEN_BASELINE.verified}
          <br />
          版本：{TOKEN_BASELINE.revision}
        </p>
      </details>
      <Sheet
        open={!!detail}
        onOpenChange={(open) => {
          if (!open) update({ task: undefined, snapshot: undefined });
        }}
      >
        <SheetContent className="savings-sheet" finalFocus={returnFocus}>
          <SheetHeader>
            <SheetTitle>任务路由与Token对比</SheetTitle>
            <SheetDescription>
              {selectedTask?.name} · {v.task}
            </SheetDescription>
          </SheetHeader>
          {detail && (
            <div className="savings-detail-body">
              <div className="savings-detail-top">
                <Badge>
                  {detail.eligible ? '已纳入比较' : detail.excludedReason}
                </Badge>
                <Button variant="outline" onClick={() => go('tasks', v.task)}>
                  查看任务运行 <ArrowRight size={14} />
                </Button>
              </div>
              {v.snapshot?.revision !== s.revision && (
                <div className="savings-new">
                  有新记录，当前仍显示查看时快照。
                  <Button
                    variant="outline"
                    onClick={() => update({ snapshot: structuredClone(s) })}
                  >
                    <RefreshCw size={14} />
                    刷新记录
                  </Button>
                </div>
              )}
              <div className="savings-path">
                <div>
                  <small>基准流程</small>
                  <b>全部使用 固定基准模型（样本）</b>
                  <strong>
                    {detail.steps.map((p) => p.name).join(' → ') ||
                      '记录待补齐'}
                  </strong>
                  <span>{fmt(detail.baselineTokens)} Token</span>
                </div>
                <div>
                  <small>当前流程 · {detail.mode}</small>
                  <b>
                    {detail.steps.map((p) => p.level).join(' → ') || '未触发'}
                  </b>
                  <strong>
                    {detail.steps
                      .map((p) =>
                        p.level === 'L0'
                          ? '授权结果复用'
                          : p.modelName ||
                            s.rows.find((m) => m.id === p.model)?.name ||
                            p.model,
                      )
                      .join(' → ')}
                  </strong>
                  <span>
                    {fmt(detail.actualTokens)} Token ·{' '}
                    {detail.savedTokens === null
                      ? '暂未纳入比较'
                      : signedToken(detail.savedTokens)}
                  </span>
                </div>
              </div>
              {detail.steps.map((step) => (
                <section className="savings-step" key={step.id}>
                  <div className="savings-step-title">
                    <b>{step.name}</b>
                    <Badge>
                      {step.level} · {step.status}
                    </Badge>
                  </div>
                  <p>{step.reason}</p>
                  <div className="savings-step-values">
                    <span>
                      基准输入 <b>{fmt(step.baseline.input)}</b> ／ 输出{' '}
                      <b>{fmt(step.baseline.output)}</b>
                    </span>
                    <span>
                      当前输入 <b>{fmt(step.input)}</b> ／ 输出{' '}
                      <b>{fmt(step.output)}</b>
                    </span>
                    <b>
                      {step.status === '完成'
                        ? signedToken(step.saved)
                        : '等待执行'}
                    </b>
                  </div>
                  <small>
                    {step.id} ·{' '}
                    {step.level === 'L0'
                      ? '不调用生成模型'
                      : `${step.modelName || step.model} · ${step.modelVersion || '执行版本待记录'}`}
                  </small>
                  {step.calls.map((c) => (
                    <div className="savings-call" key={c.id}>
                      <span>
                        {c.id} · {c.status}
                      </span>
                      <span>
                        {c.metered
                          ? `输入 ${fmt(c.input)} ／ 输出 ${fmt(c.output)} ／ 缓存输入 ${fmt(c.cached)}（已包含）`
                          : '计量待回传'}
                      </span>
                      <small>
                        计量回执：{c.metered ? 'METER-' + c.id : '待回传'}
                      </small>
                    </div>
                  ))}
                  <small>
                    执行回执：{step.receipt || '待补齐'} · 安全检查：
                    {step.checkId || '历史检查见任务安全链'}
                  </small>
                </section>
              ))}
              <p className="savings-note">
                质量核对：{detail.quality || '待核对'} ·{' '}
                {v.snapshot?.comparisons?.[v.task!]?.qualityReceipt || '待回执'}
                <br />
                {v.snapshot?.comparisons?.[v.task!]?.basis}
              </p>
              <details className="savings-method">
                <summary>本任务比较依据</summary>
                <p>{TOKEN_BASELINE.method}</p>
                <p>{TOKEN_BASELINE.counting}</p>
                <p>{TOKEN_BASELINE.provenance}</p>
                <p>基准版本 {TOKEN_BASELINE.revision}</p>
              </details>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
