'use client';
import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Activity,
  Server,
  Users,
  Building2,
  Boxes,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Panel, Badge, token, fmt } from './ui';
import {
  records,
  unitName,
  number,
  type State,
  type Filters,
  type Row,
} from './data';
import {
  safetySummary,
  connectorReady,
  publishedPassed,
  taskSafetyChain,
} from './safety';
import type { Navigate } from './views';
import type { PageId } from './catalog';
import './overview.css';
import { SavingsStrip } from './savings-view';
import { AdmissionEvidence } from './admission-evidence';

export type OverviewFocus = {
  title: string;
  kind: string;
  risk?: string;
  ids: string[];
  snapshot: State;
  filter: Filters;
  task?: string;
  open: boolean;
};
type Props = {
  state: State;
  filters: Filters;
  go: Navigate;
  paused: boolean;
  focus: OverviewFocus | null;
  onFocus: (v: OverviewFocus | null) => void;
};
const stageNames = ['任务进入', '安全检查', '受控执行', '结果完成'];
const boxStates = ['运行中', '闲置', '异常', '已隔离', '已停止', '已回收'];
const outcomes = [
  ['允许', '允许执行'],
  ['脱敏', '脱敏后执行'],
  ['转人工确认', '等待确认'],
  ['阻断', '已阻断'],
];
export const alertStage = (r: Row) =>
  r.status === '已关闭'
    ? '已关闭'
    : r.status === '待处理'
      ? '待领取'
      : r.status === '待复测' || r.status === '待复核' || r.status === '待恢复'
        ? '待复核'
        : r.status === '待整改'
          ? '整改中'
          : '核查中';
const color = (v: string) =>
  /阻断|高|异常|未通过/.test(v)
    ? 'danger'
    : /等待|确认|隔离|待|受限|中风险/.test(v)
      ? 'warn'
      : /完成|通过|允许|运行|可用|低风险/.test(v)
        ? 'good'
        : 'neutral';
function Distribution({
  items,
  onSelect,
}: {
  items: { name: string; count: number }[];
  onSelect: (name: string) => void;
}) {
  const total = items.reduce((a, b) => a + b.count, 0);
  return (
    <>
      <div className="v3-distribution" aria-label="状态占比">
        {items
          .filter((i) => i.count > 0)
          .map((i) => (
            <button
              key={i.name}
              title={`${i.name} ${i.count}`}
              aria-label={`${i.name} ${i.count}条`}
              className={color(i.name)}
              style={{ flex: i.count }}
              onClick={() => onSelect(i.name)}
            />
          ))}
      </div>
      <div className="v3-legend">
        {items.map((i) => (
          <button key={i.name} onClick={() => onSelect(i.name)}>
            <i className={color(i.name)} />
            {i.name}
            <b>{i.count}</b>
          </button>
        ))}
      </div>
      {!total && <span className="v3-muted">当前范围暂无记录</span>}
    </>
  );
}
function SuccessGauge({
  percent,
  success,
  total,
  onClick,
}: {
  percent: number;
  success: number;
  total: number;
  onClick: () => void;
}) {
  const value = Math.max(0, Math.min(100, percent));
  return (
    <button
      className="v3-success-gauge"
      aria-label={`调用成功率 ${value.toFixed(1)}%，${success} / ${total} 次`}
      onClick={onClick}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="v3-gauge-track" cx="60" cy="60" r="44" />
        <circle
          className="v3-gauge-value"
          cx="60"
          cy="60"
          r="44"
          pathLength="100"
          style={{ strokeDashoffset: 100 - value }}
        />
      </svg>
      <span className="v3-gauge-copy">
        <strong>{value.toFixed(1)}%</strong>
        <small>
          {fmt(success)} / {fmt(total)} 次
        </small>
      </span>
    </button>
  );
}
function SafetyGauge({ value, total }: { value: number; total: number }) {
  const percent = total ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;
  return (
    <div
      className="v3-safety-gauge"
      aria-label={`允许执行占比 ${percent.toFixed(1)}%`}
    >
      <svg viewBox="0 0 140 86" aria-hidden="true">
        <path className="v3-gauge-track" d="M18 72a52 52 0 0 1 104 0" />
        <path
          className="v3-gauge-value"
          d="M18 72a52 52 0 0 1 104 0"
          pathLength="100"
          style={{ strokeDashoffset: 100 - percent }}
        />
      </svg>
      <strong>{percent.toFixed(1)}%</strong>
      <small>
        允许执行占比 · {fmt(value)} / {fmt(total)}
      </small>
    </div>
  );
}
export function SafetyOverview({
  state: s,
  filters: f,
  go,
  paused,
  focus,
  onFocus,
}: Props) {
  const m = safetySummary(s, f),
    period = f.from === f.to ? '今日' : '近7日';
  const explain = (title: string, kind: string, ids: string[], task?: string) =>
    onFocus({
      title,
      kind,
      risk: kind.startsWith('risk:')
        ? kind.slice(5)
        : kind === 'controls'
          ? focus?.risk
          : undefined,
      ids,
      snapshot: structuredClone(s),
      filter: { ...f },
      task,
      open: true,
    });
  const scoped = (r: Row) =>
    f.unit === 'all' || r.unit === f.unit || r.unit === 'all';
  const focusTask = focus?.task
    ? records(s, 'tasks').find((t) => t.id === focus.task)
    : undefined;
  const isRelated = (ids: string[]) =>
    !!focusTask &&
    ids.some((id) => Object.values(focusTask.fields).includes(id));
  const high = m.alerts.filter(
    (a) => a.status !== '已关闭' && a.fields.level === '高危',
  );
  const awaiting = m.alerts.filter(
    (a) => a.status !== '已关闭' && a.fields.restriction !== '已限制',
  );
  const abnormal = m.boxes.filter((b) => b.status === '异常');
  const scales = [
    {
      label: '待审批席位申请',
      value: m.scale.requests,
      unit: '单',
      ids: records(s, 'applications')
        .filter((r) => scoped(r) && r.status === '待审批')
        .map((r) => r.id),
      Icon: AlertTriangle,
      tone: 'danger',
    },
    {
      label: '已开通席位',
      value: fmt(m.scale.opened),
      unit: '个',
      ids: records(s, 'seats')
        .filter(scoped)
        .map((r) => r.id),
      Icon: ShieldCheck,
      tone: 'blue',
    },
    {
      label: period + '使用人数',
      value: m.scale.active,
      unit: '人',
      ids: m.tasks.map((r) => r.id),
      Icon: Users,
      tone: 'cyan',
    },
    {
      label: '已上线专业智能体',
      value: m.scale.agents,
      unit: '个',
      ids: m.agents.filter((r) => r.fields.enabled === '是').map((r) => r.id),
      Icon: Boxes,
      tone: 'good',
    },
    {
      label: period + '调用次数',
      value: fmt(m.calls.length),
      unit: '次',
      ids: m.calls.map((r) => r.id),
      Icon: Activity,
      tone: 'cyan',
    },
    {
      label: period + 'Token用量',
      value: token(m.scale.input + m.scale.output),
      unit: '',
      ids: m.calls.filter((c) => c.type === '模型请求').map((r) => r.id),
      Icon: Server,
      tone: 'warn',
    },
  ];
  const buckets =
    f.from === f.to
      ? Array.from({ length: 8 }, (_, i) => ({
          label: `${String(i + 3).padStart(2, '0')}:00`,
          match: (c: State['calls'][number]) => c.hour === i + 3,
        }))
      : Array.from({ length: 7 }, (_, i) => ({
          label: `09-${String(i + 2).padStart(2, '0')}`,
          match: (c: State['calls'][number]) =>
            c.date === `2026-09-${String(i + 2).padStart(2, '0')}`,
        }));
  const trend = buckets.map((b) => {
    const cc = m.calls.filter(b.match),
      ok = cc.filter((c) => c.status === '成功');
    return {
      time: b.label,
      calls: cc.length,
      seconds: ok.length
        ? Number(
            (ok.reduce((n, c) => n + c.duration, 0) / ok.length / 1000).toFixed(
              2,
            ),
          )
        : null,
      ids: cc.map((c) => c.id),
    };
  });
  const stageTasks = (stage: string) =>
    (['任务进入', '安全检查', '受控执行'].includes(stage)
      ? records(s, 'tasks').filter(scoped)
      : m.tasks
    ).filter((t) => t.fields.stage === stage);
  const admission = [
    {
      name: '系统与连接器',
      Icon: Building2,
      rows: m.systems,
      status: (r: Row) =>
        r.status === '已接入' &&
        m.connectors.some(
          (c) =>
            c.fields.systemId === r.id &&
            connectorReady(s, c, f.unit === 'all' ? c.unit : f.unit),
        )
          ? '当前可用'
          : ['草稿', '待审核', '待开通', '待补充'].includes(r.status)
            ? '待完成准入'
            : '受限',
      detail: `已批准 ${m.systems.filter((r) => r.fields.review === '通过').length} 个系统 · 有效连接 ${m.connectors.filter((c) => connectorReady(s, c, f.unit === 'all' ? c.unit : f.unit)).length} 个`,
    },
    {
      name: '智能体等能力',
      Icon: Boxes,
      rows: [
        ...m.agents,
        ...records(s, 'skills').filter(scoped),
        ...records(s, 'plugins').filter(scoped),
      ],
      status: (r: Row) =>
        r.page === 'agents'
          ? publishedPassed(s, r)
            ? '当前可用'
            : r.fields.enabled === '否' && r.fields.liveVersion
              ? '受限'
              : '待完成准入'
          : r.fields.enabled === '是' && !!r.fields.liveVersion
            ? '当前可用'
            : r.fields.liveVersion
              ? '受限'
              : '待完成准入',
      detail: `专业智能体 ${m.agents.length} 个`,
    },
    {
      name: '单位与人员',
      Icon: Users,
      rows: records(s, 'accounts').filter(scoped),
      status: (r: Row) =>
        r.status === '启用' &&
        records(s, 'seats').some(
          (seat) => seat.unit === r.unit && number(seat, 'opened') > 0,
        )
          ? '当前可用'
          : r.status === '启用'
            ? '待完成准入'
            : '受限',
      detail: `人员授权记录 ${m.grants.length} 条`,
    },
  ];
  const selectedRisk = focus?.risk ?? '';
  const controlChecks = selectedRisk
    ? m.checks.filter((c) => c.risk === selectedRisk)
    : m.checks;
  return (
    <div className={'v3-overview ' + (paused ? 'is-paused' : '')}>
      <div className="v3-scale">
        {scales.map(({ label, value, unit, ids, Icon, tone }) => (
          <button key={label} onClick={() => explain(label, 'scale', ids)}>
            <span className={'v3-kpi-icon ' + tone}>
              <Icon size={15} />
            </span>
            <span className="v3-kpi-copy">
              <span>{label}</span>
              <strong>
                {value}
                <small>{unit}</small>
              </strong>
            </span>
          </button>
        ))}
      </div>
      <SavingsStrip state={s} filters={f} go={go} />
      <button
        className="v3-attention"
        onClick={() =>
          explain(
            '待关注事项',
            'attention',
            [...high, ...awaiting, ...abnormal].map((r) => r.id),
          )
        }
      >
        <AlertTriangle size={18} />
        <span>
          当前 <b>{m.high}</b> 项高危告警未关闭 · <b>{m.pendingRestriction}</b>{' '}
          项告警限制尚未生效 · <b>{abnormal.length}</b> 个运行环境异常
        </span>
        <span className="v3-attention-link">
          查看详情 <ChevronRight size={15} />
        </span>
      </button>
      <div className="v3-main-grid">
        <Panel
          title="准入管理"
          className={
            'v3-admission ' +
            (isRelated(m.systems.map((r) => r.id)) ? 'v3-related' : '')
          }
          aside={<span className="v3-step">01</span>}
        >
          {admission.map((a) => (
            <section className="v3-admit-group" key={a.name}>
              <div className="v3-subtitle">
                <a.Icon size={19} />
                <button
                  onClick={() =>
                    explain(
                      a.name + '准入',
                      'admission',
                      a.rows.map((r) => r.id),
                    )
                  }
                >
                  {a.name}
                  <ChevronRight size={14} />
                </button>
              </div>
              <Distribution
                items={['当前可用', '待完成准入', '受限'].map((name) => ({
                  name,
                  count: a.rows.filter((r) => a.status(r) === name).length,
                }))}
                onSelect={(name) =>
                  explain(
                    a.name + ' · ' + name,
                    'admission',
                    a.rows.filter((r) => a.status(r) === name).map((r) => r.id),
                  )
                }
              />
              <small>{a.detail}</small>
            </section>
          ))}
        </Panel>
        <Panel
          title="运行监控"
          className="v3-runtime"
          aside={<span className="v3-step">02</span>}
        >
          <div className="v3-runtime-stats">
            {[
              [
                '当前执行中',
                m.running + ' 项',
                records(s, 'tasks')
                  .filter((t) => scoped(t) && t.status === '运行中')
                  .map((t) => t.id),
              ],
              [
                period + '已完成',
                m.tasks.filter((t) => t.status === '完成').length + ' 项',
                m.tasks.filter((t) => t.status === '完成').map((t) => t.id),
              ],
              [
                '调用成功率',
                (m.success?.toFixed(1) ?? '—') + '%',
                m.calls.map((c) => c.id),
              ],
              [
                '平均响应',
                (m.latency?.toFixed(2) ?? '—') + ' 秒',
                m.calls.filter((c) => c.status === '成功').map((c) => c.id),
              ],
            ].map(([label, value, ids]) => (
              <button
                key={label as string}
                onClick={() =>
                  explain(label as string, 'runtime', ids as string[])
                }
              >
                <span>{label as string}</span>
                <strong>{value as string}</strong>
              </button>
            ))}
          </div>
          <div className="v3-charts">
            <div>
              <button
                className="v3-chart-label"
                onClick={() =>
                  explain(
                    '调用量趋势',
                    'calls',
                    m.calls.map((c) => c.id),
                  )
                }
              >
                调用量 <small>次</small>
                <ChevronRight size={13} />
              </button>
              <ResponsiveContainer
                initialDimension={{ width: 600, height: 200 }}
                minWidth={0}
                width="100%"
                height={72}
              >
                <AreaChart
                  data={trend}
                  onClick={(e) => {
                    const b = trend.find((t) => t.time === e?.activeLabel);
                    if (b) explain(b.time + '调用记录', 'calls', b.ids);
                  }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis width={28} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    dataKey="calls"
                    name="调用次数"
                    stroke="var(--ov-blue-2)"
                    fill="var(--ov-chart-fill)"
                    isAnimationActive={!paused}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div>
              <button
                className="v3-chart-label"
                onClick={() =>
                  explain(
                    '调用成功率',
                    'calls',
                    m.calls.map((c) => c.id),
                  )
                }
              >
                调用成功率 <small>{period}</small>
                <ChevronRight size={13} />
              </button>
              <SuccessGauge
                percent={m.success ?? 0}
                success={m.calls.filter((c) => c.status === '成功').length}
                total={m.calls.length}
                onClick={() =>
                  explain(
                    '调用成功率',
                    'calls',
                    m.calls.map((c) => c.id),
                  )
                }
              />
            </div>
          </div>
          <div className="v3-call-split">
            <button
              onClick={() =>
                explain(
                  '模型请求',
                  'calls',
                  m.calls.filter((c) => c.type === '模型请求').map((c) => c.id),
                )
              }
            >
              模型请求 <b>{m.modelCalls}</b> 次
            </button>
            <button
              onClick={() =>
                explain(
                  '工具调用',
                  'calls',
                  m.calls.filter((c) => c.type === '工具调用').map((c) => c.id),
                )
              }
            >
              工具调用 <b>{m.toolCalls}</b> 次
            </button>
            <button
              onClick={() =>
                explain(
                  '技术失败',
                  'calls',
                  m.calls.filter((c) => c.status === '失败').map((c) => c.id),
                )
              }
            >
              技术失败 <b>{m.failed}</b> 次
            </button>
          </div>
          <div className="v3-flow-title">
            <Activity size={16} />
            <strong>任务运行态势</strong>
            <span>
              {period}累计 {fmt(m.tasks.length)} 项
            </span>
          </div>
          <div className="v3-flow">
            {stageNames.map((stage, i) => (
              <div key={stage} className="v3-flow-cell">
                <button
                  className={'v3-stage stage-' + i}
                  onClick={() =>
                    explain(
                      stage + '任务',
                      'stage',
                      stageTasks(stage).map((t) => t.id),
                    )
                  }
                >
                  <span className="v3-stage-number">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <strong
                    key={stageTasks(stage).length}
                    className="v3-count-update"
                  >
                    {fmt(stageTasks(stage).length)}
                  </strong>
                  <span>
                    {stage === '任务进入'
                      ? '当前待检查'
                      : stage === '安全检查'
                        ? '当前检查中'
                        : stage === '受控执行'
                          ? '当前执行中'
                          : period + '完成'}
                  </span>
                </button>
                {i < 3 && <ArrowRight size={16} className="v3-flow-arrow" />}
              </div>
            ))}
          </div>
          <div className="v3-branches">
            {['等待确认', '已阻断', '技术异常', '安全中止'].map((stage) => (
              <button
                key={stage}
                className={color(stage)}
                onClick={() =>
                  explain(
                    stage + '任务',
                    'stage',
                    stageTasks(stage).map((t) => t.id),
                  )
                }
              >
                <i />
                {stage}
                <b>{stageTasks(stage).length}</b>
              </button>
            ))}
          </div>
          <button
            className="v3-latest"
            onClick={() =>
              explain(
                '任务追踪',
                'task',
                m.tasks.map((t) => t.id),
              )
            }
          >
            <ShieldCheck size={16} />
            <span>
              {focusTask ? `关联任务：${focusTask.name}` : '任务追踪'}
            </span>
            <ChevronRight size={15} />
          </button>
        </Panel>
        <Panel
          title="告警处置"
          className={
            'v3-disposal ' +
            (focusTask &&
            m.alerts.some(
              (a) =>
                a.fields.task === focusTask.id ||
                a.fields.latestTask === focusTask.id,
            )
              ? 'v3-related'
              : '')
          }
          aside={<span className="v3-step">03</span>}
        >
          <div className="v3-alert-numbers">
            {[
              ['高危未关闭', m.high, high],
              ['限制待生效', m.pendingRestriction, awaiting],
              [
                '超时待处理',
                m.overdue,
                m.alerts.filter(
                  (a) =>
                    a.status !== '已关闭' &&
                    (a.fields.due.length === 10
                      ? a.fields.due + ' 23:59'
                      : a.fields.due) < s.now,
                ),
              ],
            ].map(([label, n, rr]) => (
              <button
                key={label as string}
                onClick={() =>
                  explain(
                    label as string,
                    'alerts',
                    (rr as Row[]).map((r) => r.id),
                  )
                }
              >
                <b>{n as number}</b>
                <span>{label as string}</span>
              </button>
            ))}
          </div>
          <Distribution
            items={['待领取', '核查中', '整改中', '待复核', '已关闭'].map(
              (name) => ({
                name,
                count: m.alerts.filter((a) => alertStage(a) === name).length,
              }),
            )}
            onSelect={(name) =>
              explain(
                '告警 · ' + name,
                'alerts',
                m.alerts.filter((a) => alertStage(a) === name).map((a) => a.id),
              )
            }
          />
          <div className="v3-alert-list">
            {m.alerts
              .filter((a) => a.status !== '已关闭')
              .sort(
                (a, b) =>
                  (a.fields.level === '高危' ? 0 : 1) -
                  (b.fields.level === '高危' ? 0 : 1),
              )
              .slice(0, 3)
              .map((a) => (
                <button
                  key={a.id}
                  onClick={() =>
                    explain(a.name, 'alerts', [a.id], a.fields.task)
                  }
                >
                  <div>
                    <Badge>{a.fields.level}</Badge>
                    <strong>{a.name}</strong>
                  </div>
                  <span>{a.fields.result}</span>
                  <small>
                    {a.fields.owner} · {alertStage(a)} · 截止{' '}
                    {a.fields.due.slice(5)}
                  </small>
                </button>
              ))}
          </div>
          <button
            className="v3-text-link"
            onClick={() =>
              explain(
                '全部告警与处置进度',
                'alerts',
                m.alerts.map((a) => a.id),
              )
            }
          >
            查看全部 {m.alerts.length} 项告警 <ChevronRight size={15} />
          </button>
        </Panel>
      </div>
      <div className="v3-bottom-grid">
        <Panel
          title="沙箱状态"
          className={
            'v3-sandbox ' +
            (isRelated(m.boxes.map((r) => r.id)) ? 'v3-related' : '')
          }
          aside={<span className="v3-muted">当前状态</span>}
        >
          <div className="v3-sandbox-layout">
            <div className="v3-sandbox-matrix">
              <div className="v3-sandbox-matrix-head">
                <span>
                  全部环境 <b>{fmt(m.boxes.length)}</b> 个
                </span>
                <span>每格 1 个沙箱</span>
              </div>
              <div className="v3-sandbox-dots" aria-label="沙箱状态点阵">
                {m.boxes.map((box) => (
                  <button
                    key={box.id}
                    className={'v3-sandbox-dot ' + color(box.status)}
                    aria-label={`${box.name}，${box.status}`}
                    title={`${box.name} · ${box.status}`}
                    onClick={() =>
                      explain(box.name, 'sandbox', [box.id], box.fields.task)
                    }
                  />
                ))}
              </div>
            </div>
            <div className="v3-box-grid">
              {boxStates.map((status) => (
                <button
                  key={status}
                  className={color(status)}
                  onClick={() =>
                    explain(
                      '沙箱 · ' + status,
                      'sandbox',
                      m.boxes
                        .filter((b) => b.status === status)
                        .map((b) => b.id),
                    )
                  }
                >
                  <b>{m.boxes.filter((b) => b.status === status).length}</b>
                  <span>{status}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            className="v3-latest"
            onClick={() =>
              explain(
                '沙箱环境',
                'sandbox',
                m.boxes.map((b) => b.id),
              )
            }
          >
            <Server size={16} />
            <span>全部环境</span>
            <b>{fmt(m.boxes.length)} 个</b>
            <ChevronRight size={15} />
          </button>
        </Panel>
        <Panel
          title="安全控制"
          className={
            'v3-security ' +
            (focusTask && m.checks.some((c) => c.task === focusTask.id)
              ? 'v3-related'
              : '')
          }
          aside={
            <button
              className="v3-text-link"
              onClick={() =>
                explain(
                  '全部安全检查',
                  'controls',
                  m.checks.map((c) => c.id),
                )
              }
            >
              {m.checks.length} 次检查 <ChevronRight size={13} />
            </button>
          }
        >
          <div className="v3-risk-layout">
            <SafetyGauge
              value={m.checks.filter((c) => c.outcome === '允许').length}
              total={m.checks.length}
            />
            <div className="v3-risk-levels">
              {[
                ['低风险', '授权资料查询'],
                ['中风险', '受限文件导出'],
                ['高风险', '越权系统写入'],
              ].map(([risk, example]) => (
                <button
                  key={risk}
                  className={
                    color(risk) + (selectedRisk === risk ? ' selected' : '')
                  }
                  onClick={() =>
                    explain(
                      risk + '操作',
                      'risk:' + risk,
                      m.checks.filter((c) => c.risk === risk).map((c) => c.id),
                    )
                  }
                >
                  <span>
                    {risk}
                    <small>{example}</small>
                  </span>
                  <b>{m.checks.filter((c) => c.risk === risk).length}</b>
                  <i
                    style={{
                      width:
                        Math.max(
                          3,
                          (m.checks.filter((c) => c.risk === risk).length /
                            Math.max(1, m.checks.length)) *
                            100,
                        ) + '%',
                    }}
                  />
                </button>
              ))}
            </div>
            <div className="v3-control-results">
              {outcomes.map(([value, label]) => (
                <button
                  key={value}
                  className={color(label)}
                  onClick={() =>
                    explain(
                      (selectedRisk ? selectedRisk + ' · ' : '') + label,
                      'controls',
                      controlChecks
                        .filter((c) => c.outcome === value)
                        .map((c) => c.id),
                    )
                  }
                >
                  <b>
                    {controlChecks.filter((c) => c.outcome === value).length}
                  </b>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </Panel>
      </div>
      <ExplainPanel current={s} focus={focus} onFocus={onFocus} go={go} />
    </div>
  );
}
function ExplainPanel({
  current,
  focus,
  onFocus,
  go,
}: {
  current: State;
  focus: OverviewFocus | null;
  onFocus: Props['onFocus'];
  go: Navigate;
}) {
  const [pagination, setPagination] = useState<{
    focus: OverviewFocus | null;
    page: number;
  }>({ focus: null, page: 0 });
  if (!focus) return null;
  const page = pagination.focus === focus ? pagination.page : 0;
  const ids = [...new Set(focus.ids)];
  const pageSize = 40;
  const pages = Math.max(1, Math.ceil(ids.length / pageSize));
  const visibleIds = new Set(ids.slice(page * pageSize, (page + 1) * pageSize));
  const s = focus.snapshot;
  const rows = focus.ids
    .map((id) => s.rows.find((r) => r.id === id))
    .filter(
      (r): r is Row => !!r && !s.safety?.checks.some((c) => c.id === r.id),
    );
  const checks = (s.safety?.checks ?? []).filter((c) =>
    focus.ids.includes(c.id),
  );
  const calls = s.calls.filter((c) => focus.ids.includes(c.id));
  const openPage = (page: PageId, id?: string) => {
    onFocus({ ...focus, open: false });
    go(page, id, {
      unit: focus.filter.unit,
      from: focus.filter.from,
      to: focus.filter.to,
    });
  };
  const chain = focus.task ? taskSafetyChain(s, focus.task) : null;
  const selectTask = (id: string) => onFocus({ ...focus, task: id });
  const uniqueRows = [...new Map(rows.map((r) => [r.id, r])).values()];
  return (
    <Sheet
      open={focus.open}
      onOpenChange={(open) => onFocus({ ...focus, open })}
    >
      <SheetContent className="v3-explain">
        <SheetHeader>
          <SheetTitle>{focus.title}</SheetTitle>
          <SheetDescription>
            统计期间 {focus.filter.from} — {focus.filter.to} · 数据截至 {s.now}
          </SheetDescription>
        </SheetHeader>
        <div className="v3-explain-body">
          {current.revision !== s.revision && (
            <div className="v3-new-records">
              <span>数据已更新</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  onFocus({ ...focus, snapshot: structuredClone(current) })
                }
              >
                <RefreshCw size={14} />
                刷新
              </Button>
            </div>
          )}
          {chain && (
            <section className="v3-chain">
              <div className="v3-section-title">
                <h3>{chain.task.name} · 安全链路</h3>
                <Badge>{chain.task.status}</Badge>
              </div>
              <small>
                {chain.task.id} · {unitName(chain.task.unit, s)}
              </small>
              {(
                chain.checks[0]?.evidence ??
                [
                  '人员授权',
                  '能力发布依据',
                  '系统与连接器授权',
                  '沙箱运行',
                ].map((label) => ({
                  label,
                  objectId: '',
                  detail: '检查记录待形成',
                  result: '待检查',
                }))
              ).map((e, i) => (
                <div className="v3-chain-step" key={e.label}>
                  <i>{i + 1}</i>
                  <div>
                    <b>{e.label}</b>
                    <p>{e.detail}</p>
                    <span>校验结果：{e.result}</span>
                    {e.objectId && s.rows.some((r) => r.id === e.objectId) && (
                      <button
                        onClick={() => {
                          const r = s.rows.find((r) => r.id === e.objectId)!;
                          openPage(r.page, r.id);
                        }}
                      >
                        对象详情 <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="v3-chain-step">
                <i>5</i>
                <div>
                  <b>安全检查</b>
                  <p>
                    {chain.events
                      .map((e) => e.time.slice(11) + ' ' + e.stage)
                      .join(' → ')}
                  </p>
                  {chain.checks.map((c) => (
                    <div className="v3-check" key={c.id}>
                      <Badge>
                        {outcomes.find((o) => o[0] === c.outcome)?.[1]}
                      </Badge>
                      <span>
                        {c.id} · {c.time}
                      </span>
                      <p>{c.reason}</p>
                      <small>
                        规则{' '}
                        {c.ruleIds
                          .map((id, i) => `${id} v${c.ruleVersions[i]}`)
                          .join('、') || '基础授权校验，无附加规则命中'}{' '}
                        · 网关回执 {c.receipt}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="v3-chain-step">
                <i>6</i>
                <div>
                  <b>执行与计量回执</b>
                  <p>实际调用记录</p>
                  {chain.calls.length ? (
                    chain.calls.map((c) => (
                      <p key={c.id}>
                        {c.type} · {c.id} · {c.status} ·{' '}
                        {(c.duration / 1000).toFixed(2)}秒
                      </p>
                    ))
                  ) : (
                    <p>未发起调用</p>
                  )}
                </div>
              </div>
              <div className="v3-chain-step">
                <i>7</i>
                <div>
                  <b>告警与处置</b>
                  {chain.alerts.length ? (
                    chain.alerts.map((a) => (
                      <div className="v3-check" key={a.id}>
                        <Badge>{a.status}</Badge>
                        <p>
                          {a.result}；后续限制：{a.restriction}
                        </p>
                        <p>
                          {a.owner} · 截止 {a.due} · 复核{' '}
                          {a.review || '尚未通过'}
                        </p>
                        <button onClick={() => openPage('alerts', a.id)}>
                          告警详情 <ChevronRight size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p>未触发关联人工告警。</p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => openPage('tasks', chain.task.id)}
              >
                任务详情
              </Button>
            </section>
          )}
          <div className="v3-section-title">
            <h3>对应明细</h3>
            <span>{new Set(focus.ids).size} 条</span>
          </div>
          {!focus.ids.length && (
            <div className="empty-state">
              <strong>当前范围暂无记录</strong>
            </div>
          )}
          <div className="v3-evidence-list">
            {uniqueRows
              .filter((r) => visibleIds.has(r.id))
              .map((r) => (
                <div key={r.id} className="v3-evidence-row">
                  <div>
                    <strong>{r.name}</strong>
                    <small>
                      {r.id} · {unitName(r.unit, s)}
                    </small>
                    {r.page === 'alerts' && (
                      <p>
                        {r.fields.result} · 限制：{r.fields.restriction}
                        <br />
                        {r.fields.owner} · 截止 {r.fields.due}
                      </p>
                    )}
                    {r.page === 'systems' && (
                      <p>
                        {r.fields.permissions} · 有效期 {r.fields.expires}
                        <br />
                        {r.fields.approval || '审批依据待补齐'}
                      </p>
                    )}
                    {r.page === 'sandboxes' && (
                      <p>
                        {r.fields.restriction} · {r.fields.owner} · 最近活动{' '}
                        {r.fields.lastActive}
                      </p>
                    )}
                    {r.page === 'accounts' && (
                      <p>
                        {s.safety?.grants
                          .filter((g) => g.unit === r.unit)
                          .map((g) => g.label + ' · ' + g.status + ' · ' + g.id)
                          .join('；') || '人员授权记录待补齐'}
                      </p>
                    )}
                    {focus.kind === 'admission' && (
                      <AdmissionEvidence
                        state={s}
                        row={r}
                        openPage={openPage}
                      />
                    )}
                    {focus.kind === 'admission' && r.page === 'systems' && (
                      <div className="admission-reports">
                        <b>关联连接器检查</b>
                        {records(s, 'connectors')
                          .filter((c) => c.fields.systemId === r.id)
                          .map((c) => (
                            <div className="admission-connector" key={c.id}>
                              <button
                                onClick={() => openPage('connectors', c.id)}
                              >
                                {c.name} →
                              </button>
                              <Badge>
                                {connectorReady(s, c)
                                  ? '当前可访问'
                                  : '当前不可访问'}
                              </Badge>
                              <p>
                                连接：{c.fields.connection} · 授权范围：
                                {c.fields.permissions} · 有效期：
                                {c.fields.expires}
                              </p>
                              <AdmissionEvidence
                                state={s}
                                row={c}
                                openPage={openPage}
                              />
                            </div>
                          ))}
                        {!records(s, 'connectors').some(
                          (c) => c.fields.systemId === r.id,
                        ) && <p>尚无关联连接器</p>}
                      </div>
                    )}
                  </div>
                  <div>
                    <Badge>{r.status}</Badge>
                    {r.page === 'tasks' ? (
                      <button onClick={() => selectTask(r.id)}>安全链路</button>
                    ) : (
                      r.fields.task &&
                      s.rows.some((t) => t.id === r.fields.task) && (
                        <button onClick={() => selectTask(r.fields.task)}>
                          关联任务安全链
                        </button>
                      )
                    )}
                    <button onClick={() => openPage(r.page, r.id)}>
                      管理详情 <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
          </div>
          {checks
            .filter((c) => visibleIds.has(c.id))
            .map((c) => (
              <div key={c.id} className="v3-check">
                <strong>
                  {c.action} · {c.risk}
                </strong>
                <Badge>{outcomes.find((o) => o[0] === c.outcome)?.[1]}</Badge>
                <p>{c.reason}</p>
                <small>
                  {c.id} · {c.time} · 回执 {c.receipt}
                </small>
                <p>
                  {c.ruleIds.map((id, i) => (
                    <button key={id} onClick={() => openPage('rules', id)}>
                      {id} v{c.ruleVersions[i]}{' '}
                    </button>
                  ))}
                </p>
                <button onClick={() => selectTask(c.task)}>任务安全链路</button>
              </div>
            ))}
          {calls
            .filter((c) => visibleIds.has(c.id))
            .map((c) => (
              <div key={c.id} className="v3-evidence-row">
                <div>
                  <strong>
                    {c.type} · {c.status}
                  </strong>
                  <small>
                    {c.id} · {c.date} · {(c.duration / 1000).toFixed(2)}秒
                  </small>
                  <p>
                    {c.type === '模型请求'
                      ? c.metered
                        ? `输入 ${c.input} + 输出 ${c.output} = ${c.input + c.output} Token；缓存输入 ${c.cached} 属于输入子集`
                        : '计量回执待回传'
                      : '工具调用不计模型Token'}
                  </p>
                </div>
                <button onClick={() => selectTask(c.task)}>任务安全链路</button>
              </div>
            ))}
          {pages > 1 && (
            <div className="v3-pagination">
              <span>
                共 {fmt(ids.length)} 条 · 第 {page + 1} / {pages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPagination({ focus, page: page - 1 })}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 === pages}
                onClick={() => setPagination({ focus, page: page + 1 })}
              >
                下一页
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
