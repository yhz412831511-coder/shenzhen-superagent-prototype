'use client';

import {
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import {
  Activity,
  AlarmClock,
  Archive,
  ArrowLeft,
  ArrowUpRight,
  Ban,
  BookOpenText,
  Boxes,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Database,
  FileSearch,
  Flame,
  GitCompareArrows,
  History,
  KeyRound,
  Layers3,
  Link2,
  ListChecks,
  LockKeyhole,
  MessageSquareWarning,
  Plus,
  RefreshCcw,
  RotateCcw,
  ScrollText,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Snowflake,
  Sparkles,
  ThermometerSun,
  Trash2,
  Workflow,
  X,
} from 'lucide-react';
import {
  CASE_AS_OF,
  CASE_SOURCE,
  MEMORY_KINDS,
  aiMemoryStories,
  type MemoryKind,
} from '../../shared/story-corpus';
import {
  KIND_MANAGEMENT,
  createInitialMemoryState,
  inferMemoryKind,
  memoryReducer,
  type ManagedMemory,
  type MemoryAction,
  type MemorySystemState,
} from './domain';
import './memory.css';

type PageId =
  | 'overview'
  | MemoryKind
  | 'sources'
  | 'evidence'
  | 'automation'
  | 'temperature'
  | 'grants'
  | 'calls'
  | 'issues'
  | 'audit';

type NavItem = { id: PageId; label: string; icon: typeof Search };

const navigation: { label: string; items: NavItem[] }[] = [
  {
    label: '个人总览',
    items: [{ id: 'overview', label: '我的记忆总览', icon: Activity }],
  },
  {
    label: '六类记忆治理',
    items: [
      { id: 'M1', label: '工作记忆', icon: BriefcaseBusiness },
      { id: 'M2', label: '语义记忆', icon: BookOpenText },
      { id: 'M3', label: '程序记忆', icon: ListChecks },
      { id: 'M4', label: '情景记忆', icon: History },
      { id: 'M5', label: '前瞻记忆', icon: AlarmClock },
      { id: 'M6', label: '组织记忆', icon: Boxes },
    ],
  },
  {
    label: '来源与证据',
    items: [
      { id: 'sources', label: '来源接入', icon: Link2 },
      { id: 'evidence', label: '证据与版本', icon: GitCompareArrows },
    ],
  },
  {
    label: '自动维护',
    items: [
      { id: 'automation', label: '自动整合', icon: Workflow },
      { id: 'temperature', label: '热温冷处理', icon: ThermometerSun },
    ],
  },
  {
    label: '授权与调用',
    items: [
      { id: 'grants', label: 'AI调用授权', icon: ShieldCheck },
      { id: 'calls', label: '调用记录', icon: FileSearch },
    ],
  },
  {
    label: '异常与审计',
    items: [
      { id: 'issues', label: '异常处理', icon: CircleAlert },
      { id: 'audit', label: '操作记录', icon: ScrollText },
    ],
  },
];

const PAGE_TITLES: Record<PageId, string> = Object.fromEntries(
  navigation.flatMap((group) =>
    group.items.map((item) => [item.id, item.label]),
  ),
) as Record<PageId, string>;

let retainedState = createInitialMemoryState();
let retainedView: { page: PageId; selected?: string } = { page: 'overview' };

function statusClass(value: string) {
  if (/异常|失败|失效|撤销|删除|阻断/.test(value)) return 'danger';
  if (/待|更新|部分|降级|运行中/.test(value)) return 'warning';
  if (/有效|完成|正常|提供|当前|解决/.test(value)) return 'success';
  return 'neutral';
}

function kindName(kind: MemoryKind) {
  return MEMORY_KINDS.find((item) => item.id === kind)?.name || kind;
}

function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mem-heading">
      <div>
        <span className="mem-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="mem-heading-actions">{actions}</div>}
    </header>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  return <span className={`mem-badge ${tone || 'neutral'}`}>{children}</span>;
}

type StoryScope = string;

function StoryScopeFilter({
  value,
  onChange,
}: {
  value: StoryScope;
  onChange: (value: StoryScope) => void;
}) {
  return (
    <label className="mem-story-filter">
      <span>固定案例</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as StoryScope)}
      >
        <option value="all">全部五条故事</option>
        {aiMemoryStories.map((story) => (
          <option key={story.id} value={story.id}>
            {story.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function matchesStory(memory: ManagedMemory, storyId: StoryScope) {
  if (storyId === 'all') return true;
  const story = aiMemoryStories.find((item) => item.id === storyId);
  return Boolean(
    story &&
      (story.taskIds.includes(memory.taskId) ||
        story.evidence.some((item) => item.memoryId === memory.id)),
  );
}

function StatCard({
  label,
  value,
  note,
  icon: Icon,
  onClick,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: typeof Search;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="mem-stat-icon">
        <Icon size={19} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
      {onClick && <ChevronRight size={17} />}
    </>
  );
  return onClick ? (
    <button className="mem-stat" onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className="mem-stat">{content}</div>
  );
}

function MemoryRow({
  memory,
  onOpen,
}: {
  memory: ManagedMemory;
  onOpen: (id: string) => void;
}) {
  return (
    <button className="mem-row" onClick={() => onOpen(memory.id)}>
      <span className={`mem-kind kind-${memory.kind}`}>{memory.kind}</span>
      <span className="mem-row-main">
        <span className="mem-row-title">
          <strong>{memory.title}</strong>
          {memory.protected && <LockKeyhole size={13} aria-label="保护对象" />}
        </span>
        <span>{memory.content}</span>
        <small>
          {memory.owner} · {memory.scope} · v{memory.version}
        </small>
      </span>
      <span className="mem-row-meta">
        <Badge tone={statusClass(memory.state)}>{memory.state}</Badge>
        <small>
          {memory.tier}层 · {memory.quality}
        </small>
      </span>
      <ChevronRight size={16} />
    </button>
  );
}

function Overview({
  state,
  go,
  onAdd,
}: {
  state: MemorySystemState;
  go: (page: PageId) => void;
  onAdd: () => void;
}) {
  const active = state.memories.filter(
    (memory) => !['已替代', '已停用', '已归档'].includes(memory.state),
  );
  const commitments = state.memories.filter(
    (memory) => memory.kind === 'M5' && memory.state === '有效',
  );
  const grants = state.grants.filter((grant) => grant.status === '有效');
  const needsMe = state.issues.filter(
    (issue) => issue.level === '需要本人判断' && issue.status !== '已解决',
  );
  return (
    <>
      <PageHeading
        eyebrow="本人拥有 · 系统自动维护"
        title="我的记忆总览"
        description="系统替我整理、校验和更新长期记忆；我只处理关键判断、授权和纠正。"
        actions={
          <button className="mem-primary" onClick={onAdd}>
            <Plus size={16} />
            新增记忆
          </button>
        }
      />
      <section className="mem-hero">
        <div>
          <Badge tone="success">当前视图已更新至 {CASE_AS_OF}</Badge>
          <h2>记得住，也能在来源变化后改得动</h2>
          <p>
            当前有效视图只保留本人有权使用、来源可追溯且适用于当前任务的内容。六类记忆采用不同规则维护，不把聊天记录、工作稿和组织事实混在一起。
          </p>
        </div>
        <div className="mem-hero-flow" aria-label="自动维护主链路">
          {[
            '工作自然发生',
            '自动分类与校验',
            '形成当前视图',
            '按需授权调用',
          ].map((label, index) => (
            <div key={label}>
              <span>{index + 1}</span>
              <b>{label}</b>
            </div>
          ))}
        </div>
      </section>
      <section className="mem-stat-grid">
        <StatCard
          label="当前有效记忆"
          value={active.length}
          note="已排除替代、停用和归档内容"
          icon={BrainCircuit}
          onClick={() => go('M1')}
        />
        <StatCard
          label="未完成承诺"
          value={commitments.length}
          note="始终保持活跃，不随时间降温"
          icon={AlarmClock}
          onClick={() => go('M5')}
        />
        <StatCard
          label="已授权AI"
          value={grants.length}
          note="每次任务仍按最小必要范围复验"
          icon={ShieldCheck}
          onClick={() => go('grants')}
        />
        <StatCard
          label="需要本人判断"
          value={needsMe.length}
          note="系统无法替代的业务取舍"
          icon={MessageSquareWarning}
          onClick={() => go('issues')}
        />
      </section>

      <div className="mem-two-column">
        <section className="mem-panel">
          <div className="mem-section-head">
            <div>
              <span>六类记忆治理</span>
              <h2>每类记忆回答不同问题</h2>
            </div>
            <small>点击进入专属工作台</small>
          </div>
          <div className="mem-kind-grid">
            {MEMORY_KINDS.map((kind) => {
              const config = KIND_MANAGEMENT[kind.id];
              const items = state.memories.filter(
                (memory) => memory.kind === kind.id,
              );
              return (
                <button key={kind.id} onClick={() => go(kind.id)}>
                  <span className={`mem-kind kind-${kind.id}`}>{kind.id}</span>
                  <div>
                    <strong>{kind.name}</strong>
                    <p>{config.question}</p>
                    <small>
                      {items.length}条 · {config.job}
                    </small>
                  </div>
                  <ChevronRight size={16} />
                </button>
              );
            })}
          </div>
        </section>
        <section className="mem-panel">
          <div className="mem-section-head">
            <div>
              <span>当前需要关注</span>
              <h2>异常只在影响工作时打扰我</h2>
            </div>
            <button className="mem-link" onClick={() => go('issues')}>
              全部异常
            </button>
          </div>
          <div className="mem-focus-list">
            {state.issues.slice(0, 3).map((issue) => (
              <button key={issue.id} onClick={() => go('issues')}>
                <Badge tone={statusClass(issue.level)}>{issue.level}</Badge>
                <strong>{issue.title}</strong>
                <span>{issue.impact}</span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="mem-panel mem-ownership-flow">
        <div>
          <span>归属与复用</span>
          <h2>个人经验与组织版本分别保留</h2>
        </div>
        <p>
          个人记忆经本人授权后，可提交不可变快照供组织评测；组织发布版本独立维护。岗位记忆包只是组织记忆按岗位与权限的筛选，不是第三个归属域，也不会覆盖个人后续编辑。
        </p>
      </section>

      <section className="mem-panel mem-maintenance-summary">
        <div className="mem-section-head">
          <div>
            <span>自动维护中心</span>
            <h2>冷热处理、压缩和纠错都在后台完成</h2>
          </div>
          <button className="mem-link" onClick={() => go('automation')}>
            查看全部作业
          </button>
        </div>
        <div className="mem-pipeline">
          {state.jobs.slice(0, 4).map((job) => (
            <button
              key={job.id}
              onClick={() =>
                go(job.type === '冷热迁移' ? 'temperature' : 'automation')
              }
            >
              <Badge tone={statusClass(job.status)}>{job.status}</Badge>
              <strong>{job.name}</strong>
              <span>{job.result}</span>
              <small>
                {job.updatedAt} · 影响{job.affected}项
              </small>
            </button>
          ))}
        </div>
      </section>

      <details className="mem-data-note">
        <summary>数据与访问说明</summary>
        <p>
          {CASE_SOURCE} · 快照时点 {CASE_AS_OF}
          。页面展示本人内容及本人获准使用的组织经验，不读取他人私有记忆。所有状态变化只在当前浏览会话中保留，刷新后恢复固定案例。
        </p>
      </details>
    </>
  );
}

function KindWorkspace({
  kind,
  state,
  openMemory,
}: {
  kind: MemoryKind;
  state: MemorySystemState;
  openMemory: (id: string) => void;
}) {
  const definition = MEMORY_KINDS.find((item) => item.id === kind)!;
  const config = KIND_MANAGEMENT[kind];
  const memories = state.memories.filter((memory) => memory.kind === kind);
  const active = memories.filter(
    (memory) => !['已停用', '已归档', '已替代'].includes(memory.state),
  );
  return (
    <>
      <PageHeading
        eyebrow={`六类记忆治理 / ${kind}`}
        title={definition.name}
        description={definition.definition}
        actions={<Badge tone="neutral">{memories.length}条个人可见记录</Badge>}
      />
      <section className="mem-governance-banner">
        <div>
          <span>核心问题</span>
          <strong>{config.question}</strong>
        </div>
        <div>
          <span>本人要完成的管理工作</span>
          <strong>{config.job}</strong>
        </div>
        <div>
          <span>管理后的结果</span>
          <strong>{config.result}</strong>
        </div>
      </section>
      <div className="mem-workspace-grid">
        <section className="mem-panel">
          <div className="mem-section-head">
            <div>
              <span>当前工作台</span>
              <h2>{active.length}条正在参与当前工作</h2>
            </div>
            <Badge tone="warning">{config.guardrail}</Badge>
          </div>
          <div className="mem-field-strip">
            {config.fields.map((field) => (
              <span key={field}>
                <Check size={13} /> {field}
              </span>
            ))}
          </div>
          <div className="mem-list">
            {memories.map((memory) => (
              <MemoryRow key={memory.id} memory={memory} onOpen={openMemory} />
            ))}
          </div>
        </section>
        <aside className="mem-panel mem-method-card">
          <span>差异化管理规则</span>
          <h2>{kind}不是普通文本条目</h2>
          <dl>
            <div>
              <dt>默认自动化</dt>
              <dd>{memories[0]?.automation || '按来源与风险判断'}</dd>
            </div>
            <div>
              <dt>允许本人操作</dt>
              <dd>{config.job}</dd>
            </div>
            <div>
              <dt>禁止动作</dt>
              <dd>{config.guardrail}</dd>
            </div>
            <div>
              <dt>生命周期保护</dt>
              <dd>
                {kind === 'M1' || kind === 'M5' || kind === 'M6'
                  ? '当前对象不会因时间或压缩自动退出有效集合'
                  : '按复用情况自动降温，仍保留来源和恢复入口'}
              </dd>
            </div>
          </dl>
          {kind === 'M3' && (
            <div className="mem-contribution-list">
              <span>独立贡献快照</span>
              {state.contributions.map((snapshot) => (
                <div key={snapshot.id}>
                  <strong>{snapshot.title}</strong>
                  <small>
                    个人v{snapshot.personalVersion} · {snapshot.status}
                  </small>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function SourcesPage({ state }: { state: MemorySystemState }) {
  return (
    <>
      <PageHeading
        eyebrow="来源与证据"
        title="来源接入"
        description="只连接本人明确使用或业务已授权的来源；同步水位、权威性和影响范围始终可见。"
      />
      <div className="mem-source-grid">
        {state.sources.map((source) => (
          <article className="mem-source-card" key={source.id}>
            <header>
              <span className="mem-source-icon">
                <Database size={20} />
              </span>
              <Badge tone={statusClass(source.status)}>{source.status}</Badge>
            </header>
            <h2>{source.name}</h2>
            <p>{source.scope}</p>
            <dl>
              <div>
                <dt>来源类型</dt>
                <dd>{source.category}</dd>
              </div>
              <div>
                <dt>权威边界</dt>
                <dd>{source.authority}</dd>
              </div>
              <div>
                <dt>同步水位</dt>
                <dd>{source.watermark}</dd>
              </div>
              <div>
                <dt>关联记忆</dt>
                <dd>{source.affected.length}条</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <section className="mem-panel mem-rule-panel">
        <h2>来源接入原则</h2>
        <div>
          <p>
            <b>自然产生优先</b>
            <span>先接本人任务、成果与明确修订，不默认扫描磁盘或聊天。</span>
          </p>
          <p>
            <b>已有确认复用</b>
            <span>源系统已批准的状态自动继承，不在记忆系统重复确认。</span>
          </p>
          <p>
            <b>读取时复验</b>
            <span>历史曾经有权不代表当前有权，每次调用都重新检查。</span>
          </p>
        </div>
      </section>
    </>
  );
}

function EvidencePage({
  state,
  openMemory,
}: {
  state: MemorySystemState;
  openMemory: (id: string) => void;
}) {
  const [story, setStory] = useState<StoryScope>('all');
  const memories = state.memories.filter((memory) => matchesStory(memory, story));
  return (
    <>
      <PageHeading
        eyebrow="来源与证据"
        title="证据与版本"
        description="原始来源、派生记忆和当前有效解释分层保存；纠正通过新版本表达。"
        actions={<StoryScopeFilter value={story} onChange={setStory} />}
      />
      <section className="mem-panel">
        <div className="mem-version-legend">
          <span>
            <i className="source" />
            原始来源
          </span>
          <span>
            <i className="derived" />
            派生记忆
          </span>
          <span>
            <i className="current" />
            当前有效视图
          </span>
        </div>
        <div className="mem-evidence-table">
          <div className="mem-table-head">
            <span>记忆对象</span>
            <span>来源与版本</span>
            <span>当前状态</span>
            <span>证据边界</span>
            <span />
          </div>
          {memories.map((memory) => (
            <button key={memory.id} onClick={() => openMemory(memory.id)}>
              <span>
                <b>{memory.kind}</b>
                {memory.title}
              </span>
              <span>
                {memory.source}
                <small>
                  v{memory.version} · {memory.date}
                </small>
              </span>
              <span>
                <Badge tone={statusClass(memory.state)}>{memory.state}</Badge>
              </span>
              <span>{memory.evidence}</span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function AutomationPage({
  state,
  dispatch,
}: {
  state: MemorySystemState;
  dispatch: (action: MemoryAction) => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="自动维护"
        title="自动整合"
        description="确定性状态走快路径，摘要和归纳走模型慢路径；慢路径失败不阻塞可信状态读取。"
      />
      <section className="mem-automation-map">
        {[
          ['增量采集', '复用来源权限、去重并保存证据'],
          ['分类与关联', '自动建议M1—M6及事项关系'],
          ['质量闸门', '检查关键字段、引用、权限和版本'],
          ['当前视图', '只发布有效、可追溯、当前有权内容'],
          ['周期对账', '修复漏事件、失效依赖和作业积压'],
        ].map(([title, description], index) => (
          <div key={title}>
            <span>{index + 1}</span>
            <strong>{title}</strong>
            <p>{description}</p>
          </div>
        ))}
      </section>
      <section className="mem-panel">
        <div className="mem-section-head">
          <div>
            <span>维护作业</span>
            <h2>失败先重试、降级或隔离</h2>
          </div>
          <Badge tone="neutral">{state.jobs.length}项</Badge>
        </div>
        <div className="mem-job-list">
          {state.jobs.map((job) => (
            <article key={job.id}>
              <div className="mem-job-mark">
                <Settings2 size={18} />
              </div>
              <div>
                <span>{job.type}</span>
                <strong>{job.name}</strong>
                <p>{job.result}</p>
                <small>
                  {job.updatedAt} · 影响{job.affected}项
                </small>
              </div>
              <Badge tone={statusClass(job.status)}>{job.status}</Badge>
              {job.retryable && (
                <button
                  className="mem-secondary"
                  onClick={() => dispatch({ type: 'retry-job', id: job.id })}
                >
                  <RefreshCcw size={14} />
                  安全重试
                </button>
              )}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function TemperaturePage({
  state,
  dispatch,
  openMemory,
}: {
  state: MemorySystemState;
  dispatch: (action: MemoryAction) => void;
  openMemory: (id: string) => void;
}) {
  const tiers = [
    { id: '热', icon: Flame, text: '当前工作、临近承诺和高频依据' },
    { id: '温', icon: ThermometerSun, text: '按需调用的方法、术语与经历' },
    { id: '冷', icon: Snowflake, text: '低频历史、旧版本和替代依据' },
  ] as const;
  return (
    <>
      <PageHeading
        eyebrow="自动维护"
        title="热温冷自动处理"
        description="温度只影响访问和存储方式，不决定真实性、有效性、权限或保留状态。"
        actions={
          <button
            className="mem-primary"
            onClick={() => dispatch({ type: 'run-temperature' })}
          >
            <ThermometerSun size={15} />
            立即执行评估
          </button>
        }
      />
      <section className="mem-tier-grid">
        {tiers.map(({ id, icon: Icon, text }) => {
          const items = state.memories.filter((memory) => memory.tier === id);
          return (
            <article key={id}>
              <Icon size={22} />
              <div>
                <h2>{id}层</h2>
                <p>{text}</p>
              </div>
              <strong>{items.length}条</strong>
              <small>
                {id === '热'
                  ? '实时参与当前工作'
                  : id === '温'
                    ? '需要时快速召回'
                    : '保留目录与证据，可恢复'}
              </small>
            </article>
          );
        })}
      </section>
      <div className="mem-workspace-grid">
        <section className="mem-panel">
          <div className="mem-section-head">
            <div>
              <span>对象级处理</span>
              <h2>同一事项可以同时存在热、温、冷表示</h2>
            </div>
          </div>
          <div className="mem-list">
            {state.memories.map((memory) => (
              <div className="mem-lifecycle-row" key={memory.id}>
                <button onClick={() => openMemory(memory.id)}>
                  <span className={`mem-kind kind-${memory.kind}`}>
                    {memory.kind}
                  </span>
                  <span>
                    <strong>{memory.title}</strong>
                    <small>
                      {memory.retention} · {memory.quality}
                    </small>
                  </span>
                </button>
                <Badge
                  tone={
                    memory.tier === '冷'
                      ? 'neutral'
                      : memory.tier === '温'
                        ? 'warning'
                        : 'success'
                  }
                >
                  {memory.tier}层
                </Badge>
                {memory.protected ? (
                  <span className="mem-protected">
                    <LockKeyhole size={13} />
                    {memory.protectedReason}
                  </span>
                ) : memory.tier === '冷' || memory.state === '已归档' ? (
                  <button
                    className="mem-secondary"
                    onClick={() => dispatch({ type: 'restore', id: memory.id })}
                  >
                    <RotateCcw size={14} />
                    恢复
                  </button>
                ) : (
                  <button
                    className="mem-secondary"
                    onClick={() => dispatch({ type: 'archive', id: memory.id })}
                  >
                    <Archive size={14} />
                    归档
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
        <aside className="mem-panel mem-policy-list">
          <span>自动处理规则</span>
          <h2>关键对象永不因年龄丢失</h2>
          <p>
            <CheckCircle2 size={16} />
            未完成承诺始终保持活跃
          </p>
          <p>
            <CheckCircle2 size={16} />
            有效权限每次读取都重新校验
          </p>
          <p>
            <CheckCircle2 size={16} />
            当前工作恢复点不会自动降温
          </p>
          <p>
            <CheckCircle2 size={16} />
            现行规则即使两年前发布仍进入当前视图
          </p>
          <p>
            <CheckCircle2 size={16} />
            归档、撤回、删除分别执行
          </p>
        </aside>
      </div>
    </>
  );
}

function GrantsPage({
  state,
  dispatch,
}: {
  state: MemorySystemState;
  dispatch: (action: MemoryAction) => void;
}) {
  const [story, setStory] = useState<StoryScope>('all');
  const grants = state.grants.filter(
    (grant) => story === 'all' || grant.storyIds?.includes(story),
  );
  return (
    <>
      <PageHeading
        eyebrow="授权与调用"
        title="AI调用授权"
        description="本人授权的是用途和范围，不是把全部记忆交给某个AI；每次调用仍执行权限复验。"
        actions={<StoryScopeFilter value={story} onChange={setStory} />}
      />
      <div className="mem-grant-grid">
        {grants.map((grant) => (
          <article
            key={grant.id}
            className={grant.status === '已撤销' ? 'revoked' : ''}
          >
            <header>
              <span className="mem-ai-icon">
                <BrainCircuit size={21} />
              </span>
              <Badge tone={statusClass(grant.status)}>{grant.status}</Badge>
            </header>
            <h2>{grant.ai}</h2>
            <p>{grant.purpose}</p>
            <div className="mem-kind-chips">
              {grant.kinds.map((kind) => (
                <span key={kind}>{kind}</span>
              ))}
            </div>
            <dl>
              <div>
                <dt>允许范围</dt>
                <dd>{grant.scope}</dd>
              </div>
              <div>
                <dt>有效期</dt>
                <dd>{grant.expires}</dd>
              </div>
              <div>
                <dt>最近调用</dt>
                <dd>{grant.lastUsed}</dd>
              </div>
            </dl>
            <footer>
              <button
                className="mem-secondary"
                onClick={() => dispatch({ type: 'adjust-grant', id: grant.id })}
                disabled={grant.status !== '有效'}
              >
                <Settings2 size={14} />
                调整范围
              </button>
              <button
                className={
                  grant.status === '已撤销' ? 'mem-secondary' : 'mem-danger'
                }
                onClick={() => dispatch({ type: 'revoke-grant', id: grant.id })}
              >
                {grant.status === '已撤销' ? (
                  <RotateCcw size={14} />
                ) : (
                  <Ban size={14} />
                )}
                {grant.status === '已撤销' ? '恢复授权' : '撤销授权'}
              </button>
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}

function CallsPage({ state }: { state: MemorySystemState }) {
  const [story, setStory] = useState<StoryScope>('all');
  const calls = state.calls.filter(
    (call) => story === 'all' || call.storyId === story,
  );
  return (
    <>
      <PageHeading
        eyebrow="授权与调用"
        title="调用记录"
        description="每次调用记录用途、覆盖范围、证据包和阻断结果；调用成功不等于正式业务结论。"
        actions={<StoryScopeFilter value={story} onChange={setStory} />}
      />
      <section className="mem-panel">
        <div className="mem-call-list">
          {calls.map((call) => (
            <article key={call.id}>
              <span className={`mem-call-icon ${statusClass(call.result)}`}>
                {call.result === '已阻断' ? (
                  <LockKeyhole size={18} />
                ) : (
                  <KeyRound size={18} />
                )}
              </span>
              <div>
                <small>
                  {call.time} · {call.ai}
                </small>
                <h2>{call.purpose}</h2>
                <p>{call.evidence}</p>
                <span>{call.coverage}</span>
              </div>
              <Badge tone={statusClass(call.result)}>{call.result}</Badge>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function IssuesPage({
  state,
  dispatch,
}: {
  state: MemorySystemState;
  dispatch: (action: MemoryAction) => void;
}) {
  const retryJob = state.jobs.find((job) => job.id === 'job-summary');
  return (
    <>
      <PageHeading
        eyebrow="异常与审计"
        title="异常处理"
        description="自动重试、降级和隔离优先；只有真正影响当前工作且需要本人判断时才打扰我。"
      />
      <div className="mem-issue-list">
        {state.issues.map((issue) => (
          <article key={issue.id}>
            <header>
              <Badge tone={statusClass(issue.level)}>{issue.level}</Badge>
              <Badge tone={statusClass(issue.status)}>{issue.status}</Badge>
            </header>
            <h2>{issue.title}</h2>
            <p>{issue.reason}</p>
            <div>
              <b>影响</b>
              <span>{issue.impact}</span>
            </div>
            <footer>
              {issue.id === 'issue-summary-gap' && retryJob?.retryable && (
                <button
                  className="mem-primary"
                  onClick={() =>
                    dispatch({ type: 'retry-job', id: retryJob.id })
                  }
                >
                  <RefreshCcw size={14} />
                  安全重试
                </button>
              )}
              {issue.level === '需要本人判断' && (
                <button
                  className="mem-secondary"
                  onClick={() =>
                    dispatch({ type: 'resolve-issue', id: issue.id })
                  }
                >
                  保持待核
                </button>
              )}
              <span>{issue.related.length}条相关记忆</span>
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}

function AuditPage({ state }: { state: MemorySystemState }) {
  const [story, setStory] = useState<StoryScope>('all');
  const audit = state.audit.filter(
    (entry) => story === 'all' || entry.storyId === story,
  );
  return (
    <>
      <PageHeading
        eyebrow="异常与审计"
        title="操作记录"
        description="本人控制、系统自动维护和权威来源变化分别记录，原始记录不被覆盖。"
        actions={<StoryScopeFilter value={story} onChange={setStory} />}
      />
      <section className="mem-panel">
        <div className="mem-audit-list">
          {audit.map((entry) => (
            <article key={entry.id}>
              <span>
                <ScrollText size={17} />
              </span>
              <div>
                <small>
                  {entry.time} · {entry.actor}
                </small>
                <h2>{entry.action}</h2>
                <p>{entry.object}</p>
              </div>
              <strong>{entry.result}</strong>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function MemoryDetail({
  memory,
  state,
  dispatch,
  onBack,
  onOpen,
  onConversation,
}: {
  memory: ManagedMemory;
  state: MemorySystemState;
  dispatch: (action: MemoryAction) => void;
  onBack: () => void;
  onOpen: (id: string) => void;
  onConversation: (id: string) => void;
}) {
  const config = KIND_MANAGEMENT[memory.kind];
  const source = state.sources.find((item) =>
    item.affected.includes(memory.id),
  );
  return (
    <>
      <button className="mem-back" onClick={onBack}>
        <ArrowLeft size={15} />
        返回{kindName(memory.kind)}工作台
      </button>
      <PageHeading
        eyebrow={`${memory.kind} · ${kindName(memory.kind)} / 记忆详情`}
        title={memory.title}
        description={`${memory.owner} · ${memory.scope}`}
        actions={<Badge tone={statusClass(memory.state)}>{memory.state}</Badge>}
      />
      <div className="mem-detail-layout">
        <article className="mem-panel mem-detail-main">
          <div className="mem-state-dimensions">
            <div>
              <span>有效状态</span>
              <b>{memory.state}</b>
            </div>
            <div>
              <span>访问温度</span>
              <b>{memory.tier}层</b>
            </div>
            <div>
              <span>质量状态</span>
              <b>{memory.quality}</b>
            </div>
            <div>
              <span>保留状态</span>
              <b>{memory.retention}</b>
            </div>
          </div>
          <section>
            <span className="mem-detail-label">
              当前内容 · v{memory.version}
            </span>
            <p className="mem-detail-prose">{memory.content}</p>
            <div className="mem-effect-box">
              <Sparkles size={17} />
              <div>
                <b>对工作的帮助</b>
                <p>{memory.effect}</p>
              </div>
            </div>
          </section>
          <section>
            <span className="mem-detail-label">该类记忆的专属字段</span>
            <div className="mem-field-strip">
              {config.fields.map((field) => (
                <span key={field}>
                  <Check size={13} />
                  {field}
                </span>
              ))}
            </div>
            {memory.reminder && (
              <p className="mem-inline-note">
                <Clock3 size={15} />
                个人提醒：{memory.reminder}
              </p>
            )}
            {memory.contribution && (
              <p className="mem-inline-note">
                <Send size={15} />
                组织贡献：{memory.contribution}
              </p>
            )}
            {memory.protected && (
              <p className="mem-inline-note">
                <LockKeyhole size={15} />
                保护原因：{memory.protectedReason}
              </p>
            )}
          </section>
          <section>
            <span className="mem-detail-label">来源与证据</span>
            <p className="mem-source-code">{memory.source}</p>
            <blockquote>{memory.evidence}</blockquote>
            <div className="mem-source-summary">
              <Database size={17} />
              <div>
                <b>{source?.name || '本人工作来源'}</b>
                <span>
                  {source?.status || '来源引用已保留'} ·{' '}
                  {source?.watermark || memory.date}
                </span>
              </div>
            </div>
            <button
              className="mem-secondary"
              onClick={() => onConversation(memory.taskId)}
            >
              查看来源对话
              <ArrowUpRight size={14} />
            </button>
          </section>
          <section>
            <span className="mem-detail-label">版本与变化原因</span>
            <ol className="mem-version-timeline">
              {[...memory.history].reverse().map((entry, index) => (
                <li key={`${entry.version}-${index}`}>
                  <i />
                  <div>
                    <b>
                      v{entry.version} · {entry.reason}
                    </b>
                    <time>{entry.date}</time>
                    <p>{entry.content}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </article>
        <aside className="mem-detail-side">
          <section className="mem-panel">
            <span>本人可执行的管理动作</span>
            <h2>{config.job}</h2>
            <div className="mem-action-stack">
              {memory.kind === 'M1' && (
                <button
                  className="mem-primary"
                  onClick={() => onConversation(memory.taskId)}
                >
                  恢复原工作
                  <ArrowUpRight size={14} />
                </button>
              )}
              {memory.kind !== 'M6' && (
                <button
                  className="mem-secondary"
                  onClick={() => dispatch({ type: 'correct', id: memory.id })}
                >
                  生成纠正版
                </button>
              )}
              {memory.kind === 'M3' && (
                <button
                  className="mem-secondary"
                  onClick={() =>
                    dispatch({ type: 'contribute', id: memory.id })
                  }
                >
                  <Send size={14} />
                  贡献方法快照
                </button>
              )}
              {memory.kind === 'M4' && (
                <button
                  className="mem-secondary"
                  onClick={() => dispatch({ type: 'rebuild', id: memory.id })}
                >
                  <RefreshCcw size={14} />
                  重算关联摘要
                </button>
              )}
              {memory.kind === 'M5' && (
                <>
                  <button
                    className="mem-secondary"
                    onClick={() =>
                      dispatch({ type: 'update-reminder', id: memory.id })
                    }
                  >
                    <AlarmClock size={14} />
                    调整提醒
                  </button>
                  <button
                    className="mem-secondary"
                    onClick={() =>
                      dispatch({ type: 'complete-commitment', id: memory.id })
                    }
                  >
                    本人标记完成
                  </button>
                </>
              )}
              {memory.kind === 'M6' && (
                <button
                  className="mem-primary"
                  onClick={() => dispatch({ type: 'feedback', id: memory.id })}
                >
                  <MessageSquareWarning size={14} />
                  提交纠错反馈
                </button>
              )}
              {memory.kind !== 'M6' && (
                <button
                  className="mem-secondary"
                  onClick={() =>
                    dispatch({ type: 'toggle-active', id: memory.id })
                  }
                >
                  {memory.state === '已停用' ? (
                    <RotateCcw size={14} />
                  ) : (
                    <Ban size={14} />
                  )}
                  {memory.state === '已停用' ? '恢复调用' : '停用记忆'}
                </button>
              )}
              {memory.kind !== 'M6' && memory.retention !== '撤回' && (
                <button
                  className="mem-secondary"
                  onClick={() => dispatch({ type: 'withdraw', id: memory.id })}
                >
                  <RotateCcw size={14} />
                  撤回当前版本
                </button>
              )}
              {!memory.protected && memory.state !== '已归档' && (
                <button
                  className="mem-secondary"
                  onClick={() => dispatch({ type: 'archive', id: memory.id })}
                >
                  <Archive size={14} />
                  归档
                </button>
              )}
              {memory.owner === '杨XX' && memory.kind !== 'M6' && (
                <button
                  className="mem-danger"
                  onClick={() =>
                    dispatch({ type: 'delete-derived', id: memory.id })
                  }
                >
                  <Trash2 size={14} />
                  删除个人派生内容
                </button>
              )}
            </div>
            <p className="mem-guardrail">
              <LockKeyhole size={14} />
              {config.guardrail}
            </p>
          </section>
          <section className="mem-panel">
            <span>关联记忆</span>
            <div className="mem-related-list">
              {memory.related.map((id) => {
                const related = state.memories.find((item) => item.id === id);
                return related ? (
                  <button key={id} onClick={() => onOpen(id)}>
                    <small>
                      {related.kind} · {related.state}
                    </small>
                    <strong>{related.title}</strong>
                    <ChevronRight size={15} />
                  </button>
                ) : null;
              })}
              {!memory.related.length && (
                <p>暂无直接关联。系统不会仅因文字相似自动合并正式事项。</p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

function AddMemoryDialog({
  open,
  onClose,
  dispatch,
}: {
  open: boolean;
  onClose: () => void;
  dispatch: (action: MemoryAction) => void;
}) {
  const [text, setText] = useState('');
  const [selectedKind, setSelectedKind] = useState<MemoryKind>('M1');
  if (!open) return null;
  return (
    <div className="mem-modal-backdrop">
      <button
        className="mem-modal-dismiss"
        aria-label="关闭新增记忆窗口"
        onClick={onClose}
      />
      <section className="mem-modal" aria-labelledby="add-memory-title">
        <header>
          <div>
            <span>自然语言新增</span>
            <h2 id="add-memory-title">告诉系统需要记住什么</h2>
          </div>
          <button aria-label="关闭" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <p>
          系统建议类别、范围和来源；你只需核对关键判断，不需要手工建立分类体系。
        </p>
        <textarea
          value={text}
          onChange={(event) => {
            const nextText = event.target.value;
            setText(nextText);
            if (nextText) setSelectedKind(inferMemoryKind(nextText));
          }}
          placeholder="例如：下周三前继续跟踪基础设施处补交验收材料，到期前一天提醒我。"
        />
        {text && (
          <div className="mem-add-preview">
            <span>系统建议</span>
            <div className="mem-add-kind-row">
              {MEMORY_KINDS.map((kind) => (
                <button
                  key={kind.id}
                  className={selectedKind === kind.id ? 'active' : ''}
                  onClick={() => setSelectedKind(kind.id)}
                >
                  {kind.id} {kind.name}
                </button>
              ))}
            </div>
            <dl>
              <div>
                <dt>作用范围</dt>
                <dd>本人私有；仅在具体任务授权后调用</dd>
              </div>
              <div>
                <dt>来源</dt>
                <dd>本人主动补充</dd>
              </div>
              <div>
                <dt>自动维护</dt>
                <dd>{KIND_MANAGEMENT[selectedKind].job}</dd>
              </div>
            </dl>
          </div>
        )}
        <footer>
          <button className="mem-secondary" onClick={onClose}>
            取消
          </button>
          <button
            className="mem-primary"
            disabled={!text.trim()}
            onClick={() => {
              dispatch({ type: 'add', text: text.trim(), kind: selectedKind });
              setText('');
              onClose();
            }}
          >
            <Check size={15} />
            确认保存
          </button>
        </footer>
      </section>
    </div>
  );
}

export default function MemoryProduct({
  switcher,
  onConversation,
}: {
  switcher: ReactNode;
  onConversation: (id: string) => void;
}) {
  const [state, dispatch] = useReducer(memoryReducer, retainedState);
  const [page, setPage] = useState<PageId>(retainedView.page);
  const [selected, setSelected] = useState<string | undefined>(
    retainedView.selected,
  );
  const [addOpen, setAddOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const selectedMemory = useMemo(
    () => state.memories.find((memory) => memory.id === selected),
    [selected, state.memories],
  );

  useEffect(() => {
    retainedState = state;
    retainedView = { page, selected };
  }, [page, selected, state]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [page, selected]);
  useEffect(() => {
    if (!state.notice) return;
    const timer = window.setTimeout(
      () => dispatch({ type: 'clear-notice' }),
      4200,
    );
    return () => window.clearTimeout(timer);
  }, [state.notice]);

  const go = (next: PageId) => {
    setSelected(undefined);
    setPage(next);
    setMobileNav(false);
  };
  const openMemory = (id: string) => {
    setSelected(id);
    setMobileNav(false);
  };
  const renderPage = () => {
    if (selectedMemory)
      return (
        <MemoryDetail
          memory={selectedMemory}
          state={state}
          dispatch={dispatch}
          onBack={() => setSelected(undefined)}
          onOpen={openMemory}
          onConversation={onConversation}
        />
      );
    if (page === 'overview')
      return <Overview state={state} go={go} onAdd={() => setAddOpen(true)} />;
    if (MEMORY_KINDS.some((kind) => kind.id === page))
      return (
        <KindWorkspace
          kind={page as MemoryKind}
          state={state}
          openMemory={openMemory}
        />
      );
    if (page === 'sources') return <SourcesPage state={state} />;
    if (page === 'evidence')
      return <EvidencePage state={state} openMemory={openMemory} />;
    if (page === 'automation')
      return <AutomationPage state={state} dispatch={dispatch} />;
    if (page === 'temperature')
      return (
        <TemperaturePage
          state={state}
          dispatch={dispatch}
          openMemory={openMemory}
        />
      );
    if (page === 'grants')
      return <GrantsPage state={state} dispatch={dispatch} />;
    if (page === 'calls') return <CallsPage state={state} />;
    if (page === 'issues')
      return <IssuesPage state={state} dispatch={dispatch} />;
    if (page === 'audit') return <AuditPage state={state} />;
    return <Overview state={state} go={go} onAdd={() => setAddOpen(true)} />;
  };

  return (
    <div className="mem-app">
      <aside className={`mem-sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="mem-brand">
          <span>
            <BrainCircuit size={25} />
          </span>
          <div>
            <strong>记忆管理</strong>
            <small>我的长期记忆与控制中心</small>
          </div>
        </div>
        <nav aria-label="个人记忆管理导航">
          {navigation.map((group) => (
            <section key={group.label}>
              <span>{group.label}</span>
              {group.items.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={page === id && !selected ? 'active' : ''}
                  onClick={() => go(id)}
                >
                  <Icon size={16} />
                  {label}
                  {id === 'issues' &&
                    state.issues.some(
                      (issue) =>
                        issue.level === '需要本人判断' &&
                        issue.status !== '已解决',
                    ) && <i>1</i>}
                </button>
              ))}
            </section>
          ))}
        </nav>
        <div className="mem-account">
          <b>杨XX</b>
          <span>深圳市XX局 · XX处</span>
          <small>本人记忆所有者视图</small>
        </div>
      </aside>
      {mobileNav && (
        <button
          className="mem-nav-scrim"
          aria-label="关闭导航"
          onClick={() => setMobileNav(false)}
        />
      )}
      <div className="mem-main">
        <header className="mem-top">
          <button
            className="mem-menu-button"
            aria-label="打开导航"
            onClick={() => setMobileNav(true)}
          >
            <Layers3 size={19} />
          </button>
          <span>
            个人空间 <i>/</i>{' '}
            {selectedMemory ? '记忆详情与证据' : PAGE_TITLES[page]}
          </span>
          <div className="mem-top-actions">
            <button
              className="mem-reset"
              onClick={() => dispatch({ type: 'reset' })}
            >
              <RotateCcw size={14} />
              重置案例
            </button>
            <div className="product-switch-slot">{switcher}</div>
          </div>
        </header>
        <main className="mem-content">{renderPage()}</main>
      </div>
      {state.notice && (
        <output className="mem-toast">
          <CheckCircle2 size={17} />
          <span>{state.notice}</span>
          <button
            aria-label="关闭"
            onClick={() => dispatch({ type: 'clear-notice' })}
          >
            <X size={15} />
          </button>
        </output>
      )}
      <AddMemoryDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        dispatch={dispatch}
      />
    </div>
  );
}
