'use client';
import { useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Briefcase,
  Check,
  Clock3,
  FileText,
  History,
  ListChecks,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMemory } from './memory-store';
import {
  applicationFor,
  contextFor,
  current,
  eligible,
  kindLabels,
  readable,
  refFor,
  revisionStatus,
  scopeLabels,
  statusLabels,
  textFor,
  validatePayload,
  type Memory,
  type MemoryKind,
  type Payload,
  type Scope,
} from './memory-domain';
import type { TaskContext } from './knowledge-memory-pages';
export const inputClass =
  'w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 py-2 text-[length:var(--ui-font-control)] leading-5 text-[color:var(--ui-text)] outline-none focus:border-[var(--ui-brand)] focus:ring-2 focus:ring-[var(--ui-border)]';
export const actionClass =
  'h-9 rounded-lg px-3 text-[length:var(--ui-font-control)]';
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
export function emptyPayload(kind: MemoryKind, subtype = 'plan'): Payload {
  if (kind === 'semantic')
    return {
      kind,
      term: '',
      aliases: [],
      definition: '',
      context: '',
      distinction: '',
      example: '',
    };
  if (kind === 'procedural')
    return { kind, method: '', conditions: '', steps: [], exceptions: '' };
  if (kind === 'episodic')
    return subtype === 'past'
      ? {
          kind,
          subtype: 'past',
          event: '',
          decision: '',
          outcome: '',
          occurredAt: new Date().toISOString(),
        }
      : {
          kind,
          subtype: 'plan',
          goal: '',
          context: '',
          responsible: '本人',
          due: '',
          phase: '下一阶段',
          completion: '',
          progress: 'planned',
        };
  if (kind === 'functional')
    return {
      kind,
      subtype: 'assignment',
      entity: '本人',
      responsibility: '',
      context: '',
      confirmedBy: '本人',
    };
  return { kind, work: '', context: '', keyPoints: [], memories: [] };
}
export function MemoryEditor({
  memory,
  taskId,
  initialKind = 'semantic',
  initialText = '',
  initialContext = '',
  onClose,
}: {
  memory?: Memory;
  taskId?: string;
  initialKind?: MemoryKind;
  initialText?: string;
  initialContext?: string;
  onClose: () => void;
}) {
  const { dispatch } = useMemory();
  const r = memory ? current(memory) : null;
  const [p, setP] = useState<Payload>(
    () =>
      r?.payload ||
      ({
        ...emptyPayload(initialKind),
        ...(initialKind === 'semantic'
          ? { definition: initialText, context: initialContext }
          : initialKind === 'episodic'
            ? { goal: initialText, context: initialContext }
            : initialKind === 'procedural'
              ? { method: initialText, conditions: initialContext }
              : {}),
      } as Payload),
  );
  const [title, setTitle] = useState(r?.title || '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [candidate, setCandidate] = useState(false);
  const patch = (key: string, value: unknown) =>
    setP((old) => ({ ...old, [key]: value }) as Payload);
  const field = (key: string, label: string, multi = false, type = 'text') => {
    const value = (p as unknown as Record<string, unknown>)[key];
    return (
      <Field label={label}>
        {multi ? (
          <textarea
            rows={3}
            className={inputClass}
            value={
              Array.isArray(value)
                ? value.join('\n')
                : typeof value === 'string'
                  ? value
                  : ''
            }
            onChange={(e) =>
              patch(
                key,
                Array.isArray(value)
                  ? e.target.value.split('\n')
                  : e.target.value,
              )
            }
          />
        ) : (
          <input
            type={type}
            className={inputClass}
            value={
              Array.isArray(value)
                ? value.join('、')
                : typeof value === 'string'
                  ? value
                  : ''
            }
            onChange={(e) =>
              patch(
                key,
                Array.isArray(value)
                  ? e.target.value.split(/[、,，]/).filter(Boolean)
                  : e.target.value,
              )
            }
          />
        )}
      </Field>
    );
  };
  const save = () => {
    const name = p.kind === 'semantic' ? p.term : title;
    const e = validatePayload(name, p);
    if (e) {
      setError(e);
      return;
    }
    if (memory && !reason.trim()) {
      setError('请填写本次纠正的原因。');
      return;
    }
    dispatch(
      memory
        ? { type: 'edit', id: memory.id, title: name, payload: p, reason }
        : { type: 'create', title: name, payload: p, taskId, candidate },
    );
    onClose();
  };
  return (
    <div
      className="space-y-4 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5"
      data-testid="memory-editor"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[length:var(--ui-font-body)] font-semibold">
          {memory ? '纠正记忆' : '从工作中保存记忆'}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          aria-label="关闭记忆编辑"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>
      {!memory && (
        <Field label="记忆类别">
          <select
            className={inputClass}
            value={p.kind}
            onChange={(e) => setP(emptyPayload(e.target.value as MemoryKind))}
          >
            {(
              [
                'semantic',
                'procedural',
                'episodic',
                'functional',
              ] as MemoryKind[]
            ).map((k) => (
              <option key={k} value={k}>
                {kindLabels[k]}
              </option>
            ))}
          </select>
        </Field>
      )}
      {p.kind !== 'semantic' && (
        <Field label="名称">
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
      )}
      {p.kind === 'semantic' && (
        <>
          {field('term', '专有名词')}
          {field('aliases', '简称与其他称谓（用顿号分隔）')}
          {field('definition', '具体含义', true)}
          {field('context', '适用语境（事项、业务领域或系统）')}
          {field('distinction', '容易混淆的含义及区别', true)}
          {field('example', '使用例句')}
        </>
      )}
      {p.kind === 'procedural' && (
        <>
          {field('method', '办理方法或工作方式', true)}
          {field('conditions', '适用条件')}
          {field('steps', '步骤（每行一项）', true)}
          {field('exceptions', '例外和需要确认的情况', true)}
        </>
      )}
      {p.kind === 'episodic' && (
        <>
          {!memory && (
            <Field label="情景类型">
              <select
                className={inputClass}
                value={p.subtype}
                onChange={(e) => setP(emptyPayload('episodic', e.target.value))}
              >
                <option value="plan">后续工作规划</option>
                <option value="past">过往经历</option>
              </select>
            </Field>
          )}
          {p.subtype === 'plan' ? (
            <>
              {field('goal', '下一阶段要完成的工作', true)}
              {field('context', '关联事项或业务语境')}
              {field('responsible', '负责人')}
              {field('due', '截止日期（可留空）', false, 'date')}
              {field('phase', '工作阶段')}
              {field('completion', '完成条件', true)}
              <Field label="规划状态">
                <select
                  className={inputClass}
                  value={p.progress}
                  onChange={(e) => patch('progress', e.target.value)}
                >
                  <option value="planned">已规划</option>
                  <option value="in_progress">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="cancelled">已取消</option>
                </select>
              </Field>
            </>
          ) : (
            <>
              {field('event', '已经发生的事情', true)}
              {field('decision', '当时决定', true)}
              {field('outcome', '结果与待核实内容', true)}
            </>
          )}
        </>
      )}
      {p.kind === 'functional' && (
        <>
          {field('entity', '承担人员或处室')}
          {field('responsibility', '本事项实际分工', true)}
          {field('context', '具体事项')}
          {field('confirmedBy', '分工确认人')}
          <p className="text-[length:var(--ui-font-meta)] leading-5 text-[color:var(--ui-muted)]">
            本次只更新事项分工。正式职能依据单位或处室职能说明维护。
          </p>
        </>
      )}
      {memory ? (
        <Field label="纠正原因">
          <input
            className={inputClass}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      ) : (
        <label className="flex items-center gap-2 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
          <input
            type="checkbox"
            checked={candidate}
            onChange={(e) => setCandidate(e.target.checked)}
          />
          从材料整理，先保存为待确认内容
        </label>
      )}
      <p className="text-[length:var(--ui-font-meta)] leading-5 text-[color:var(--ui-muted)]">
        {candidate
          ? '提取的解释等待确认后生效。'
          : '你明确填写并保存的内容将在个人范围生效。'}
        不会自动成为处室正式口径。
      </p>
      {error && (
        <p
          role="alert"
          className="text-[length:var(--ui-font-control)] text-amber-700"
        >
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" className={actionClass} onClick={onClose}>
          取消
        </Button>
        <Button
          className={
            actionClass +
            ' bg-[var(--ui-brand)] text-[color:var(--ui-on-brand)]'
          }
          onClick={save}
        >
          {memory ? '保存新版本' : candidate ? '保存候选' : '确认保存'}
        </Button>
      </div>
    </div>
  );
}
function KindIcon({ kind }: { kind: MemoryKind }) {
  const Icon = {
    working: Briefcase,
    semantic: BookOpen,
    procedural: ListChecks,
    episodic: Clock3,
    functional: Users,
  }[kind];
  return <Icon className="size-4" aria-hidden="true" />;
}
function ApplicationView({
  revision,
}: {
  revision: ReturnType<typeof current>;
}) {
  const application = applicationFor(revision);
  return (
    <section
      className="overflow-hidden rounded-xl border border-[var(--ui-brand-border)] bg-[var(--ui-surface)]"
      data-testid="memory-application"
    >
      <div className="flex items-start gap-3 border-b border-[var(--ui-brand-border)] bg-[var(--ui-brand-soft)] p-4">
        <span className="mt-0.5 rounded-lg bg-[var(--ui-surface)] p-2 text-[color:var(--ui-brand)]">
          <KindIcon kind={revision.payload.kind} />
        </span>
        <div>
          <p className="text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-brand)]">
            工作作用
          </p>
          <p className="mt-1 text-[length:var(--ui-font-body)] font-medium leading-7 text-[color:var(--ui-text)]">
            {application.workRole}
          </p>
        </div>
      </div>
      <div className="grid gap-px bg-[var(--ui-border)] sm:grid-cols-3">
        {[
          ['适用工作', application.applicableWork],
          ['对工作的帮助', application.workBenefit],
          ['责任边界', application.responsibilityBoundary],
        ].map(([label, value]) => (
          <div key={label} className="bg-[var(--ui-surface)] p-4">
            <p className="text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-muted)]">
              {label}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-[length:var(--ui-font-control)] leading-6 text-[color:var(--ui-text)]">
              {value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
function PayloadView({ payload: p }: { payload: Payload }) {
  return (
    <div className="space-y-3 text-[length:var(--ui-font-control)] leading-6 text-[color:var(--ui-text)]">
      {p.kind === 'working' && (
        <>
          <p className="whitespace-pre-wrap rounded-lg bg-[var(--ui-canvas)] p-4">
            {p.work}
          </p>
          <Meta label="工作事项" value={p.context || '未填写业务语境'} />
          <h3 className="text-[length:var(--ui-font-control)] font-medium">
            工作中的关键记忆
          </h3>
          {p.keyPoints.map((point, i) => (
            <div
              key={point.eventId + i}
              className="rounded-lg border border-[var(--ui-border)] p-3"
            >
              <p className="mb-1 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
                {
                  {
                    requirement: '关键要求',
                    decision: '用户决定',
                    result: '结果反馈（本人陈述）',
                  }[point.kind]
                }{' '}
                · {point.at.slice(0, 10)}
              </p>
              <p className="whitespace-pre-wrap">{point.text}</p>
            </div>
          ))}
          {!p.keyPoints.length && (
            <p className="text-[length:var(--ui-font-control)] text-[color:var(--ui-muted)]">
              尚无关键记录。
            </p>
          )}
        </>
      )}
      {p.kind === 'semantic' && (
        <>
          <p className="whitespace-pre-wrap rounded-lg bg-[var(--ui-canvas)] p-4">
            {p.definition}
          </p>
          <Meta label="简称与称谓" value={p.aliases.join('、') || '无'} />
          <Meta label="适用语境" value={p.context} />
          {p.distinction && (
            <Meta label="需要区分" value={p.distinction} />
          )}{' '}
          {p.example && <Meta label="使用例句" value={p.example} />}
        </>
      )}
      {p.kind === 'procedural' && (
        <>
          <p className="whitespace-pre-wrap rounded-lg bg-[var(--ui-canvas)] p-4">
            {p.method}
          </p>
          <Meta label="适用条件" value={p.conditions || '本人工作'} />
          <h3 className="pt-1 text-[length:var(--ui-font-control)] font-medium">
            办理步骤
          </h3>
          <ol className="space-y-2">
            {p.steps.map((step, index) => (
              <li
                key={step + index}
                className="flex gap-3 rounded-lg border border-[var(--ui-border)] p-3"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--ui-brand-soft)] text-[length:var(--ui-font-meta)] font-semibold text-[color:var(--ui-brand)]">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {!p.steps.length && (
            <p className="text-[color:var(--ui-muted)]">尚未拆分办理步骤。</p>
          )}
          {p.exceptions && <Meta label="例外处理" value={p.exceptions} />}
          {p.skill && <Meta label="关联Skill" value={p.skill} />}
        </>
      )}
      {p.kind === 'episodic' && p.subtype === 'past' && (
        <>
          <Meta label="发生时间" value={p.occurredAt.slice(0, 10)} />
          <Meta label="相关事项" value={p.context || '本人相关工作'} />
          <div className="space-y-2 rounded-lg bg-[var(--ui-canvas)] p-4">
            <p className="font-medium">当时发生</p>
            <p className="whitespace-pre-wrap">{p.event}</p>
          </div>
          <Meta label="本人决定" value={p.decision || '未记录'} />
          <Meta label="处理结果" value={p.outcome || '待核实'} />
        </>
      )}
      {p.kind === 'episodic' && p.subtype === 'plan' && (
        <>
          <p className="whitespace-pre-wrap rounded-lg bg-[var(--ui-canvas)] p-4">
            {p.goal}
          </p>
          <Meta label="适用语境" value={p.context || '本人工作'} />
          <Meta label="负责人" value={p.responsible} />
          <Meta label="时间／阶段" value={p.due || p.phase} />
          <Meta label="完成条件" value={p.completion} />
          <Meta
            label="当前状态"
            value={
              {
                planned: '已规划',
                in_progress: '进行中',
                completed: '已完成',
                cancelled: '已取消',
              }[p.progress]
            }
          />
        </>
      )}
      {p.kind === 'functional' && (
        <>
          <p className="whitespace-pre-wrap rounded-lg bg-[var(--ui-canvas)] p-4">
            {p.responsibility}
          </p>
          <Meta
            label="职能性质"
            value={p.subtype === 'formal' ? '正式职能说明' : '本事项实际分工'}
          />
          <Meta label="承担主体" value={p.entity} />
          <Meta label="适用事项" value={p.context} />
          <Meta label="确认人" value={p.confirmedBy || '待核实'} />
        </>
      )}
    </div>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-3 text-[length:var(--ui-font-control)] leading-6">
      <span className="text-[color:var(--ui-muted)]">{label}</span>
      <span className="whitespace-pre-wrap break-words">{value}</span>
    </div>
  );
}
export function MemoryPage({
  onUse,
  onOpenTask,
  selectedId,
  onSelect,
  onReminders,
  onBack,
}: {
  onUse: (c: TaskContext) => void;
  onOpenTask: (id: string) => void;
  selectedId?: string;
  onSelect: (id: string) => void;
  onReminders: () => void;
  onBack?: () => void;
}) {
  const { state, dispatch } = useMemory();
  const selected = state.memories.find((x) => x.id === selectedId);
  const [scope, setScope] = useState<'personal' | 'organization'>(
    selected && selected.scope !== 'personal' ? 'organization' : 'personal',
  );
  const [org, setOrg] = useState('all');
  const [kind, setKind] = useState('all');
  const [subtype, setSubtype] = useState('all');
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [contribution, setContribution] = useState('');
  const [target, setTarget] = useState<'department' | 'unit' | 'city'>(
    'department',
  );
  const [deleting, setDeleting] = useState(false);
  const rows = state.memories.filter((m) => {
    const r = current(m);
    return (
      readable(m) &&
      (scope === 'personal'
        ? m.scope === 'personal'
        : m.scope !== 'personal' && (org === 'all' || m.scope === org)) &&
      (kind === 'all' || r.payload.kind === kind) &&
      (subtype === 'all' ||
        ('subtype' in r.payload && r.payload.subtype === subtype)) &&
      (status === 'all'
        ? r.status !== 'archived' && r.status !== 'withdrawn'
        : r.status === status) &&
      [
        r.title,
        textFor(r.payload),
        contextFor(r.payload),
        r.source.label,
        r.payload.kind === 'semantic' ? r.payload.aliases.join(' ') : '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(q.toLowerCase())
    );
  });
  const m = rows.find((x) => x.id === selectedId);
  const r = m ? current(m) : undefined;
  const choose = (id: string) => {
    onSelect(id);
    setEditing(false);
    setCreating(false);
    setContributing(false);
    setDeleting(false);
  };
  const uses = m
    ? state.tasks.flatMap((t) =>
        t.uses
          .filter((u) => u.memoryId === m.id)
          .map((u) => ({ ...u, title: t.title })),
      )
    : [];
  return (
    <div
      className="fw-memory-page flex min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--ui-center)] p-5 lg:p-7"
      data-testid="memory-page"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {onBack && (
              <Button
                variant="ghost"
                onClick={onBack}
                aria-label="返回来源任务"
              >
                <ArrowLeft className="size-4" />
              </Button>
            )}
            <BrainCircuit className="size-5 text-[color:var(--ui-brand)]" />
            <h2 className="text-xl font-semibold text-[color:var(--ui-text)]">
              记忆
            </h2>
          </div>
          <p className="mt-2 text-[length:var(--ui-font-control)] text-[color:var(--ui-muted)]">
            专业理解、工作经验与事项安排
          </p>
        </div>
        <Button
          className={
            actionClass +
            ' bg-[var(--ui-brand)] text-[color:var(--ui-on-brand)]'
          }
          onClick={() => {
            setCreating(true);
            setEditing(false);
          }}
        >
          <Plus className="size-4" />
          保存记忆
        </Button>
      </div>
      <div className="mb-4 flex items-center gap-1 border-b border-[var(--ui-border)]">
        {[
          ['personal', '我的记忆'],
          ['organization', '组织经验'],
        ].map(([id, name]) => (
          <button
            key={id}
            className={`px-4 py-3 text-[length:var(--ui-font-control)] ${scope === id ? 'border-b-2 border-[var(--ui-brand)] font-semibold text-[color:var(--ui-brand)]' : 'text-[color:var(--ui-muted)]'}`}
            onClick={() => {
              setScope(id as typeof scope);
              setKind('all');
              setSubtype('all');
              setStatus('all');
              setCreating(false);
              setEditing(false);
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="fw-input-with-icon relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--ui-muted)]" />
          <input
            aria-label="搜索记忆"
            placeholder="搜索名称、简称、含义或来源"
            className={inputClass}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <select
          aria-label="记忆状态"
          className={inputClass + ' w-auto'}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">全部状态</option>
          {(
            [
              'active',
              'candidate',
              'disputed',
              'disabled',
              'expired',
              'archived',
            ] as const
          ).map((v) => (
            <option key={v} value={v}>
              {statusLabels[v]}
            </option>
          ))}
        </select>
        {scope === 'organization' && (
          <select
            aria-label="组织范围"
            className={inputClass + ' w-auto'}
            value={org}
            onChange={(e) => setOrg(e.target.value)}
          >
            <option value="all">全部组织</option>
            {['department', 'unit', 'city'].map((v) => (
              <option key={v} value={v}>
                {scopeLabels[v as Scope]}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {[['all', '全部'], ...Object.entries(kindLabels)].map(([id, label]) => (
          <button
            key={id}
            onClick={() => {
              setKind(id);
              setSubtype('all');
            }}
            className={`rounded-lg px-3 py-2 text-[length:var(--ui-font-control)] ${kind === id ? 'bg-[var(--ui-brand-soft)] font-medium text-[color:var(--ui-brand)]' : 'bg-[var(--ui-surface)] text-[color:var(--ui-muted)] hover:bg-[var(--ui-canvas)]'}`}
          >
            {label}
          </button>
        ))}
        {['episodic', 'functional'].includes(kind) && (
          <select
            className={inputClass + ' w-auto'}
            aria-label="记忆子类"
            value={subtype}
            onChange={(e) => setSubtype(e.target.value)}
          >
            <option value="all">全部子类</option>
            {(kind === 'episodic'
              ? [
                  ['past', '过往经历'],
                  ['plan', '工作规划'],
                ]
              : [
                  ['formal', '正式职能'],
                  ['assignment', '事项分工'],
                ]
            ).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        )}
      </div>
      {state.notice && (
        <output className="mb-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] p-3 text-[length:var(--ui-font-control)] text-[color:var(--ui-text)]">
          {state.notice}
        </output>
      )}
      <div className="fw-split-layout grid min-h-[460px] flex-1 grid-cols-1 overflow-hidden rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] min-[820px]:grid-cols-[minmax(210px,0.85fr)_minmax(320px,1.4fr)]">
        <div className="fw-memory-list-pane fw-split-list-pane border-r border-[var(--ui-border)]">
          <p className="border-b border-[var(--ui-border)] px-4 py-3 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
            {rows.length} 条记忆
          </p>
          <div className="max-h-[340px] overflow-y-auto min-[820px]:max-h-[680px]">
            {rows.map((item) => {
              const ir = current(item);
              return (
                <button
                  key={item.id}
                  onClick={() => choose(item.id)}
                  className={`fw-split-list-item block w-full border-b border-[var(--ui-border)] px-4 py-4 text-left ${m?.id === item.id && !creating ? 'is-selected' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[length:var(--ui-font-control)] font-medium leading-6 text-[color:var(--ui-text)]">
                      {ir.title}
                    </span>
                    <span
                      className={`shrink-0 text-[length:var(--ui-font-meta)] ${ir.status === 'active' ? 'text-[color:var(--ui-text)]' : 'text-[color:var(--ui-warning)]'}`}
                    >
                      {statusLabels[ir.status]}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[length:var(--ui-font-control)] leading-5 text-[color:var(--ui-muted)]">
                    {applicationFor(ir).workRole}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
                    <KindIcon kind={ir.payload.kind} />
                    <span>
                      {kindLabels[ir.payload.kind]} ·{' '}
                      {contextFor(ir.payload) || '通用工作'} · v{ir.number}
                    </span>
                  </div>
                </button>
              );
            })}
            {!rows.length && (
              <p className="px-5 py-12 text-[length:var(--ui-font-control)] text-[color:var(--ui-muted)]">
                没有符合条件的记忆。
              </p>
            )}
          </div>
        </div>
        <div className="fw-memory-detail-pane fw-split-detail-pane min-w-0 p-5 lg:p-6">
          {creating ? (
            <MemoryEditor key="new" onClose={() => setCreating(false)} />
          ) : m && r ? (
            editing ? (
              <MemoryEditor
                key={r.id}
                memory={m}
                onClose={() => setEditing(false)}
              />
            ) : (
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-lg bg-[var(--ui-brand-soft)] p-2 text-[color:var(--ui-brand)]">
                    <KindIcon kind={r.payload.kind} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
                      <span>{kindLabels[r.payload.kind]}</span>
                      <span>·</span>
                      <span>{scopeLabels[m.scope]}</span>
                      <span>· v{r.number}</span>
                    </div>
                    <h2 className="mt-1 text-[18px] font-semibold leading-7 text-[color:var(--ui-text)]">
                      {r.title}
                    </h2>
                  </div>
                </div>
                <ApplicationView revision={r} />
                <PayloadView payload={r.payload} />
                {r.payload.kind === 'working' && (
                  <div className="space-y-2 text-[length:var(--ui-font-control)]">
                    <h3 className="font-medium text-[color:var(--ui-text)]">
                      这项工作沉淀的记忆
                    </h3>
                    {r.payload.memories.map((ref) => {
                      const linked = state.memories.find(
                        (item) => item.id === ref.memoryId,
                      );
                      return linked && readable(linked, ref) ? (
                        <button
                          key={ref.memoryId}
                          className="block w-full rounded-lg bg-[var(--ui-canvas)] p-3 text-left text-[color:var(--ui-text)]"
                          onClick={() => {
                            onSelect(linked.id);
                            setKind('all');
                          }}
                        >
                          {kindLabels[current(linked).payload.kind]} ·{' '}
                          {current(linked).title}
                          {' · '}
                          {statusLabels[current(linked).status]}
                          {linked.current !== ref.revisionId
                            ? ' · 已有版本变化'
                            : ''}
                        </button>
                      ) : (
                        <p
                          key={ref.memoryId}
                          className="text-[color:var(--ui-muted)]"
                        >
                          一项关联记忆当前不可访问。
                        </p>
                      );
                    })}
                    {!r.payload.memories.length && (
                      <p className="text-[color:var(--ui-muted)]">
                        尚未另行沉淀术语、方法等记忆；关键工作记录已保留。
                      </p>
                    )}
                    {r.source.taskId && (
                      <Button
                        variant="outline"
                        className={actionClass}
                        onClick={() => onOpenTask(r.source.taskId!)}
                      >
                        查看这项工作的原始过程
                      </Button>
                    )}
                  </div>
                )}
                <div className="space-y-2 border-y border-[var(--ui-border)] py-4">
                  <Meta label="来源" value={r.source.label} />
                  <Meta label="生效时间" value={r.validFrom.slice(0, 10)} />
                  <Meta label="记录时间" value={r.recordedAt.slice(0, 10)} />
                  <Meta label="确认依据" value={r.confirmedBy || '等待确认'} />
                  <details className="text-[length:var(--ui-font-control)] text-[color:var(--ui-muted)]">
                    <summary className="cursor-pointer py-1">
                      查看来源内容
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap rounded-lg bg-[var(--ui-canvas)] p-3 leading-6">
                      {r.source.quote}
                    </p>
                    {r.source.url && (
                      <a
                        className="mt-2 inline-block text-[color:var(--ui-text)] underline"
                        href={r.source.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        查看公开依据
                      </a>
                    )}
                    {r.source.taskId && (
                      <Button
                        variant="ghost"
                        className={actionClass + ' mt-2'}
                        onClick={() => onOpenTask(r.source.taskId!)}
                      >
                        <FileText className="size-4" />
                        回到来源任务
                      </Button>
                    )}
                  </details>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={!eligible(m, state.now)}
                    onClick={() =>
                      onUse({
                        id: m.id,
                        kind: 'Memory',
                        label: r.title,
                        memoryRef: refFor(m),
                      })
                    }
                    className={
                      actionClass +
                      ' bg-[var(--ui-brand)] text-[color:var(--ui-on-brand)]'
                    }
                  >
                    用于新任务
                    <ArrowRight className="size-4" />
                  </Button>
                  {m.scope === 'personal' && r.payload.kind !== 'working' ? (
                    <>
                      <Button
                        variant="outline"
                        className={actionClass}
                        onClick={() => setEditing(true)}
                      >
                        纠正
                      </Button>
                      {r.status === 'candidate' || r.status === 'disputed' ? (
                        <Button
                          variant="outline"
                          className={actionClass}
                          onClick={() =>
                            dispatch({
                              type: 'status',
                              id: m.id,
                              status: 'active',
                            })
                          }
                        >
                          <Check className="size-4" />
                          确认含义与范围
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className={actionClass}
                          onClick={() =>
                            dispatch({
                              type: 'status',
                              id: m.id,
                              status:
                                r.status === 'active' ? 'disabled' : 'active',
                            })
                          }
                        >
                          {r.status === 'active' ? '停用' : '重新启用'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        disabled={!eligible(m, state.now)}
                        className={actionClass}
                        onClick={() => {
                          setContributing(!contributing);
                          setContribution(textFor(r.payload));
                        }}
                      >
                        贡献
                      </Button>
                      <Button
                        variant="ghost"
                        className={
                          actionClass + ' text-[color:var(--ui-muted)]'
                        }
                        onClick={() => setDeleting(true)}
                      >
                        删除
                      </Button>
                    </>
                  ) : m.scope !== 'personal' ? (
                    <>
                      <Button
                        variant="outline"
                        className={actionClass}
                        onClick={() =>
                          dispatch({ type: 'subscribe', id: m.id })
                        }
                      >
                        {m.subscribed ? '取消关注' : '关注并使用'}
                      </Button>
                      <Button
                        variant="outline"
                        className={actionClass}
                        onClick={() => {
                          setContributing(true);
                          setContribution('');
                        }}
                      >
                        反馈纠错
                      </Button>
                    </>
                  ) : null}
                </div>
                {deleting && (
                  <div
                    role="alert"
                    className="space-y-3 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] p-4 text-[length:var(--ui-font-control)]"
                  >
                    <p>
                      删除此记忆的可调用内容和历史正文？原任务、原始材料和已形成的正式成果保留。
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setDeleting(false)}
                      >
                        取消
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          dispatch({ type: 'delete', id: m.id });
                          setDeleting(false);
                        }}
                      >
                        确认删除
                      </Button>
                    </div>
                  </div>
                )}
                {r.payload.kind === 'episodic' &&
                  r.payload.subtype === 'plan' && (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--ui-canvas)] p-3">
                      <span className="text-[length:var(--ui-font-control)] text-[color:var(--ui-muted)]">
                        相关任务可参考此规划，也可加入周期提醒。
                      </span>
                      <Button
                        variant="outline"
                        className={actionClass}
                        onClick={onReminders}
                      >
                        <Clock3 className="size-4" />
                        设置工作规划提醒
                      </Button>
                    </div>
                  )}
                {contributing && (
                  <div className="space-y-3 rounded-lg border border-[var(--ui-border)] p-4">
                    <p className="text-xs text-[color:var(--ui-muted)]">
                      随贡献提交名称“{r.title}”
                      {r.payload.kind === 'semantic'
                        ? `及术语“${r.payload.term}”的适用语境“${r.payload.context}”`
                        : ''}
                      。请在下方写明可共享的内容与必要条件；其他个人字段和来源原文不提交。
                    </p>
                    <Field
                      label={
                        m.scope === 'personal'
                          ? '贡献内容（不包含原任务及附件）'
                          : '纠错意见'
                      }
                    >
                      <textarea
                        rows={3}
                        className={inputClass}
                        value={contribution}
                        onChange={(e) => setContribution(e.target.value)}
                      />
                    </Field>
                    <select
                      aria-label="贡献目标"
                      className={inputClass}
                      value={target}
                      onChange={(e) =>
                        setTarget(e.target.value as typeof target)
                      }
                    >
                      <option value="department">处室</option>
                      <option value="unit">单位</option>
                      <option value="city">全市</option>
                    </select>
                    <Button
                      className={actionClass}
                      disabled={!contribution.trim()}
                      onClick={() => {
                        dispatch({
                          type: 'contribute',
                          id: m.id,
                          target,
                          content: contribution,
                        });
                        setContributing(false);
                      }}
                    >
                      提交{m.scope === 'personal' ? '贡献' : '纠错意见'}
                    </Button>
                  </div>
                )}
                <details className="text-[length:var(--ui-font-control)]">
                  <summary className="flex cursor-pointer items-center gap-2 py-2 text-[color:var(--ui-muted)]">
                    <History className="size-4" />
                    历史版本与变化（{m.revisions.length}）
                  </summary>
                  <div className="space-y-3 pt-2">
                    {[...m.revisions].reverse().map((v) => (
                      <div
                        key={v.id}
                        className="rounded-lg border border-[var(--ui-border)] p-3"
                      >
                        <p className="font-medium">
                          v{v.number} · {statusLabels[revisionStatus(m, v)]} ·{' '}
                          {v.reason}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap leading-6 text-[color:var(--ui-muted)]">
                          {textFor(v.payload)}
                        </p>
                        <p className="mt-2 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
                          {v.recordedAt.slice(0, 10)}
                        </p>
                      </div>
                    ))}
                  </div>
                </details>
                <details
                  className="text-[length:var(--ui-font-control)]"
                  open={uses.length > 0}
                >
                  <summary className="cursor-pointer py-2 text-[color:var(--ui-muted)]">
                    实际引用记录（{uses.length}次）
                  </summary>
                  {uses.map((u, i) => (
                    <button
                      key={u.taskId + u.revisionId + i}
                      onClick={() => onOpenTask(u.taskId)}
                      className="mt-2 block w-full rounded-lg bg-[var(--ui-canvas)] p-3 text-left"
                    >
                      <p className="font-medium">
                        {u.title} · {u.revisionId.split('-v').at(-1)}版
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-[length:var(--ui-font-control)] leading-6 text-[color:var(--ui-muted)]">
                        {u.effect}
                      </p>
                    </button>
                  ))}
                  {!uses.length && (
                    <p className="py-3 text-[color:var(--ui-muted)]">
                      尚无实际引用记录。
                    </p>
                  )}
                </details>
                {state.contributions
                  .filter((c) => c.ref.memoryId === m.id)
                  .map((c) => (
                    <div
                      key={c.id}
                      className="rounded-lg border border-[var(--ui-border)] p-3 text-[length:var(--ui-font-control)]"
                    >
                      <p>
                        {scopeLabels[c.target]} ·{' '}
                        {
                          {
                            submitted: '已提交，待处理',
                            accepted: '已采纳',
                            returned: '已退回',
                            withdrawn: '已撤回',
                          }[c.status]
                        }
                      </p>
                      <p className="mt-1 text-[color:var(--ui-muted)]">
                        {c.reply || '尚未收到组织处理回执。'}
                      </p>
                      {c.status === 'submitted' && (
                        <Button
                          variant="ghost"
                          onClick={() =>
                            dispatch({
                              type: 'contribution',
                              id: c.id,
                              status: 'withdrawn',
                            })
                          }
                        >
                          撤回贡献
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            )
          ) : (
            <div className="fw-split-detail-empty">
              <BrainCircuit size={26} />
              <strong>选择一条记忆查看详情</strong>
              <p>可查看工作作用、适用范围、来源、版本和实际引用记录。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
