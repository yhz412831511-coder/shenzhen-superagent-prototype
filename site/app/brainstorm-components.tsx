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

function CompactReceipt({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="bc-receipt">
      <CheckCircle2 size={14} />
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
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
  if (flow.issue.confirmed)
    return (
      <CompactReceipt
        title="议题与交付边界已确认"
        detail={`${flow.issue.audience} · ${flow.issue.period}`}
      />
    );
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
  if (flow.phaseStatus !== 'awaiting_participants')
    return (
      <CompactReceipt
        title="参与岗位已确认"
        detail={`${flow.participants.filter((item) => item.selected).length}个职责岗位 · 5个议题组`}
      />
    );
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
  if (flow.sourceScopes.confirmed)
    return (
      <CompactReceipt
        title="材料与授权范围已确认"
        detail="公开职责 · 岗位授权摘要 · 最小必要共享"
      />
    );
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
  const collected = flow.topics.some((topic) => topic.status === 'ready');
  const round = flow.rounds.find((item) => item.id === 'v0')!;
  if (collected && flow.phaseStatus !== 'partial_ready')
    return (
      <CompactReceipt
        title="V0 独立贡献已保留"
        detail={`${flow.participants.filter((item) => item.status === 'submitted').length}岗输出 · 岗位输出清单 · 初步汇集稿`}
      />
    );
  return (
    <Card
      eyebrow="步骤 3 · 主题贡献"
      title={collected ? round.title : '准备汇集岗位贡献'}
    >
      {collected ? (
        <>
          <p className="bc-round-description">{round.description}</p>
          <div className="bc-contribution-list">
            {round.entries.slice(0, 6).map((entry) => (
              <button
                type="button"
                key={entry.participantId}
                onClick={() =>
                  onOpen({
                    kind: 'brainstorm',
                    entity: 'role',
                    id: entry.participantId,
                  })
                }
              >
                <strong>
                  {
                    flow.participants.find(
                      (item) => item.id === entry.participantId,
                    )?.name
                  }
                </strong>
                <span>{entry.statement}</span>
                <small>{entry.outcome}</small>
              </button>
            ))}
          </div>
          <div className="bc-round-summary">
            <span>
              <strong>阶段成果</strong>
              {round.artifacts.join(' · ')}
            </span>
            <span className="attention">
              <strong>继续原因</strong>
              {round.continuationReason}
            </span>
          </div>
        </>
      ) : (
        <p>将按跨处室主题归并13个岗位的结构化贡献，不按机构逐段拼稿。</p>
      )}
      {['collecting', 'partial_ready'].includes(flow.phaseStatus) ? (
        <div className="bc-actions">
          {collected ? (
            <Action
              onClick={() =>
                onOpen({ kind: 'brainstorm', entity: 'round', id: 'v0' })
              }
            >
              查看13岗完整输出
            </Action>
          ) : null}
          <Action
            primary
            onClick={() =>
              dispatch({
                type: 'brainstorm',
                action: {
                  type: collected ? 'inquire' : 'collect',
                  taskId: flow.taskId,
                },
              })
            }
          >
            {collected ? '开始第一轮讨论' : '开始汇集贡献'}
          </Action>
        </div>
      ) : null}
    </Card>
  );
}

const effectLabel = {
  origin: '主张',
  add: '补充',
  challenge: '质疑',
  correct: '校正',
  keep: '保留',
} as const;

function InquiryRoundCard({
  flow,
  onOpen,
}: {
  flow: BrainstormFlow;
  onOpen: OpenTarget;
}) {
  const { dispatch } = useWorkspace();
  const round = flow.rounds.find((item) => item.id === 'v1')!;
  if (flow.phaseStatus !== 'inquiring')
    return (
      <CompactReceipt
        title="V1 第一轮讨论已完成"
        detail={`${round.consensus.length}项一致 · ${round.conflicts.length}项问题进入第二轮 · ${round.artifacts.length}项阶段成果`}
      />
    );
  return (
    <RoundCard
      flow={flow}
      roundId="v1"
      onOpen={onOpen}
      action={
        <Action
          primary
          onClick={() =>
            dispatch({
              type: 'brainstorm',
              action: { type: 'inquire', taskId: flow.taskId },
            })
          }
        >
          进入第二轮询证
        </Action>
      }
    />
  );
}

function RoundCard({
  flow,
  roundId,
  onOpen,
  action,
}: {
  flow: BrainstormFlow;
  roundId: 'v1' | 'v2';
  onOpen: OpenTarget;
  action?: React.ReactNode;
}) {
  const round = flow.rounds.find((item) => item.id === roundId)!;
  return (
    <section className="bc-round-card">
      <header>
        <div>
          <span>步骤 4 · 协同询证</span>
          <strong>{round.title}</strong>
          <small>{round.description}</small>
        </div>
        <b>{round.id.toUpperCase()}</b>
      </header>
      <div className="bc-round-focus">
        <span>讨论焦点</span>
        <strong>{round.focus}</strong>
        <em>{round.conflicts.length}项未决</em>
      </div>
      <div className="bc-round-table-head">
        <span>职责岗位</span>
        <span>作用</span>
        <span>明确主张／回应</span>
        <span>结果</span>
      </div>
      <div className="bc-round-table">
        {round.entries.slice(0, 7).map((entry) => (
          <button
            type="button"
            key={entry.participantId}
            onClick={() =>
              onOpen({
                kind: 'brainstorm',
                entity: 'role',
                id: entry.participantId,
              })
            }
          >
            <strong>
              {
                flow.participants.find(
                  (item) => item.id === entry.participantId,
                )?.name
              }
            </strong>
            <i className={`effect-${entry.effect}`}>
              {effectLabel[entry.effect]}
            </i>
            <span>{entry.statement}</span>
            <small>{entry.outcome}</small>
          </button>
        ))}
      </div>
      <div className="bc-round-summary two-column">
        <span>
          <strong>本轮形成的一致</strong>
          {round.consensus.join('；')}
        </span>
        <span className="attention">
          <strong>仍需处理的矛盾</strong>
          {round.conflicts.join('；')}
        </span>
      </div>
      <footer>
        <small>阶段成果：{round.artifacts.join(' · ')}</small>
        <Action
          onClick={() =>
            onOpen({ kind: 'brainstorm', entity: 'round', id: round.id })
          }
        >
          查看完整论证
        </Action>
        {action}
      </footer>
    </section>
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
  if (conflict.status === 'resolved')
    return (
      <CompactReceipt
        title="V3 用户裁决已记录"
        detail={`${conflict.options.find((item) => item.id === conflict.selectedOptionId)?.label} · 已同步主稿与决定记录`}
      />
    );
  return (
    <>
      <RoundCard flow={flow} roundId="v2" onOpen={onOpen} />
      <section className="bc-decision-card">
        <header>
          <span>步骤 5 · 用户裁决</span>
          <strong>{conflict.title}</strong>
          <small>{conflict.summary}</small>
        </header>
        <button
          type="button"
          className="bc-link"
          onClick={() =>
            onOpen({ kind: 'brainstorm', entity: 'evolution', id: flow.id })
          }
        >
          对照V0初步汇集与V2协作收敛 <ArrowUpRight size={14} />
        </button>
        <div className="bc-options">
          {conflict.options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={option.recommended ? 'recommended' : ''}
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
                {option.recommended ? ' · 建议' : ''}
              </strong>
              <span>{option.impact}</span>
            </button>
          ))}
        </div>
        <p className="bc-boundary">
          <ShieldCheck size={15} />
          本决定仅用于工作版本取舍，不代表领导审定。
        </p>
      </section>
    </>
  );
}

function OutlineCard({ flow }: { flow: BrainstormFlow }) {
  const { dispatch } = useWorkspace();
  const confirmed = flow.phaseStatus === 'outline_ready';
  if (
    !['awaiting_outline_confirmation', 'outline_ready'].includes(
      flow.phaseStatus,
    )
  )
    return (
      <CompactReceipt
        title="综合大纲已确认"
        detail="用户决定已应用到任务排序、场景表述和承诺边界"
      />
    );
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
  if (flow.phaseStatus !== 'fact_gap_attention')
    return (
      <CompactReceipt
        title="事实缺口处理已记录"
        detail="合成、待核与缺失内容均保留明确状态"
      />
    );
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
  if (anchor === 'round')
    return <InquiryRoundCard flow={flow} onOpen={onOpen} />;
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
  const selected = flow.conflicts.find(
    (item) => item.kind === 'high_impact',
  )?.selectedOptionId;
  return (
    <>
      <details open className="bc-monitor">
        <summary>协作过程</summary>
        {flow.rounds.map((round) => (
          <button
            key={round.id}
            className={round.status === 'active' ? 'current' : ''}
            onClick={() =>
              onOpen({ kind: 'brainstorm', entity: 'round', id: round.id })
            }
          >
            {round.status === 'completed' ? (
              <CheckCircle2 />
            ) : round.status === 'active' ? (
              <UsersRound />
            ) : (
              <span className="bc-monitor-dot" />
            )}
            <span>
              {round.id.toUpperCase()} {round.title.replace(/^.*：/, '')}
              <strong>
                {round.status === 'completed'
                  ? '已形成'
                  : round.status === 'active'
                    ? '进行中'
                    : '等待'}
              </strong>
              <small>{round.artifacts.length}项阶段成果</small>
            </span>
          </button>
        ))}
        <button
          className={
            flow.phaseStatus === 'awaiting_high_impact_decision'
              ? 'current'
              : ''
          }
          onClick={() =>
            onOpen({ kind: 'brainstorm', entity: 'evolution', id: flow.id })
          }
        >
          {selected ? <CheckCircle2 /> : <AlertTriangle />}
          <span>
            V3 用户裁决与版本变化
            <strong>{selected ? '已记录' : '等待决定'}</strong>
            <small>主稿差异与协作增益回执</small>
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

function BrainstormRoundWorkspace({
  flow,
  roundId,
  onOpen,
}: {
  flow: BrainstormFlow;
  roundId: string;
  onOpen: OpenTarget;
}) {
  const round =
    flow.rounds.find((item) => item.id === roundId) || flow.rounds[0];
  return (
    <section className="bc-argument-workspace">
      <header>
        <div>
          <span>协作论证 · {round.id.toUpperCase()}</span>
          <h2>{round.title}</h2>
          <p>{round.description}</p>
        </div>
        <button
          type="button"
          onClick={() =>
            onOpen({ kind: 'brainstorm', entity: 'evolution', id: flow.id })
          }
        >
          查看版本变化 <ArrowUpRight size={14} />
        </button>
      </header>
      <div className="bc-argument-focus">
        <span>讨论焦点</span>
        <strong>{round.focus}</strong>
        <em>{round.conflicts.length}项未决</em>
      </div>
      <div className="bc-argument-head">
        <span>职责岗位</span>
        <span>作用</span>
        <span>明确主张／回应</span>
        <span>依据状态</span>
        <span>结果</span>
      </div>
      <div className="bc-argument-rows">
        {round.entries.map((entry) => (
          <button
            type="button"
            key={entry.participantId}
            onClick={() =>
              onOpen({
                kind: 'brainstorm',
                entity: 'role',
                id: entry.participantId,
              })
            }
          >
            <strong>
              {
                flow.participants.find(
                  (item) => item.id === entry.participantId,
                )?.name
              }
            </strong>
            <i className={`effect-${entry.effect}`}>
              {effectLabel[entry.effect]}
            </i>
            <span>{entry.statement}</span>
            <small>{entry.basisStatus}</small>
            <em>{entry.outcome}</em>
          </button>
        ))}
      </div>
      <div className="bc-argument-outcomes">
        <section>
          <h3>本轮形成的一致</h3>
          <ul>
            {round.consensus.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="attention">
          <h3>仍需处理的矛盾</h3>
          <ul>
            {round.conflicts.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
      <footer>
        <strong>阶段成果</strong>
        <span>{round.artifacts.join(' · ')}</span>
        <small>继续原因：{round.continuationReason}</small>
      </footer>
    </section>
  );
}

function BrainstormEvolutionWorkspace({ flow }: { flow: BrainstormFlow }) {
  const selected = flow.conflicts
    .find((item) => item.kind === 'high_impact')
    ?.options.find(
      (item) =>
        item.id ===
        flow.conflicts.find((entry) => entry.kind === 'high_impact')
          ?.selectedOptionId,
    );
  return (
    <section className="bc-evolution-workspace">
      <header>
        <span>协作增益</span>
        <h2>从初步汇集到两轮岗位互证</h2>
        <p>
          比较相同议题、相同材料范围下，结论因职责补证和相互质疑发生的变化。
        </p>
      </header>
      <div className="bc-version-compare">
        <article>
          <strong>{flow.evolution.baselineTitle}</strong>
          <p>{flow.evolution.baselineText}</p>
        </article>
        <article>
          <strong>
            {selected
              ? `V3 ${selected.label}工作版本`
              : flow.evolution.convergedTitle}
          </strong>
          <p>{selected?.impact || flow.evolution.convergedText}</p>
        </article>
      </div>
      <div className="bc-change-ledger">
        <div className="bc-change-head">
          <span>变化类型</span>
          <span>相关岗位</span>
          <span>具体变化</span>
          <span>结果影响</span>
        </div>
        {flow.evolution.changes.map((change) => (
          <div key={change.text}>
            <i>
              {
                (
                  {
                    added_condition: '补充条件',
                    corrected_boundary: '纠正边界',
                    formed_dependency: '形成协同',
                    reduced_claim: '降级表述',
                  } as const
                )[change.kind]
              }
            </i>
            <span>
              {change.participantIds
                .map(
                  (id) =>
                    flow.participants.find((item) => item.id === id)?.name,
                )
                .join('、')}
            </span>
            <strong>{change.text}</strong>
            <small>{change.impact}</small>
          </div>
        ))}
      </div>
      <div className="bc-gain-receipt">
        <span>
          <strong>
            {
              flow.evolution.changes.filter(
                (item) => item.kind === 'added_condition',
              ).length
            }
          </strong>
          新增准入条件
        </span>
        <span>
          <strong>
            {
              flow.evolution.changes.filter(
                (item) =>
                  item.kind === 'corrected_boundary' ||
                  item.kind === 'reduced_claim',
              ).length
            }
          </strong>
          风险或无依据表述被纠正
        </span>
        <span>
          <strong>
            {
              flow.evolution.changes.filter(
                (item) => item.kind === 'formed_dependency',
              ).length
            }
          </strong>
          跨处室依赖被明确
        </span>
        <span>
          <strong>1</strong>高影响方向由用户决定
        </span>
      </div>
      <p className="bc-boundary">
        <ShieldCheck size={15} />
        以上为合成工作示例，不代表真实处室意见、正式规划或已核定任务。
      </p>
    </section>
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
  if (target.entity === 'round')
    return (
      <BrainstormRoundWorkspace
        flow={flow}
        roundId={target.id}
        onOpen={onOpen}
      />
    );
  if (target.entity === 'evolution')
    return <BrainstormEvolutionWorkspace flow={flow} />;
  if (target.entity === 'role') {
    const item = flow.participants.find((entry) => entry.id === target.id);
    const contribution = flow.contributions.find(
      (entry) => entry.participantId === item?.id,
    );
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
          <div>
            <dt>明确主张</dt>
            <dd>{contribution?.position}</dd>
          </div>
          <div>
            <dt>依据状态</dt>
            <dd>{contribution?.basisStatus}</dd>
          </div>
          <div>
            <dt>对主稿的影响</dt>
            <dd>{contribution?.draftImpact}</dd>
          </div>
        </dl>
        {contribution?.questions.length ? (
          <>
            <h3>向相关岗位提出的问题</h3>
            <ul className="bc-question-list">
              {contribution.questions.map((question) => (
                <li key={question.text}>
                  <strong>
                    {
                      flow.participants.find(
                        (entry) => entry.id === question.participantId,
                      )?.name
                    }
                  </strong>
                  {question.text}
                </li>
              ))}
            </ul>
          </>
        ) : null}
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
        {topic.id === 'ai-government' ? (
          <>
            <h3>协作变化</h3>
            <ul className="bc-question-list">
              {flow.evolution.changes.slice(0, 4).map((change) => (
                <li key={change.text}>
                  <strong>{change.impact}</strong>
                  {change.text}
                </li>
              ))}
            </ul>
            <div className="bc-actions">
              <Action
                onClick={() =>
                  onOpen({
                    kind: 'brainstorm',
                    entity: 'round',
                    id:
                      flow.rounds.find((item) => item.status === 'active')
                        ?.id || 'v2',
                  })
                }
              >
                查看当前轮次论证
              </Action>
              <Action
                onClick={() =>
                  onOpen({
                    kind: 'brainstorm',
                    entity: 'evolution',
                    id: flow.id,
                  })
                }
              >
                查看版本变化
              </Action>
            </div>
          </>
        ) : null}
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
        <h3>两轮论证结果</h3>
        <ul className="bc-question-list">
          {flow.rounds.slice(1).map((round) => (
            <li key={round.id}>
              <strong>{round.title}</strong>
              {round.consensus.join('；')}。仍需处理：
              {round.conflicts.join('；')}。
            </li>
          ))}
        </ul>
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
