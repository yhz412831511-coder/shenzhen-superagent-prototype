'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { useWorkspace } from './workspace-store';
import {
  brainstormPhaseLabel,
  brainstormSummary,
} from './brainstorm-selectors.ts';
import type { BrainstormFlow } from './brainstorm-types.ts';
import type { WorkspaceTarget } from './task-workspace-model.ts';

type OpenTarget = (target: WorkspaceTarget) => void;

function Action({
  children,
  primary,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  primary?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`fw-btn${primary ? ' primary' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function Card({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bc-card">
      <header>
        <span>{eyebrow}</span>
        <strong>{title}</strong>
      </header>
      {children}
    </section>
  );
}

function IssueCard({ flow }: { flow: BrainstormFlow }) {
  const { dispatch } = useWorkspace();
  const [draft, setDraft] = useState({
    goal: flow.issue.goal,
    audience: flow.issue.audience,
    period: flow.issue.period,
    quality: flow.issue.quality,
  });
  const save = (field: keyof typeof draft) =>
    dispatch({
      type: 'brainstorm',
      action: {
        type: 'issue-update',
        taskId: flow.taskId,
        field,
        value: draft[field],
      },
    });
  return (
    <Card eyebrow="步骤 1 · 议题准备" title={flow.issue.title}>
      <dl className="bc-grid">
        <div>
          <dt>工作目标</dt>
          <dd>{flow.issue.goal}</dd>
        </div>
        <div>
          <dt>汇报对象</dt>
          <dd>{flow.issue.audience}</dd>
        </div>
        <div>
          <dt>时间范围</dt>
          <dd>{flow.issue.period}</dd>
        </div>
        <div>
          <dt>交付成果</dt>
          <dd>{flow.issue.outputs.join('、')}</dd>
        </div>
      </dl>
      {!flow.issue.confirmed ? (
        <details className="bc-edit">
          <summary>调整议题卡</summary>
          {(Object.keys(draft) as Array<keyof typeof draft>).map((field) => (
            <label key={field}>
              {
                {
                  goal: '工作目标',
                  audience: '汇报对象',
                  period: '时间范围',
                  quality: '质量重点',
                }[field]
              }
              <textarea
                rows={2}
                value={draft[field]}
                onChange={(event) =>
                  setDraft((old) => ({ ...old, [field]: event.target.value }))
                }
                onBlur={() => save(field)}
              />
            </label>
          ))}
        </details>
      ) : null}
      <p className="bc-boundary">
        <ShieldCheck size={15} />
        {flow.issue.boundary}
      </p>
      {!flow.issue.confirmed ? (
        <div className="bc-actions">
          <Action
            primary
            onClick={() =>
              dispatch({
                type: 'brainstorm',
                action: { type: 'issue-confirm', taskId: flow.taskId },
              })
            }
          >
            确认议题卡
          </Action>
        </div>
      ) : null}
    </Card>
  );
}

function ParticipantsCard({
  flow,
  onOpen,
}: {
  flow: BrainstormFlow;
  onOpen: OpenTarget;
}) {
  const { dispatch } = useWorkspace();
  const groups = [...new Set(flow.participants.map((item) => item.groupId))];
  return (
    <Card eyebrow="步骤 2 · 参与岗位" title="五个议题组 · 13个职责岗位">
      <p className="bc-help">
        岗位依据公开职责设置，只在本任务中承担材料贡献，不加入“专业智能”目录。
      </p>
      <div className="bc-groups">
        {groups.map((group) => (
          <section key={group}>
            <strong>
              {
                (
                  {
                    synthesis: '综合统稿组',
                    strategy: '发展制度组',
                    service: '政务服务组',
                    'data-project': '数据项目组',
                    security: '基础设施与安全组',
                  } as Record<string, string>
                )[group]
              }
            </strong>
            {flow.participants
              .filter((item) => item.groupId === group)
              .map((item) => (
                <label key={item.id}>
                  <input
                    type="checkbox"
                    checked={item.selected}
                    disabled={flow.phaseStatus !== 'awaiting_participants'}
                    onChange={() =>
                      dispatch({
                        type: 'brainstorm',
                        action: {
                          type: 'participants-toggle',
                          taskId: flow.taskId,
                          participantId: item.id,
                        },
                      })
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onOpen({
                        kind: 'brainstorm',
                        entity: 'role',
                        id: item.id,
                      })
                    }
                  >
                    {item.name}
                    <ArrowUpRight size={13} />
                  </button>
                </label>
              ))}
          </section>
        ))}
      </div>
      {flow.phaseStatus === 'awaiting_participants' ? (
        <div className="bc-actions">
          <Action
            primary
            onClick={() =>
              dispatch({
                type: 'brainstorm',
                action: { type: 'participants-confirm', taskId: flow.taskId },
              })
            }
          >
            确认参与岗位
          </Action>
        </div>
      ) : null}
    </Card>
  );
}

function ScopeCard({ flow }: { flow: BrainstormFlow }) {
  const { dispatch } = useWorkspace();
  const toggle = (field: 'crossOfficeOriginals' | 'personalMemory') =>
    dispatch({
      type: 'brainstorm',
      action: { type: 'scope-toggle', taskId: flow.taskId, field },
    });
  return (
    <Card eyebrow="步骤 2 · 材料授权" title="按最小必要范围调用材料">
      <ul className="bc-scope">
        <li className="on">
          <CheckCircle2 />
          公开机构职责
        </li>
        <li className="on">
          <CheckCircle2 />
          本岗位授权摘要
        </li>
        <li>
          <input
            type="checkbox"
            checked={flow.sourceScopes.crossOfficeOriginals}
            disabled={flow.sourceScopes.confirmed}
            onChange={() => toggle('crossOfficeOriginals')}
          />
          跨处室原文
        </li>
        <li>
          <input
            type="checkbox"
            checked={flow.sourceScopes.personalMemory}
            disabled={flow.sourceScopes.confirmed}
            onChange={() => toggle('personalMemory')}
          />
          个人记忆
        </li>
      </ul>
      <p className="bc-help">
        未勾选的内容不会在本轮读取；政策名称和年度数据仍需单独核验。
      </p>
      {!flow.sourceScopes.confirmed ? (
        <div className="bc-actions">
          <Action
            primary
            onClick={() =>
              dispatch({
                type: 'brainstorm',
                action: { type: 'scope-confirm', taskId: flow.taskId },
              })
            }
          >
            确认调用范围
          </Action>
        </div>
      ) : null}
    </Card>
  );
}

function SynthesisCard({
  flow,
  onOpen,
}: {
  flow: BrainstormFlow;
  onOpen: OpenTarget;
}) {
  const { dispatch } = useWorkspace();
  const ready = flow.phaseStatus === 'partial_ready';
  const collected = flow.topics.some((topic) => topic.status === 'ready');
  return (
    <Card
      eyebrow="步骤 3 · 主题贡献"
      title={collected ? '七个主题已形成初步综合' : '准备汇集岗位贡献'}
    >
      {collected ? (
        <>
          <div className="bc-topics">
            {flow.topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() =>
                  onOpen({ kind: 'brainstorm', entity: 'topic', id: topic.id })
                }
              >
                <span>{topic.title}</span>
                <small>{topic.contributionIds.length}项贡献</small>
                <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
          <p className="bc-summary">6项共识 · 1项普通冲突 · 1项高影响冲突</p>
        </>
      ) : (
        <p>将按跨处室主题归并13个岗位的结构化贡献，不按机构逐段拼稿。</p>
      )}
      {['collecting', 'partial_ready'].includes(flow.phaseStatus) ? (
        <div className="bc-actions">
          <Action
            primary
            onClick={() =>
              dispatch({
                type: 'brainstorm',
                action: {
                  type: ready ? 'inquire' : 'collect',
                  taskId: flow.taskId,
                },
              })
            }
          >
            {ready ? '发起协同询证' : '开始汇集贡献'}
          </Action>
        </div>
      ) : null}
    </Card>
  );
}

function DecisionCard({
  flow,
  onOpen,
}: {
  flow: BrainstormFlow;
  onOpen: OpenTarget;
}) {
  const { dispatch } = useWorkspace();
  const conflict = flow.conflicts.find((item) => item.kind === 'high_impact')!;
  return (
    <Card eyebrow="步骤 4 · 高影响决定" title={conflict.title}>
      <p>{conflict.summary}</p>
      <button
        type="button"
        className="bc-link"
        onClick={() =>
          onOpen({ kind: 'brainstorm', entity: 'conflict', id: conflict.id })
        }
      >
        查看两轮询证与影响范围 <ArrowUpRight size={14} />
      </button>
      <div className="bc-options">
        {conflict.options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={conflict.status === 'resolved'}
            className={
              option.id === conflict.selectedOptionId ||
              (conflict.status !== 'resolved' && option.recommended)
                ? 'recommended'
                : ''
            }
            onClick={() =>
              dispatch({
                type: 'brainstorm',
                action: {
                  type: 'decision-resolve',
                  taskId: flow.taskId,
                  conflictId: conflict.id,
                  optionId: option.id,
                },
              })
            }
          >
            <strong>
              {option.label}
              {option.id === conflict.selectedOptionId
                ? ' · 已选择'
                : conflict.status !== 'resolved' && option.recommended
                  ? ' · 建议'
                  : ''}
            </strong>
            <span>{option.impact}</span>
          </button>
        ))}
      </div>
      <p className="bc-boundary">
        <ShieldCheck size={15} />
        本决定仅用于工作版本取舍，不代表领导审定。
      </p>
    </Card>
  );
}

function OutlineCard({ flow }: { flow: BrainstormFlow }) {
  const { dispatch } = useWorkspace();
  const confirmed = flow.phaseStatus === 'outline_ready';
  return (
    <Card eyebrow="步骤 5 · 综合大纲" title="一份推荐主稿的统一结构">
      <ol className="bc-outline">
        <li>人工智能赋能政务与数字化发展</li>
        <li>政务服务提质增效</li>
        <li>数据、项目、应用与运行保障</li>
        <li>问题与形势判断</li>
        <li>2027年重点工作</li>
      </ol>
      <p className="bc-help">
        已把用户决定应用到开篇、主题排序、2027年任务和结尾承诺。
      </p>
      {['awaiting_outline_confirmation', 'outline_ready'].includes(
        flow.phaseStatus,
      ) ? (
        <div className="bc-actions">
          <Action
            primary
            onClick={() =>
              dispatch({
                type: 'brainstorm',
                action: {
                  type: confirmed ? 'artifacts-generate' : 'outline-confirm',
                  taskId: flow.taskId,
                },
              })
            }
          >
            {confirmed ? '生成工作版本与支撑材料' : '确认综合大纲'}
          </Action>
        </div>
      ) : null}
    </Card>
  );
}

function GapCard({
  flow,
  onOpen,
}: {
  flow: BrainstormFlow;
  onOpen: OpenTarget;
}) {
  const { dispatch } = useWorkspace();
  return (
    <Card eyebrow="步骤 6 · 事实缺口" title="明确未核内容的处理方式">
      <div className="bc-gaps">
        {flow.facts
          .filter((item) => item.verificationStatus !== 'verified')
          .map((fact) => (
            <button
              key={fact.id}
              type="button"
              onClick={() =>
                onOpen({ kind: 'brainstorm', entity: 'fact', id: fact.id })
              }
            >
              <AlertTriangle size={15} />
              <span>
                {fact.label}
                <small>
                  {fact.value === null
                    ? '缺少材料，不进入具体数值'
                    : `${fact.value}${fact.unit || ''} · 合成示例，待年终核定`}
                </small>
              </span>
            </button>
          ))}
      </div>
      {flow.phaseStatus === 'fact_gap_attention' ? (
        <div className="bc-actions">
          <Action
            primary
            onClick={() =>
              dispatch({
                type: 'brainstorm',
                action: {
                  type: 'fact-gap-resolve',
                  taskId: flow.taskId,
                  resolution: 'keep_limited',
                },
              })
            }
          >
            保留限定并继续
          </Action>
          <Action
            onClick={() =>
              dispatch({
                type: 'brainstorm',
                action: {
                  type: 'fact-gap-resolve',
                  taskId: flow.taskId,
                  resolution: 'remove_from_draft',
                },
              })
            }
          >
            移除未核定数值
          </Action>
        </div>
      ) : (
        <p className="bc-help">缺口处理方式已记录。</p>
      )}
    </Card>
  );
}

function FinalCard({
  flow,
  onOpen,
}: {
  flow: BrainstormFlow;
  onOpen: OpenTarget;
}) {
  const { state, dispatch } = useWorkspace();
  const complete = flow.phaseStatus === 'completed';
  return (
    <Card
      eyebrow="步骤 6 · 工作版本"
      title={complete ? '脑暴协作已完成' : '四项成果待最终确认'}
    >
      <div className="bc-artifacts">
        {flow.artifactIds.map((id) => (
          <button
            type="button"
            key={id}
            onClick={() => onOpen({ kind: 'artifact', id })}
          >
            <FileText size={16} />
            <span>
              {state.artifacts[id]?.name}
              <small>v{state.artifacts[id]?.version} · 工作版本</small>
            </span>
            <ArrowUpRight size={14} />
          </button>
        ))}
      </div>
      <p className="bc-boundary">
        <ShieldCheck size={15} />
        工作版本不代表正式审定或报送。
      </p>
      {!complete ? (
        <div className="bc-actions">
          <Action
            primary
            onClick={() =>
              dispatch({
                type: 'brainstorm',
                action: {
                  type: 'working-version-confirm',
                  taskId: flow.taskId,
                },
              })
            }
          >
            确认最终工作版本
          </Action>
          <Action
            onClick={() =>
              onOpen({ kind: 'brainstorm', entity: 'review', id: flow.id })
            }
          >
            进入三栏审阅
          </Action>
        </div>
      ) : null}
    </Card>
  );
}

export function BrainstormAttachment({
  flow,
  messageId,
  onOpen,
}: {
  flow: BrainstormFlow;
  messageId: string;
  onOpen: OpenTarget;
}) {
  const anchor = (
    Object.entries(flow.anchors) as Array<[keyof typeof flow.anchors, string]>
  ).find(([, id]) => id === messageId)?.[0];
  if (!anchor) return null;
  if (anchor === 'issue') return <IssueCard flow={flow} />;
  if (anchor === 'participants')
    return <ParticipantsCard flow={flow} onOpen={onOpen} />;
  if (anchor === 'scope') return <ScopeCard flow={flow} />;
  if (anchor === 'synthesis')
    return <SynthesisCard flow={flow} onOpen={onOpen} />;
  if (anchor === 'decision')
    return <DecisionCard flow={flow} onOpen={onOpen} />;
  if (anchor === 'outline') return <OutlineCard flow={flow} />;
  if (anchor === 'gaps') return <GapCard flow={flow} onOpen={onOpen} />;
  if (anchor === 'final') return <FinalCard flow={flow} onOpen={onOpen} />;
  return null;
}

export function BrainstormHeaderStatus({ flow }: { flow: BrainstormFlow }) {
  const summary = brainstormSummary(flow);
  return (
    <div className="bc-header-status">
      <UsersRound size={16} />
      <span>{brainstormPhaseLabel(flow.phase)}</span>
      <strong>
        {summary.submitted}/{summary.selected} 岗位
      </strong>
      <small>
        {summary.readyTopics}/7主题 · {summary.gaps}项待核
      </small>
    </div>
  );
}

export function BrainstormMonitorSections({
  flow,
  onOpen,
}: {
  flow: BrainstormFlow;
  onOpen: OpenTarget;
}) {
  const submitted = flow.participants.filter(
    (item) => item.status === 'submitted',
  ).length;
  return (
    <>
      <details open className="bc-monitor">
        <summary>协作态势</summary>
        <button
          onClick={() =>
            onOpen({ kind: 'brainstorm', entity: 'review', id: flow.id })
          }
        >
          <UsersRound />
          <span>
            参与岗位
            <strong>
              {flow.participants.filter((item) => item.selected).length}/13
            </strong>
            <small>{submitted}个已提交贡献</small>
          </span>
        </button>
        <button
          onClick={() =>
            onOpen({
              kind: 'brainstorm',
              entity: 'conflict',
              id: 'conflict-ai-balance',
            })
          }
        >
          <AlertTriangle />
          <span>
            分歧与决定
            <strong>
              {
                flow.conflicts.filter((item) => item.status === 'resolved')
                  .length
              }
              /{flow.conflicts.length}
            </strong>
            <small>{flow.decisions.length}项用户决定</small>
          </span>
        </button>
      </details>
      <details open className="bc-monitor">
        <summary>事实与边界</summary>
        <button
          onClick={() =>
            onOpen({
              kind: 'brainstorm',
              entity: 'fact',
              id: 'fact-online-rate',
            })
          }
        >
          <ShieldCheck />
          <span>
            事实状态
            <strong>
              {
                flow.facts.filter(
                  (item) => item.verificationStatus === 'missing',
                ).length
              }
              项缺口
            </strong>
            <small>截止 {flow.factCutoff}</small>
          </span>
        </button>
      </details>
    </>
  );
}

export function BrainstormObjectView({
  taskId,
  target,
  onOpen,
}: {
  taskId: string;
  target: Extract<WorkspaceTarget, { kind: 'brainstorm' }>;
  onOpen: OpenTarget;
}) {
  const { state } = useWorkspace();
  const flow = state.brainstorm.flows[taskId];
  if (!flow) return <p>未找到脑暴协作记录。</p>;
  if (target.entity === 'role') {
    const item = flow.participants.find((entry) => entry.id === target.id);
    return item ? (
      <article className="bc-object">
        <span>职责岗位</span>
        <h2>{item.name}</h2>
        <p>{item.scenarioCapability}</p>
        <dl>
          <div>
            <dt>职责依据</dt>
            <dd>{item.dutyBasis}</dd>
          </div>
          <div>
            <dt>可用材料</dt>
            <dd>{item.materialScope}</dd>
          </div>
          <div>
            <dt>本轮状态</dt>
            <dd>
              {item.status === 'submitted' ? '已提交结构化贡献' : '等待汇集'}
            </dd>
          </div>
        </dl>
      </article>
    ) : (
      <p>岗位不存在。</p>
    );
  }
  if (target.entity === 'topic') {
    const topic = flow.topics.find((entry) => entry.id === target.id);
    return topic ? (
      <article className="bc-object">
        <span>跨处室主题</span>
        <h2>{topic.title}</h2>
        <p>{topic.summary}</p>
        <h3>参与岗位</h3>
        <div className="bc-chip-list">
          {topic.participantIds.map((id) => (
            <button
              key={id}
              onClick={() => onOpen({ kind: 'brainstorm', entity: 'role', id })}
            >
              {flow.participants.find((item) => item.id === id)?.name}
            </button>
          ))}
        </div>
        <h3>综合状态</h3>
        <p>
          {topic.contributionIds.length}项结构化贡献 ·{' '}
          {topic.status === 'ready' ? '已形成初步综合' : '等待汇集'}
        </p>
      </article>
    ) : (
      <p>主题不存在。</p>
    );
  }
  if (target.entity === 'conflict') {
    const conflict = flow.conflicts.find((entry) => entry.id === target.id);
    return conflict ? (
      <article className="bc-object">
        <span>
          {conflict.kind === 'high_impact' ? '高影响分歧' : '普通分歧'}
        </span>
        <h2>{conflict.title}</h2>
        <p>{conflict.summary}</p>
        <dl>
          <div>
            <dt>询证轮次</dt>
            <dd>{conflict.inquiryRounds}轮</dd>
          </div>
          <div>
            <dt>处理状态</dt>
            <dd>{conflict.status === 'resolved' ? '已解决' : '等待处理'}</dd>
          </div>
          <div>
            <dt>影响类别</dt>
            <dd>{conflict.category}</dd>
          </div>
        </dl>
        {conflict.selectedOptionId ? (
          <p className="bc-boundary">
            <CheckCircle2 />
            已选择：
            {
              conflict.options.find(
                (option) => option.id === conflict.selectedOptionId,
              )?.label
            }
          </p>
        ) : null}
      </article>
    ) : (
      <p>分歧不存在。</p>
    );
  }
  if (target.entity === 'fact') {
    const fact = flow.facts.find((entry) => entry.id === target.id);
    return fact ? (
      <article className="bc-object">
        <span>事实证据</span>
        <h2>{fact.label}</h2>
        <p className="bc-fact-value">
          {fact.value === null ? '—' : `${fact.value}${fact.unit || ''}`}
        </p>
        <dl>
          <div>
            <dt>内容性质</dt>
            <dd>{fact.nature === 'synthetic' ? '合成示例' : '待补材料'}</dd>
          </div>
          <div>
            <dt>统计截止</dt>
            <dd>{fact.asOf}</dd>
          </div>
          <div>
            <dt>统计口径</dt>
            <dd>{fact.statisticScope}</dd>
          </div>
          <div>
            <dt>核定状态</dt>
            <dd>
              {fact.verificationStatus === 'pending_year_end'
                ? '待年终核定'
                : '缺少可靠材料'}
            </dd>
          </div>
        </dl>
      </article>
    ) : (
      <p>事实不存在。</p>
    );
  }
  return <BrainstormReviewWorkspace flow={flow} onOpen={onOpen} />;
}

function BrainstormReviewWorkspace({
  flow,
  onOpen,
}: {
  flow: BrainstormFlow;
  onOpen: OpenTarget;
}) {
  const { state } = useWorkspace();
  const reportId = flow.artifactIds[0];
  const body = state.artifacts[reportId]?.body;
  return (
    <section className="bc-review">
      <aside>
        <strong>七个主题</strong>
        {flow.topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() =>
              onOpen({ kind: 'brainstorm', entity: 'topic', id: topic.id })
            }
          >
            {topic.title}
            <small>{topic.contributionIds.length}项</small>
          </button>
        ))}
      </aside>
      <main>
        <span>推荐主稿</span>
        <h2>{state.artifacts[reportId]?.name || '主稿尚未生成'}</h2>
        <div className="bc-report-body">
          {body ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
              {body}
            </ReactMarkdown>
          ) : (
            '确认综合大纲后，将在这里形成一份推荐主稿。'
          )}
        </div>
        {reportId ? (
          <Action onClick={() => onOpen({ kind: 'artifact', id: reportId })}>
            打开完整主稿
          </Action>
        ) : null}
      </main>
      <aside>
        <strong>事实与决定</strong>
        {flow.facts.map((fact) => (
          <button
            key={fact.id}
            onClick={() =>
              onOpen({ kind: 'brainstorm', entity: 'fact', id: fact.id })
            }
          >
            {fact.label}
            <small>{fact.value === null ? '待补材料' : '合成／待核'}</small>
          </button>
        ))}
        {flow.decisions.map((decision) => (
          <p key={decision.id}>
            <CheckCircle2 />
            用户决定已记录<small>{decision.boundary}</small>
          </p>
        ))}
      </aside>
    </section>
  );
}
