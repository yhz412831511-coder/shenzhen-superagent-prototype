'use client';
import { connectorReady } from './safety';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  ArrowUpRight,
  ChevronRight,
  Clock,
  ShieldCheck,
  Activity,
  FileCheck2,
  Server,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  type State,
  type Row,
  type Filters,
  metrics,
  records,
  filteredCalls,
  allUnits,
  unitName,
  number,
  todos,
  quotaUsed,
  quotaStatus,
} from './data';
import { type PageId } from './catalog';
import { Panel, Stat, Fields, Badge, fmt, token } from './ui';
import { impact, evaluationPassed } from './business';
export type Navigate = (
  page: PageId,
  id?: string,
  patch?: Partial<Filters>,
) => void;
const names: Record<string, string> = {
  boundary: '职责边界',
  systemId: '系统登记编号',
  dataScope: '允许的数据范围',
  approval: '接入审批依据',
  receipt: '执行回执',
  occurrences: '发生次数',
  lastSeen: '最近发生时间',
  stage: '当前运行阶段',
  connector: '使用的连接器',
  approved: '已批准额度',
  opened: '已开通席位',
  owner: '责任人／岗位',
  scope: '适用范围',
  date: '登记日期',
  material: '材料与证据摘要',
  purpose: '申请用途',
  amount: '申请数量',
  note: '处理说明',
  source: '来源',
  quota: '配额',
  threshold: '预警阈值 / %',
  period: '额度周期',
  increase: '申请增加Token',
  requestStatus: '增额申请状态',
  requestReason: '增额原因',
  account: '管理员子账号',
  contact: '管理联系人',
  phone: '联系电话',
  role: '账号角色',
  used: '已使用容量 / GB',
  authorized: '授权能力',
  error: '异常说明',
  privacy: '内容访问边界',
  provider: '建设来源',
  description: '说明',
  model: '模型服务',
  permissions: '权限范围',
  liveVersion: '已发布版本',
  enabled: '当前服务启用',
  review: '审核／复核结果',
  target: '评测对象',
  targetVersion: '受测版本',
  kind: '评测类型',
  testSet: '测试集版本',
  report: '评测结果',
  progress: '完成进度 / %',
  failures: '失败项',
  rectification: '整改记录',
  gate: '通过标准',
  system: '对应系统',
  connection: '连接状态',
  expires: '授权到期',
  default: '是否默认模型',
  maker: '模型厂商',
  scale: '模型规模',
  level: '建议能力等级',
  backup: '备用模型',
  mode: '使用模式',
  L0: '规则处理',
  L1: '轻量处理映射',
  L2: '标准处理映射',
  L3: '深度处理映射',
  user: '用户编号',
  userLabel: '用户摘要',
  time: '发生时间',
  duration: '任务耗时 / 秒',
  taskType: '任务类型',
  businessScenario: '业务场景',
  entry: '任务入口',
  sandbox: '任务环境',
  modelMode: '模型选择方式',
  task: '关联任务',
  space: '个人空间',
  analysis: '分析沙箱',
  execution: '执行沙箱',
  vectorService: '向量检索供应',
  ownership: '内容所有权',
  network: '运行网络',
  template: '环境规格',
  cpu: '处理器',
  memory: '内存',
  resource: '资源使用率',
  lastActive: '最近活动',
  retention: '保留要求',
  restriction: '当前限制',
  files: '成果保留方式',
  items: '知识条目数',
  lastSync: '最近同步',
  content: '组织内容',
  feedback: '处理结果',
  unitFeedback: '单位反馈',
  category: '事项类别',
  due: '处理期限',
  alert: '关联告警',
  levelRisk: '风险等级',
  evidence: '证据编号',
  result: '控制结果',
  actionType: '操作类型',
  rule: '关联规则',
  tag: '数据范围',
  condition: '触发条件',
  action: '控制动作',
  checkVersion: '检查版本',
  pilot: '小范围应用单位',
  menus: '可见目录',
  protected: '基础管理角色',
  actor: '执行主体',
  risk: '操作风险等级',
};
export const fieldLabel = (k: string) => names[k] ?? k;
function value(s: State, k: string, v: string) {
  if (
    [
      'model',
      'backup',
      'L1',
      'L2',
      'L3',
      'target',
      'sandbox',
      'space',
      'agent',
      'rule',
    ].includes(k)
  )
    return s.rows.find((r) => r.id === v)?.name ?? v;
  return v;
}
const excluded = [
  'failure',
  'retried',
  'liveConfig',
  'previous',
  'checkResult',
];
export function Overview({
  state: s,
  filters: f,
  go,
}: {
  state: State;
  filters: Filters;
  go: Navigate;
}) {
  const m = metrics(s, f);
  const daily = Array.from({ length: 7 }, (_, i) => {
    const day = '2026-09-' + String(2 + i).padStart(2, '0');
    const mm = metrics(s, { ...f, from: day, to: day });
    return {
      day: day.slice(5),
      active: mm.active,
      calls: mm.calls,
      success: Number((mm.success ?? 0).toFixed(1)),
      token: mm.input + mm.output,
    };
  });
  const ranks = allUnits(s)
    .map((u) => ({
      name: u.name.replace('市', ''),
      id: u.id,
      count: metrics(s, { ...f, unit: u.id }).active,
      opened: records(s, 'seats')
        .filter((r) => r.unit === u.id)
        .reduce((n, r) => n + number(r, 'opened'), 0),
    }))
    .filter((u) => f.unit === 'all' || f.unit === u.id)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const tasks = todos(s)
    .filter((r) => f.unit === 'all' || r.unit === f.unit)
    .sort(
      (a, b) =>
        (a.page === 'alerts' ? 0 : a.page === 'applications' ? 1 : 2) -
        (b.page === 'alerts' ? 0 : b.page === 'applications' ? 1 : 2),
    )
    .slice(0, 4);
  const risk = ['低风险', '中风险', '高风险'].map((name) => ({
    name,
    count: m.ops.filter((o) => o.fields.risk === name).length,
  }));
  const breakdown = allUnits(s)
    .map((u) => {
      const t = metrics(s, { ...f, unit: u.id });
      return {
        name: u.name.replace('市', '').slice(0, 5),
        unit: u.id,
        input: t.input,
        output: t.output,
      };
    })
    .filter((u) => f.unit === 'all' || u.unit === f.unit);
  return (
    <div className="overview">
      <div className="metrics six">
        <Stat
          label="待审批席位申请"
          value={m.requests}
          unit="单"
          note="单位提交 · 市中台审批"
          onClick={() =>
            go('applications', undefined, { status: '待审批', unit: f.unit })
          }
        />
        <Stat
          label="已开通席位"
          value={fmt(m.opened)}
          unit="个"
          note="当前已生效的单位额度"
          onClick={() => go('seats', undefined, { unit: f.unit })}
        />
        <Stat
          label="今日使用人数"
          value={m.active}
          unit="人"
          note="按有效任务用户去重"
          onClick={() =>
            go('tasks', undefined, { unit: f.unit, from: f.from, to: f.to })
          }
        />
        <Stat
          label="已上线专业智能体"
          value={m.agents}
          unit="个"
          note="当前线上版本可用"
          onClick={() =>
            go('agents', undefined, { unit: f.unit, status: '已上线' })
          }
        />
        <Stat
          label="今日调用"
          value={fmt(m.calls)}
          unit="次"
          note={
            <>
              成功率 <b>{m.success?.toFixed(1) ?? '—'}%</b> ·{' '}
              {m.latency?.toFixed(2) ?? '—'}秒
            </>
          }
          onClick={() =>
            go('tasks', undefined, { unit: f.unit, from: f.from, to: f.to })
          }
        />
        <Stat
          label="今日Token用量"
          value={token(m.input + m.output)}
          note={
            <>
              输入 {token(m.input)} · 输出 {token(m.output)}
            </>
          }
          onClick={() =>
            go('usage', undefined, { unit: f.unit, from: f.from, to: f.to })
          }
        />
      </div>
      <div className="dashboard-grid">
        <Panel
          title="使用与申请"
          aside={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => go('applications')}
            >
              查看申请 <ChevronRight size={14} />
            </Button>
          }
        >
          <div className="chart-kicker">
            <strong>
              {m.active}
              <small>今日使用人数</small>
            </strong>
            <span>近7日实际使用趋势</span>
          </div>
          <div className="chart">
            <ResponsiveContainer
              initialDimension={{ width: 600, height: 200 }}
              minWidth={0}
              width="100%"
              height="100%"
            >
              <AreaChart
                data={daily}
                onClick={(p) => {
                  if (p?.activeLabel)
                    go('tasks', undefined, {
                      from: '2026-' + p.activeLabel,
                      to: '2026-' + p.activeLabel,
                      unit: f.unit,
                    });
                }}
              >
                <defs>
                  <linearGradient id="blue-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4d8ee7" stopOpacity={0.32} />
                    <stop
                      offset="100%"
                      stopColor="#4d8ee7"
                      stopOpacity={0.01}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} width={28} />
                <Tooltip />
                <Area
                  name="使用人数"
                  type="monotone"
                  dataKey="active"
                  stroke="#3f7fdb"
                  fill="url(#blue-area)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="panel-foot">
            <span>
              席位申请数量 <b>{m.requested}</b>
            </span>
            <button onClick={() => go('applications')}>
              查看单位需求 <ArrowUpRight size={13} />
            </button>
          </div>
        </Panel>
        <Panel title="单位使用情况" aside={<span>按今日使用人数</span>}>
          <div className="ranking">
            {ranks.map((u, i) => (
              <button
                key={u.id}
                onClick={() => go('tasks', undefined, { unit: u.id })}
              >
                <span className={'rank-index rank-' + i}>{i + 1}</span>
                <div>
                  <b>{u.name}</b>
                  <div className="rank-track">
                    <i
                      style={{
                        width:
                          (u.count /
                            Math.max(...ranks.map((r) => r.count), 1)) *
                            100 +
                          '%',
                      }}
                    />
                  </div>
                </div>
                <strong>
                  {u.count}
                  <small>人</small>
                </strong>
              </button>
            ))}
          </div>
        </Panel>
        <Panel
          title="运行质量"
          aside={
            <Button variant="ghost" size="sm" onClick={() => go('tasks')}>
              运行监控 <ChevronRight size={14} />
            </Button>
          }
        >
          <div className="inline-stats">
            <span>
              调用成功率 <b>{m.success?.toFixed(1) ?? '—'}%</b>
            </span>
            <span>
              平均响应 <b>{m.latency?.toFixed(2) ?? '—'}秒</b>
            </span>
          </div>
          <div className="chart">
            <ResponsiveContainer
              initialDimension={{ width: 600, height: 200 }}
              minWidth={0}
              width="100%"
              height="100%"
            >
              <LineChart
                data={daily}
                onClick={(p) => {
                  if (p?.activeLabel)
                    go('tasks', undefined, {
                      from: '2026-' + p.activeLabel,
                      to: '2026-' + p.activeLabel,
                    });
                }}
              >
                <CartesianGrid strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis width={28} />
                <YAxis
                  yAxisId="rate"
                  orientation="right"
                  domain={[0, 100]}
                  width={32}
                />
                <Tooltip />
                <Legend />
                <Line
                  name="调用次数"
                  dataKey="calls"
                  stroke="#3f7fdb"
                  strokeWidth={2.3}
                  dot={false}
                />
                <Line
                  name="成功率 %"
                  dataKey="success"
                  yAxisId="rate"
                  stroke="#27a88c"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel
          title="Token用量分布"
          aside={
            <Button variant="ghost" size="sm" onClick={() => go('usage')}>
              Token分析 <ChevronRight size={14} />
            </Button>
          }
        >
          <div className="inline-stats">
            <span>
              <i className="legend-dot blue" />
              输入Token
            </span>
            <span>
              <i className="legend-dot teal" />
              输出Token
            </span>
          </div>
          <div className="chart">
            <ResponsiveContainer
              initialDimension={{ width: 600, height: 200 }}
              minWidth={0}
              width="100%"
              height="100%"
            >
              <BarChart
                data={breakdown}
                onClick={(p) => {
                  const row = breakdown.find((d) => d.name === p?.activeLabel);
                  if (row) go('usage', undefined, { unit: row.unit });
                }}
              >
                <CartesianGrid strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis width={42} tickFormatter={(v) => token(Number(v))} />
                <Tooltip formatter={(v) => token(Number(v))} />
                <Bar
                  name="输入"
                  dataKey="input"
                  stackId="t"
                  fill="#528ce0"
                  maxBarSize={26}
                />
                <Bar
                  name="输出"
                  dataKey="output"
                  stackId="t"
                  fill="#69c8bd"
                  maxBarSize={26}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="安全操作与控制" aside={<Badge>控制持续生效</Badge>}>
          <div className="security-summary">
            <ShieldCheck size={31} />
            <div>
              <strong>
                {m.controlled}
                <small>次</small>
              </strong>
              <span>安全控制生效操作</span>
            </div>
          </div>
          <div className="risk-bars">
            {risk.map((r, i) => (
              <button
                key={r.name}
                onClick={() =>
                  go('audit', undefined, { search: r.name, unit: f.unit })
                }
              >
                <span>{r.name}</span>
                <div>
                  <i
                    style={{
                      width: (r.count / Math.max(m.ops.length, 1)) * 100 + '%',
                      background: ['#5794df', '#e4ae50', '#dc7980'][i],
                    }}
                  />
                </div>
                <b>{r.count}</b>
              </button>
            ))}
          </div>
          <div className="control-counts">
            {[
              ['拦截', m.blocked, '阻断'],
              ['人工确认', m.review, '转人工确认'],
              ['脱敏', m.masked, '脱敏'],
            ].map(([n, v, filter]) => (
              <button
                key={n}
                onClick={() =>
                  go('audit', undefined, { search: String(filter) })
                }
              >
                <b>{v}</b>
                <span>{n}</span>
              </button>
            ))}
          </div>
        </Panel>
        <Panel
          title="待处理与服务状态"
          aside={
            <Button variant="ghost" size="sm" onClick={() => go('alerts')}>
              告警 {m.alerts} <ChevronRight size={14} />
            </Button>
          }
        >
          <div className="attention-summary">
            <button onClick={() => go('alerts', undefined, { search: '高危' })}>
              <span className="attention-icon">
                <Activity size={17} />
              </span>
              <span>高危未关闭</span>
              <b>{m.high}</b>
            </button>
            <button
              onClick={() => go('sandboxes', undefined, { status: '异常' })}
            >
              <Server size={18} />
              <span>环境异常／隔离</span>
              <b>{m.sandboxErrors}</b>
            </button>
          </div>
          <div className="todo-list">
            {tasks.map((r) => (
              <button key={r.id} onClick={() => go(r.page, r.id)}>
                <FileCheck2 size={17} />
                <div>
                  <strong>
                    {r.page === 'quotas' ? 'Token增额申请 · ' + r.name : r.name}
                  </strong>
                  <small>
                    {unitName(r.unit, s)} ·{' '}
                    {r.page === 'quotas'
                      ? r.fields.requestStatus === '待审批'
                        ? '增额待审批'
                        : quotaStatus(s, r)
                      : r.status}
                  </small>
                </div>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
export function RecordDetails({
  state: s,
  row: r,
  go,
}: {
  state: State;
  row: Row;
  go: Navigate;
}) {
  const related = impact(s, r);
  const calls = s.calls.filter((c) => c.task === r.id);
  const evals = records(s, 'evaluations').filter(
    (e) => e.fields.target === r.id,
  );
  let check: {
    total: number;
    matched: number;
    action: string;
    ids: string[];
    outcomes?: { id: string; outcome: string }[];
    note: string;
  } | null = null;
  if (r.fields.checkResult) check = JSON.parse(r.fields.checkResult);
  return (
    <div className="detail-content">
      {r.page === 'systems' && (
        <Panel title="关联连接器">
          <div className="related-list">
            {records(s, 'connectors')
              .filter((c) => c.fields.systemId === r.id)
              .map((c) => (
                <button key={c.id} onClick={() => go('connectors', c.id)}>
                  <span>{c.name}</span>
                  <Badge>
                    {connectorReady(s, c) ? '当前可访问' : '当前不可访问'}
                  </Badge>
                  <ChevronRight size={14} />
                </button>
              ))}
          </div>
          {!records(s, 'connectors').some(
            (c) => c.fields.systemId === r.id,
          ) && <p>尚无关联连接器，请在连接器管理中关联并检查。</p>}
        </Panel>
      )}
      {r.page === 'connectors' && (
        <Panel title="系统准入与有效访问">
          <Fields
            items={[
              [
                '关联系统',
                s.rows.find((row) => row.id === r.fields.systemId)?.name ||
                  '未关联',
              ],
              [
                '当前访问',
                connectorReady(s, r)
                  ? '系统和连接器授权有效'
                  : '系统准入或连接授权条件未满足',
              ],
            ]}
          />
          {r.fields.systemId && (
            <Button
              variant="outline"
              onClick={() => go('systems', r.fields.systemId)}
            >
              查看系统接入
            </Button>
          )}
        </Panel>
      )}
      {r.page === 'agents' && (
        <div className="detail-notice">
          <FileCheck2 size={20} />
          <span>
            当前提交版本 {r.version} ·{' '}
            {evaluationPassed(s, r)
              ? '性能与安全评测均已通过'
              : '当前版本需完成性能、安全双项评测'}
            {r.fields.liveVersion && ' · 线上版本 ' + r.fields.liveVersion}
          </span>
        </div>
      )}
      {['tasks', 'spaces', 'memory'].includes(r.page) && (
        <div className="privacy-note">
          <ShieldCheck size={17} />
          仅查看运行与服务信息，不展示个人文件、任务正文或私有记忆。
        </div>
      )}
      {r.page === 'quotas' && (
        <Panel title="本月额度使用">
          <Fields
            items={[
              ['已计量用量', token(quotaUsed(s, r)) + ' Token'],
              [
                '剩余额度',
                token(Math.max(0, number(r, 'quota') - quotaUsed(s, r))) +
                  ' Token',
              ],
              ['当前提醒', quotaStatus(s, r)],
              ['达到额度的处理', '形成预警与待办，不自动中断业务'],
            ]}
          />
        </Panel>
      )}
      <Panel title="基本信息">
        <Fields
          items={[
            ['记录编号', r.id],
            ['所属单位', unitName(r.unit, s)],
            [
              '当前状态',
              <Badge key="status">{r.pending ? '执行中' : r.status}</Badge>,
            ],
            ['当前版本', r.version],
          ]}
        />
      </Panel>
      <Panel
        title={
          r.page === 'tasks'
            ? '执行信息'
            : r.page === 'evaluations'
              ? '评测报告'
              : r.page === 'sandboxes'
                ? '环境与保留规则'
                : '管理信息'
        }
      >
        <Fields
          items={Object.entries(r.fields)
            .filter(([k]) => !excluded.includes(k) && names[k])
            .map(
              ([k, v]) =>
                [
                  k === 'level' && r.page === 'alerts'
                    ? '告警等级'
                    : k === 'kind' && r.page === 'audit'
                      ? '记录类型'
                      : fieldLabel(k),
                  value(s, k, v),
                ] as [string, string],
            )}
        />
      </Panel>
      {r.page === 'tasks' && (
        <Panel title="执行链路">
          <div className="execution-timeline">
            {calls.map((c) => (
              <div key={c.id}>
                <i />
                <div>
                  <strong>
                    {c.type} · {s.rows.find((r) => r.id === c.model)?.name}
                  </strong>
                  <span>
                    {c.id} · {(c.duration / 1000).toFixed(2)}秒
                  </span>
                </div>
                <Badge>{c.status}</Badge>
              </div>
            ))}
          </div>
          <div className="detail-links">
            <Button
              variant="outline"
              onClick={() => go('sandboxes', r.fields.sandbox)}
            >
              查看任务环境
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                go('usage', undefined, {
                  search: r.id,
                  from: r.fields.date,
                  to: r.fields.date,
                })
              }
            >
              查看调用计量
            </Button>
          </div>
        </Panel>
      )}
      {evals.length > 0 && (
        <Panel title="版本评测记录">
          <div className="related-list">
            {evals.map((e) => (
              <button key={e.id} onClick={() => go('evaluations', e.id)}>
                <span>
                  {e.fields.kind}评测 · v{e.fields.targetVersion}
                </span>
                <Badge>{e.status}</Badge>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </Panel>
      )}
      {r.page === 'evaluations' && (
        <Panel title="检查项目">
          <div className="check-report">
            {(r.fields.kind === '性能'
              ? ['调用完成率', '响应时间', '异常返回处理']
              : ['数据访问范围', '工具执行权限', '文件输出控制', '沙箱访问边界']
            ).map((n, i) => (
              <div key={n}>
                <span>{n}</span>
                <Badge>
                  {r.status === '未通过' && i === 1
                    ? '未通过'
                    : r.status === '待复测'
                      ? '待复测'
                      : r.status === '评测中'
                        ? '检查中'
                        : r.status === '评测失败'
                          ? '未完成'
                          : '通过'}
                </Badge>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => go('agents', r.fields.target)}
          >
            返回受测智能体
          </Button>
        </Panel>
      )}
      {check && (
        <Panel title="当前版本变更检查">
          <Fields
            items={[
              ['检查记录', check.total + '条'],
              ['匹配操作', check.matched + '条'],
              ['匹配后动作', check.action],
              ['控制说明', check.note],
            ]}
          />
          <div className="related-list">
            {(
              check.outcomes ??
              check.ids.map((id) => ({ id, outcome: check!.action }))
            ).map((o) => (
              <button key={o.id} onClick={() => go('audit', o.id)}>
                {o.id}
                <Badge>{o.outcome}</Badge>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </Panel>
      )}
      {(related.tasks.length > 0 || related.caps.length > 0) &&
        r.page !== 'tasks' && (
          <Panel title="影响对象">
            <div className="related-list">
              {related.tasks.slice(0, 8).map((t) => (
                <button key={t.id} onClick={() => go('tasks', t.id)}>
                  <span>
                    {t.id} · {t.name}
                  </span>
                  <Badge>{t.status}</Badge>
                  <ChevronRight size={14} />
                </button>
              ))}
              {related.caps.map((c) => (
                <button key={c.id} onClick={() => go('agents', c.id)}>
                  {c.name}
                  <Badge>{c.status}</Badge>
                </button>
              ))}
            </div>
            {related.tasks.length > 8 && (
              <small>共关联{related.tasks.length}项任务</small>
            )}
          </Panel>
        )}
      {r.page === 'alerts' && (
        <Panel title="核查与处置依据">
          <Fields
            items={[
              ['动作是否执行', '执行前阻断，未实际执行'],
              ['需人工介入原因', '需要核实授权配置、责任与恢复条件'],
              ['脱敏证据编号', r.fields.evidence],
              ['恢复原则', '保留基础授权限制，不重放原任务'],
            ]}
          />
          <div className="detail-links">
            <Button
              variant="outline"
              onClick={() => go('tasks', r.fields.task)}
            >
              查看任务链路
            </Button>
            <Button
              variant="outline"
              onClick={() => go('sandboxes', r.fields.sandbox)}
            >
              查看运行环境
            </Button>
            <Button
              variant="outline"
              onClick={() => go('rules', r.fields.rule)}
            >
              查看控制规则
            </Button>
          </div>
        </Panel>
      )}
      <Panel title="操作记录">
        <div className="history-list">
          {r.history
            .slice()
            .reverse()
            .map((h, i) => (
              <div key={i}>
                <Clock size={14} />
                <div>
                  <strong>{h.action}</strong>
                  <p>{h.detail}</p>
                  <small>{h.time} · 市中台</small>
                </div>
              </div>
            ))}
        </div>
      </Panel>
    </div>
  );
}
export function Usage({
  state: s,
  filters: f,
  go,
}: {
  state: State;
  filters: Filters;
  go: Navigate;
}) {
  const cc = filteredCalls(s, f).filter(
    (c) => !f.search || [c.task, c.id].some((v) => v.includes(f.search)),
  );
  const total = cc
    .filter((c) => c.metered)
    .reduce((n, c) => n + c.input + c.output, 0);
  const data = allUnits(s).map((u) => ({
    name: u.name.replace('市', ''),
    unit: u.id,
    input: cc
      .filter((c) => c.unit === u.id && c.metered)
      .reduce((n, c) => n + c.input, 0),
    output: cc
      .filter((c) => c.unit === u.id && c.metered)
      .reduce((n, c) => n + c.output, 0),
  }));
  return (
    <>
      <div className="metrics">
        <Stat
          label="本期Token用量"
          value={token(total)}
          note="输入＋输出；缓存不重复相加"
        />
        <Stat
          label="输入Token"
          value={token(data.reduce((n, d) => n + d.input, 0))}
          note="含已计量的缓存输入"
        />
        <Stat
          label="输出Token"
          value={token(data.reduce((n, d) => n + d.output, 0))}
          note="以计量记录为依据"
        />
        <Stat
          label="计量待回传"
          value={cc.filter((c) => !c.metered && c.type === '模型请求').length}
          unit="条"
          note="不作为零用量计入"
        />
      </div>
      <Panel
        title="单位用量对比"
        aside={
          <span>
            {f.from} 至 {f.to}
          </span>
        }
      >
        <div className="usage-chart">
          <ResponsiveContainer
            initialDimension={{ width: 600, height: 200 }}
            minWidth={0}
            width="100%"
            height="100%"
          >
            <BarChart
              data={data}
              onClick={(p) => {
                const row = data.find((d) => d.name === p?.activeLabel);
                if (row) go('usage', undefined, { unit: row.unit });
              }}
            >
              <CartesianGrid strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(v) => token(Number(v))} />
              <Tooltip />
              <Legend />
              <Bar name="输入Token" dataKey="input" fill="#4987df" />
              <Bar name="输出Token" dataKey="output" fill="#5fbeb0" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel
        title="调用计量明细"
        aside={<span>{cc.length}条 · 工具调用单独计次</span>}
      >
        <div className="table-scroll">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  '调用／任务',
                  '单位',
                  '类型／模型',
                  '输入',
                  '输出',
                  '缓存输入（已包含）',
                  '计量状态',
                ].map((n) => (
                  <TableHead key={n}>{n}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {cc.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <button
                      className="record-link"
                      onClick={() => go('tasks', c.task)}
                    >
                      {c.id}
                    </button>
                    <small>{c.task}</small>
                  </TableCell>
                  <TableCell>{unitName(c.unit, s)}</TableCell>
                  <TableCell>
                    {c.type}
                    <small>
                      {c.type === '模型请求'
                        ? s.rows.find((r) => r.id === c.model)?.name
                        : '—'}
                    </small>
                  </TableCell>
                  <TableCell>
                    {c.type === '工具调用'
                      ? '—'
                      : c.metered
                        ? fmt(c.input)
                        : '待回传'}
                  </TableCell>
                  <TableCell>
                    {c.type === '工具调用'
                      ? '—'
                      : c.metered
                        ? fmt(c.output)
                        : '待回传'}
                  </TableCell>
                  <TableCell>
                    {c.type === '工具调用'
                      ? '—'
                      : c.metered
                        ? fmt(c.cached)
                        : '待回传'}
                  </TableCell>
                  <TableCell>
                    <Badge>
                      {c.type === '工具调用'
                        ? '按调用计次'
                        : c.metered
                          ? '已计量'
                          : '待回传'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {cc.length === 0 && (
            <div className="empty-state">当前筛选没有调用记录</div>
          )}
        </div>
      </Panel>
    </>
  );
}
