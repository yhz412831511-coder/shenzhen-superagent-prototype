'use client';

import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Route,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  atomicTaskGroups,
  atomicTaskTypes,
  modelById,
  modelCatalog,
  type AtomicTaskType,
  type RoutingLevel,
  type RoutingRule,
} from '../../shared/routing-domain';
import { MEETING_COMPARISON, aiMemoryStories } from '../../shared/story-corpus';
import type { AdminRole } from './governance';
import { mayManage, meetingSamples } from './governance';
import type { Filters, State } from './admin/data';
import { filteredCalls, records, unitName } from './admin/data';
import { token } from './admin/ui';
import type { Navigate } from './admin/views';
import {
  beginRoutingTrial,
  completeRoutingEvaluation,
  getTokenGovernanceState,
  publishRoutingCandidate,
  requestRoutingEvaluation,
  retainTokenGovernanceState,
  rollbackRoutingPolicy,
  saveRoutingRule,
  type TokenGovernanceState,
} from './token-governance';
import './token-governance.css';

const levelName: Record<RoutingLevel, string> = {
  L1: '轻度任务',
  L2: '中度任务',
  L3: '重度任务',
};

function modelName(id: string) {
  return modelById(id)?.name ?? id;
}

function AiMemoryGovernanceChecks() {
  return (
    <section className="token-panel ai-memory-governance">
      <div className="token-panel-heading">
        <div>
          <h2>固定案例的记忆治理检查</h2>
          <p>仅展示来源、版本、授权与实际作用等脱敏元数据，不展示个人记忆或任务正文。</p>
        </div>
        <span>五条合成快照</span>
      </div>
      <div className="token-table-wrap">
        <table className="token-table compact">
          <thead>
            <tr>
              <th>案例</th>
              <th>来源与版本</th>
              <th>授权与实际作用</th>
              <th>人工确认与回执边界</th>
            </tr>
          </thead>
          <tbody>
            {aiMemoryStories.map((story) => (
              <tr key={story.id}>
                <td><b>{story.name}</b><small>{story.source}</small></td>
                <td>固定合成快照 · {story.evidence.length}项依据</td>
                <td>按任务最小必要范围提供；{story.evidence.map((item) => item.effect).join('；')}</td>
                <td>正式判断、共享与发布均须人工确认；无源系统回执不标记系统成功。</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function TokenDistribution({
  state,
  filters,
  detail = false,
  go,
}: {
  state: State;
  filters: Filters;
  detail?: boolean;
  go: Navigate;
}) {
  const calls = filteredCalls(state, filters).filter(
    (call) =>
      !filters.search ||
      [call.id, call.task, call.atomicTaskType, call.policyVersion]
        .join(' ')
        .toLowerCase()
        .includes(filters.search.toLowerCase()),
  );
  const modelCalls = calls.filter((call) => call.type === '模型请求');
  const metered = modelCalls.filter((call) => call.metered);
  const rows = atomicTaskTypes.map((taskType) => {
    const current = metered.filter((call) => call.atomicTaskType === taskType);
    const all = modelCalls.filter((call) => call.atomicTaskType === taskType);
    const input = current.reduce((sum, call) => sum + call.input, 0);
    const output = current.reduce((sum, call) => sum + call.output, 0);
    const retry = current.reduce(
      (sum, call) => sum + (call.retryTokens ?? 0),
      0,
    );
    const routing = current.reduce(
      (sum, call) => sum + (call.routingTokens ?? 0),
      0,
    );
    const models = [...new Set(current.map((call) => modelName(call.model)))];
    return {
      taskType,
      level:
        current[0]?.routeLevel ??
        atomicTaskGroups.find((group) => group.tasks.includes(taskType))!.level,
      input,
      output,
      retry,
      routing,
      total: input + output + retry + routing,
      calls: all.length,
      models,
      upgrades: all.filter((call) => call.upgradedFrom).length,
      fallbacks: all.filter((call) => call.fallbackUsed).length,
      pending: all.filter((call) => !call.metered).length,
    };
  });
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  const max = Math.max(...rows.map((row) => row.total), 1);
  const pending = modelCalls.filter((call) => !call.metered).length;
  const upgrades = modelCalls.filter((call) => call.upgradedFrom).length;
  const fallbacks = modelCalls.filter((call) => call.fallbackUsed).length;
  const levels = atomicTaskGroups.map((group) => ({
    ...group,
    token: rows
      .filter((row) => row.level === group.level)
      .reduce((sum, row) => sum + row.total, 0),
  }));

  if (detail)
    return (
      <div className="token-governance-stack">
        <section className="token-panel">
          <div className="token-panel-heading">
            <div>
              <h2>步骤级调用计量</h2>
              <p>
                管理后台不展示任务正文，只保留分类、模型、策略版本和计量证据。
              </p>
            </div>
            <span>{calls.length}条记录</span>
          </div>
          <div className="token-table-wrap">
            <table className="token-table">
              <thead>
                <tr>
                  <th>调用／任务</th>
                  <th>原子任务</th>
                  <th>等级／模型</th>
                  <th>策略版本</th>
                  <th>Token</th>
                  <th>路由结果</th>
                  <th>计量</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call) => (
                  <tr key={call.id}>
                    <td>
                      <button
                        className="token-link"
                        onClick={() => go('tasks', call.task)}
                      >
                        {call.id}
                      </button>
                      <small>
                        {call.task} · {unitName(call.unit, state)}
                      </small>
                    </td>
                    <td>
                      {call.atomicTaskType ?? '工具执行'}
                      <small>{call.businessScenario ?? call.entry}</small>
                    </td>
                    <td>
                      {call.routeLevel ?? 'L0'}
                      <small>
                        {call.type === '模型请求'
                          ? modelName(call.model)
                          : '不调用模型'}
                      </small>
                    </td>
                    <td>{call.policyVersion ?? '—'}</td>
                    <td>
                      {call.metered
                        ? token(call.input + call.output)
                        : '待回传'}
                      <small>
                        {call.metered
                          ? `输入 ${token(call.input)} · 输出 ${token(call.output)}`
                          : '不按零用量计入'}
                      </small>
                    </td>
                    <td>
                      {call.fallbackUsed
                        ? '备用切换'
                        : call.upgradedFrom
                          ? `${call.upgradedFrom}升级`
                          : call.status}
                      <small>{call.routeReason ?? '按已发布策略执行'}</small>
                    </td>
                    <td>
                      {call.metered
                        ? (call.qualityReceipt ?? `METER-${call.id}`)
                        : '等待计量回执'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );

  return (
    <div className="token-governance-stack">
      <div className="token-metrics">
        <article>
          <span>本期Token</span>
          <strong>{token(total)}</strong>
          <small>输入、输出、重试与路由开销</small>
        </article>
        <article>
          <span>自动升级</span>
          <strong>{upgrades}</strong>
          <small>复杂度或质量门触发</small>
        </article>
        <article>
          <span>备用切换</span>
          <strong>{fallbacks}</strong>
          <small>只在策略允许时发生</small>
        </article>
        <article>
          <span>计量待回传</span>
          <strong>{pending}</strong>
          <small>未作为零用量计入</small>
        </article>
      </div>
      <section className="token-panel">
        <div className="token-panel-heading">
          <div>
            <h2>按原子任务类型分布</h2>
            <p>
              办文、办会等是业务场景；真正决定模型的是每个执行步骤的任务类型。
            </p>
          </div>
          <span>
            路由策略 v{modelCalls[0]?.policyVersion ?? '2.0'} · 固定运行样本
          </span>
        </div>
        <div className="token-level-summary">
          {levels.map((item) => (
            <div key={item.level}>
              <b>
                {item.level} · {item.name}
              </b>
              <span>
                {token(item.token)} ·{' '}
                {total ? Math.round((item.token / total) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
        <div className="token-bars">
          {rows.map((row) => (
            <div className="token-bar-row" key={row.taskType}>
              <div>
                <b>{row.taskType}</b>
                <span>
                  {row.level} · {row.calls}次
                </span>
              </div>
              <div
                className="token-bar-track"
                aria-label={`${row.taskType} ${row.total} Token`}
              >
                <i
                  style={{
                    width: `${Math.max(row.total ? 5 : 0, (row.total / max) * 100)}%`,
                  }}
                />
              </div>
              <strong>{row.total ? token(row.total) : '—'}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="token-panel">
        <div className="token-panel-heading">
          <div>
            <h2>任务类型与实际模型</h2>
            <p>同一统计口径下核对主模型、自动升级、备用切换和待回传记录。</p>
          </div>
        </div>
        <div className="token-table-wrap">
          <table className="token-table compact">
            <thead>
              <tr>
                <th>任务类型</th>
                <th>默认等级</th>
                <th>实际模型</th>
                <th>调用</th>
                <th>升级</th>
                <th>备用</th>
                <th>待回传</th>
                <th>Token</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.taskType}>
                  <td>
                    <b>{row.taskType}</b>
                  </td>
                  <td>{row.level}</td>
                  <td>{row.models.join('、') || '—'}</td>
                  <td>{row.calls}</td>
                  <td>{row.upgrades}</td>
                  <td>{row.fallbacks}</td>
                  <td>{row.pending}</td>
                  <td>{row.total ? token(row.total) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="token-footnote">
          Token总量只统计已回传的模型计量；缓存输入属于输入子集，不重复相加。不同模型Token数量不直接等同于算力或价格。
        </p>
      </section>
    </div>
  );
}

function selectModels(level: RoutingLevel) {
  return modelCatalog.filter(
    (model) =>
      model.status === 'available' && model.recommendedLevels.includes(level),
  );
}

export function TaskRoutingView({
  role,
  go,
}: {
  role: AdminRole;
  go: Navigate;
}) {
  const [state, setState] = useState(getTokenGovernanceState);
  const active = state.candidate ?? state.published;
  const [taskType, setTaskType] = useState<AtomicTaskType>('分类');
  const currentRule = active.rules.find((rule) => rule.taskType === taskType)!;
  const [draft, setDraft] = useState<RoutingRule>(structuredClone(currentRule));
  const editable = mayManage(role, 'routing');
  const updateState = (next: TokenGovernanceState) => {
    retainTokenGovernanceState(next);
    setState(next);
  };
  const run = (work: (old: TokenGovernanceState) => TokenGovernanceState) => {
    try {
      updateState(work(state));
    } catch (error) {
      setState({
        ...state,
        error: error instanceof Error ? error.message : '操作失败',
      });
    }
  };
  const choose = (type: AtomicTaskType) => {
    setTaskType(type);
    setDraft(
      structuredClone(active.rules.find((rule) => rule.taskType === type)!),
    );
  };
  const status = state.candidate?.status ?? state.published.status;
  return (
    <div className="token-governance-stack">
      {state.error && (
        <p className="token-error" role="alert">
          {state.error}
        </p>
      )}
      <section className="token-route-hero">
        <div>
          <small>全市任务路由策略 / 步骤级识别</small>
          <h2>按原子任务匹配足够的模型能力</h2>
          <p>
            业务任务先拆为步骤，再识别分类、抽取、起草、分析或复杂推理等任务类型。用户端智能模式读取这里发布的策略。
          </p>
        </div>
        <div className="token-route-status">
          <b>v{active.version}</b>
          <span>{status}</span>
          <small>{active.evaluationStatus}</small>
        </div>
      </section>
      <section className="token-panel">
        <div className="token-panel-heading">
          <div>
            <h2>任务分类与模型映射</h2>
            <p>L0只执行规则、缓存、确定性检索和格式校验，不调用生成模型。</p>
          </div>
          <span>生效范围：全市已授权单位</span>
        </div>
        <div className="token-l0">
          <b>L0 · 无模型处理</b>
          <span>规则判断 · 缓存复用 · 确定性检索 · 格式校验</span>
        </div>
        <div className="token-table-wrap">
          <table className="token-table route-table">
            <thead>
              <tr>
                <th>任务类型</th>
                <th>等级</th>
                <th>主模型</th>
                <th>备用模型</th>
                <th>自动升级</th>
                <th>步骤上限</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {active.rules.map((rule) => (
                <tr
                  key={rule.taskType}
                  className={rule.taskType === taskType ? 'selected' : ''}
                  onClick={() => choose(rule.taskType)}
                >
                  <td>
                    <button className="token-link">{rule.taskType}</button>
                  </td>
                  <td>
                    {rule.level} · {levelName[rule.level]}
                  </td>
                  <td>{modelName(rule.primaryModelId)}</td>
                  <td>{modelName(rule.fallbackModelId)}</td>
                  <td>{rule.autoUpgrade ? '允许' : '不允许'}</td>
                  <td>{token(rule.stepTokenLimit)}</td>
                  <td>{rule.taskType === taskType ? '正在查看' : '已配置'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="token-panel route-editor">
        <div className="token-panel-heading">
          <div>
            <h2>{taskType} · 路由规则</h2>
            <p>保存会生成候选版本，并使此前针对旧候选版本的评测失效。</p>
          </div>
          <span>{editable ? '可配置' : '当前岗位只读'}</span>
        </div>
        <div className="route-editor-grid">
          <label>
            默认等级
            <input
              value={`${draft.level} · ${levelName[draft.level]}`}
              readOnly
            />
          </label>
          <label>
            主模型
            <select
              disabled={!editable}
              value={draft.primaryModelId}
              onChange={(event) =>
                setDraft({ ...draft, primaryModelId: event.target.value })
              }
            >
              {selectModels(draft.level).map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            备用模型
            <select
              disabled={!editable}
              value={draft.fallbackModelId}
              onChange={(event) =>
                setDraft({ ...draft, fallbackModelId: event.target.value })
              }
            >
              {selectModels(draft.level).map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            失败处理
            <select
              disabled={!editable}
              value={draft.failureAction}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  failureAction: event.target
                    .value as RoutingRule['failureAction'],
                })
              }
            >
              <option>使用备用模型</option>
              <option>暂停并请求人工决定</option>
            </select>
          </label>
          <label>
            最大上下文（Token）
            <input
              disabled={!editable}
              type="number"
              value={draft.contextLimit}
              onChange={(event) =>
                setDraft({ ...draft, contextLimit: Number(event.target.value) })
              }
            />
          </label>
          <label>
            单步骤上限（Token）
            <input
              disabled={!editable}
              type="number"
              value={draft.stepTokenLimit}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  stepTokenLimit: Number(event.target.value),
                })
              }
            />
          </label>
        </div>
        <div className="route-conditions">
          <b>允许自动升级</b>
          <button
            disabled={!editable}
            aria-pressed={draft.autoUpgrade}
            onClick={() =>
              setDraft({ ...draft, autoUpgrade: !draft.autoUpgrade })
            }
          >
            {draft.autoUpgrade ? '已开启' : '已关闭'}
          </button>
          <span>{draft.upgradeConditions.join(' · ') || 'L3不再自动升级'}</span>
        </div>
        {editable && (
          <div className="token-actions">
            <Button onClick={() => run((old) => saveRoutingRule(old, draft))}>
              <Save size={15} />
              保存候选版本
            </Button>
            {state.candidate?.status === '候选' && (
              <Button
                variant="outline"
                onClick={() => {
                  const next = requestRoutingEvaluation(state);
                  updateState(next);
                  go('evaluations');
                }}
              >
                <Route size={15} />
                发起路由回归评测
              </Button>
            )}
            {state.candidate?.status === '试用中' && (
              <Button onClick={() => run(publishRoutingCandidate)}>
                发布当前候选
              </Button>
            )}
            <Button
              variant="ghost"
              disabled={!state.published.previousVersion}
              onClick={() => run(rollbackRoutingPolicy)}
            >
              回退上一版本
            </Button>
          </div>
        )}
      </section>
      <section className="token-panel">
        <div className="token-panel-heading">
          <div>
            <h2>版本与操作记录</h2>
            <p>发布和回退只影响后续新任务及尚未开始的步骤。</p>
          </div>
        </div>
        <div className="route-history">
          {state.history.map((item, index) => (
            <div key={`${item.time}-${index}`}>
              <b>{item.action}</b>
              <span>{item.detail}</span>
              <small>{item.time}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function EvaluationCenter({
  state: adminState,
  role,
  go,
}: {
  state: State;
  role: AdminRole;
  go: Navigate;
}) {
  const [state, setState] = useState(getTokenGovernanceState);
  const [selected, setSelected] = useState('EVAL-M14-ROUTE-20');
  const custom = state.evaluations;
  const generic = records(adminState, 'evaluations');
  const current = custom.find((item) => item.id === selected) ?? custom[0];
  const editable = mayManage(role, 'evaluations');
  const update = (next: TokenGovernanceState) => {
    retainTokenGovernanceState(next);
    setState(next);
  };
  const act = (fn: (old: TokenGovernanceState) => TokenGovernanceState) => {
    try {
      update(fn(state));
    } catch (error) {
      setState({
        ...state,
        error: error instanceof Error ? error.message : '操作失败',
      });
    }
  };
  const isMeeting = current.id === 'EVAL-M14-ROUTE-20';
  return (
    <div className="evaluation-layout">
      <aside className="evaluation-list">
        <h2>评测任务</h2>
        <p>准入、质量安全、路由回归和改进效果统一管理。</p>
        {custom.map((item) => (
          <button
            key={item.id}
            className={selected === item.id ? 'selected' : ''}
            onClick={() => setSelected(item.id)}
          >
            <span>{item.type}</span>
            <b>{item.name}</b>
            <small>
              {item.status} · {item.candidateVersion}
            </small>
          </button>
        ))}
        {generic.slice(0, 8).map((item) => (
          <button key={item.id} onClick={() => go('evaluations', item.id)}>
            <span>
              {adminState.rows.find((row) => row.id === item.fields.target)
                ?.page === 'models'
                ? '模型准入'
                : '能力质量与安全'}
            </span>
            <b>{item.name}</b>
            <small>
              {item.status} · {item.fields.targetVersion}
            </small>
          </button>
        ))}
      </aside>
      <main className="evaluation-detail">
        {state.error && (
          <p className="token-error" role="alert">
            {state.error}
          </p>
        )}
        <section className="token-panel evaluation-summary">
          <div>
            <small>
              {current.type} / {current.sampleSet}
            </small>
            <h2>{current.name}</h2>
            <p>{current.evidence}</p>
          </div>
          <span
            className={`evaluation-status ${current.status === '通过' ? 'passed' : ''}`}
          >
            {current.status}
          </span>
        </section>
        <div className="evaluation-gates">
          <article>
            <CheckCircle2 />
            <b>质量门</b>
            <span>{current.qualityGate}</span>
          </article>
          <article>
            <CheckCircle2 />
            <b>安全门</b>
            <span>{current.safetyGate}</span>
          </article>
          <article>
            <CircleAlert />
            <b>Token口径</b>
            <span>{current.tokenMethod}</span>
          </article>
        </div>
        {isMeeting ? (
          <>
            <AiMemoryGovernanceChecks />
            <section className="token-panel">
              <div className="token-panel-heading">
                <div>
                  <h2>第13次经验如何影响第14次</h2>
                  <p>采用同一纠正后输入回放两版策略，核对过程变化和证据。</p>
                </div>
                <span>快照时点 2026-09-25</span>
              </div>
              <div className="token-table-wrap">
                <table className="token-table">
                  <thead>
                    <tr>
                      <th>环节</th>
                      <th>原策略</th>
                      <th>候选策略</th>
                      <th>证据</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MEETING_COMPARISON.map((item) => (
                      <tr key={item.step}>
                        <td>
                          <b>{item.step}</b>
                        </td>
                        <td>{item.before}</td>
                        <td>{item.after}</td>
                        <td>{item.evidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="token-panel">
              <div className="token-panel-heading">
                <div>
                  <h2>同等质量下的完整Token开销</h2>
                  <p>低消耗但未通过质量门的结果不计为有效改进。</p>
                </div>
                <span>固定合成样本</span>
              </div>
              <div className="token-table-wrap">
                <table className="token-table compact">
                  <thead>
                    <tr>
                      <th>固定样本</th>
                      <th>输入</th>
                      <th>输出</th>
                      <th>重试</th>
                      <th>路由</th>
                      <th>合计</th>
                      <th>质量</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meetingSamples.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <b>{item.name}</b>
                          <small>{item.policy}</small>
                        </td>
                        <td>{item.input.toLocaleString()}</td>
                        <td>{item.output.toLocaleString()}</td>
                        <td>{item.retry.toLocaleString()}</td>
                        <td>{item.routing.toLocaleString()}</td>
                        <td>
                          {(
                            item.input +
                            item.output +
                            item.retry +
                            item.routing
                          ).toLocaleString()}
                        </td>
                        <td>{item.quality}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="token-footnote">
                该对照证明评测方法和策略差异，不代表当前生产环境已经形成确定节省。
              </p>
            </section>
          </>
        ) : (
          <>
            <AiMemoryGovernanceChecks />
            <section className="token-panel">
              <div className="token-panel-heading">
              <div>
                <h2>
                  {current.type === '模型准入'
                    ? '模型准入结果'
                    : '路由回归结果'}
                </h2>
                <p>
                  {current.type === '模型准入'
                    ? '在进入组织模型目录前，统一核对质量、安全和计量证据。'
                    : '候选版本与当前生效版本使用同一组11类原子任务固定样本。'}
                </p>
              </div>
              <span>
                {current.baselineVersion} → {current.candidateVersion}
              </span>
            </div>
            <dl className="evaluation-facts">
              <dt>评测对象</dt>
              <dd>{current.target}</dd>
              <dt>固定样本</dt>
              <dd>{current.sampleSet}</dd>
              <dt>执行结论</dt>
              <dd>
                {current.status === '待执行'
                  ? '尚未运行，不能用于发布判断'
                  : current.status === '通过'
                    ? current.type === '模型准入'
                      ? '质量与安全准入项通过，可进入授权范围使用'
                      : '11/11样本达到质量门，安全控制未降级'
                    : '需要整改后复测'}
              </dd>
              <dt>证据状态</dt>
              <dd>{current.evidence}</dd>
            </dl>
              {editable && (
              <div className="token-actions">
                {current.status === '待执行' && (
                  <Button
                    onClick={() =>
                      act((old) => completeRoutingEvaluation(old, true))
                    }
                  >
                    运行固定样本评测
                  </Button>
                )}
                {current.status === '通过' &&
                  state.candidate?.status === '评测通过' &&
                  current.id.startsWith('EVAL-ROUTE-') && (
                    <Button onClick={() => act(beginRoutingTrial)}>
                      开始授权范围试用
                    </Button>
                  )}
                {state.candidate?.status === '试用中' &&
                  current.id.startsWith('EVAL-ROUTE-') && (
                    <Button variant="outline" onClick={() => go('routing')}>
                      返回任务路由发布
                      <ArrowRight size={15} />
                    </Button>
                  )}
              </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
