'use client';
import { oaAssignment } from './fiscal-catalog';
import { currentUser } from './current-user';
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertCircle,
  Zap,
  ArrowLeft,
  ArrowUpRight,
  Bot,
  Check,
  ChevronDown,
  Copy,
  FileText,
  Folder,
  HardDrive,
  Cloud,
  Database,
  History,
  Globe2,
  ShieldCheck,
  Plus,
  Search,
  Play,
  Pause,
  Clock3,
  MousePointer2,
  BrainCircuit,
} from 'lucide-react';
import { useWorkspace } from './workspace-store';
import { useAppearance } from './appearance';
import {
  current,
  eligible,
  kindLabels,
  type SavedContext,
  type WorkTask,
} from './memory-domain';
import {
  assets,
  agentDetailProfiles,
  digitalProfiles,
  fiscalAgent,
  paymentSkill,
  projectAgent,
  systems,
  originalRemarks,
  type CatalogEntry,
  type SystemId,
} from './fiscal-catalog';
import {
  formatTime,
  taskFor,
  type Artifact,
  type Automation,
  type Command,
  type CommandAction,
  type Flow,
  type Operation,
  type Project,
} from './fiscal-domain';
import { MemoryReminders } from './memory-reminders';
import {
  conversationTurns,
  confirmationResolution,
  isRoutineOperation,
  operationTitle,
  authorizationLabel,
  turnText,
  type OperationGroup,
} from './conversation-view';
import {
  canUsePersonalItem,
  formatFileSize,
  knowledgeBaseContext,
  knowledgeBaseProfiles,
  personalItemContext,
  type PersonalLibraryItem,
} from './library-domain';
export type Target = {
  kind:
    | 'system'
    | 'artifact'
    | 'operation'
    | 'operation-group'
    | 'capability'
    | 'file';
  annotationId?: string;
  id: string;
};

type AgentCapabilityDetail = {
  title: string;
  work: string;
  result: string;
  basisType: string;
  sourceIds: string[];
};

type AgentDetailProfile = {
  id: string;
  type: string;
  organization: string;
  officialDutySummary: string;
  dutySupport: string[];
  rolePositioning: string;
  serviceAudience: string[];
  initialCapabilities: AgentCapabilityDetail[];
  requiredContext: string[];
  expectedOutputs: string[];
  basisSourceIds: string[];
  basisLabel: string;
  basisNote: string;
  serviceBoundaries: string[];
  sampleQuestions: string[];
};

function agentProfileFor(entry: CatalogEntry): AgentDetailProfile | undefined {
  if (entry.kind !== '专业智能体') return undefined;
  const officialProfile = digitalProfiles.agents.find((agent) => agent.id === entry.id);
  if (officialProfile) {
    return {
      ...officialProfile,
      basisLabel: '业务场景资料',
      basisNote: officialProfile.businessSource,
    };
  }

  const configuredProfile = agentDetailProfiles.profiles.find(
    (agent) => agent.id === entry.id,
  );
  if (!configuredProfile) return undefined;
  return {
    ...configuredProfile,
    organization: entry.publisher,
    officialDutySummary: entry.owned
      ? `${entry.publisher}当前已配置${entry.category}领域的基础辅助能力。`
      : `${entry.publisher}的目录共建方向，具体职责与业务规则待共建单位确认。`,
    basisSourceIds: [],
    initialCapabilities: entry.details.map((title, index) => ({
      title,
      work: configuredProfile.capabilityWork[index],
      result: configuredProfile.capabilityResults[index],
      basisType: configuredProfile.basisLabel,
      sourceIds: [],
    })),
  };
}
export function Btn({
  children,
  onClick,
  primary = false,
  disabled = false,
  small = false,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`fw-btn ${primary ? 'primary' : ''} ${small ? 'small' : ''}`}
    >
      {children}
    </button>
  );
}
export function Tag({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`fw-tag ${tone}`}>{children}</span>;
}
export function PlainText({ text }: { text: string }) {
  const markdown = text
    .replace(/^(\d+)[、．]\s*/gm, '$1. ')
    .replace(/^([一二三四五六七八九十]+)、([^\n]+)$/gm, '## $1、$2');
  return (
    <div className="fw-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
export function SafetyDetail({ op }: { op: Operation }) {
  return (
    <div className="fw-safety-detail">
      <div className="fw-row">
        <Tag
          tone={
            op.risk === '高' ? 'amber' : op.risk === '中' ? 'blue' : 'green'
          }
        >
          {op.risk}风险
        </Tag>
        <span>{authorizationLabel(op)} · {op.status}</span>
      </div>
      <p>{op.scope}</p>
      <dl>
        <dt>操作身份</dt>
        <dd>{op.actor}</dd>
        <dt>操作时间</dt>
        <dd>{formatTime(op.at)}</dd>
        <dt>依据版本</dt>
        <dd>v{op.version}</dd>
        {op.capability && (
          <>
            <dt>能力版本</dt>
            <dd>
              {op.capability.name} · v{op.capability.version}
            </dd>
          </>
        )}
        {op.system && (
          <>
            <dt>来源系统</dt>
            <dd>{systems[op.system].name}</dd>
          </>
        )}
      </dl>
      <ul className="fw-checks">
        {op.checks.map((c, i) => (
          <li key={i} className={c.passed ? 'pass' : 'fail'}>
            {c.passed ? '✓' : '!'} {c.label}
          </li>
        ))}
      </ul>
      <p>{op.detail}</p>
      {op.receipt && <p className="fw-meta">回执编号：{op.receipt}</p>}
      {op.items?.map((i) => (
        <p key={i.id}>
          {i.id} · {i.status}
        </p>
      ))}
    </div>
  );
}
export function OperationRow({
  op,
  resolution,
}: {
  op: Operation;
  resolution?: Operation;
}) {
  const abnormal = op.status !== '成功';
  const statusLabel =
    isRoutineOperation(op)
      ? `${op.risk}风险 · ${authorizationLabel(op)} · 完成`
      : op.status === '成功'
      ? '高风险操作 · 已执行'
      : op.status === '待确认'
        ? '需要本人确认'
        : op.status === '失败'
          ? '执行失败'
          : op.status === '部分成功'
            ? '部分完成'
            : op.status;
  const Icon = abnormal
    ? AlertCircle
    : [
          'save-method',
          'share-method',
          'review',
          'discover-capability',
          'guide',
          'consultation',
        ].includes(op.cmd)
      ? BrainCircuit
      : ['report', 'prepare-materials', 'upload-materials'].includes(op.cmd)
        ? FileText
        : Globe2;
  return (
    <>
      <details
        className={'fw-operation' + (abnormal ? ' abnormal' : '')}
        data-status={op.status}
        data-risk={op.risk}
      >
        <summary>
          <Icon size={16} />
          <span className="fw-operation-title">{operationTitle(op)}</span>
          <span
            className={abnormal ? 'fw-warning-text' : 'fw-operation-status'}
          >
            {resolution ? '已确认并执行' : statusLabel}
          </span>
          <ChevronDown size={14} />
        </summary>
        {resolution && (
          <p className="fw-meta">
            此记录保留当时的确认请求，后续操作已完成本人确认。
            <a href={'#message-' + resolution.messageId}>查看后续执行</a>
          </p>
        )}
        <SafetyDetail op={op} />
      </details>
      {abnormal && (
        <p className="fw-operation-alert" data-status={op.status}>
          {op.detail}
        </p>
      )}
    </>
  );
}
export function OperationGroupRow({group,onOpen}:{group:OperationGroup;onOpen:(t:Target)=>void}) {
  const systemsLabel=group.systems.length?` · 涉及 ${group.systems.length} 个系统`:'';
  return <button type="button" className="fw-operation-group" onClick={()=>onOpen({kind:'operation-group',id:group.id})} aria-label={`查看本轮 ${group.operations.length} 项执行记录`}>
    <History size={14}/><span className="fw-operation-group-title">执行记录 {group.operations.length} 项{systemsLabel}</span><ArrowUpRight size={13}/>
  </button>;
}

export function OperationGroupDetail({group,onOpen}:{group:OperationGroup;onOpen:(t:Target)=>void}) {
  return <div className="fw-operation-group-detail">
    <header><h3>本轮执行记录</h3><p>{group.operations.length} 项操作 · 涉及 {group.systems.length} 个系统</p></header>
    <div className="fw-operation-group-assurance"><ShieldCheck size={15}/><span>最高{group.maxRisk}风险 · {group.authorization==='本地处理'?'全部在本地完成':`${group.operations.length}/${group.operations.length} 项检查通过`}</span></div>
    <div className="fw-operation-group-records">
      {group.operations.map(op=><button type="button" key={op.id} onClick={()=>onOpen({kind:'operation',id:op.id})}><Check size={14}/><span><strong>{operationTitle(op)}</strong><small>{op.system?systems[op.system].name:'任务工作区'} · {formatTime(op.at)}</small></span><ArrowUpRight size={13}/></button>)}
    </div>
  </div>;
}
export function ArtifactRow({
  art,
  onOpen,
}: {
  art: Artifact;
  onOpen: () => void;
}) {
  return (
    <button type="button" className="fw-artifact-row" onClick={onOpen}>
      <span className="fw-file-icon">
        <FileText size={19} />
      </span>
      <span>
        <strong>{art.name}</strong>
        <small>
          v{art.version} · {art.source}
        </small>
      </span>
      <ArrowUpRight size={16} />
    </button>
  );
}
const stageNames: Record<string, string> = {
  read: '读取支付申请',
  review: '检查支付备注',
  findings: '确认疑点与核对方法',
  rules: '穿透式监管规则核查',
  report: '生成审查结果',
  delivery: '确认结果处理方式',
  receipt: '核实回执',
  oa: '读取交办事项',
  guide: '咨询办理指引',
  create: '建立运维项目',
  fill: '核对基础信息',
  assets: '关联并同步资产',
  materials: '整理申报材料',
  upload: '确认材料上传',
  estimate: '获取费用估算',
  submit: '选择提交方式',
  manual: '等待本人提交反馈',
  tracking: '创建反馈追踪',
  complete: '可查看既有办理记录，并在对话中继续补充工作',
  consult: '专业咨询',
  feedback: '处理审核反馈',
};
export function DecisionPanel({
  flow,
  onOpen,
  onMemory,
}: {
  flow: Flow;
  onOpen: (t: Target) => void;
  onMemory: (id: string) => void;
}) {
  const { state, dispatch } = useWorkspace();
  const [first, setFirst] = useState('用途描述存疑，退回补充说明'),
    [second, setSecond] = useState('用途描述存疑，退回补充说明');
  const run = (cmd: Command, extra: Partial<CommandAction> = {}) =>
    dispatch({ type: 'command', taskId: flow.id, cmd, ...extra });
  const method = state.memory.memories.find((m) => m.id === flow.memoryId),
    p = method ? current(method).payload : flow.candidate;
  const contribution = state.memory.contributions.find(
    (c) => c.id === flow.contributionId,
  );
  if (flow.historical) return null;
  if (flow.stopped)
    return (
      <div className="fw-decision">
        <strong>任务已暂停</strong>
        <p>后续操作不会发起；已发出的请求仍需核实回执。</p>
        <Btn
          primary
          onClick={() =>
            dispatch({ type: 'stop', taskId: flow.id, stopped: false })
          }
        >
          恢复任务
        </Btn>
      </div>
    );
  if (flow.pending)
    return (
      <div className="fw-decision">
        <strong>确认本次操作</strong>
        <p>{flow.operations.at(-1)?.scope}</p>
        <p className="fw-meta">
          核对对象版本 v{flow.pending.revision}。确认后再次检查授权。
        </p>
        <Btn
          primary
          onClick={() => dispatch({ ...flow.pending!, confirmed: true })}
        >
          确认并执行
        </Btn>
        <Btn
          onClick={() => dispatch({ type: 'cancel-pending', taskId: flow.id })}
        >
          取消本次操作
        </Btn>
      </div>
    );
  return (
    <>
      {flow.kind === 'payment' && p?.kind === 'procedural' && (
        <div className="fw-decision">
          <div className="fw-row">
            <BrainCircuit size={18} />
            <strong>{method ? '本次保存的程序记忆' : '请核对程序记忆'}</strong>
            <Tag>
              {contribution
                ? {
                    submitted: '等待组织采纳',
                    accepted: '组织已采纳',
                    returned: '待修改',
                    withdrawn: '已撤回',
                  }[contribution.status]
                : method
                  ? '已保存到个人'
                  : '待保存'}
            </Tag>
          </div>
          <p>{p.method}</p>
          <details>
            <summary>查看方法及共享范围</summary>
            <p>适用条件：{p.conditions}</p>
            <ol>
              {p.steps.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ol>
            <p>例外：{p.exceptions}</p>
            <p className="fw-meta">
              贡献仅包含以上结构化内容，不包含任务原话、原始单据及个人信息。
            </p>
          </details>
          <div className="fw-actions">
            {!method ? (
              <Btn onClick={() => run('save-method')} primary>
                确认并保存记忆
              </Btn>
            ) : (
              <>
                <Btn onClick={() => onMemory(method.id)}>查看或纠正记忆</Btn>
                {!contribution && (
                  <Btn
                    primary
                    onClick={() => run('share-method', { confirmed: true })}
                  >
                    确认以上内容并贡献组织
                  </Btn>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {!['complete', 'consult', 'feedback'].includes(flow.stage) && (
        <div className="fw-decision">
          <strong>{stageNames[flow.stage]}</strong>
          {flow.stage === 'read' && (
            <>
              <p>本周期申请只读获取，按申请编号及版本去重。</p>
              <Btn primary onClick={() => run('read-payments')}>
                读取本周期申请
              </Btn>
            </>
          )}
          {flow.stage === 'review' && (
            <>
              <p>使用支付备注隐晦表达审查 Skill。</p>
              <Btn primary onClick={() => run('review')}>
                开始备注审查
              </Btn>
            </>
          )}
          {flow.stage === 'findings' && (
            <>
              <p>请在对话中补充核对方法，或直接确认各笔处理意见。</p>
              <label>
                第一笔 · 年薪补差
                <select
                  value={first}
                  onChange={(e) => setFirst(e.target.value)}
                >
                  <option>用途描述存疑，退回补充说明</option>
                  <option>保留疑点，进一步核实</option>
                </select>
              </label>
              <label>
                第二笔 · 绩效分析平台
                <select
                  value={second}
                  onChange={(e) => setSecond(e.target.value)}
                >
                  <option>用途描述存疑，退回补充说明</option>
                  <option>材料不足，继续核实</option>
                </select>
              </label>
              <Btn
                primary
                onClick={() =>
                  run('confirm-findings', { value: { first, second } })
                }
              >
                确认两笔处理意见
              </Btn>
            </>
          )}
          {flow.stage === 'rules' && (
            <>
              <p>检查其他必要规则，保留已确认的备注疑点。</p>
              <Btn primary onClick={() => run('check-rules')}>
                执行其他规则核查
              </Btn>
            </>
          )}
          {flow.stage === 'report' && (
            <Btn primary onClick={() => run('report')}>
              生成审查结果
            </Btn>
          )}
          {flow.stage === 'delivery' && (
            <>
              <p>回写审查意见、疑点标记及汇总材料，不执行支付审批。</p>
              <div className="fw-actions">
                <Btn
                  primary
                  onClick={() => run('writeback', { confirmed: true })}
                >
                  确认结果并回写智慧财政
                </Btn>
                <Btn onClick={() => run('draft-only')}>仅保留草稿</Btn>
              </div>
            </>
          )}
          {flow.stage === 'receipt' && (
            <>
              <p>已成功的申请不会重复回写。回执待核实时先查询原请求。</p>
              <div className="fw-actions">
                <Btn primary onClick={() => run('query-receipt')}>
                  查询回执
                </Btn>
                <Btn
                  onClick={() => run('writeback', { confirmed: true })}
                  disabled={flow.operations.some(
                    (o) => o.cmd === 'writeback' && o.status === '待核实',
                  )}
                >
                  重试失败项
                </Btn>
              </div>
            </>
          )}
          {flow.stage === 'oa' && (
            <Btn primary onClick={() => run('read-oa')}>
              读取 OA 交办事项
            </Btn>
          )}
          {flow.stage === 'guide' && (
            <Btn primary onClick={() => run('guide')}>
              咨询项目统筹处数字人
            </Btn>
          )}
          {flow.stage === 'create' && (
            <Btn primary onClick={() => run('create-project')}>
              按指引启动申报办理
            </Btn>
          )}
          {flow.stage === 'fill' && (
            <>
              <p>核对申报单位、预算单位、历史项目及服务周期。</p>
              <div className="fw-actions">
                <Btn onClick={() => onOpen({ kind: 'system', id: 'pm' })}>
                  打开项管平台核对
                </Btn>
                <Btn primary onClick={() => run('save-project')}>
                  保存当前基础信息
                </Btn>
              </div>
            </>
          )}
          {flow.stage === 'assets' && (
            <>
              <p>先从数字资源系统选择资产，再同步回项管平台。</p>
              <div className="fw-actions">
                <Btn
                  onClick={() => onOpen({ kind: 'system', id: 'resources' })}
                >
                  查看并选择资产
                </Btn>
                {!flow.assetIds.length ? (
                  <Btn
                    primary
                    onClick={() =>
                      run('select-assets', {
                        assetIds: assets.map((x) => x.id),
                      })
                    }
                  >
                    选择本项目四项资产
                  </Btn>
                ) : (
                  <Btn primary onClick={() => run('sync-assets')}>
                    同步 {flow.assetIds.length} 项资产至项管平台
                  </Btn>
                )}
              </div>
            </>
          )}
          {flow.stage === 'materials' && (
            <Btn primary onClick={() => run('prepare-materials')}>
              依据本处室资料整理材料
            </Btn>
          )}
          {flow.stage === 'upload' && (
            <>
              <p>
                将下方七份材料传入项管平台草稿，尚不发起审批。请先查看内容和版本。
              </p>
              <Btn
                primary
                onClick={() => run('upload-materials', { confirmed: true })}
              >
                确认当前材料并上传
              </Btn>
            </>
          )}
          {flow.stage === 'estimate' && (
            <Btn primary onClick={() => run('estimate')}>
              读取项管平台费用估算
            </Btn>
          )}
          {flow.stage === 'submit' && (
            <>
              <p>
                费用估算 {flow.estimate?.total.toFixed(2)}{' '}
                万元。正式提交后进入主管单位内审，再由政数局审核。
              </p>
              <div className="fw-actions">
                <Btn primary onClick={() => run('manual-submit')}>
                  由我前往项管平台提交
                </Btn>
                <Btn onClick={() => run('submit-project', { confirmed: true })}>
                  确认并自动提交审批
                </Btn>
              </div>
            </>
          )}
          {flow.stage === 'manual' && (
            <p>请在项管平台完成提交，再在下方对话中告知“我已经提交了”。</p>
          )}
          {flow.stage === 'tracking' && (
            <>
              <p>
                收到项目反馈后主动推送，解析原因，列出修改清单和建议。不会自动修改或重新提交。
              </p>
              <div className="fw-actions">
                <Btn primary onClick={() => run('track')}>
                  创建审核反馈追踪
                </Btn>
                <Btn onClick={() => run('no-track')}>暂不创建</Btn>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
export function Conversation({
  task,
  onOpen,
  onMemory,
}: {
  task: WorkTask;
  onOpen: (t: Target) => void;
  onMemory: (id: string) => void;
}) {
  const { state, dispatch } = useWorkspace(),
    flow = state.flows[task.id];
  const { value: appearance } = useAppearance();
  const initialScroll = useRef(task.savedScroll);
  const lastScroll = useRef(task.savedScroll);
  const scroll = useRef<HTMLDivElement>(null),
    followBottom = useRef(task.savedScroll === 0),
    last = useRef(task.messages.length),
    [newMessages, setNewMessages] = useState(false),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = initialScroll.current;
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (lastScroll.current !== initialScroll.current)
        dispatch({
          type: 'memory',
          action: {
            type: 'scroll',
            taskId: task.id,
            position: lastScroll.current,
          },
        });
    };
  }, [dispatch, task.id]);
  useEffect(() => {
    const el = scroll.current;
    if (!el || last.current === task.messages.length) return;
    const sentByUser = task.messages
      .slice(last.current)
      .some((message) => message.role === 'user');
    const frame = requestAnimationFrame(() => {
      if (followBottom.current || sentByUser) {
        el.scrollTop = el.scrollHeight;
        setNewMessages(false);
      } else setNewMessages(true);
    });
    last.current = task.messages.length;
    return () => cancelAnimationFrame(frame);
  }, [task.messages]);
  const arts =
    flow?.artifactIds.map((id) => state.artifacts[id]).filter(Boolean) || [];
  const turns = conversationTurns(
    task,
    flow?.operations,
    arts,
    appearance.showRoutineOperations ? 'expanded' : 'summary',
  );
  const lastAssistantTurn = turns.findLast((t) => t.role === 'assistant');
  return (
    <div
      className="fw-conversation"
      ref={scroll}
      onScroll={() => {
        const el = scroll.current;
        if (el)
          followBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < 160;
        if (timer.current) clearTimeout(timer.current);
        const position = scroll.current?.scrollTop || 0;
        lastScroll.current = position;
        timer.current = setTimeout(
          () =>
            dispatch({
              type: 'memory',
              action: { type: 'scroll', taskId: task.id, position },
            }),
          180,
        );
      }}
    >
      <div className="fw-message-column">
        {flow && (
          <div className="fw-task-origin">
            <Tag>{flow.source}</Tag>
            {!flow.historical && flow.stage !== 'complete' && (
              <span>{flow.status}</span>
            )}
          </div>
        )}
        {turns.map((turn) => (
          <section
            key={turn.id}
            className={'fw-turn ' + turn.role}
            aria-label={
              turn.role === 'user'
                ? '用户消息'
                : turn.role === 'system'
                  ? '任务事件'
                  : '智能体回复'
            }
          >
            {turn.segments.filter(segment=>segment.kind!=='operation-group').map(segment => {
              const {message:m,operation:op}=segment.block;
              return <article key={m.id} className={'fw-message '+m.role+(op?' execution':'')} id={'message-'+m.id}>
                {m.role==='system'&&!op?<div className="fw-system-message"><Clock3 size={14}/><span>{m.text}</span></div>:<div className="fw-message-content">
                  {op?<OperationRow op={op} resolution={confirmationResolution(op,flow?.operations||[])}/>:<>
                    <PlainText text={m.text}/>
                    {state.workspaceFeedback?.find(f=>f.taskId===task.id&&f.messageId===m.id)?.annotations.map((note,index)=><button className="fw-source-entry" key={note.id} onClick={()=>onOpen({...note.target,annotationId:note.id})}><MousePointer2 size={13}/> 标注 {index+1} · {note.title}</button>)}
                    {m.text.includes('程序记忆候选')&&flow?.candidate&&<details className="fw-inline-memory fw-source-entry"><summary><BrainCircuit size={14}/>查看本次整理的方法</summary><p>{flow.candidate.conditions}</p><ol>{flow.candidate.steps.map((x,i)=><li key={i}>{x}</li>)}</ol><p>例外：{flow.candidate.exceptions}</p>{flow.memoryId&&<Btn small onClick={()=>onMemory(flow.memoryId!)}>打开关联记忆</Btn>}</details>}
                  </>}
                </div>}
              </article>;
            })}
            {turn.artifacts.length > 0 && (
              <div className="fw-turn-artifacts" aria-label="本轮成果">
                {turn.artifacts.slice(0, 3).map((a) => (
                  <ArtifactRow
                    key={a.id}
                    art={a}
                    onOpen={() => onOpen({ kind: 'artifact', id: a.id })}
                  />
                ))}
                {turn.artifacts.length > 3 && (
                  <details className="fw-artifact-more">
                    <summary>另有 {turn.artifacts.length - 3} 项成果</summary>
                    {turn.artifacts.slice(3).map((a) => (
                      <ArtifactRow
                        key={a.id}
                        art={a}
                        onOpen={() => onOpen({ kind: 'artifact', id: a.id })}
                      />
                    ))}
                  </details>
                )}
              </div>
            )}
            {flow?.agentId &&
              turn.blocks.some(
                (b) =>
                  b.operation?.cmd === 'guide' ||
                  b.operation?.cmd === 'consultation',
              ) && (
                <div className="fw-source-line">
                  <Bot size={14} />
                  专业指引来源：
                  {state.catalog.find((c) => c.id === flow.agentId)?.name ||
                    '专业智能体'}
                </div>
              )}
            {turn.segments.filter(segment=>segment.kind==='operation-group').map(segment=>segment.kind==='operation-group'?<article key={segment.group.id} className="fw-message assistant execution fw-execution-summary"><div className="fw-message-content"><OperationGroupRow group={segment.group} onOpen={onOpen}/></div></article>:null)}
            {turn.role === 'assistant' && turn.id === lastAssistantTurn?.id && (
              <>
                {task.uses.length > 0 && (
                  <details className="fw-memory-references fw-source-entry">
                    <summary>
                      <BrainCircuit size={14} />
                      参考了 {task.uses.length} 项记忆
                    </summary>
                    {task.uses.map((r, i) => {
                      const m = state.memory.memories.find(
                        (x) => x.id === r.memoryId,
                      );
                      return (
                        <button key={i} onClick={() => onMemory(r.memoryId)}>
                          {m ? current(m).title : '来源已不可访问'} ·{' '}
                          {r.revisionId}
                          <ArrowUpRight size={13} />
                        </button>
                      );
                    })}
                  </details>
                )}
                {flow && (
                  <DecisionPanel
                    flow={flow}
                    onOpen={onOpen}
                    onMemory={onMemory}
                  />
                )}
              </>
            )}
            {turn.role !== 'system' && (
              <div className="fw-turn-tools">
                {turn.role === 'assistant' && turnText(turn) && (
                  <button
                    className="fw-copy"
                    title="复制本轮回复"
                    aria-label="复制本轮回复"
                    onClick={() =>
                      void navigator.clipboard?.writeText(turnText(turn))
                    }
                  >
                    <Copy size={14} />
                  </button>
                )}
                <time dateTime={turn.blocks[0].message.at}>
                  {formatTime(turn.blocks[0].message.at)}
                </time>
              </div>
            )}
          </section>
        ))}
        {flow && !lastAssistantTurn && (
          <DecisionPanel flow={flow} onOpen={onOpen} onMemory={onMemory} />
        )}
        {!flow && task.pending.length > 0 && (
          <div className="fw-decision">
            <strong>可用于本次工作的记忆</strong>
            <p>授权后，相关记忆会用于这次工作；不会扩大对外分享范围。</p>
            {task.pending.map((r) => {
              const m = state.memory.memories.find((x) => x.id === r.memoryId);
              return (
                <p key={r.memoryId}>{m ? current(m).title : r.memoryId}</p>
              );
            })}
            <Btn
              primary
              onClick={() =>
                dispatch({
                  type: 'memory',
                  action: {
                    type: 'grant',
                    taskId: task.id,
                    refs: task.pending,
                  },
                })
              }
            >
              用于本次任务
            </Btn>
          </div>
        )}
      </div>
      {newMessages && (
        <button
          className="fw-new-messages"
          onClick={() => {
            scroll.current?.scrollTo({
              top: scroll.current.scrollHeight,
              behavior: 'smooth',
            });
            setNewMessages(false);
          }}
        >
          有新消息 · 回到最新 ↓
        </button>
      )}
    </div>
  );
}
export function Monitor({
  task,
  onOpen,
  onMemory,
  onShowFiles,
}: {
  task: WorkTask;
  onOpen: (t: Target) => void;
  onMemory: (id: string) => void;
  onShowFiles?: () => void;
}) {
  const { state } = useWorkspace(),
    f = state.flows[task.id];
  const memories = state.memory.memories.filter(
    (m) =>
      current(m).source.taskId === task.id ||
      task.uses.some((u) => u.memoryId === m.id),
  );
  const usedCapabilities = [
    ...new Set([
      ...(f?.agentId ? [f.agentId] : []),
      ...(f?.operations.some((o) => o.cmd === 'guide') ? [projectAgent] : []),
      ...(f?.operations.some((o) => o.cmd === 'review') ? [paymentSkill] : []),
    ]),
  ].flatMap((id) => {
    const c = state.catalog.find((c) => c.id === id);
    return c ? [c] : [];
  });
  const usedSystems = [
    ...new Set(
      f?.operations.flatMap((o) => (o.system ? [o.system] : [])) || [],
    ),
  ];
  const attentionOperations=f?.operations.filter(op=>op.risk==='高'||op.status!=='成功'||(op.risk!=='无'&&(!op.checks.length||op.checks.some(check=>!check.passed))))||[];
  const operationGroups=conversationTurns(task,f?.operations).flatMap(turn=>turn.segments.flatMap(segment=>segment.kind==='operation-group'?[segment.group]:[]));
  const recentArtifacts=(f?.artifactIds||[]).slice(-3).reverse();
  const securitySection=<details className={attentionOperations.length?'fw-monitor-attention':''} open={attentionOperations.length>0}>
    <summary>安全与授权 <span>{attentionOperations.length?`${attentionOperations.length} 项需关注`:`${f?.operations.length||0} 项检查已记录`}</span></summary>
    {attentionOperations.map(op=><button className="fw-detail-link" key={op.id} onClick={()=>onOpen({kind:'operation',id:op.id})}><AlertCircle size={15}/><span>{operationTitle(op)}<small>{op.status==='待确认'?'需要本人确认':op.status==='成功'?'高风险操作已执行':op.status}</small></span><ArrowUpRight size={13}/></button>)}
    {!attentionOperations.length&&operationGroups.slice(-3).reverse().map(group=><OperationGroupRow key={group.id} group={group} onOpen={onOpen}/>)}
    {!f?.operations.length&&<p className="fw-meta">尚未发起系统操作。</p>}
  </details>;
  return (
    <aside className="fw-monitor">
      <h3>任务概览</h3>
      {!!attentionOperations.length&&securitySection}
      <details open>
        <summary>
          处理进度{' '}
          {f && !f.historical && f.stage !== 'complete' && (
            <Tag>{f.status}</Tag>
          )}
        </summary>
        <p>{f ? stageNames[f.stage] : '依据当前任务内容继续办理'}</p>
        {f?.decisions.slice(-1).map((d, i) => (
          <p className="fw-small-line" key={i}>
            <Check size={14} />
            {d.text}
          </p>
        ))}
        {!!f && f.decisions.length > 1 && (
          <details className="fw-monitor-history">
            <summary>查看此前 {f.decisions.length - 1} 项决定</summary>
            {f.decisions.slice(0, -1).map((d, i) => (
              <p className="fw-small-line" key={i}>
                <Check size={14} />
                {d.text}
              </p>
            ))}
          </details>
        )}
        {f?.submission === 'user-reported' && (
          <p className="fw-meta">
            提交来源：本人告知已提交。尚未取得平台提交回执。
          </p>
        )}
        {f?.submission === 'system-confirmed' && (
          <p className="fw-meta">提交来源：项管平台正式提交回执。</p>
        )}
        {f?.tracking && (
          <p className="fw-meta">
            审核反馈追踪已创建；新反馈将生成独立跟进任务。
          </p>
        )}
        {f &&
          !f.historical &&
          ['payment', 'maintenance'].includes(f.kind) &&
          f.stage !== 'complete' && (
            <Btn
              small
              onClick={() =>
                document
                  .querySelector('.fw-decision:last-of-type')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              定位当前待办
            </Btn>
          )}
      </details>
      <details open>
        <summary>
          材料与成果 <span>{f?.artifactIds.length || 0}</span>
        </summary>
        {recentArtifacts.map((id) => (
          <ArtifactRow
            key={id}
            art={state.artifacts[id]}
            onOpen={() => onOpen({ kind: 'artifact', id })}
          />
        ))}
        {!f?.artifactIds.length && <p className="fw-meta">尚未形成成果。</p>}
        {(f?.artifactIds.length||0)>3&&<button className="fw-monitor-more" onClick={onShowFiles}>查看其余 {(f?.artifactIds.length||0)-3} 项成果<ArrowUpRight size={13}/></button>}
      </details>
      <details>
        <summary>
          系统与能力 <span>{usedSystems.length + usedCapabilities.length}</span>
        </summary>
        {usedSystems.map((id) => (
          <button
            className="fw-detail-link"
            key={id}
            onClick={() => onOpen({ kind: 'system', id })}
          >
            <Globe2 size={14} />
            <span>{systems[id].name}</span>
            <ArrowUpRight size={13} />
          </button>
        ))}
        {usedCapabilities.map((entry) => (
          <button
            key={entry.id}
            className="fw-detail-link"
            onClick={() => onOpen({ kind: 'capability', id: entry.id })}
          >
            {entry.kind === 'Skill' ? <Zap size={14} /> : <Bot size={14} />}
            <span>
              {entry.name}
              <small>
                {entry.kind} · v{entry.version}
              </small>
            </span>
            <ArrowUpRight size={13} />
          </button>
        ))}
      </details>
      <details>
        <summary>
          本次记忆 <span>{memories.length}</span>
        </summary>
        {memories.map((m) => (
          <button
            key={m.id}
            className="fw-detail-link"
            onClick={() => onMemory(m.id)}
          >
            <BrainCircuit size={15} />
            <span>
              {current(m).title}
              <small>
                {kindLabels[current(m).payload.kind]} · v{current(m).number}
              </small>
            </span>
          </button>
        ))}
        {f?.contributionId && (
          <p className="fw-meta">
            组织贡献：
            {state.memory.contributions.find((x) => x.id === f.contributionId)
              ?.status === 'accepted'
              ? '维护者已采纳'
              : '等待维护者处理'}
          </p>
        )}
      </details>
      {!attentionOperations.length&&securitySection}
    </aside>
  );
}
export function ArtifactPreview({
  artifact,
  onBack,
}: {
  artifact?: Artifact;
  onBack: () => void;
}) {
  const { state, dispatch } = useWorkspace(),
    [note, setNote] = useState('');
  if (!artifact)
    return (
      <div className="fw-empty">
        <h2>未找到此成果</h2>
        <p>请返回任务选择有效文件，不会打开其他文件替代。</p>
        <Btn onClick={onBack}>返回对话</Btn>
      </div>
    );
  return (
    <div className="fw-preview">
      <div className="fw-preview-toolbar">
        <Btn small onClick={onBack}>
          <ArrowLeft size={14} />
          返回对话
        </Btn>
        <span>{artifact.name}</span>
        <Tag>v{artifact.version}</Tag>
        <Tag>只读预览</Tag>
        {artifact.version !== state.flows[artifact.taskId]?.version && (
          <Tag tone="amber">历史版本 · 当前办理不再采用</Tag>
        )}
      </div>
      <div className="fw-paper">
        <PlainText text={artifact.body} />
        <footer>
          来源：{artifact.source}
          <br />
          形成时间：{formatTime(artifact.createdAt)}
        </footer>
      </div>
      <section className="fw-annotation">
        <h3>批注</h3>
        {artifact.annotations.map((a, i) => (
          <p key={i}>
            {a.text}
            <small>{formatTime(a.at)}</small>
          </p>
        ))}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="记录需要补充或修订的内容"
          aria-label="成果批注"
        />
        <Btn
          disabled={!note.trim()}
          onClick={() => {
            dispatch({ type: 'annotate', id: artifact.id, text: note });
            setNote('');
          }}
        >
          保存批注
        </Btn>
      </section>
    </div>
  );
}
export type SystemViewState = {
  tab?: string;
  edits?: Partial<Project>;
  selection?: string[];
};
export function SystemPage({
  system,
  flow,
  onOpen,
  view = {},
  onViewChange,
}: {
  system: SystemId;
  flow: Flow;
  onOpen: (t: Target) => void;
  view?: SystemViewState;
  onViewChange: (changes: Partial<SystemViewState>) => void;
}) {
  const { state, dispatch } = useWorkspace();
  const { tab = '项目概况', edits = {}, selection } = view;
  const setTab = (tab: string) => onViewChange({ tab });
  const form = { ...flow.project, ...edits },
    selected = selection || flow.assetIds;
  const setForm = (p: Partial<Project>) =>
      onViewChange({ edits: { ...edits, ...p } }),
    setSelected = (ids: string[]) => onViewChange({ selection: ids });

  const readonly =
    flow.historical ||
    flow.submission === 'user-reported' ||
    flow.submission === 'system-confirmed';
  const run = (cmd: Command, extra: Partial<CommandAction> = {}) =>
    dispatch({
      type: 'command',
      taskId: flow.id,
      cmd,
      source: 'browser',
      ...extra,
    });
  const field = (label: string, key: keyof Project, options?: string[]) => (
    <label key={key}>
      {label}
      {options ? (
        <select
          disabled={readonly}
          value={form[key]}
          onChange={(e) => setForm({ [key]: e.target.value })}
        >
          {options.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      ) : (
        <input
          disabled={readonly}
          value={form[key]}
          onChange={(e) => setForm({ [key]: e.target.value })}
        />
      )}
    </label>
  );
  const selectedAssets = assets.filter((a) =>
    (system === 'resources' ? flow.assetIds : flow.syncedIds).includes(a.id),
  );
  return (
    <div className="fw-system">
      <header>
        <span className="fw-system-logo">
          <Globe2 size={23} />
        </span>
        <strong>{systems[system].name}</strong>
        <span>{currentUser.name} · {currentUser.organization}</span>
      </header>
      <div className="fw-system-path">
        {systems[system].path}
        {readonly && (
          <Tag>
            {flow.historical
              ? '历史查看'
              : flow.submission === 'user-reported'
                ? '本人告知已提交 · 只读'
                : '已提交 · 只读'}
          </Tag>
        )}
      </div>
      <div className="fw-system-body">
        {(system === 'payment' || system === 'supervision') && (
          <>
            <h2>
              {system === 'payment' ? '本周期支付申请' : '支付申请规则核查'}
            </h2>
            <p>
              {flow.period
                ? `${formatTime(flow.period.start)} 至 ${formatTime(flow.period.end)}`
                : '当前任务关联申请'}
            </p>
            <div className="fw-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>申请编号 / 版本</th>
                    <th>支付用途备注原文</th>
                    <th>经办意见</th>
                    <th>
                      {system === 'payment' ? '回写状态' : '其他必要规则'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {flow.stage !== 'read' &&
                    originalRemarks.map((r, i) => (
                      <tr key={r}>
                        <td>PAY-{i + 1} / v1</td>
                        <td>{r}</td>
                        <td>{flow.findings[i]}</td>
                        <td>
                          {system === 'payment'
                            ? flow.written[`PAY-${i + 1}:v1`]
                              ? '已存草稿，未提交'
                              : '未回写'
                            : flow.rulePassed
                              ? '本次检查通过'
                              : '待核查'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {flow.stage === 'read' && (
              <Btn
                disabled={readonly}
                primary
                onClick={() => run('read-payments')}
              >
                读取本周期申请
              </Btn>
            )}
            {system === 'supervision' && flow.stage === 'rules' && (
              <Btn
                disabled={readonly}
                primary
                onClick={() => run('check-rules')}
              >
                执行关联规则核查
              </Btn>
            )}
            {system === 'payment' && flow.stage === 'delivery' && (
              <Btn disabled={readonly} primary onClick={() => run('writeback')}>
                申请回写审查意见
              </Btn>
            )}
            <p className="fw-meta">
              原始案例中的 ZYZXJK120154 为规则标识；PAY
              编号为本地场景申请标识。此处不办理资金拨付。
            </p>
          </>
        )}
        {system === 'oa' && (
          <>
            <h2>运维项目申报交办事项</h2>
            <dl>
              <dt>交办单号</dt>
              <dd>{oaAssignment.id}</dd>
              <dt>交办来源</dt>
              <dd>财政局领导</dd>
              <dt>承办人员</dt>
              <dd>{currentUser.name} · {currentUser.organization}</dd>
              <dt>工作要求</dt>
              <dd>
                向政数局申报本单位财政资金穿透式监管系统运维项目，并获得费用估算。
              </dd>
              <dt>办理状态</dt>
              <dd>{flow.status}</dd>
            </dl>
            {flow.stage === 'oa' && (
              <Btn primary onClick={() => run('read-oa')}>
                读取交办内容
              </Btn>
            )}
          </>
        )}
        {system === 'resources' && (
          <>
            <h2>关联运维资产</h2>
            <p>{flow.project.name}</p>
            <p className="fw-meta">
              建设项目：{flow.project.history} · 合同 CZ-CT-2024-01
            </p>
            <div className="fw-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>选择</th>
                    <th>资产编码</th>
                    <th>资产名称</th>
                    <th>类别 / 状态</th>
                    <th>重要程度</th>
                    <th>采购额（万元）</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <input
                          aria-label={`选择${a.name}`}
                          type="checkbox"
                          disabled={readonly}
                          checked={selected.includes(a.id)}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? [...selected, a.id]
                                : selected.filter((x) => x !== a.id),
                            )
                          }
                        />
                      </td>
                      <td>{a.id}</td>
                      <td>{a.name}</td>
                      <td>{a.category} / 在用</td>
                      <td>{a.importance}</td>
                      <td>{a.purchase}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="fw-actions">
              <Btn
                disabled={readonly}
                onClick={() => run('select-assets', { assetIds: selected })}
              >
                暂存选择
              </Btn>
              <Btn
                disabled={readonly || !flow.assetIds.length}
                primary
                onClick={() => run('sync-assets')}
              >
                同步已暂存清单至项管平台
              </Btn>
            </div>
            <p>
              已暂存 {selectedAssets.length} 项；项管平台已关联{' '}
              {flow.syncedIds.length} 项。
            </p>
            <p className="fw-meta">资产同步只更新运维对象，不触发正式申报。</p>
          </>
        )}
        {system === 'pm' && (
          <>
            <h2>{flow.project.name}</h2>
            {flow.stage === 'create' ? (
              <div className="fw-decision">
                <strong>选择申报项目类型</strong>
                <p>运维类项目 · 运行维护服务</p>
                <Btn primary onClick={() => run('create-project')}>
                  确定并建立草稿
                </Btn>
              </div>
            ) : (
              <>
                <div className="fw-system-tabs">
                  {[
                    '项目概况',
                    '运维对象情况',
                    '运维服务费用',
                    '详版立项方案／其它附件',
                  ].map((t) => (
                    <button
                      className={tab === t ? 'active' : ''}
                      key={t}
                      onClick={() => setTab(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {tab === '项目概况' && (
                  <>
                    <h3>项目基本信息</h3>
                    <div className="fw-form-grid">
                      {field('项目名称', 'name')}
                      {field('预算起始年度', 'year')}
                      {field('项目申报单位', 'unit')}
                      {field('项目建设单位', 'constructionUnit')}
                      {field('项目预算单位', 'budgetUnit')}
                      {field('项目联系人', 'contact')}
                      {field('联系人电话', 'phone')}
                      {field('关联历史建设项目', 'history')}
                      {field('服务周期（月）', 'months')}
                      {field('服务保障方式', 'service', [
                        '标准保障',
                        '加强保障',
                      ])}
                    </div>
                    <label>
                      项目运维内容
                      <textarea
                        disabled={readonly}
                        value={form.content}
                        onChange={(e) => setForm({ content: e.target.value })}
                      />
                    </label>
                    <Btn
                      primary
                      disabled={readonly}
                      onClick={() => run('save-project', { value: form })}
                    >
                      保存基础信息
                    </Btn>
                    <p className="fw-meta">
                      提交状态：
                      {
                        {
                          draft: '申报草稿',
                          'manual-selected': '本人选择前往平台提交',
                          'user-reported': '本人告知已提交，尚无系统提交回执',
                          'system-confirmed': '系统已返回正式提交回执',
                        }[flow.submission]
                      }
                    </p>
                  </>
                )}
                {tab === '运维对象情况' && (
                  <>
                    <Btn
                      onClick={() =>
                        onOpen({ kind: 'system', id: 'resources' })
                      }
                    >
                      跳转一体化数字资源管理系统
                    </Btn>
                    <div className="fw-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>运维对象</th>
                            <th>总数量</th>
                            <th>资产重要程度</th>
                            <th>使用状态</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedAssets.map((a) => (
                            <tr key={a.id}>
                              <td>{a.name}</td>
                              <td>{a.quantity}</td>
                              <td>{a.importance}</td>
                              <td>在用</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {!selectedAssets.length && <p>暂无已同步资产。</p>}
                  </>
                )}
                {tab === '运维服务费用' && (
                  <>
                    <h3>项管平台费用估算</h3>
                    {flow.estimate ? (
                      <>
                        <div className="fw-estimate">
                          <strong>{flow.estimate.total.toFixed(2)}</strong> 万元{' '}
                          <Tag>估算 · v{flow.estimate.version}</Tag>
                        </div>
                        <div className="fw-table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>服务对象</th>
                                <th>费用（万元）</th>
                              </tr>
                            </thead>
                            <tbody>
                              {flow.estimate.rows.map((r) => (
                                <tr key={r.name}>
                                  <td>{r.name}</td>
                                  <td>{r.annual.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="fw-meta">
                          平台根据已关联资产、服务月数及保障方式计算。场景参数和来源见费用估算明细。
                        </p>
                      </>
                    ) : (
                      <p>尚无当前版本估算。请完成资产关联、材料整理及上传。</p>
                    )}
                    <Btn
                      disabled={
                        readonly || flow.uploadedVersion !== flow.version
                      }
                      primary
                      onClick={() => run('estimate')}
                    >
                      计算并读取当前费用估算
                    </Btn>
                  </>
                )}
                {tab === '详版立项方案／其它附件' && (
                  <>
                    <p>
                      当前材料状态：
                      {flow.uploadedVersion === flow.version
                        ? '当前版本已上传'
                        : '待上传或版本已变化'}
                    </p>
                    {flow.artifactIds
                      .map((id) => state.artifacts[id])
                      .filter(
                        (a) =>
                          a.version === flow.version &&
                          a.name !== '运维服务费用估算明细',
                      )
                      .map((a) => (
                        <ArtifactRow
                          key={a.id}
                          art={a}
                          onOpen={() => onOpen({ kind: 'artifact', id: a.id })}
                        />
                      ))}
                    <div className="fw-actions">
                      <Btn
                        disabled={readonly || !flow.syncedIds.length}
                        onClick={() => run('prepare-materials')}
                      >
                        整理当前版本材料
                      </Btn>
                      <Btn
                        primary
                        disabled={
                          readonly || flow.materialsVersion !== flow.version
                        }
                        onClick={() => run('upload-materials')}
                      >
                        申请上传当前材料
                      </Btn>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
export function CatalogPage({
  kind,
  onConsult,
  onMemory,
  onUse,
  initialId = '',
  onBack,
}: {
  initialId?: string;
  onBack?: () => void;
  kind: '专业智能体' | 'Skill' | '插件' | '连接器';
  onConsult: (id: string, text: string) => void;
  onMemory: (id: string) => void;
  onUse: (id: string) => void;
}) {
  const { state, dispatch } = useWorkspace();
  const [creating, setCreating] = useState(false);
  const [skillDraft, setSkillDraft] = useState({ name: '', category: '自建技能', summary: '', instructions: '' });
  const [id, setId] = useState(initialId),
    [q, setQ] = useState(''),
    [category, setCategory] = useState('全部'),
    [mine, setMine] = useState(false),
    [extensionTab, setExtensionTab] = useState<'插件' | '连接器'>(
      kind === '连接器' ? '连接器' : '插件',
    );
  const activeKind = kind === '插件' || kind === '连接器' ? extensionTab : kind,
    entry = state.catalog.find((c) => c.id === id && c.kind === activeKind),
    profile = entry ? agentProfileFor(entry) : undefined;

  const all = state.catalog.filter((c) => c.kind === activeKind),
    results = all.filter(
      (c) =>
        (!mine || c.owned) &&
        (category === '全部' || c.category === category) &&
        (c.name + c.summary).includes(q),
    );
  if (creating)
    return (
      <div className="fw-module">
        <Btn onClick={() => setCreating(false)}><ArrowLeft size={15} />返回技能</Btn>
        <header className="fw-module-title"><div><h1>自建技能</h1><p>将常用工作方法整理成可复用的技能。</p></div></header>
        <form className="fw-skill-form" onSubmit={(event) => {
          event.preventDefault();
          if (!Object.values(skillDraft).every(value => value.trim())) return;
          dispatch({ type: 'create-skill', ...skillDraft, publisher: currentUser.name });
          setCreating(false);
          setQ('');
          setCategory(skillDraft.category.trim());
          setMine(true);
          setSkillDraft({ name: '', category: '自建技能', summary: '', instructions: '' });
        }}>
          <label>技能名称<input required maxLength={80} value={skillDraft.name} onChange={e => setSkillDraft({ ...skillDraft, name: e.target.value })} placeholder="例如：申报材料一致性核对" /></label>
          <label>分类<input required maxLength={40} value={skillDraft.category} onChange={e => setSkillDraft({ ...skillDraft, category: e.target.value })} /></label>
          <label>用途说明<textarea required rows={3} value={skillDraft.summary} onChange={e => setSkillDraft({ ...skillDraft, summary: e.target.value })} placeholder="说明适用场景与预期结果" /></label>
          <label>执行说明<textarea required rows={7} value={skillDraft.instructions} onChange={e => setSkillDraft({ ...skillDraft, instructions: e.target.value })} placeholder="填写处理步骤、所需资料和核对要求" /></label>
          <div className="fw-actions"><Btn onClick={() => setCreating(false)}>取消</Btn><button className="fw-btn primary" type="submit" disabled={!Object.values(skillDraft).every(value => value.trim())}>保存技能</button></div>
        </form>
      </div>
    );
  if (entry)
    return (
      <div className="fw-module">
        <Btn onClick={() => (onBack ? onBack() : setId(''))}>
          <ArrowLeft size={15} />
          {onBack ? '返回对话' : '返回目录'}
        </Btn>
        <header className="fw-module-title">
          <span className="fw-large-icon">
            {activeKind === 'Skill' ? <Zap /> : <Bot />}
          </span>
          <div>
            <h1>{entry.name}</h1>
            <p>
              {entry.publisher} · {entry.category} ·{' '}
              {entry.version.startsWith('v') || entry.version.startsWith('示例')
                ? entry.version
                : `v${entry.version}`}
            </p>
          </div>
          <Tag tone={entry.enabled ? 'green' : 'neutral'}>
            {entry.owned
              ? entry.enabled
                ? '已获取 · 已启用'
                : '已获取 · 已停用'
              : '未获取'}
          </Tag>
        </header>
        <p>{entry.summary}</p>
        <div className="fw-actions">
          {entry.owned ? (
            <>
              <Btn
                primary
                disabled={!entry.enabled}
                onClick={() =>
                  activeKind === '专业智能体'
                    ? onConsult(
                        entry.id,
                        profile?.sampleQuestions[0] ||
                          `请介绍${entry.name}可以如何协助本次工作`,
                      )
                    : onUse(entry.id)
                }
              >
                {activeKind === '专业智能体' ? '发起咨询' : '用于任务'}
              </Btn>
              <Btn
                onClick={() =>
                  dispatch({
                    type: 'catalog',
                    id: entry.id,
                    enabled: !entry.enabled,
                  })
                }
              >
                {entry.enabled ? '停用' : '启用'}
              </Btn>
            </>
          ) : (
            <Btn
              primary
              onClick={() =>
                dispatch({
                  type: 'catalog',
                  id: entry.id,
                  owned: true,
                  enabled: true,
                })
              }
            >
              获取并启用
            </Btn>
          )}
        </div>
        {profile && (
          <>
            <section className="fw-section fw-agent-positioning">
              <h2>岗位定位</h2>
              <p className="fw-agent-duty-summary">
                {profile.officialDutySummary}
              </p>
              <dl>
                <dt>数字人类型</dt>
                <dd>{profile.type}</dd>
                <dt>组织归属</dt>
                <dd>{profile.organization}</dd>
                <dt>职责支撑</dt>
                <dd>{profile.dutySupport.join('、')}</dd>
                <dt>服务定位</dt>
                <dd>{profile.rolePositioning}</dd>
                <dt>服务对象</dt>
                <dd>{profile.serviceAudience.join('、')}</dd>
              </dl>
            </section>

            <section className="fw-section">
              <div className="fw-section-heading">
                <div>
                  <h2>初始具备的基础能力</h2>
                  <p>
                    {entry.owned ? '当前' : '目录'}{' '}
                    {entry.version.startsWith('v') || entry.version.startsWith('示例')
                      ? entry.version
                      : `v${entry.version}`}{' '}
                    {entry.owned
                      ? '已具备以下能力，后续组织经验在此基础上持续补充。'
                      : '配置了以下基础能力，获取并启用后可使用。'}
                  </p>
                </div>
                <Tag tone="blue">{entry.owned ? '初始可用' : '获取后可用'}</Tag>
              </div>
              <div className="fw-capability-grid">
                {profile.initialCapabilities.map((capability) => {
                  const capabilitySources = digitalProfiles.sources.filter((s) =>
                    capability.sourceIds.includes(s.id),
                  );
                  return (
                    <article className="fw-capability-card" key={capability.title}>
                      <div className="fw-capability-card-title">
                        <h3>{capability.title}</h3>
                        <Tag
                          tone={
                            capability.basisType === '官方职责衍生'
                              ? 'blue'
                              : 'neutral'
                          }
                        >
                          {capability.basisType}
                        </Tag>
                      </div>
                      <p>{capability.work}</p>
                      <div className="fw-capability-result">
                        <strong>形成结果</strong>
                        <span>{capability.result}</span>
                      </div>
                      {capabilitySources.length > 0 && (
                        <p className="fw-meta">
                          依据：{capabilitySources.map((s) => s.title).join('、')}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="fw-section">
              <h2>开展工作需要的信息与可形成的结果</h2>
              <div className="fw-agent-io-grid">
                <div className="fw-agent-list-card">
                  <h3>需要提供的信息</h3>
                  <ul>
                    {profile.requiredContext.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="fw-agent-list-card">
                  <h3>可形成的结果</h3>
                  <ul>
                    {profile.expectedOutputs.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            <section className="fw-section">
              <h2>职责依据</h2>
              <p className="fw-section-note">
                {profile.basisSourceIds.length > 0
                  ? '官方职责和公开工作信息用于界定基础能力范围；具体系统操作来自本工作区业务资料。'
                  : '当前仅展示目录能力或拟共建场景的配置依据；未经核对的内容不作为部门官方职责或办事依据。'}
              </p>
              <div className="fw-source-grid">
                {digitalProfiles.sources
                  .filter((s) => profile.basisSourceIds.includes(s.id))
                  .map((s) => (
                    <article className="fw-source-card" key={s.id}>
                      <div>
                        <Tag tone="blue">{s.basisType}</Tag>
                        <small className="fw-meta">
                          发布 {s.publishedAt} · 核对 {s.checkedAt}
                        </small>
                      </div>
                      <h3>
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {s.title} <ArrowUpRight size={14} />
                        </a>
                      </h3>
                      <p>{s.verifiedFacts.join('；')}。</p>
                    </article>
                  ))}
                <article className="fw-source-card">
                  <div>
                    <Tag>{profile.basisLabel}</Tag>
                  </div>
                  <h3>当前能力配置记录</h3>
                  <p>{profile.basisNote}</p>
                </article>
              </div>
            </section>

            <section className="fw-section">
              <h2>使用边界</h2>
              <ul className="fw-boundary-list">
                {profile.serviceBoundaries.map((item) => (
                  <li key={item}>
                    <ShieldCheck size={17} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
        {!profile && (
          <section className="fw-section">
            <h2>可以协助的工作</h2>
            <ul>
              {entry.details.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </section>
        )}
        {entry.system && (
          <section className="fw-section">
            <h2>当前身份与授权</h2>
            <p>{currentUser.name} · {currentUser.organization} · {currentUser.role}</p>
            <p>{entry.summary}</p>
            <Tag
              tone={
                state.auth[entry.system].enabled &&
                state.auth[entry.system].expires > state.memory.now
                  ? 'green'
                  : 'amber'
              }
            >
              {state.auth[entry.system].enabled &&
              state.auth[entry.system].expires > state.memory.now
                ? '授权有效'
                : '授权已失效'}
            </Tag>
            <p>
              读取：{state.auth[entry.system].read ? '允许' : '不允许'}；写入：
              {state.auth[entry.system].write
                ? '在授权对象范围内允许，正式操作另行确认'
                : '不允许'}
            </p>
          </section>
        )}
        {profile && (
          <section className="fw-section">
            <h2>常见咨询</h2>
            {profile.sampleQuestions.map((t) => (
              <button
                key={t}
                className="fw-detail-link"
                disabled={!entry.enabled}
                onClick={() => onConsult(entry.id, t)}
              >
                {t}
                <ArrowUpRight size={15} />
              </button>
            ))}
          </section>
        )}
        {profile && (
          <section className="fw-section">
            <h2>后续增加的组织经验</h2>
            <p>
              {entry.owned
                ? '初始基础能力始终可用；以下经验由组织维护者采纳后增加，个人原始对话不进入对外答复。'
                : '当前尚未获取该智能体；获取后，组织经验只会在基础能力上增加，不会取代基础能力。'}
            </p>
            {id === fiscalAgent && state.memory.memories
              .filter(
                (m) =>
                  m.scope !== 'personal' &&
                  eligible(m, state.memory.now) &&
                  current(m).payload.kind === 'procedural' &&
                  current(m).title.includes('支付'),
              )
              .map((m) => (
                <button
                  className="fw-detail-link"
                  key={m.id}
                  onClick={() => onMemory(m.id)}
                >
                  <BrainCircuit size={18} />
                  {current(m).title} · v{current(m).number}
                  <Tag tone="green">组织已采纳</Tag>
                </button>
              ))}
            {(id !== fiscalAgent ||
              !state.memory.memories.some(
                (m) =>
                  m.scope !== 'personal' &&
                  eligible(m, state.memory.now) &&
                  current(m).title.includes('支付'),
              )) && (
              <p className="fw-meta">
                {entry.owned
                  ? '当前没有新增的有效组织方法，数字人仍可使用上述初始基础能力。'
                  : '获取并启用后，可先使用上述基础能力；当前没有新增的组织方法。'}
              </p>
            )}
          </section>
        )}
      </div>
    );
  return (
    <div className="fw-module">
      <header className="fw-module-title">
        <div>
          <h1>{activeKind === '连接器' ? '系统连接' : activeKind}</h1>
          <p>
            {activeKind === '专业智能体'
              ? '按岗位与专业领域找到可以协助工作的能力。'
              : '查看已获取能力、使用范围与当前状态。'}
          </p>
        </div>
        {activeKind === 'Skill' && <Btn primary onClick={() => setCreating(true)}><Plus size={16} />自建技能</Btn>}
      </header>
      {(kind === '插件' || kind === '连接器') && (
        <div className="fw-tabs">
          {(['插件', '连接器'] as const).map((t) => (
            <button
              className={extensionTab === t ? 'active' : ''}
              key={t}
              onClick={() => {
                setExtensionTab(t);
                setId('');
                setCategory('全部');
              }}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <div className="fw-filter">
        <label className="fw-search">
          <Search size={16} />
          <input
            aria-label="搜索能力"
            placeholder="搜索名称或服务内容"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <button
          className={mine ? 'fw-toggle active' : 'fw-toggle'}
          onClick={() => setMine(!mine)}
        >
          只看已获取
        </button>
      </div>
      <fieldset className="fw-category-filters" aria-label="能力分类">
        {['全部', ...new Set(all.map(c => c.category))].map(c => (
          <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </fieldset>
      <p className="fw-meta">共 {results.length} 项</p>
      <div className="fw-catalog-list">
        {results.map((c) => (
          <button key={c.id} onClick={() => setId(c.id)}>
            <span className="fw-catalog-icon">
              {c.kind === '连接器' ? <Globe2 size={21} /> : <Bot size={21} />}
            </span>
            <span className="fw-catalog-body">
              <strong>{c.name}</strong>
              <p>{c.summary}</p>
              <small>
                {c.publisher} · {c.category}
              </small>
            </span>
            <Tag tone={c.enabled ? 'green' : 'neutral'}>
              {c.owned ? (c.enabled ? '已启用' : '已停用') : '未获取'}
            </Tag>
            <ArrowUpRight size={16} />
          </button>
        ))}
      </div>
    </div>
  );
}
export function Library({
  onUse,
  onOpenTask,
}: {
  onUse: (context: SavedContext) => void;
  onOpenTask: (taskId: string) => void;
}) {
  const { state, dispatch } = useWorkspace();
  const [area, setArea] = useState<'personal' | 'knowledge'>('personal');
  const [personalTab, setPersonalTab] = useState<'local' | 'cloud'>('local');
  const [queries, setQueries] = useState({ personal: '', knowledge: '' });
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState({ local: '', cloud: '', knowledge: '' });
  const [cloudForm, setCloudForm] = useState(false);
  const [cloudDraft, setCloudDraft] = useState({
    name: '',
    location: '',
    access: '本人只读' as '本人只读' | '本人可读写',
  });
  const fileInput = useRef<HTMLInputElement>(null);
  const query = queries[area];
  const setAreaQuery = (value: string) =>
    setQueries((old) => ({ ...old, [area]: value }));
  const personalItems = state.library.personalItems.filter((item) => {
    if (item.storage !== personalTab) return false;
    if (!(item.name + item.location + item.format).includes(query)) return false;
    if (status === 'usable') return canUsePersonalItem(item);
    if (status === 'attention') return !canUsePersonalItem(item);
    return true;
  });
  const knowledgeItems = knowledgeBaseProfiles.filter((item) => {
    if (!(item.name + item.maintainer + item.searchableScope).includes(query))
      return false;
    if (status === 'connected') return item.connectionStatus === '已接入';
    if (status === 'public') return item.connectionStatus.includes('公开');
    return true;
  });
  const selectionKey = area === 'knowledge' ? 'knowledge' : personalTab;
  const selectedId = selected[selectionKey];
  const selectedPersonal = personalItems.find((item) => item.id === selectedId);
  const selectedKnowledge = knowledgeItems.find(
    (item) => item.catalogId === selectedId,
  );
  const choose = (id: string) =>
    setSelected((old) => ({ ...old, [selectionKey]: id }));
  const clearSelection = () =>
    setSelected((old) => ({ ...old, [selectionKey]: '' }));
  const changeArea = (next: 'personal' | 'knowledge') => {
    setArea(next);
    setStatus('all');
  };
  const changePersonalTab = (next: 'local' | 'cloud') => {
    setPersonalTab(next);
    setStatus('all');
  };
  const addLocalFiles = (files: FileList | null) => {
    if (!files) return;
    for (const file of files) {
      const extension = file.name.split('.').pop()?.toUpperCase();
      const item: PersonalLibraryItem = {
        id: `local-${file.name}-${file.lastModified}`,
        name: file.name,
        storage: 'local',
        itemType: '文件',
        format: extension ? `${extension} 文件` : '本地文件',
        location: '本机 / 本人新选择',
        source: '本人通过资料库选择',
        modifiedAt: new Date(file.lastModified).toLocaleString('zh-CN', {
          hour12: false,
        }),
        sizeLabel: formatFileSize(file.size),
        availability: 'available',
        availabilityLabel: '本机可用',
        access: '仅本人当前工作区可读',
        summary: '已记录文件元数据，文件内容未上传。',
        recentUses: [],
        boundaries: [
          '当前只记录名称、类型、大小和修改时间等元数据。',
          '加入任务只授权本次使用，不会自动上传、共享或贡献。',
        ],
      };
      dispatch({ type: 'library-add-local', item });
      choose(item.id);
    }
    if (fileInput.current) fileInput.current.value = '';
  };
  const submitCloud = (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    if (!cloudDraft.name.trim() || !cloudDraft.location.trim()) return;
    const pendingCount = state.library.personalItems.filter(
      (item) => item.availability === 'pending',
    ).length;
    dispatch({
      type: 'library-request-cloud',
      name: cloudDraft.name.trim(),
      location: cloudDraft.location.trim(),
      access: cloudDraft.access,
    });
    setSelected((old) => ({
      ...old,
      cloud: `cloud-request-${pendingCount + 1}`,
    }));
    setCloudDraft({ name: '', location: '', access: '本人只读' });
    setCloudForm(false);
  };
  const statusOptions =
    area === 'knowledge'
      ? [
          ['all', '全部状态'],
          ['connected', '已接入'],
          ['public', '公开来源'],
        ]
      : [
          ['all', '全部状态'],
          ['usable', '当前可用'],
          ['attention', '需处理'],
        ];
  const hasSelection = Boolean(selectedPersonal || selectedKnowledge);
  return (
    <div className="fw-module">
      <header className="fw-module-title">
        <div>
          <h1>资料库</h1>
          <p>管理本人主动选择的资料，或从已接入知识库中检索。</p>
        </div>
        {area === 'personal' && personalTab === 'local' && (
          <>
            <input
              ref={fileInput}
              className="fw-visually-hidden"
              type="file"
              multiple
              aria-label="选择本地资料"
              onChange={(event) => addLocalFiles(event.target.files)}
            />
            <Btn primary onClick={() => fileInput.current?.click()}>
              <Plus size={16} />选择本地资料
            </Btn>
          </>
        )}
        {area === 'personal' && personalTab === 'cloud' && (
          <Btn primary onClick={() => setCloudForm(true)}>
            <Cloud size={16} />连接个人云空间
          </Btn>
        )}
      </header>
      <div className="fw-library-primary-tabs" role="tablist" aria-label="资料库分区">
        {([
          ['personal', '个人'],
          ['knowledge', '知识库'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={area === value}
            className={area === value ? 'active' : ''}
            onClick={() => changeArea(value)}
          >
            {value === 'personal' ? <HardDrive size={17} /> : <Database size={17} />}
            {label}
          </button>
        ))}
      </div>

      {area === 'personal' && (
        <div className="fw-library-secondary-tabs" role="tablist" aria-label="个人资料来源">
          {([
            ['local', '本地资料'],
            ['cloud', '云资料'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={personalTab === value}
              className={personalTab === value ? 'active' : ''}
              onClick={() => changePersonalTab(value)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {cloudForm && area === 'personal' && personalTab === 'cloud' && (
        <form className="fw-library-connect-form" onSubmit={submitCloud}>
          <div>
            <h2>连接个人云空间</h2>
            <p>只记录本人确认的目录和权限范围，完成外部授权后才可读取。</p>
          </div>
          <label>
            空间或连接名称
            <input
              required
              value={cloudDraft.name}
              onChange={(event) =>
                setCloudDraft({ ...cloudDraft, name: event.target.value })
              }
              placeholder="例如：个人工作资料"
            />
          </label>
          <label>
            授权目录
            <input
              required
              value={cloudDraft.location}
              onChange={(event) =>
                setCloudDraft({ ...cloudDraft, location: event.target.value })
              }
              placeholder="例如：财政工作 / 参考资料"
            />
          </label>
          <label>
            使用权限
            <select
              value={cloudDraft.access}
              onChange={(event) =>
                setCloudDraft({
                  ...cloudDraft,
                  access: event.target.value as '本人只读' | '本人可读写',
                })
              }
            >
              <option>本人只读</option>
              <option>本人可读写</option>
            </select>
          </label>
          <div className="fw-actions">
            <button className="fw-btn primary" type="submit">记录连接申请</button>
            <Btn onClick={() => setCloudForm(false)}>取消</Btn>
          </div>
        </form>
      )}

      <div className="fw-library-toolbar">
        <label className="fw-search">
          <Search size={16} />
          <input
            placeholder={area === 'knowledge' ? '搜索知识库' : '搜索个人资料'}
            aria-label={area === 'knowledge' ? '搜索知识库' : '搜索个人资料'}
            value={query}
            onChange={(event) => setAreaQuery(event.target.value)}
          />
        </label>
        <select
          aria-label="筛选状态"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          {statusOptions.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className={`fw-library-layout fw-split-layout ${hasSelection ? 'has-selection' : ''}`}>
        <section className="fw-library-list-pane fw-split-list-pane" aria-label={area === 'knowledge' ? '知识库列表' : '个人资料列表'}>
          <div className="fw-library-list-heading">
            <strong>
              {area === 'knowledge'
                ? '已配置的外接知识库'
                : personalTab === 'local'
                  ? '本地资料'
                  : '个人云空间'}
            </strong>
            <span className="fw-meta">
              {area === 'knowledge' ? knowledgeItems.length : personalItems.length} 项
            </span>
          </div>
          <div className="fw-library-list">
            {area === 'personal' && personalItems.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`fw-split-list-item ${selectedId === item.id ? 'active' : ''}`}
                onClick={() => choose(item.id)}
              >
                <span className="fw-library-item-icon">
                  {item.storage === 'cloud' ? <Cloud size={19} /> : item.itemType === '文件夹' ? <Folder size={19} /> : <FileText size={19} />}
                </span>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.format} · {item.modifiedAt}</small>
                  <small>{item.location}</small>
                </span>
                <Tag tone={canUsePersonalItem(item) ? 'green' : 'amber'}>
                  {item.availabilityLabel}
                </Tag>
                <ArrowUpRight size={15} />
              </button>
            ))}
            {area === 'knowledge' && knowledgeItems.map((item) => (
              <button
                type="button"
                key={item.catalogId}
                className={`fw-split-list-item ${selectedId === item.catalogId ? 'active' : ''}`}
                onClick={() => choose(item.catalogId)}
              >
                <span className="fw-library-item-icon"><Database size={19} /></span>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.level} · {item.sourceType}</small>
                  <small>{item.maintainer}</small>
                </span>
                <Tag tone="green">{item.connectionStatus}</Tag>
                <ArrowUpRight size={15} />
              </button>
            ))}
            {((area === 'personal' && !personalItems.length) ||
              (area === 'knowledge' && !knowledgeItems.length)) && (
              <p className="fw-library-empty">没有符合当前条件的内容。</p>
            )}
          </div>
        </section>

        <section className="fw-library-detail-pane fw-split-detail-pane" aria-label="资料详情">
          {hasSelection && (
            <button type="button" className="fw-library-mobile-back" onClick={clearSelection}>
              <ArrowLeft size={16} />返回列表
            </button>
          )}
          {!hasSelection && (
            <div className="fw-library-detail-empty fw-split-detail-empty">
              {area === 'knowledge' ? <Database size={26} /> : <FileText size={26} />}
              <strong>选择一项查看详情</strong>
              <p>可查看来源、权限、最近使用和任务使用边界。</p>
            </div>
          )}
          {selectedPersonal && (
            <>
              <header className="fw-library-detail-header">
                <span className="fw-large-icon">
                  {selectedPersonal.storage === 'cloud' ? <Cloud /> : selectedPersonal.itemType === '文件夹' ? <Folder /> : <FileText />}
                </span>
                <div>
                  <h2>{selectedPersonal.name}</h2>
                  <p>{selectedPersonal.source}</p>
                </div>
                <Tag tone={canUsePersonalItem(selectedPersonal) ? 'green' : 'amber'}>
                  {selectedPersonal.availabilityLabel}
                </Tag>
              </header>
              {canUsePersonalItem(selectedPersonal) && selectedPersonal.summary && (
                <p className="fw-library-summary">{selectedPersonal.summary}</p>
              )}
              {!canUsePersonalItem(selectedPersonal) && (
                <p className="fw-library-unavailable">
                  当前连接尚不可用，不展示目录内容或文件摘要。
                </p>
              )}
              <dl className="fw-library-facts">
                <dt>类型</dt><dd>{selectedPersonal.format}</dd>
                <dt>位置</dt><dd>{selectedPersonal.location}</dd>
                <dt>修改时间</dt><dd>{selectedPersonal.modifiedAt}</dd>
                <dt>大小或规模</dt><dd>{selectedPersonal.sizeLabel}</dd>
                <dt>当前权限</dt><dd>{selectedPersonal.access}</dd>
              </dl>
              {canUsePersonalItem(selectedPersonal) && selectedPersonal.preview?.length ? (
                <div className="fw-library-detail-block">
                  <h3>内容概览</h3>
                  {selectedPersonal.preview.map((line) => <p key={line}>{line}</p>)}
                </div>
              ) : null}
              <div className="fw-library-detail-block">
                <h3><History size={16} />最近任务使用</h3>
                {selectedPersonal.recentUses.length ? selectedPersonal.recentUses.map((use) => (
                  <button className="fw-library-task-link" type="button" key={`${use.taskId}-${use.at}`} onClick={() => onOpenTask(use.taskId)}>
                    <span><strong>{use.title}</strong><small>{use.at}</small></span>
                    <ArrowUpRight size={15} />
                  </button>
                )) : <p className="fw-meta">尚无任务使用记录。</p>}
              </div>
              <div className="fw-library-detail-block">
                <h3><ShieldCheck size={16} />使用边界</h3>
                <ul>{selectedPersonal.boundaries.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div className="fw-actions">
                <Btn
                  primary
                  disabled={!canUsePersonalItem(selectedPersonal)}
                  onClick={() => onUse(personalItemContext(selectedPersonal))}
                >
                  {canUsePersonalItem(selectedPersonal) ? '在新任务中使用' : '完成授权后可用'}
                </Btn>
              </div>
            </>
          )}
          {selectedKnowledge && (
            <>
              <header className="fw-library-detail-header">
                <span className="fw-large-icon"><Database /></span>
                <div>
                  <h2>{selectedKnowledge.name}</h2>
                  <p>{selectedKnowledge.sourceType}</p>
                </div>
                <Tag tone="green">{selectedKnowledge.connectionStatus}</Tag>
              </header>
              <p className="fw-library-summary">{selectedKnowledge.searchableScope}</p>
              <dl className="fw-library-facts">
                <dt>层级与范围</dt><dd>{selectedKnowledge.level}</dd>
                <dt>维护与来源</dt><dd>{selectedKnowledge.maintainer}</dd>
                <dt>最近同步／核验</dt><dd>{selectedKnowledge.updatedAt}</dd>
                <dt>当前账号可用范围</dt><dd>{selectedKnowledge.accessScope}</dd>
              </dl>
              <div className="fw-library-detail-block">
                <h3>支持的检索能力</h3>
                <div className="fw-library-capabilities">
                  {selectedKnowledge.capabilities.map((item) => <Tag key={item} tone="blue">{item}</Tag>)}
                </div>
              </div>
              <div className="fw-library-detail-block">
                <h3>来源说明</h3>
                {selectedKnowledge.sourceUrl ? (
                  <a className="fw-library-source-link" href={selectedKnowledge.sourceUrl} target="_blank" rel="noreferrer">
                    {selectedKnowledge.sourceLabel}<ArrowUpRight size={15} />
                  </a>
                ) : <p>{selectedKnowledge.sourceLabel}</p>}
              </div>
              <div className="fw-library-detail-block">
                <h3><ShieldCheck size={16} />使用边界</h3>
                <ul>{selectedKnowledge.boundaries.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div className="fw-actions">
                <Btn primary onClick={() => onUse(knowledgeBaseContext(selectedKnowledge))}>
                  使用该知识库新建任务
                </Btn>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
export function Automations({ onTask }: { onTask: (id: string) => void }) {
  const { state, dispatch } = useWorkspace(),
    [tab, setTab] = useState('任务自动化'),
    [editing, setEditing] = useState<Automation | null>(null);
  const newItem = (): Automation => ({
    id: 'automation-' + (state.memory.counter + 1),
    name: '',
    prompt: '',
    enabled: true,
    kind: 'generic',
    cadence: 'weekly',
    weekday: 1,
    time: '09:00',
    createdAt: new Date(state.memory.now).toISOString(),
    runs: [],
    evaluated: [],
  });
  return (
    <div className="fw-module">
      <header className="fw-module-title">
        <div>
          <h1>自动化</h1>
          <p>定时处理工作，收到反馈时及时跟进。</p>
        </div>
        <Btn primary onClick={() => setEditing(newItem())}>
          <Plus size={16} />
          创建自动化
        </Btn>
      </header>
      <div className="fw-tabs">
        {['任务自动化', '工作规划提醒'].map((t) => (
          <button
            key={t}
            className={tab === t ? 'active' : ''}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === '工作规划提醒' ? (
        <MemoryReminders onOpenTask={onTask} />
      ) : (
        state.automations.map((c) => (
          <section className="fw-auto-item" key={c.id}>
            <div className="fw-row">
              <Clock3 size={19} />
              <h2>{c.name}</h2>
              <Tag tone={c.enabled ? 'green' : 'neutral'}>
                {c.enabled ? '已启用' : '已暂停'}
              </Tag>
            </div>
            <p>
              {c.cadence === 'event'
                ? '收到项目审核反馈时'
                : `${c.cadence === 'weekly' ? '每周' + '日一二三四五六'[c.weekday] : c.cadence === 'weekdays' ? '工作日' : '每天'} ${c.time}（北京时间）`}
            </p>
            <p>{c.prompt}</p>
            <div className="fw-actions">
              <Btn
                small
                onClick={() =>
                  dispatch({
                    type: 'automation',
                    item: { ...c, enabled: !c.enabled },
                  })
                }
              >
                {c.enabled ? <Pause size={14} /> : <Play size={14} />}{' '}
                {c.enabled ? '暂停' : '启用'}
              </Btn>
              <Btn small onClick={() => setEditing({ ...c })}>
                编辑
              </Btn>
              <Btn
                small
                disabled={!c.enabled}
                onClick={() => dispatch({ type: 'run-automation', id: c.id })}
              >
                {c.kind === 'feedback' ? '检查反馈' : '立即运行'}
              </Btn>
            </div>
            <details open={c.runs.length < 3}>
              <summary>运行记录 · {c.runs.length}</summary>
              {c.runs.map((id) => (
                <button
                  className="fw-detail-link"
                  key={id}
                  onClick={() => onTask(id)}
                >
                  {taskFor(state, id)?.title || '记录不可用'}{' '}
                  <ArrowUpRight size={14} />
                </button>
              ))}
              {!c.runs.length && <p className="fw-meta">尚无新运行。</p>}
            </details>
          </section>
        ))
      )}
      {editing && (
        <div className="fw-modal-backdrop">
          <dialog
            open
            className="fw-modal"
            aria-modal="true"
            aria-label="编辑自动化"
          >
            <h2>自动化设置</h2>
            <label>
              名称
              <input
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
              />
            </label>
            <label>
              工作要求
              <textarea
                value={editing.prompt}
                onChange={(e) =>
                  setEditing({ ...editing, prompt: e.target.value })
                }
              />
            </label>
            {editing.cadence !== 'event' && (
              <div className="fw-form-grid">
                <label>
                  周期
                  <select
                    value={editing.cadence}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        cadence: e.target.value as Automation['cadence'],
                      })
                    }
                  >
                    <option value="weekly">每周</option>
                    <option value="weekdays">工作日</option>
                    <option value="daily">每天</option>
                  </select>
                </label>
                {editing.cadence === 'weekly' && (
                  <label>
                    星期
                    <select
                      value={editing.weekday}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          weekday: Number(e.target.value),
                        })
                      }
                    >
                      {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                        <option key={d} value={d}>
                          星期{'日一二三四五六'[d]}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  时间
                  <input
                    type="time"
                    value={editing.time}
                    onChange={(e) =>
                      setEditing({ ...editing, time: e.target.value })
                    }
                  />
                </label>
              </div>
            )}
            <div className="fw-actions">
              <Btn onClick={() => setEditing(null)}>取消</Btn>
              <Btn
                primary
                disabled={
                  !editing.name.trim() ||
                  !editing.prompt.trim() ||
                  !editing.time
                }
                onClick={() => {
                  dispatch({ type: 'automation', item: editing });
                  setEditing(null);
                }}
              >
                保存
              </Btn>
            </div>
          </dialog>
        </div>
      )}
    </div>
  );
}
