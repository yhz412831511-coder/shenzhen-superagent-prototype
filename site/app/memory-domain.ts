export type MemoryKind =
  | 'working'
  | 'semantic'
  | 'procedural'
  | 'episodic'
  | 'functional';
export const kindLabels: Record<MemoryKind, string> = {
  working: '工作记忆',
  semantic: '语义记忆',
  procedural: '程序记忆',
  episodic: '情景记忆',
  functional: '职能记忆',
};
export type MemoryStatus =
  | 'candidate'
  | 'active'
  | 'disputed'
  | 'disabled'
  | 'superseded'
  | 'expired'
  | 'withdrawn'
  | 'archived';
export const statusLabels: Record<MemoryStatus, string> = {
  candidate: '待确认',
  active: '有效',
  disputed: '有争议',
  disabled: '已停用',
  superseded: '已被替代',
  expired: '已失效',
  withdrawn: '已撤回',
  archived: '已归档',
};
export type Scope = 'personal' | 'department' | 'unit' | 'city';
export const scopeLabels: Record<Scope, string> = {
  personal: '我的记忆',
  department: '处室',
  unit: '单位',
  city: '全市',
};
export type Source = {
  url?: string;
  taskId?: string;
  eventId?: string;
  label: string;
  quote: string;
  nature: 'user' | 'event' | 'extracted' | 'published';
  accessible: boolean;
};
export type Payload =
  | {
      kind: 'semantic';
      term: string;
      aliases: string[];
      definition: string;
      context: string;
      distinction: string;
      example: string;
    }
  | {
      kind: 'working';
      work: string;
      context: string;
      keyPoints: {
        kind: 'requirement' | 'decision' | 'result';
        text: string;
        eventId: string;
        at: string;
      }[];
      memories: MemoryRef[];
    }
  | {
      kind: 'procedural';
      method: string;
      conditions: string;
      steps: string[];
      exceptions: string;
      skill?: string;
    }
  | {
      kind: 'episodic';
      subtype: 'past';
      context?: string;
      event: string;
      decision: string;
      outcome: string;
      occurredAt: string;
    }
  | {
      kind: 'episodic';
      subtype: 'plan';
      goal: string;
      context: string;
      responsible: string;
      due: string;
      phase: string;
      completion: string;
      progress: 'planned' | 'in_progress' | 'completed' | 'cancelled';
    }
  | {
      kind: 'functional';
      subtype: 'formal' | 'assignment';
      entity: string;
      responsibility: string;
      context: string;
      confirmedBy: string;
    };
export type Revision = {
  id: string;
  number: number;
  title: string;
  payload: Payload;
  source: Source;
  validFrom: string;
  validTo: string;
  recordedAt: string;
  status: MemoryStatus;
  reason: string;
  confirmedBy: string;
  supersedes?: string;
  application?: MemoryApplication;
};
export type MemoryApplication = {
  workRole: string;
  applicableWork: string;
  workBenefit: string;
  responsibilityBoundary: string;
};
export type Memory = {
  id: string;
  scope: Scope;
  owner: string;
  current: string;
  revisions: Revision[];
  events: { at: string; text: string }[];
  subscribed: boolean;
};
export type MemoryRef = { memoryId: string; revisionId: string };
export type MemoryUse = MemoryRef & {
  taskId: string;
  at: string;
  effect: string;
};
export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  at: string;
};
export type SavedContext = {
  id: string;
  kind:
    | '资料'
    | '知识库'
    | 'Memory'
    | '专业智能体'
    | '组织智能载体'
    | '场景工作智能体'
    | 'Skill'
    | '插件'
    | '连接器';
  label: string;
  memoryRef?: MemoryRef;
};
export type TaskSettings = {
  contexts?: SavedContext[];
  commandMode?: 'standard' | 'plan' | 'goal' | 'browser';
  permissionMode?: 'standard' | 'confirm' | 'full';
  collaborationMode?: 'standard' | 'brainstorm';
  draftText?: string;
};
export type WorkTask = TaskSettings & {
  id: string;
  title: string;
  context: string;
  messages: Message[];
  grants: MemoryRef[];
  pending: MemoryRef[];
  uses: MemoryUse[];
  type: 'work' | 'reminder';
  planIds: string[];
  savedScroll: number;
};
export type Contribution = {
  id: string;
  ref: MemoryRef;
  target: Exclude<Scope, 'personal'>;
  content: string;
  sharedPayload?: Extract<Payload, { kind: 'procedural' }>;
  status: 'submitted' | 'accepted' | 'returned' | 'withdrawn';
  at: string;
  reply: string;
};
export type Schedule = {
  id: string;
  name: string;
  enabled: boolean;
  cadence: 'daily' | 'weekdays' | 'weekly';
  weekday: number;
  time: string;
  timezone: 'Asia/Shanghai';
  planIds: string[];
  createdAt: string;
  evaluated: string[];
  snapshots: Record<string, string>;
  runs: string[];
};
export type MemoryState = {
  memories: Memory[];
  tasks: WorkTask[];
  contributions: Contribution[];
  schedules: Schedule[];
  now: number;
  offset: number;
  counter: number;
  notice: string;
};
export const iso = (now: number) => new Date(now).toISOString();
export const current = (m: Memory) =>
  m.revisions.find((r) => r.id === m.current)!;
export const revisionFor = (m: Memory, id: string) =>
  m.revisions.find((r) => r.id === id);
export function applicationFor(r: Revision): MemoryApplication {
  if (r.application) return r.application;
  const p = r.payload;
  if (p.kind === 'working') {
    const latestResult = [...p.keyPoints]
      .reverse()
      .find((point) => point.kind === 'result')?.text;
    return {
      workRole: '接续这项工作时，恢复已经完成的步骤、本人决定和当前结果。',
      applicableWork: p.context || p.work,
      workBenefit:
        latestResult || '减少重复回看材料，从已经确认的工作状态继续处理。',
      responsibilityBoundary:
        '只保留当时的工作记录；当前结论仍需结合最新材料、授权和有效规则核对。',
    };
  }
  if (p.kind === 'semantic')
    return {
      workRole: `任务中出现“${p.term}”时，按具体业务语境准确理解。`,
      applicableWork: p.context,
      workBenefit: `区分专业含义与相近说法，避免仅凭字面作出业务判断。`,
      responsibilityBoundary:
        p.distinction || '只解决术语理解，不代表已经取得对应系统权限或业务结论。',
    };
  if (p.kind === 'procedural')
    return {
      workRole: '再次办理同类事项时，复用已经确认的处理顺序和检查方法。',
      applicableWork: p.conditions || '本人同类工作',
      workBenefit: p.steps.length
        ? `按${p.steps.length}个步骤组织办理，减少遗漏和反复确认。`
        : p.method,
      responsibilityBoundary:
        p.exceptions || '遇到适用条件变化或材料冲突时，仍由本人确认处理方式。',
    };
  if (p.kind === 'episodic' && p.subtype === 'past')
    return {
      workRole: '遇到相近情况时，调取当时的事实、决定和处理结果。',
      applicableWork: p.context || '相关后续工作',
      workBenefit: p.outcome || '帮助判断哪些做法可以沿用，哪些事实需要重新核实。',
      responsibilityBoundary:
        '只说明该次经历及其结果，不自动推广为所有事项都适用的规则。',
    };
  if (p.kind === 'episodic')
    return {
      workRole: '在后续任务和周期回顾中保持下一步安排连续。',
      applicableWork: p.context || '相关后续工作',
      workBenefit: p.completion || '明确下一步完成条件，避免事项在任务切换后中断。',
      responsibilityBoundary:
        '工作规划可随实际反馈调整；没有明确日期时不补造期限。',
    };
  return {
    workRole:
      p.subtype === 'formal'
        ? '判断该事项应由哪个机构提供职责依据和业务指导。'
        : '明确当前事项中由谁办理、确认和承担最终动作。',
    applicableWork: p.context || '相关职责与事项分工',
    workBenefit: p.responsibility,
    responsibilityBoundary:
      p.subtype === 'formal'
        ? '正式职能以公开或组织发布的有效文件为准，不据此替代具体事项审批。'
        : '事项分工只对当前工作有效，不改写单位或处室的正式职责。',
  };
}
export function readable(m: Memory, ref?: MemoryRef) {
  return Boolean(
    current(m).source.accessible &&
    (!ref || revisionFor(m, ref.revisionId)?.source.accessible),
  );
}
export function eligible(m: Memory, now: number) {
  const r = current(m);
  return (
    readable(m) &&
    r.status === 'active' &&
    (!r.validFrom || Date.parse(r.validFrom) <= now) &&
    (!r.validTo || Date.parse(r.validTo) > now)
  );
}
export const refFor = (m: Memory): MemoryRef => ({
  memoryId: m.id,
  revisionId: m.current,
});
export function validRef(s: MemoryState, ref: MemoryRef) {
  const m = s.memories.find((x) => x.id === ref.memoryId);
  return m && m.current === ref.revisionId && eligible(m, s.now)
    ? m
    : undefined;
}
export function textFor(p: Payload): string {
  switch (p.kind) {
    case 'semantic':
      return p.definition;
    case 'working':
      return [p.work, ...p.keyPoints.map((point) => point.text)]
        .filter(Boolean)
        .join('\n');
    case 'procedural':
      return [p.method, ...p.steps, p.exceptions].filter(Boolean).join('\n');
    case 'episodic':
      return p.subtype === 'past'
        ? [p.event, p.decision, p.outcome].filter(Boolean).join('\n')
        : p.goal;
    case 'functional':
      return p.responsibility;
  }
}
export function contextFor(p: Payload) {
  return 'context' in p
    ? p.context || ''
    : p.kind === 'procedural'
      ? p.conditions
      : '';
}
export function related(context: string, text: string) {
  return (
    !context ||
    context === '通用' ||
    context === '本人工作' ||
    text.includes(context)
  );
}
export function suggestions(s: MemoryState, t: WorkTask): Memory[] {
  const input =
    t.context +
    ' ' +
    t.messages
      .filter((x) => x.role === 'user')
      .map((x) => x.text)
      .join(' ');
  return s.memories.filter((m) => {
    if (!eligible(m, s.now)) return false;
    const p = current(m).payload;
    if (p.kind === 'working')
      return (
        current(m).source.taskId === t.id ||
        Boolean(
          p.context &&
          p.context !== '本人工作' &&
          p.context !== '通用' &&
          related(p.context, input),
        ) ||
        t.grants.some((g) => g.memoryId === m.id && g.revisionId === m.current)
      );
    if (p.kind === 'episodic' && p.subtype === 'past')
      return (
        current(m).source.taskId === t.id ||
        Boolean(p.context && related(p.context, input))
      );
    if (p.kind === 'semantic')
      return (
        [p.term, ...p.aliases].some((x) => x && input.includes(x)) &&
        (!t.context || related(p.context, t.context))
      );
    if (p.kind === 'episodic' && p.subtype === 'plan')
      return (
        !['completed', 'cancelled'].includes(p.progress) &&
        related(p.context, input)
      );
    return (
      related(contextFor(p), input) && (m.scope === 'personal' || m.subscribed)
    );
  });
}
export function semanticResolution(
  memories: Memory[],
  term: string,
  context: string,
) {
  const named = memories.filter((m) => {
    const p = current(m).payload;
    return p.kind === 'semantic' && [p.term, ...p.aliases].includes(term);
  });
  const specific = named.filter((m) => {
    const p = current(m).payload;
    return (
      p.kind === 'semantic' &&
      p.context &&
      p.context !== '通用' &&
      context.includes(p.context)
    );
  });
  const matches = specific.length
    ? specific
    : named.filter((m) => {
        const p = current(m).payload;
        return p.kind === 'semantic' && related(p.context, context);
      });
  if (matches.length === 1) return { matches, ambiguous: false };
  if (
    matches.length > 1 &&
    new Set(matches.map((m) => textFor(current(m).payload))).size === 1
  )
    return { matches: matches.slice(0, 1), ambiguous: false };
  const remaining = matches.length ? matches : named;
  return { matches: remaining, ambiguous: remaining.length > 1 };
}
export function revise(
  m: Memory,
  payload: Payload,
  title: string,
  now: number,
  reason: string,
  status: MemoryStatus = 'active',
  source?: Source,
): Memory {
  const old = current(m);
  const number = Math.max(...m.revisions.map((r) => r.number)) + 1;
  const id = `${m.id}-v${number}`;
  return {
    ...m,
    current: id,
    revisions: [
      ...m.revisions,
      {
        ...old,
        id,
        number,
        title,
        payload,
        source: source ?? old.source,
        application:
          JSON.stringify(payload) === JSON.stringify(old.payload)
            ? old.application
            : undefined,
        recordedAt: iso(now),
        validFrom: iso(now),
        status,
        reason,
        confirmedBy: status === 'active' ? '本人确认' : '',
        supersedes: old.id,
      },
    ],
    events: [...m.events, { at: iso(now), text: reason }],
  };
}
export function changeStatus(
  m: Memory,
  status: MemoryStatus,
  now: number,
  reason: string,
) {
  return revise(m, current(m).payload, current(m).title, now, reason, status);
}
export function revisionStatus(m: Memory, r: Revision) {
  return r.id === m.current ? r.status : 'superseded';
}
export function validatePayload(title: string, p: Payload): string {
  if (!title.trim() || !textFor(p).trim()) return '请填写名称和内容。';
  if (p.kind === 'semantic' && (!p.term.trim() || !p.context.trim()))
    return '请明确术语及适用语境，避免把个人解释扩大到所有事项。';
  if (
    p.kind === 'episodic' &&
    p.subtype === 'plan' &&
    (!p.responsible.trim() ||
      !p.completion.trim() ||
      (!p.due && !p.phase.trim()))
  )
    return '请补充负责人、完成条件，以及截止时间或工作阶段。';
  if (
    p.kind === 'functional' &&
    p.subtype === 'assignment' &&
    !p.context.trim()
  )
    return '事项分工必须填写具体事项。';
  return '';
}
export function localParts(now: number) {
  const date = new Date(now + 8 * 3600000);
  return {
    day: date.toISOString().slice(0, 10),
    weekday: date.getUTCDay(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
  };
}
export function dueSlot(schedule: Schedule, now: number): number | undefined {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.time)) return;
  const day = localParts(now).day;
  const [h, m] = schedule.time.split(':').map(Number);
  const today = Date.parse(day + 'T00:00:00+08:00') + (h * 60 + m) * 60000;
  for (let n = 0; n < 8; n++) {
    const slot = today - n * 86400000;
    const w = localParts(slot).weekday;
    if (
      slot <= now &&
      (schedule.cadence === 'daily' ||
        (schedule.cadence === 'weekdays' && w > 0 && w < 6) ||
        (schedule.cadence === 'weekly' && w === schedule.weekday))
    )
      return slot;
  }
}
export function nextSlot(schedule: Schedule, after: number): number {
  const [h, m] = schedule.time.split(':').map(Number);
  const today =
    Date.parse(localParts(after).day + 'T00:00:00+08:00') +
    (h * 60 + m) * 60000;
  for (let n = 0; n <= 8; n++) {
    const slot = today + n * 86400000;
    const w = localParts(slot).weekday;
    if (
      slot > after &&
      (schedule.cadence === 'daily' ||
        (schedule.cadence === 'weekdays' && w > 0 && w < 6) ||
        (schedule.cadence === 'weekly' && w === schedule.weekday))
    )
      return slot;
  }
  return after + 7 * 86400000;
}
export function reminderItems(s: MemoryState, c: Schedule, slot: number) {
  const next = nextSlot(c, slot);
  return s.memories.filter((m) => {
    if (!c.planIds.includes(m.id) || !eligible(m, s.now)) return false;
    const r = current(m);
    const p = r.payload;
    return (
      p.kind === 'episodic' &&
      p.subtype === 'plan' &&
      !['completed', 'cancelled'].includes(p.progress) &&
      ((!!p.due && Date.parse(p.due + 'T23:59:59+08:00') <= next) ||
        c.snapshots[m.id] !== r.id)
    );
  });
}
export function planSummary(m: Memory, now: number) {
  const p = current(m).payload;
  if (p.kind !== 'episodic' || p.subtype !== 'plan') return '';
  const due = p.due ? Date.parse(p.due + 'T23:59:59+08:00') : null;
  return `${current(m).title}｜${p.responsible}｜${p.due || p.phase}${due && due < now ? ' · 已逾期' : ''}\n完成条件：${p.completion}`;
}
export type MemoryAction =
  | {
      type: 'create';
      title: string;
      payload: Payload;
      taskId?: string;
      candidate?: boolean;
    }
  | {
      type: 'edit';
      id: string;
      title: string;
      payload: Payload;
      reason: string;
    }
  | { type: 'status'; id: string; status: MemoryStatus }
  | { type: 'delete'; id: string }
  | { type: 'subscribe'; id: string }
  | {
      type: 'contribute';
      id: string;
      target: Contribution['target'];
      content: string;
      sharedPayload?: Extract<Payload, { kind: 'procedural' }>;
    }
  | {
      type: 'contribution';
      id: string;
      status: Contribution['status'];
      reply?: string;
    }
  | {
      type: 'new-task';
      id: string;
      text: string;
      refs: MemoryRef[];
      context?: string;
      settings?: TaskSettings;
    }
  | { type: 'task-settings'; taskId: string; settings: TaskSettings }
  | { type: 'message'; taskId: string; text: string }
  | { type: 'grant'; taskId: string; refs: MemoryRef[]; reject?: boolean }
  | { type: 'context'; taskId: string; context: string }
  | {
      type: 'schedule';
      schedule: Omit<
        Schedule,
        'id' | 'createdAt' | 'evaluated' | 'snapshots' | 'runs'
      >;
      id?: string;
    }
  | { type: 'tick'; now: number }
  | { type: 'advance'; ms: number }
  | { type: 'access'; id: string; allowed: boolean }
  | { type: 'scroll'; taskId: string; position: number }
  | { type: 'notice'; text: string };
function addMemory(
  s: MemoryState,
  title: string,
  payload: Payload,
  source: Source,
  candidate = false,
) {
  const id = `memory-${++s.counter}`;
  const at = iso(s.now);
  const m: Memory = {
    id,
    scope: 'personal',
    owner: '林思远',
    current: id + '-v1',
    subscribed: false,
    revisions: [
      {
        id: id + '-v1',
        number: 1,
        title,
        payload,
        source,
        validFrom: at,
        validTo: '',
        recordedAt: at,
        status: candidate ? 'candidate' : 'active',
        reason: candidate ? '从材料整理，等待确认' : '用户明确说明',
        confirmedBy: candidate ? '' : '本人',
      },
    ],
    events: [{ at, text: candidate ? '形成候选' : '本人说明并确认' }],
  };
  s.memories.unshift(m);
  return m;
}
function message(
  t: WorkTask,
  s: MemoryState,
  role: Message['role'],
  text: string,
) {
  t.messages.push({ id: `event-${++s.counter}`, role, text, at: iso(s.now) });
}
function applyContext(s: MemoryState, t: WorkTask) {
  const all = suggestions(s, t);
  const granted = all.filter(
    (m) =>
      m.scope !== 'personal' ||
      (current(m).payload.kind === 'working' &&
        current(m).source.taskId === t.id) ||
      (current(m).source.taskId === t.id &&
        current(m).payload.kind === 'episodic') ||
      t.grants.some((g) => g.memoryId === m.id && g.revisionId === m.current),
  );
  t.pending = all.filter((m) => !granted.includes(m)).map(refFor);
  const input =
    t.context +
    ' ' +
    t.messages
      .filter((x) => x.role === 'user')
      .map((x) => x.text)
      .join(' ');
  const lines: string[] = [];
  const used = new Set<string>();
  function recordUse(m: Memory, effect: string) {
    if (used.has(m.id)) return;
    used.add(m.id);
    lines.push(effect);
    if (!t.uses.some((x) => x.memoryId === m.id && x.revisionId === m.current))
      t.uses.push({ ...refFor(m), taskId: t.id, at: iso(s.now), effect });
  }
  const terms = [
    ...new Set(
      all.flatMap((m) => {
        const p = current(m).payload;
        return p.kind === 'semantic'
          ? [p.term, ...p.aliases].filter((x) => x && input.includes(x))
          : [];
      }),
    ),
  ];
  const ambiguousTerms = new Set<string>();
  for (const term of terms) {
    const result = semanticResolution(all, term, t.context || input);
    if (result.ambiguous) {
      if (!ambiguousTerms.has(term)) {
        lines.push(
          `“${term}”存在不同适用含义，请明确本任务的业务语境（${[...new Set(result.matches.map((m) => contextFor(current(m).payload)))].join('／')}）。澄清前不采用其中任一解释。`,
        );
        ambiguousTerms.add(term);
      }
      continue;
    }
    for (const m of result.matches)
      if (granted.includes(m)) {
        const p = current(m).payload;
        if (p.kind === 'semantic')
          recordUse(
            m,
            `按“${p.context}”理解“${term}”：${p.definition}${p.distinction ? '\n判断边界：' + p.distinction : ''}`,
          );
      }
  }
  for (const m of granted) {
    const p = current(m).payload;
    if (p.kind === 'working' && current(m).source.taskId !== t.id)
      recordUse(
        m,
        `参考你此前做过的工作“${p.work}”：\n${p.keyPoints.map((point) => point.text).join('\n')}\n这些是当时的工作记录；本次要求和当前有效专业口径仍需分别核对。`,
      );
    if (p.kind === 'episodic' && p.subtype === 'plan')
      recordUse(
        m,
        `结合下一阶段安排，先${p.goal}\n本次交付增加检查项：${p.completion}`,
      );
    if (p.kind === 'procedural')
      recordUse(
        m,
        `本次处理顺序：${p.steps.join(' → ') || p.method}${p.exceptions ? '\n例外处理：' + p.exceptions : ''}`,
      );
    if (p.kind === 'functional')
      recordUse(
        m,
        `${p.subtype === 'formal' ? '职责依据' : '本事项分工'}：${p.entity} · ${p.responsibility}`,
      );
    if (p.kind === 'episodic' && p.subtype === 'past')
      recordUse(m, `相关经过：${p.event} ${p.decision}`);
  }
  const tail = t.pending.length
    ? '有相关个人记忆等待本任务授权，可在下方查看适用范围。'
    : used.size
      ? '以上记忆已进入本次任务；实际业务结论仍需结合原始材料核实。'
      : lines.length
        ? '请先明确上述称谓的适用语境，再继续处理。'
        : t.messages.filter((m) => m.role === 'user').length > 1
          ? '已记录本轮补充。你可以继续提供材料、调整工作要求，或补充需要记住的专业解释。'
          : '已保存任务目标。请补充业务语境、材料或需要记住的专业解释，当前不推测未提供的业务事实。';
  message(t, s, 'assistant', [...lines, tail].join('\n\n'));
}
function recordWork(s: MemoryState, t: WorkTask) {
  if (t.type !== 'work') return;
  const old = s.memories.find(
    (x) =>
      current(x).payload.kind === 'working' &&
      current(x).source.taskId === t.id,
  );
  const id = old?.id || 'working-' + t.id;
  const userMessages = t.messages.filter((m) => m.role === 'user');
  const p: Payload = {
    kind: 'working',
    work: t.title,
    context: t.context,
    keyPoints: userMessages
      .filter(
        (m, i) =>
          i === 0 ||
          /记住|关键|注意|要求|不要|不得|不能|必须|仅|改为|决定|确认|采用|指的是|指本|含义|已完成|已形成|结果|补充|纠正/.test(
            m.text,
          ),
      )
      .filter((m, i, all) => all.findIndex((x) => x.text === m.text) === i)
      .map((m) => ({
        kind: /已完成|已形成|结果/.test(m.text)
          ? 'result'
          : /决定|确认|采用|改为|纠正/.test(m.text)
            ? 'decision'
            : 'requirement',
        text: m.text,
        eventId: m.id,
        at: m.at,
      })),
    memories: s.memories
      .filter(
        (m) =>
          current(m).source.taskId === t.id &&
          m.scope === 'personal' &&
          current(m).payload.kind !== 'working' &&
          readable(m),
      )
      .map(refFor),
  };
  if (old && JSON.stringify(current(old).payload) === JSON.stringify(p)) return;
  if (old) {
    s.memories = s.memories.map((m) => {
      if (m.id !== id) return m;
      const next = revise(m, p, t.title, s.now, '沉淀本项工作的关键记录');
      current(next).confirmedBy = '本人的任务记录';
      return next;
    });
  } else {
    const m = addMemory(s, t.title, p, {
      taskId: t.id,
      eventId: userMessages[0]?.id,
      label: t.title,
      quote: userMessages[0]?.text || '',
      nature: 'event',
      accessible: true,
    });
    m.id = id;
    m.current = id + '-v1';
    m.revisions[0].id = m.current;
    m.revisions[0].confirmedBy = '本人的任务记录';
    m.revisions[0].reason = '由工作过程沉淀';
  }
}
function inferContext(s: MemoryState, text: string) {
  const contexts = [
    ...new Set(
      s.memories
        .filter((m) => readable(m))
        .map((m) => contextFor(current(m).payload))
        .filter(
          (c) => c && c !== '通用' && c !== '本人工作' && text.includes(c),
        ),
    ),
  ];
  return contexts.length === 1 ? contexts[0] : '';
}
function parseExplanation(s: MemoryState, t: WorkTask, text: string) {
  const match = text.match(
    /(?:我们这里的|这里的|记住[：:]?|术语[：:]?)\s*[“「"]?([^”」"，：:\n]{1,24})[”」"]?\s*(?:指的是|意味着|是指|指|表示)[：:]?\s*([\s\S]+?)(?:[。；;]\s*适用于[：:]?\s*([\s\S]+?)[。]?$|$)/,
  );
  if (!match) return;
  const context = match[3]?.trim() || t.context;
  if (!context) {
    message(
      t,
      s,
      'assistant',
      '已收到术语解释，请先填写本任务的业务语境，再将它保存为适用范围明确的语义记忆。',
    );
    return;
  }
  const term = match[1].trim(),
    definition = match[2].trim();
  if (!definition) return;
  const existing = s.memories.find((m) => {
    const p = current(m).payload;
    return (
      m.scope === 'personal' &&
      readable(m) &&
      p.kind === 'semantic' &&
      p.term === term &&
      p.context === context
    );
  });
  const payload: Payload = {
    kind: 'semantic',
    term,
    aliases: [],
    definition,
    context,
    distinction: '',
    example: '',
  };
  const source: Source = {
    taskId: t.id,
    eventId: t.messages.at(-1)?.id,
    label: t.title,
    quote: text,
    nature: 'user',
    accessible: true,
  };
  let m: Memory;
  if (existing) {
    m = revise(
      existing,
      {
        ...payload,
        aliases:
          current(existing).payload.kind === 'semantic'
            ? (
                current(existing).payload as Extract<
                  Payload,
                  { kind: 'semantic' }
                >
              ).aliases
            : [],
      },
      term,
      s.now,
      '用户在任务中纠正解释',
      'active',
      source,
    );
    s.memories = s.memories.map((x) => (x.id === m.id ? m : x));
  } else m = addMemory(s, term, payload, source);
  t.grants.push(refFor(m));
  message(
    t,
    s,
    'assistant',
    `已将你对“${term}”的明确解释记入个人语义记忆，适用于“${context}”。后续可查看、纠正或停用。`,
  );
}
export function evaluateSchedules(s: MemoryState) {
  for (const c of s.schedules) {
    if (!c.enabled) continue;
    const slot = dueSlot(c, s.now);
    if (
      slot === undefined ||
      slot < Date.parse(c.createdAt) ||
      c.evaluated.includes(iso(slot))
    )
      continue;
    c.evaluated.push(iso(slot));
    const items = reminderItems(s, c, slot);
    if (!items.length) continue;
    const id = `reminder-${c.id}-${slot}`;
    if (s.tasks.some((t) => t.id === id)) continue;
    const t: WorkTask = {
      id,
      title: `工作规划提醒 · ${localParts(slot).day}`,
      context: '工作规划回顾',
      type: 'reminder',
      planIds: items.map((m) => m.id),
      grants: items.map(refFor),
      pending: [],
      uses: items.map((m) => ({
        ...refFor(m),
        taskId: id,
        at: iso(s.now),
        effect: planSummary(m, s.now),
      })),
      savedScroll: 0,
      messages: [
        {
          id: id + '-message',
          role: 'assistant',
          text: `本期需要关注的工作规划：\n\n${items.map((m) => planSummary(m, s.now)).join('\n\n')}\n\n仅向本人提供提醒，未发送外部消息或改变业务系统状态。`,
          at: iso(s.now),
        },
      ],
    };
    s.tasks.unshift(t);
    c.runs.unshift(id);
    for (const m of items) c.snapshots[m.id] = m.current;
  }
}
export function memoryReducer(
  previous: MemoryState,
  action: MemoryAction,
): MemoryState {
  // Reducer is deterministic; all time and IDs derive from the state/action.
  const s: MemoryState = structuredClone(previous);
  s.notice = '';
  const find = (id: string) => s.memories.find((m) => m.id === id);
  const update = (m: Memory) => {
    s.memories = s.memories.map((x) => (x.id === m.id ? m : x));
  };
  if (action.type === 'notice') s.notice = action.text;
  if (action.type === 'scroll') {
    const t = s.tasks.find((x) => x.id === action.taskId);
    if (t) t.savedScroll = action.position;
    return s;
  }
  if (action.type === 'create') {
    const error = validatePayload(action.title, action.payload);
    if (error) return { ...previous, notice: error };
    if (
      action.payload.kind === 'working' ||
      (action.payload.kind === 'functional' &&
        action.payload.subtype === 'formal')
    )
      return { ...previous, notice: '工作记录及正式职能通过来源维护。' };
    const t = s.tasks.find((x) => x.id === action.taskId);
    const source: Source = {
      taskId: t?.id,
      eventId: t?.messages.at(-1)?.id,
      label: t?.title || '本人主动说明',
      quote:
        t?.messages.filter((x) => x.role === 'user').at(-1)?.text ||
        textFor(action.payload),
      nature: action.candidate ? 'extracted' : 'user',
      accessible: true,
    };
    const duplicate = s.memories.find(
      (m) =>
        m.scope === 'personal' &&
        current(m).payload.kind === 'semantic' &&
        action.payload.kind === 'semantic' &&
        current(m).title === action.title &&
        contextFor(current(m).payload) === action.payload.context &&
        readable(m),
    );
    if (duplicate)
      return {
        ...previous,
        notice: '相同语境已有该术语，请打开原记忆纠正，避免重复定义。',
      };
    const m = addMemory(
      s,
      action.title,
      action.payload,
      source,
      action.candidate,
    );
    s.notice = action.candidate ? '已形成待确认内容。' : '已保存到我的记忆。';
    if (t) {
      if (!action.candidate) t.grants.push(refFor(m));
      message(
        t,
        s,
        'assistant',
        `${action.candidate ? '已整理候选' : '已按你的说明保存'}${kindLabels[action.payload.kind]}：${action.title}。`,
      );
      recordWork(s, t);
    }
  }
  if (
    action.type === 'edit' ||
    action.type === 'status' ||
    action.type === 'delete'
  ) {
    const m = find(action.id);
    if (!m || !readable(m))
      return { ...previous, notice: '当前无法访问该记忆。' };
    if (m.scope !== 'personal' || current(m).payload.kind === 'working')
      return {
        ...previous,
        notice: '组织原文与执行事实只读，请反馈纠错或在来源任务中继续办理。',
      };
    if (action.type === 'edit') {
      if (
        action.payload.kind === 'working' ||
        (action.payload.kind === 'functional' &&
          action.payload.subtype === 'formal')
      )
        return { ...previous, notice: '正式职能与执行事实通过来源维护。' };
      const error = validatePayload(action.title, action.payload);
      if (error) return { ...previous, notice: error };
      update(
        revise(
          m,
          action.payload,
          action.title,
          s.now,
          action.reason || '本人纠正',
        ),
      );
      s.notice = '新版已生效，历史引用保留原版本。';
    }
    if (action.type === 'status') {
      update(
        changeStatus(m, action.status, s.now, statusLabels[action.status]),
      );
      s.notice = `已${action.status === 'active' ? '确认生效' : statusLabels[action.status].replace(/^已/, '')}，后续任务按当前状态使用。`;
    }
    if (action.type === 'delete') {
      update({
        ...m,
        current: m.current,
        revisions: m.revisions.map((r) => ({
          ...r,
          title: '已删除的个人记忆',
          payload: {
            kind: 'semantic',
            term: '已删除',
            aliases: [],
            definition: '',
            context: '',
            distinction: '',
            example: '',
          },
          status: 'withdrawn',
          source: { ...r.source, quote: '', accessible: false },
        })),
        events: [
          ...m.events,
          { at: iso(s.now), text: '本人删除可调用内容；来源任务保留' },
        ],
      });
      s.notice = '已删除记忆内容；原任务和原始业务材料保留。';
    }
  }
  if (action.type === 'subscribe') {
    const m = find(action.id);
    if (m && readable(m)) update({ ...m, subscribed: !m.subscribed });
  }
  if (action.type === 'access') {
    const m = find(action.id);
    if (m)
      update({
        ...m,
        revisions: m.revisions.map((r) => ({
          ...r,
          source: { ...r.source, accessible: action.allowed },
        })),
      });
  }
  if (action.type === 'contribute') {
    const m = find(action.id);
    if (
      !m ||
      (!eligible(m, s.now) && m.scope === 'personal') ||
      !readable(m) ||
      !action.content.trim()
    )
      return {
        ...previous,
        notice: '仅有效、可访问的记忆可以贡献，请填写贡献内容。',
      };
    s.contributions.unshift({
      id: `contribution-${++s.counter}`,
      ref: refFor(m),
      target: action.target,
      content: action.content,
      sharedPayload: action.sharedPayload
        ? {
            kind: 'procedural',
            method: action.sharedPayload.method,
            conditions: action.sharedPayload.conditions,
            steps: [...action.sharedPayload.steps],
            exceptions: action.sharedPayload.exceptions,
          }
        : undefined,
      status: 'submitted',
      at: iso(s.now),
      reply: '',
    });
    s.notice = '已提交贡献；组织采纳前不影响其他人。';
  }
  if (action.type === 'contribution') {
    const c = s.contributions.find((x) => x.id === action.id);
    if (c) {
      c.status = action.status;
      c.reply = action.reply || '';
      if (action.status === 'accepted') {
        const original = find(c.ref.memoryId);
        const r = original && revisionFor(original, c.ref.revisionId);
        if (original && r && readable(original)) {
          const id = 'org-' + c.id;
          const p = structuredClone(r.payload);
          if (p.kind === 'semantic')
            Object.assign(p, {
              definition: c.content,
              aliases: [],
              distinction: '',
              example: '',
            });
          if (p.kind === 'working')
            Object.assign(p, {
              work: c.content,
              context: '',
              keyPoints: [],
              memories: [],
            });
          if (p.kind === 'procedural')
            Object.assign(p, {
              method: c.content,
              conditions: '',
              steps: [],
              exceptions: '',
              skill: undefined,
            });
          if (p.kind === 'procedural' && c.sharedPayload)
            Object.assign(p, structuredClone(c.sharedPayload));
          if (p.kind === 'episodic' && p.subtype === 'past')
            Object.assign(p, {
              event: c.content,
              context: '',
              decision: '',
              outcome: '',
              occurredAt: '',
            });
          if (p.kind === 'episodic' && p.subtype === 'plan')
            Object.assign(p, {
              goal: c.content,
              context: '',
              responsible: '',
              due: '',
              phase: '',
              completion: '',
              progress: 'planned',
            });
          if (p.kind === 'functional')
            Object.assign(p, {
              entity: '',
              responsibility: c.content,
              context: '',
              confirmedBy: '组织回执',
            });
          const m: Memory = {
            ...structuredClone(original),
            id,
            scope: c.target,
            owner: '市财政局 · 组织经验',
            current: id + '-v1',
            subscribed: false,
            revisions: [
              {
                ...r,
                id: id + '-v1',
                number: 1,
                payload: p,
                title: r.title,
                application: {
                  ...applicationFor({ ...r, payload: p }),
                  workRole:
                    '向有权限的工作人员和专业智能体提供经组织采纳的工作经验。',
                  workBenefit:
                    '把个人办理经验转化为可复用的组织方法，后续咨询可引用同一受控版本。',
                  responsibilityBoundary:
                    '只使用组织维护者采纳的内容，不公开个人原话、任务附件或未提交字段。',
                },
                source: {
                  label: '组织经验采纳记录',
                  quote: c.content,
                  nature: 'published',
                  accessible: true,
                },
                status: 'active',
                confirmedBy: '组织回执',
                recordedAt: iso(s.now),
                reason: '采纳本人提交的贡献内容',
                supersedes: undefined,
              },
            ],
            events: [{ at: iso(s.now), text: '组织采纳贡献' }],
          };
          if (!find(id)) s.memories.unshift(m);
        }
      }
    }
  }
  if (action.type === 'new-task') {
    if (s.tasks.some((t) => t.id === action.id)) return previous;
    const t: WorkTask = {
      id: action.id,
      title: action.text.slice(0, 38),
      context: action.context || inferContext(s, action.text),
      ...action.settings,
      type: 'work',
      planIds: [],
      messages: [],
      grants: action.refs.filter((r) => validRef(s, r)),
      pending: [],
      uses: [],
      savedScroll: 0,
    };
    s.tasks.unshift(t);
    if (t.commandMode === 'plan')
      message(
        t,
        s,
        'assistant',
        '本任务先整理计划与依据，未经确认不执行业务操作。',
      );
    message(t, s, 'user', action.text);
    parseExplanation(s, t, action.text);
    applyContext(s, t);
    recordWork(s, t);
    if (action.refs.some((r) => !validRef(s, r)))
      s.notice = '部分所选记忆已变化或不可用，未使用这些内容；请重新检查。';
  }
  if (action.type === 'task-settings') {
    const t = s.tasks.find((t) => t.id === action.taskId);
    if (t) Object.assign(t, action.settings);
  }
  if (action.type === 'message') {
    const t = s.tasks.find((x) => x.id === action.taskId);
    if (t) {
      message(t, s, 'user', action.text);
      if (!t.context) t.context = inferContext(s, action.text);
      parseExplanation(s, t, action.text);
      applyContext(s, t);
      recordWork(s, t);
    }
  }
  if (action.type === 'context') {
    const t = s.tasks.find((x) => x.id === action.taskId);
    if (t) {
      t.context = action.context;
      message(t, s, 'user', '本任务业务语境：' + action.context);
      applyContext(s, t);
      recordWork(s, t);
    }
  }
  if (action.type === 'grant') {
    const t = s.tasks.find((x) => x.id === action.taskId);
    if (t) {
      if (action.reject) {
        t.pending = [];
        message(
          t,
          s,
          'assistant',
          '本次不使用所推荐的个人记忆，请提供本任务所需的独立依据。',
        );
      } else {
        for (const ref of action.refs)
          if (
            validRef(s, ref) &&
            !t.grants.some(
              (g) =>
                g.memoryId === ref.memoryId && g.revisionId === ref.revisionId,
            )
          )
            t.grants.push(ref);
        applyContext(s, t);
      }
      recordWork(s, t);
    }
  }
  if (action.type === 'schedule') {
    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(action.schedule.time) ||
      !action.schedule.planIds.length ||
      action.schedule.weekday < 0 ||
      action.schedule.weekday > 6
    )
      return { ...previous, notice: '请选择工作规划和有效运行时间。' };
    const old = s.schedules.find((x) => x.id === action.id);
    const id = old?.id || `schedule-${++s.counter}`;
    const c: Schedule = {
      ...action.schedule,
      id,
      createdAt: iso(s.now),
      evaluated: old?.evaluated || [],
      snapshots: old?.snapshots || {},
      runs: old?.runs || [],
    };
    s.schedules = old
      ? s.schedules.map((x) => (x.id === id ? c : x))
      : [...s.schedules, c];
    s.notice = c.enabled ? '已启用本人工作规划提醒。' : '已暂停工作规划提醒。';
  }
  if (action.type === 'tick') s.now = action.now + s.offset;
  if (action.type === 'advance') {
    s.offset += action.ms;
    s.now += action.ms;
  }
  if (action.type === 'tick' || action.type === 'advance') evaluateSchedules(s);
  return s;
}
