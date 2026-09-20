'use client';
import { type ReactNode } from 'react';
import {
  Check,
  ChevronRight,
  FileText,
  ShieldCheck,
  Info,
  LoaderCircle,
} from 'lucide-react';
import { useWorkspace } from './workspace-store';
import {
  PARTY_SYSTEMS,
  PARTY_RECIPIENTS,
  PARTY_SOURCE,
  partyPlan,
  partyStageLabel,
  type PartyFlow,
  type PartyAction,
  type PartySystem,
} from './party-domain';

type Choice = PartyAction extends infer A
  ? A extends PartyAction
    ? Omit<A, 'taskId' | 'revision'>
    : never
  : never;
type Open = (target: { kind: 'artifact'; id: string }) => void;
const date = (value: string) => value.replace('T', ' ');

function Action({
  children,
  onClick,
  primary = false,
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={'party-button' + (primary ? ' primary' : '')}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function PlanEditor({
  flow,
  act,
}: {
  flow: PartyFlow;
  act: (action: Choice) => void;
}) {
  const meetingAt = flow.planDraft?.meetingAt ?? flow.meetingAt;
  const cutoff = flow.planDraft?.cutoff ?? flow.cutoff;
  const extraTopic = flow.planDraft?.extraTopic ?? flow.extraTopic;
  const recipients = flow.planDraft?.recipients ?? flow.recipients;
  const setMeeting = (meetingAt: string) =>
    act({ type: 'draft', plan: { meetingAt } });
  const setCutoff = (cutoff: string) =>
    act({ type: 'draft', plan: { cutoff } });
  const setTopic = (extraTopic: string) =>
    act({ type: 'draft', plan: { extraTopic } });
  const setRecipients = (recipients: string[]) =>
    act({ type: 'draft', plan: { recipients } });
  return (
    <details className="party-details party-editor">
      <summary>
        调整时间、议题或通知范围
        {Object.keys(flow.planDraft || {}).length > 0 ? ' · 有未保存修改' : ''}
      </summary>
      <div className="party-edit-grid">
        <label>
          会议时间
          <input
            type="datetime-local"
            value={meetingAt}
            onChange={(e) => setMeeting(e.target.value)}
            onInput={(e) => setMeeting(e.currentTarget.value)}
          />
        </label>
        <label>
          材料截止
          <input
            type="datetime-local"
            value={cutoff}
            onChange={(e) => setCutoff(e.target.value)}
            onInput={(e) => setCutoff(e.currentTarget.value)}
          />
        </label>
        <label className="wide">
          补充议题
          <input
            value={extraTopic}
            maxLength={120}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="填写新增议题，依据不足的内容会保留待核"
          />
        </label>
      </div>
      <fieldset>
        <legend>通知接收范围</legend>
        <div className="party-recipients">
          {PARTY_RECIPIENTS.map((name) => (
            <label key={name}>
              <input
                type="checkbox"
                checked={recipients.includes(name)}
                onChange={(e) =>
                  setRecipients(
                    e.target.checked
                      ? [...recipients, name]
                      : recipients.filter((r) => r !== name),
                  )
                }
              />
              {name}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="party-muted">
        生成新版本，旧稿保留。对象、范围或内容改变后重新确认发送。
      </p>
      <Action
        primary
        onClick={() =>
          act({ type: 'revise', meetingAt, cutoff, extraTopic, recipients })
        }
      >
        保存调整并重审计划
      </Action>
      {Object.keys(flow.planDraft || {}).length > 0 && (
        <Action onClick={() => act({ type: 'draft', discardPlan: true })}>
          放弃未保存修改
        </Action>
      )}
    </details>
  );
}

function Evidence({
  flow,
  act,
}: {
  flow: PartyFlow;
  act: (action: Choice) => void;
}) {
  return (
    <details className="party-details party-evidence">
      <summary>
        <Info size={14} />
        数据与授权说明
      </summary>
      <p>
        {PARTY_SOURCE}
        。会前来源时点为2026-09-22，会后记录按本人补充时点追加。当前身份为本人，读取限于本次获准参与的会务资料。处室名称为案例用名。
      </p>
      <p>
        第13次会务摘要：材料目录和未完成跟踪项继续作为背景；附件齐套及进度口径尚待核实。摘要只提供背景，不替代原始纪要、正式责任认定或新的提交授权。
      </p>
      <p>
        85%与72%为不同分母的合成口径示例，当前材料没有足够明细可复算，因此均保持待核。未获授权的专项督查系统不可选。
      </p>
      <details className="party-details">
        <summary>辅助演练设置</summary>
        <label className="party-field">
          正式动作返回状态
          <select
            aria-label="正式动作返回状态"
            disabled={[
              'sending',
              'unknown',
              'sent',
              'minutes-sending',
              'minutes-unknown',
            ].includes(flow.stage)}
            value={flow.outcome}
            onChange={(e) =>
              act({
                type: 'exercise',
                outcome: e.target.value as PartyFlow['outcome'],
                oaUnavailable: flow.unavailable.includes('oa'),
              })
            }
          >
            <option value="success">返回本地样例回执</option>
            <option value="failure">明确失败</option>
            <option value="unknown">结果未知，查询后返回回执</option>
          </select>
        </label>
        <label className="party-check">
          <input
            type="checkbox"
            checked={flow.unavailable.includes('oa')}
            disabled={[
              'sending',
              'unknown',
              'sent',
              'minutes-sending',
              'minutes-unknown',
            ].includes(flow.stage)}
            onChange={(e) =>
              act({
                type: 'exercise',
                outcome: flow.outcome,
                oaUnavailable: e.target.checked,
              })
            }
          />
          OA当前不可用
        </label>
        <p className="party-muted">
          仅改变本地案例分支，不产生真实发送或授权。会后请在对话中提供会议记录；源系统正式状态需核验。
        </p>
      </details>
    </details>
  );
}

function PartyCard({ flow, onOpen }: { flow: PartyFlow; onOpen: Open }) {
  const { dispatch, state } = useWorkspace();
  const act = (action: Choice) =>
    dispatch({
      type: 'party',
      action: {
        ...action,
        taskId: flow.id,
        revision: flow.revision,
      } as PartyAction,
    });
  const selected = flow.selectionDraft ?? flow.selected;
  const setSelected = (selected: PartySystem[]) =>
    act({ type: 'draft', selected });
  const gapChoice = flow.gapDraft ?? 'provisional';
  const setGap = (gapChoice: 'wait' | 'provisional' | 'exclude') =>
    act({ type: 'draft', gapChoice });
  const busy = ['collecting', 'sending', 'minutes-sending'].includes(
    flow.stage,
  );
  const preview = (id?: string) => {
    if (id) onOpen({ kind: 'artifact', id });
  };
  const title = {
    systems: '选择本次使用的系统',
    plan: '核对会前工作计划',
    collecting: '正在收集与核查',
    gap: '材料有缺口，工作稿如何处理？',
    waiting: '已保留断点，等待补充依据',
    review: '会前材料已备好，请审阅',
    confirm: '确认发送会议通知',
    sending: '正在核对发送结果',
    failed: '通知发送失败',
    unknown: '通知结果尚未确定',
    sent: '本次通知结果已记录',
    internal: '内部工作稿已保留',
    minutes: '审阅会议纪要',
    'minutes-confirm': '确认提交纪要',
    'minutes-submitted': '等待纪要审定',
    closed: '跟踪会议承诺',
    'minutes-sending': '纪要提交受理中',
    'minutes-failed': '纪要提交失败',
    'minutes-unknown': '纪要结果待核',
  }[flow.stage];
  return (
    <section
      className="party-card"
      aria-label={title}
      data-party-stage={flow.stage}
    >
      <header>
        <span className="party-card-icon">
          {busy ? (
            <LoaderCircle size={18} className="party-spin" />
          ) : (
            <ShieldCheck size={18} />
          )}
        </span>
        <div>
          <h3>{title}</h3>
          <span className="party-muted">
            第14次党组会 · 计划 v{flow.planVersion}
          </span>
        </div>
        <span className="party-state">{partyStageLabel(flow)}</span>
      </header>
      {flow.feedback && (
        <p className="party-alert" role="alert">
          {flow.feedback}
        </p>
      )}
      {flow.stopped ? (
        <div className="party-body">
          <p>工作已暂停，保留当前选择和材料。</p>
          <Action
            primary
            onClick={() => act({ type: 'pause', stopped: false })}
          >
            恢复工作
          </Action>
        </div>
      ) : (
        <div className="party-body">
          {[
            'minutes',
            'minutes-confirm',
            'minutes-submitted',
            'minutes-sending',
            'minutes-failed',
            'minutes-unknown',
            'closed',
          ].includes(flow.stage) && (
            <>
              <p>
                纪要 v{flow.minutesVersion} ·{' '}
                {flow.stage === 'closed'
                  ? '已关联本人提供的审定依据，源系统待核'
                  : '送审与审定分开记录'}
              </p>
              <div className="party-actions">
                <Action onClick={() => preview(flow.minutesArtifact)}>
                  预览纪要
                </Action>
                {flow.stage === 'minutes-unknown' && (
                  <Action
                    primary
                    onClick={() => act({ type: 'minutes-query' })}
                  >
                    查询原纪要提交结果
                  </Action>
                )}
                {flow.stage === 'minutes-failed' && (
                  <Action onClick={() => act({ type: 'minutes-retry' })}>
                    重新核对后提交
                  </Action>
                )}
                {flow.stage === 'minutes' && (
                  <Action
                    primary
                    onClick={() => act({ type: 'minutes-review' })}
                  >
                    审阅完成，准备提交
                  </Action>
                )}
                {flow.stage === 'minutes-confirm' && (
                  <>
                    <Action
                      primary
                      onClick={() => act({ type: 'minutes-submit' })}
                    >
                      确认提交至办公室会务审核岗
                    </Action>
                    <Action onClick={() => act({ type: 'minutes-cancel' })}>
                      暂不提交
                    </Action>
                  </>
                )}
              </div>
              {flow.stage === 'minutes-confirm' && (
                <p className="party-muted">
                  仅提交当前纪要送审稿，不发布决定、不新增正式督办。修改纪要将使本次确认失效。
                </p>
              )}
              {flow.minutesReceipt && (
                <details className="party-details">
                  <summary>提交与审定依据</summary>
                  <p>合成受理记录：{flow.minutesReceipt}</p>
                  <p>
                    {flow.approvalSource ||
                      '尚未收到审定依据，新增责任保持候选。'}
                  </p>
                </details>
              )}
            </>
          )}
          {flow.stage === 'systems' && (
            <>
              <p className="party-muted">
                已推荐必要来源。选中只确定读取范围，后续正式动作仍需单独确认。
              </p>
              <div className="party-systems">
                {PARTY_SYSTEMS.map((system) => {
                  const unavailable = flow.unavailable.includes(system.id);
                  return (
                    <div
                      key={system.id}
                      className={
                        'party-system' + (unavailable ? ' unavailable' : '')
                      }
                    >
                      <label>
                        <input
                          type="checkbox"
                          aria-label={system.name}
                          disabled={
                            unavailable && !selected.includes(system.id)
                          }
                          checked={selected.includes(system.id)}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? [...selected, system.id]
                                : selected.filter((id) => id !== system.id),
                            )
                          }
                        />
                        <span>
                          <strong>{system.name}</strong>
                        </span>
                        <span className="party-small-tag">
                          {unavailable
                            ? system.id === 'inspection'
                              ? '无权限'
                              : '不可用'
                            : system.recommended
                              ? '推荐'
                              : '按需'}
                        </span>
                      </label>
                      <details className="party-scope">
                        <summary>用途与范围</summary>
                        <p>{system.purpose}</p>
                        <p>{system.scope}</p>
                        <p>{system.impact}</p>
                        {unavailable && system.id === 'oa' && (
                          <Action
                            onClick={() =>
                              setSelected(selected.filter((id) => id !== 'oa'))
                            }
                          >
                            取消当前不可用来源
                          </Action>
                        )}
                      </details>
                    </div>
                  );
                })}
              </div>
              <div className="party-actions">
                <Action
                  primary
                  onClick={() => act({ type: 'systems-confirm', selected })}
                >
                  按所选系统制定计划
                </Action>
                <span className="party-muted">已选 {selected.length} 个</span>
              </div>
            </>
          )}
          {flow.stage === 'plan' && (
            <>
              <dl className="party-facts">
                <div>
                  <dt>会议</dt>
                  <dd>{date(flow.meetingAt)}</dd>
                </div>
                <div>
                  <dt>材料截止</dt>
                  <dd>{date(flow.cutoff)}</dd>
                </div>
              </dl>
              {flow.reuseEvidence && (
                <p className="party-muted">
                  沿用已核查来源及缺口决定，本轮仅更新受时间或通知范围影响的材料。
                </p>
              )}
              <ol className="party-plan">
                {partyPlan(flow).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <PlanEditor flow={flow} act={act} />
              <div className="party-actions">
                <Action primary onClick={() => act({ type: 'plan-confirm' })}>
                  按此计划开始核查
                </Action>
                <Action onClick={() => act({ type: 'systems-edit' })}>
                  调整系统
                </Action>
              </div>
              <p className="party-muted">
                确认计划允许读取与整理；不预先批准通知发送。
              </p>
            </>
          )}
          {busy && (
            <output>
              {flow.stage === 'collecting'
                ? '正在读取所选来源并核对材料。遇到缺口会停下来请你判断。'
                : '请求已发出，正在等待对应结果。重复点击不会新增发送请求。'}
            </output>
          )}
          {['gap', 'waiting'].includes(flow.stage) && (
            <>
              <fieldset className="party-options">
                <legend>本次处理方式</legend>
                {(
                  [
                    [
                      'provisional',
                      '先形成工作稿，保留待核标记',
                      '推荐 · 会前整理可继续；不将待核数字作为正式结论。',
                    ],
                    [
                      'exclude',
                      '暂不引用完成率',
                      '材料保留缺件说明，差异只进入核查清单。',
                    ],
                    [
                      'wait',
                      '等待责任处室补件与核实',
                      '保留当前断点，不自动发起催办或发送。',
                    ],
                  ] as const
                ).map(([value, label, detail]) => (
                  <label
                    key={value}
                    aria-label={label}
                    className={gapChoice === value ? 'selected' : ''}
                  >
                    <input
                      type="radio"
                      name={'gap-' + flow.id}
                      checked={gapChoice === value}
                      onChange={() => setGap(value)}
                    />
                    <span>
                      <strong>{label}</strong>
                      <span className="party-muted">{detail}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className="party-actions">
                <Action
                  primary
                  onClick={() => act({ type: 'gap', choice: gapChoice })}
                >
                  确认处理方式
                </Action>
                <Action onClick={() => act({ type: 'say', text: '再检查' })}>
                  重新核查
                </Action>
              </div>
            </>
          )}
          {flow.stage === 'review' && (
            <>
              <p>
                议程、落实清单和督办报告中仍有待核项；通知仅包含时间安排与材料报送要求。
              </p>
              <div className="party-artifacts">
                {flow.artifacts.map((id) => (
                  <button type="button" key={id} onClick={() => preview(id)}>
                    <FileText size={16} />
                    <span>{state.artifacts[id]?.name}</span>
                    <small>v{state.artifacts[id]?.version}</small>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
              <PlanEditor flow={flow} act={act} />
              <div className="party-actions">
                <Action primary onClick={() => act({ type: 'prepare-send' })}>
                  准备发送通知
                </Action>
                <Action onClick={() => act({ type: 'internal' })}>
                  仅保留内部工作稿
                </Action>
                <Action onClick={() => act({ type: 'systems-edit' })}>
                  调整系统
                </Action>
              </div>
            </>
          )}
          {flow.stage === 'confirm' && (
            <>
              <dl className="party-facts vertical">
                <div>
                  <dt>本次操作</dt>
                  <dd>通过OA发送会议通知 v{flow.planVersion}</dd>
                </div>
                <div>
                  <dt>接收方</dt>
                  <dd>{flow.recipients.join('、')}</dd>
                </div>
                <div>
                  <dt>内容及用途</dt>
                  <dd>
                    通知会议安排与材料报送要求；材料截止{date(flow.cutoff)}。
                  </dd>
                </div>
                <div>
                  <dt>发送后</dt>
                  <dd>
                    接收处室可据此准备报送。不会同时发送待核议程、督办工作稿或新增催办。
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                className="party-preview-link"
                onClick={() => preview(flow.noticeArtifact)}
              >
                <FileText size={15} />
                预览完整通知 v{flow.planVersion}
              </button>
              <PlanEditor flow={flow} act={act} />
              <div className="party-actions">
                <Action primary onClick={() => act({ type: 'send' })}>
                  确认本次发送
                </Action>
                <Action onClick={() => act({ type: 'cancel-send' })}>
                  暂不发送
                </Action>
              </div>
            </>
          )}
          {flow.stage === 'failed' && (
            <>
              <p>原请求已明确失败。重试前需重新核对接收方及通知版本。</p>
              <div className="party-actions">
                <Action primary onClick={() => act({ type: 'retry' })}>
                  核对后重新发送
                </Action>
                <Action onClick={() => act({ type: 'internal' })}>
                  保留内部稿
                </Action>
              </div>
            </>
          )}
          {flow.stage === 'unknown' && (
            <>
              <p>原请求保持待核实。先查询处理结果，当前不允许重发。</p>
              <p className="party-request">请求编号：{flow.requestId}</p>
              <Action primary onClick={() => act({ type: 'query-receipt' })}>
                查询原请求结果
              </Action>
            </>
          )}
          {flow.stage === 'sent' && (
            <>
              <p className="party-success">
                <Check size={16} />
                通知 v{flow.planVersion} · {flow.recipients.length} 个接收处室
              </p>
              <p>
                已自动记录本次工作上下文与待核项，可从原对话继续。未生成新的责任认定或共享方法。
              </p>
              <details className="party-details">
                <summary>查看结果与来源</summary>
                <p>回执性质：本地合成回执；不证明真实OA发送。</p>
                <p className="party-request">{flow.receipt}</p>
                <p>关联请求：{flow.submittedRequestId}</p>
                <p>进度口径保持待核，未转为正式事实。</p>
              </details>
              <button
                className="party-preview-link"
                type="button"
                onClick={() => preview(flow.noticeArtifact)}
              >
                查看本次通知内容
              </button>
            </>
          )}
          {flow.stage === 'internal' && (
            <>
              <p>
                未产生通知发送。原成果可在右侧工作区查看；补充时间或议题后生成新版本。
              </p>
              <PlanEditor flow={flow} act={act} />
            </>
          )}
        </div>
      )}
      <footer>
        <Evidence flow={flow} act={act} />
      </footer>
    </section>
  );
}

export function PartyAttachment({
  flow,
  messageId,
  onOpen,
}: {
  flow: PartyFlow;
  messageId: string;
  onOpen: Open;
}) {
  const decision = flow.decisions.find((item) => item.anchor === messageId);
  if (decision)
    return (
      <details className="party-resolved">
        <summary>
          <Check size={14} />
          {decision.label}
          <span>v{decision.version} · 已记录</span>
        </summary>
        <p>{decision.summary}</p>
      </details>
    );
  if (flow.anchor !== messageId) return null;
  return (
    <PartyCard
      key={`${flow.anchor}-${flow.planVersion}`}
      flow={flow}
      onOpen={onOpen}
    />
  );
}
