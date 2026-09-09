import type { Annotation } from './task-workspace-model.ts';
import {
  current,
  eligible,
  iso,
  memoryReducer,
  refFor,
  type MemoryState,
  type MemoryAction,
  type Payload,
  type WorkTask,
  type MemoryRef,
  type Schedule,
  dueSlot,
} from './memory-domain.ts';
import { initialMemoryState } from './memory-fixtures.ts';
import {
  oaAssignment,
  paymentWarningTerms,
  paymentReturnOpinions,
  assets,
  initialCatalog,
  originalRemarks,
  teachingExample,
  systems,
  paymentSkill,
  fiscalAgent,
  projectAgent,
  type CatalogEntry,
  type SystemId,
} from './fiscal-catalog.ts';
import {
  initialLibraryState,
  type LibraryState,
  type PersonalLibraryItem,
} from './library-domain.ts';

export type Risk = '无' | '低' | '中' | '高';
export type Command =
  | 'read-payments'
  | 'review'
  | 'save-method'
  | 'share-method'
  | 'confirm-findings'
  | 'check-rules'
  | 'report'
  | 'check-payment-submission'
  | 'writeback'
  | 'draft-only'
  | 'query-receipt'
  | 'read-oa'
  | 'read-project-requirements'
  | 'read-resource-assets'
  | 'read-knowledge-plans'
  | 'discover-capability'
  | 'guide'
  | 'create-project'
  | 'save-project'
  | 'select-assets'
  | 'sync-assets'
  | 'prepare-materials'
  | 'upload-materials'
  | 'estimate'
  | 'manual-submit'
  | 'submit-project'
  | 'read-feedback'
  | 'track'
  | 'no-track'
  | 'consultation';
export type CommandAction = {
  type: 'command';
  taskId: string;
  cmd: Command;
  confirmed?: boolean;
  value?: Record<string, string>;
  assetIds?: string[];
  source?: 'assistant' | 'browser';
  revision?: number;
  text?: string;
};
export type Operation = {
  id: string;
  messageId: string;
  cmd: string;
  system?: SystemId;
  risk: Risk;
  scope: string;
  at: string;
  actor: string;
  version: number;
  capability?: { id: string; name: string; version: string };
  checks: { label: string; passed: boolean }[];
  status:
    | '成功'
    | '待确认'
    | '已取消'
    | '已阻止'
    | '失败'
    | '部分成功'
    | '待核实';
  detail: string;
  receipt?: string;
  items?: { id: string; status: string }[];
};
export type Artifact = {
  id: string;
  originMessageId?: string;
  taskId: string;
  name: string;
  version: number;
  source: string;
  body: string;
  createdAt: string;
  annotations: { text: string; at: string }[];
};
export type Project = {
  name: string;
  unit: string;
  constructionUnit: string;
  budgetUnit: string;
  contact: string;
  phone: string;
  year: string;
  months: string;
  service: string;
  history: string;
  content: string;
};
export type Flow = {
  id: string;
  kind: 'payment' | 'maintenance' | 'feedback' | 'consultation';
  stage: string;
  status: string;
  source: string;
  historical: boolean;
  stopped: boolean;
  version: number;
  operations: Operation[];
  artifactIds: string[];
  decisions: { at: string; text: string; version: number }[];
  pending?: CommandAction;
  period?: { start: string; end: string };
  findings: string[];
  rulePassed: boolean;
  written: Record<string, string>;
  memoryId?: string;
  contributionId?: string;
  candidate?: Extract<Payload, { kind: 'procedural' }>;
  project: Project;
  assetIds: string[];
  syncedIds: string[];
  materialsVersion: number;
  uploadedVersion: number;
  estimate?: {
    total: number;
    version: number;
    rows: { name: string; annual: number }[];
  };
  submission:
    | 'draft'
    | 'manual-selected'
    | 'user-reported'
    | 'system-confirmed';
  tracking?: string;
  agentId?: string;
  folder: string;
};
export type Automation = {
  id: string;
  name: string;
  enabled: boolean;
  kind: 'payment' | 'feedback' | 'generic';
  cadence: 'weekly' | 'daily' | 'weekdays' | 'event';
  weekday: number;
  time: string;
  createdAt: string;
  runs: string[];
  evaluated: string[];
  taskId?: string;
  prompt: string;
};
export type Auth = {
  enabled: boolean;
  expires: number;
  read: boolean;
  write: boolean;
  identity: boolean;
};
export type WorkspaceState = {
  workspaceFeedback?: { taskId: string; messageId: string; annotations: Annotation[] }[];
  memory: MemoryState;
  flows: Record<string, Flow>;
  artifacts: Record<string, Artifact>;
  catalog: CatalogEntry[];
  library: LibraryState;
  auth: Record<SystemId, Auth>;
  automations: Automation[];
  folders: string[];
  folderTasks: Record<string, string>;
  nextOutcome: 'success' | 'partial' | 'unknown' | 'failure';
  notice: string;
  feedbackIds: string[];
  archive?: WorkspaceState;
};
export type WorkspaceAction =
  | CommandAction
  | { type: 'memory'; action: MemoryAction }
  | {
      type: 'start';
      kind: 'payment' | 'maintenance';
      id: string;
      periodEnd?: number;
    }
  | { type: 'workspace-feedback'; taskId: string; text: string; annotations?: Annotation[] }
  | { type: 'say'; taskId: string; text: string }
  | { type: 'replay'; kind: 'payment' | 'maintenance' }
  | { type: 'return-history' }
  | { type: 'adopt'; taskId: string }
  | { type: 'feedback'; taskId: string; eventId: string }
  | { type: 'auth'; system: SystemId; patch: Partial<Auth> }
  | { type: 'outcome'; value: WorkspaceState['nextOutcome'] }
  | { type: 'stop'; taskId: string; stopped: boolean }
  | { type: 'cancel-pending'; taskId: string }
  | { type: 'create-skill'; name: string; category: string; summary: string; instructions: string; publisher: string }
  | { type: 'library-add-local'; item: PersonalLibraryItem }
  | {
      type: 'library-request-cloud';
      name: string;
      location: string;
      access: '本人只读' | '本人可读写';
    }
  | { type: 'catalog'; id: string; owned?: boolean; enabled?: boolean }
  | { type: 'automation'; item: Automation }
  | { type: 'run-automation'; id: string; slot?: number }
  | {
      type: 'new-task';
      id: string;
      text: string;
      agentId?: string;
      refs?: MemoryRef[];
      settings?: WorkTask['contexts'];
      permissionMode?: WorkTask['permissionMode'];
      commandMode?: WorkTask['commandMode'];
    }
  | { type: 'annotate'; id: string; text: string }
  | { type: 'tick'; now: number }
  | { type: 'folder'; name: string; taskId?: string }
  | { type: 'notice'; text: string };
const projectDefaults: Project = {
  name: '财政资金穿透式监管系统运维项目（2027年）',
  unit: '深圳市财政局',
  constructionUnit: '深圳市财政局',
  budgetUnit: '深圳市财政局',
  contact: '林思远',
  phone: '0755-00000000',
  year: '2027',
  months: '12',
  service: '标准保障',
  history: '财政资金穿透式监管系统建设项目',
  content:
    '保障核心应用、支付数据接口、规则分析及监管报表稳定运行，完成巡检、故障响应、备份恢复和既有功能维护。',
};
const methodName = '支付用途备注核对与补充说明方法';
const nextId = (s: WorkspaceState, prefix: string) =>
  `${prefix}-${++s.memory.counter}`;
export function taskFor(s: WorkspaceState, id: string) {
  return s.memory.tasks.find((t) => t.id === id)!;
}
function say(
  s: WorkspaceState,
  id: string,
  role: 'user' | 'assistant' | 'system',
  text: string,
) {
  const m = { id: nextId(s, 'event'), role, text, at: iso(s.memory.now) };
  taskFor(s, id).messages.push(m);
  return m.id;
}
function workPoint(
  s: WorkspaceState,
  id: string,
  text: string,
  kind: 'requirement' | 'decision' | 'result' = 'result',
) {
  const t = taskFor(s, id),
    mid = `working-${id}`,
    event = t.messages.at(-1)!;
  let m = s.memory.memories.find((x) => x.id === mid);
  const key = { kind, text, eventId: event.id, at: event.at };
  if (!m) {
    const rid = mid + '-v1';
    m = {
      id: mid,
      scope: 'personal',
      owner: '林思远',
      current: rid,
      subscribed: false,
      revisions: [
        {
          id: rid,
          number: 1,
          title: t.title,
          payload: {
            kind: 'working',
            work: t.title,
            context: t.context,
            keyPoints: [key],
            memories: [],
          },
          source: {
            taskId: id,
            eventId: event.id,
            label: t.title,
            quote: text,
            nature: 'event',
            accessible: true,
          },
          validFrom: iso(s.memory.now),
          validTo: '',
          recordedAt: iso(s.memory.now),
          status: 'active',
          reason: '工作中产生的关键记录',
          confirmedBy: '本人工作记录',
        },
      ],
      events: [],
    };
    s.memory.memories.unshift(m);
  } else {
    const r = current(m),
      p = r.payload;
    if (p.kind !== 'working' || p.keyPoints.some((x) => x.text === text))
      return;
    const n = r.number + 1;
    const v = {
      ...structuredClone(r),
      id: `${mid}-v${n}`,
      number: n,
      payload: { ...p, keyPoints: [...p.keyPoints, key] },
      recordedAt: iso(s.memory.now),
    };
    m.revisions.push(v);
    m.current = v.id;
  }
  const p = current(m).payload,
    flow = s.flows[id];
  if (p.kind === 'working' && flow.memoryId) {
    const mm = s.memory.memories.find((x) => x.id === flow.memoryId);
    if (mm && !p.memories.some((x) => x.memoryId === mm.id))
      p.memories.push(refFor(mm));
  }
}
function start(
  s: WorkspaceState,
  kind: 'payment' | 'maintenance',
  id: string,
  end = s.memory.now,
) {
  if (s.flows[id]) return;
  const payment = kind === 'payment',
    period = { start: iso(end - 7 * 86400000), end: iso(end) };
  const title = payment
    ? `财政支付审查 · ${new Date(end + 8 * 3600000).toISOString().slice(0, 10)}`
    : '财政资金穿透式监管系统运维项目申报';
  s.memory.tasks.unshift({
    id,
    title,
    context: payment ? '财政支付审查' : '运维项目申报',
    type: 'work',
    planIds: [],
    grants: [],
    pending: [],
    uses: [],
    messages: [],
    savedScroll: 0,
    permissionMode: 'standard',
    commandMode: 'standard',
  });
  s.flows[id] = {
    id,
    kind,
    stage: payment ? 'read' : 'oa',
    status: '待办理',
    source: payment ? '定时触发 · 每周四 09:00' : '用户发起 · OA 事项协助',
    historical: false,
    stopped: false,
    version: 1,
    operations: [],
    artifactIds: [],
    decisions: [],
    period: payment ? period : undefined,
    findings: ['待核实', '待核实'],
    rulePassed: false,
    written: {},
    project: { ...projectDefaults },
    assetIds: [],
    syncedIds: [],
    materialsVersion: 0,
    uploadedVersion: 0,
    submission: 'draft',
    folder: payment ? '财政支付审查' : '',
  };
  say(
    s,
    id,
    payment ? 'system' : 'user',
    payment
      ? `每周四 09:00 自动触发财政支付审查。读取范围：${formatTime(period.start)}（含）至 ${formatTime(period.end)}（不含）。`
      : oaAssignment.request,
  );
  if (payment)
    say(
      s,
      id,
      'assistant',
      '我将读取本周期支付申请，检查支付用途备注。发现疑点后先请你确认，再完成其他规则核查和结果整理。',
    );
  workPoint(
    s,
    id,
    payment
      ? '本期支付审查只回写审查意见，不代批支付。'
      : `用户请求协助处理 OA 交办单 ${oaAssignment.id}。`,
    'requirement',
  );
}
export function formatTime(t: string | number) {
  return new Date(t).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
const opSpecs: Partial<
  Record<
    Command,
    {
      system?: SystemId;
      risk: Risk;
      scope: string;
      write?: boolean;
      capability?: string;
    }
  >
> = {
  'read-payments': {
    system: 'payment',
    risk: '低',
    scope: '通过智慧财政支付系统连接器读取当前周期支付申请，只读',
  },
  review: {
    risk: '无',
    scope: '已读取的两条备注和授权补充材料',
    capability: paymentSkill,
  },
  'save-method': { risk: '无', scope: '保存本人确认的程序记忆' },
  'share-method': { risk: '高', scope: '仅共享预览中的方法、条件、步骤与例外' },
  'check-rules': {
    system: 'supervision',
    risk: '低',
    scope: '本次确认的两笔申请，核对信息完整性及关联一致性',
  },
  report: { risk: '无', scope: '生成本任务审查汇总与疑点清单' },
  'check-payment-submission': { system: 'payment', risk: '高', scope: '检查是否获准正式提交草稿箱内的审查结果', write: true },
  writeback: {
    system: 'payment',
    risk: '中',
    scope: '将两笔审查意见、疑点标记及汇总材料写入智慧财政草稿箱，不正式提交',
    write: true,
  },
  'query-receipt': {
    system: 'payment',
    risk: '低',
    scope: '查询本次回写的幂等回执',
  },
  'read-oa': { system: 'oa', risk: '低', scope: `用户指定的交办单 ${oaAssignment.id}，且承办人为本人` },
  'read-project-requirements': { system: 'pm', risk: '低', scope: '通过项管平台连接器读取运维申报入口、必填字段与材料要求' },
  'read-resource-assets': { system: 'resources', risk: '低', scope: '通过一体化数字资源管理系统连接器查询本单位关联历史项目的资产' },
  'read-knowledge-plans': { risk: '低', scope: '检索本单位知识库中的系统方案、历史运维资料与保障说明', capability: 'finance-knowledge' },
  'discover-capability': { risk: '无', scope: '查询当前用户已获取的技能与专业智能体，匹配运维申报咨询能力' },
  guide: {
    risk: '低',
    scope: '调用项目统筹处对外提供的办理指引',
    capability: projectAgent,
  },
  'create-project': {
    system: 'pm',
    risk: '中',
    scope: '创建本单位运维申报草稿',
    write: true,
  },
  'save-project': {
    system: 'pm',
    risk: '中',
    scope: '更新本单位申报草稿，不启动审批',
    write: true,
  },
  'select-assets': {
    system: 'resources',
    risk: '中',
    scope: '选择本单位该历史项目资产',
    write: true,
  },
  'sync-assets': {
    system: 'resources',
    risk: '中',
    scope: '将已选资产清单同步至项管平台草稿',
    write: true,
  },
  'prepare-materials': {
    risk: '无',
    scope: '根据本处室资料生成申报材料',
    capability: 'finance-knowledge',
  },
  'upload-materials': {
    system: 'pm',
    risk: '中',
    scope: '将已预览的项目申报材料传入项管平台；不正式提交审批',
    write: true,
  },
  estimate: {
    system: 'pm',
    risk: '低',
    scope: '依据当前资产、服务周期及内容获取平台费用估算',
  },
  'submit-project': {
    system: 'pm',
    risk: '高',
    scope: '正式提交本单位项目申报，发起主管单位内审',
    write: true,
  },
  'read-feedback': { system: 'pm', risk: '低', scope: '读取已订阅项目的审核反馈' },
  track: { risk: '无', scope: '本人反馈通知与修改建议，不自动修改或重提' },
  consultation: { risk: '低', scope: '调用已获取专业智能体的咨询能力' },
};
function validateStage(f: Flow, cmd: Command) {
  const allowed: Record<Command, string[]> = {
    'read-payments': ['read'],
    review: ['review'],
    'save-method': ['findings'],
    'share-method': ['findings', 'rules', 'report', 'delivery', 'complete'],
    'confirm-findings': ['findings'],
    'check-rules': ['rules'],
    report: ['report'],
    'check-payment-submission': [],
    writeback: ['delivery', 'receipt'],
    'draft-only': ['delivery'],
    'query-receipt': ['receipt'],
    'read-oa': ['oa'],
    'read-project-requirements': [],
    'read-resource-assets': [],
    'read-knowledge-plans': [],
    'discover-capability': [], // Internal step of guide; not a standalone user command.
    guide: ['guide'],
    'create-project': ['create'],
    'save-project': [
      'fill',
      'assets',
      'materials',
      'upload',
      'estimate',
      'submit',
      'manual',
    ],
    'select-assets': [
      'assets',
      'materials',
      'upload',
      'estimate',
      'submit',
      'manual',
    ],
    'sync-assets': [
      'assets',
      'materials',
      'upload',
      'estimate',
      'submit',
      'manual',
    ],
    'prepare-materials': [
      'materials',
      'upload',
      'estimate',
      'submit',
      'manual',
    ],
    'upload-materials': ['upload', 'estimate', 'submit', 'manual'],
    estimate: ['estimate', 'submit', 'manual'],
    'manual-submit': ['submit'],
    'submit-project': ['submit'],
    'read-feedback': [],
    track: ['tracking'],
    'no-track': ['tracking'],
    consultation: ['consult'],
  };
  return allowed[cmd].includes(f.stage);
}
function gate(s: WorkspaceState, f: Flow, a: CommandAction) {
  let spec = opSpecs[a.cmd];
  if (!spec) return true;
  if (a.cmd === 'consultation')
    spec = {
      ...spec,
      capability: f.agentId,
      scope: `${s.catalog.find((c) => c.id === f.agentId)?.name || '专业智能体'}公开或已授权的咨询范围`,
    };
  const capability = s.catalog.find((c) => c.id === spec?.capability);
  const auth = spec.system ? s.auth[spec.system] : undefined;
  const checks = [
    {
      label: '当前经办身份',
      passed: auth ? auth.identity : true,
    },
    { label: '执行未暂停', passed: !f.stopped },
    {
      label: '材料与决定版本一致',
      passed: a.revision === undefined || a.revision === f.version,
    },
  ];
  if (auth)
    checks.push(
      {
        label: '源系统连接及授权有效',
        passed: auth.enabled && auth.expires > s.memory.now,
      },
      {
        label: spec.write
          ? '具备本单位目标对象写入权限'
          : '具备目标对象读取权限',
        passed: spec.write ? auth.write : auth.read,
      },
    );
  if (spec.system)
    checks.push({
      label: '连接器已启用',
      passed: !!s.catalog.find((c) => c.system === spec.system)?.enabled,
    });
  if (spec.capability)
    checks.push({
      label: '所用能力已获取、启用且版本可用',
      passed: !!s.catalog.find(
        (c) => c.id === spec.capability && c.enabled && c.owned,
      ),
    });
  if (a.cmd === 'sync-assets') {
    const pm = s.auth.pm;
    checks.push({
      label: '项管平台资产接收权限有效',
      passed:
        pm.enabled &&
        pm.write &&
        pm.expires > s.memory.now &&
        !!s.catalog.find((c) => c.system === 'pm')?.enabled,
    });
  }
  if (a.cmd === 'check-payment-submission') checks.push({ label: '用户已明确指令正式提交（回写指令不包含提交）', passed: false });
  const needs =
    spec.risk === '高' || a.cmd === 'writeback' || a.cmd === 'upload-materials' || taskFor(s, f.id).permissionMode === 'confirm';
  const blocked = checks.some((c) => !c.passed),
    pending = !blocked && needs && !a.confirmed;
  if (needs)
    checks.push({ label: '本人确认当前对象与影响', passed: !!a.confirmed });
  const op: Operation = {
    id: nextId(s, 'op'),
    messageId: '',
    cmd: a.cmd,
    system: spec.system,
    risk: spec.risk,
    scope: spec.scope,
    at: iso(s.memory.now),
    actor:
      a.source === 'browser'
        ? '本人 · 任务浏览器'
        : '超级智能体 · 当前经办身份',
    version: f.version,
    capability: capability
      ? {
          id: capability.id,
          name: capability.name,
          version: capability.version,
        }
      : undefined,
    checks,
    status: blocked ? '已阻止' : pending ? '待确认' : '成功',
    detail: blocked
      ? '未发起系统操作，请检查失败项。'
      : pending
        ? '请确认操作范围后继续。'
        : '执行前检查通过。',
  };
  if (pending) {
    f.pending = { ...a, revision: f.version };
    f.status = '等待本人确认';
  }
  op.messageId = say(
    s,
    f.id,
    'assistant',
    `${spec.risk}风险 · ${spec.scope}${blocked ? '。检查未通过，操作已停止。' : pending ? '。等待你确认。' : '。授权检查通过。'}`,
  );
  f.operations.push(op);
  if (blocked) {
    f.status = '操作已阻止';
    s.notice = '授权或对象检查未通过，未执行该操作。';
    return false;
  }
  if (pending) return false;
  f.pending = undefined;
  if (s.nextOutcome === 'failure' && spec.system) {
    s.nextOutcome = 'success';
    op.status = '失败';
    op.detail = '连接暂时不可用，没有取得执行成功回执。';
    s.notice = op.detail;
    return false;
  }
  return true;
}
function artifact(
  s: WorkspaceState,
  f: Flow,
  name: string,
  body: string,
  source: string,
) {
  const existing = f.artifactIds
    .map((id) => s.artifacts[id])
    .find(
      (a) =>
        a.name === name &&
        a.version === f.version &&
        a.body === body &&
        a.source === source,
    );
  if (existing) return existing.id;
  const id = nextId(s, 'artifact');
  s.artifacts[id] = {
    id,
    taskId: f.id,
    name,
    body,
    source,
    version: f.version,
    createdAt: iso(s.memory.now),
    annotations: [],
    originMessageId:
      f.operations.at(-1)?.messageId || taskFor(s, f.id).messages.at(-1)?.id,
  };
  f.artifactIds.push(id);
  return id;
}
function invalidate(f: Flow) {
  f.version++;
  f.estimate = undefined;
  f.materialsVersion = 0;
  f.uploadedVersion = 0;
  f.pending = undefined;
  f.submission = 'draft';
}
function lastOp(f: Flow) {
  return f.operations.at(-1)!;
}
function finish(s: WorkspaceState, f: Flow, text: string) {
  f.stage = 'complete';
  f.status = '已完成';
  say(s, f.id, 'assistant', text);
  workPoint(s, f.id, text);
}
export function extractMethod(
  text: string,
): Extract<Payload, { kind: 'procedural' }> | undefined {
  if (!/支付|备注|用途/.test(text) || !/[先应要需不能不要]/.test(text)) return;
  const parts = text
    .split(/[。；\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
  return {
    kind: 'procedural',
    method: methodName,
    conditions: /财教〔2021〕315号/.test(text)
      ? '核实资金属于支持地方高校改革发展资金后，依据财教〔2021〕315号第十二条核对用途；其他资金不得直接套用该专项资金规则'
      : '财政支付申请的用途备注核对；结合实际业务材料',
    steps: parts.filter((x) => !/不能|不要|例外/.test(x)),
    exceptions:
      parts.filter((x) => /不能|不要|例外/.test(x)).join('；') ||
      '材料不足时提出核实要求，不直接判断违规。',
  };
}
function contributionBody(p: Extract<Payload, { kind: 'procedural' }>) {
  return `${p.method}\n适用条件：${p.conditions}\n${p.steps.map((x, i) => `${i + 1}. ${x}`).join('\n')}\n例外：${p.exceptions}`;
}
function applyCommand(s: WorkspaceState, a: CommandAction) {
  const f = s.flows[a.taskId];
  if (!f || f.historical) {
    s.notice =
      '这是一笔既有操作记录，不能重复执行。可以在当前对话继续补充要求。';
    return;
  }
  if (f.stopped) {
    s.notice = '任务已暂停，请先恢复。';
    return;
  }
  if (!validateStage(f, a.cmd)) {
    s.notice = '当前步骤尚不支持该操作，已保留现有状态。';
    return;
  }
  if (
    (a.confirmed || a.cmd === 'track') &&
    [
      'writeback',
      'upload-materials',
      'submit-project',
      'share-method',
      'track',
    ].includes(a.cmd)
  ) {
    const text = (
      {
        writeback: '确认将当前审查意见、疑点标记及汇总材料回写智慧财政。',
        'upload-materials':
          '确认上传已预览的当前版本申报材料，不正式提交审批。',
        'submit-project': '确认正式提交当前项目申报并发起审批。',
        'share-method': '确认以上方法、条件、步骤和例外，贡献给组织经验。',
        track: '创建审核反馈追踪，收到反馈后提醒我，并给出修改清单和建议。',
      } as Partial<Record<Command, string>>
    )[a.cmd]!;
    say(s, f.id, 'user', text);
    f.decisions.push({ at: iso(s.memory.now), text, version: f.version });
  }
  if (a.cmd === 'consultation') {
    consult(
      s,
      f.id,
      f.agentId || fiscalAgent,
      a.text || '',
      a.confirmed,
      a.revision,
    );
    return;
  }
  if (a.cmd === 'create-project') {
    const task = taskFor(s, f.id);
    if (task.messages.at(-1)?.role !== 'user') {
      say(s, f.id, 'user', '按刚才的指引，开始帮我办理这个运维项目申报。');
    }
    f.decisions.push({ at: iso(s.memory.now), text: task.messages.at(-1)!.text, version: f.version });
  }
  const preparation = {
    'create-project': 'read-project-requirements',
    'select-assets': 'read-resource-assets',
    'prepare-materials': 'read-knowledge-plans',
  } as Partial<Record<Command, Command>>;
  const prerequisite = preparation[a.cmd];
  if (prerequisite) {
    if (!gate(s, f, { ...a, cmd: prerequisite })) return;
    lastOp(f).detail = prerequisite === 'read-project-requirements'
      ? '项管平台连接器返回：选择运维类项目；基础信息包括申报单位、预算单位、联系人、年度、服务周期与历史建设项目。后续须同步运维资产、上传方案材料，再获取平台费用估算。'
      : prerequisite === 'read-resource-assets'
        ? `一体化数字资源管理系统（原 CDOS）连接器返回 ${assets.length} 项可关联资产，包含资产标识、所属历史项目及运维信息；下一步选择并同步至项管平台。`
        : '已从本单位知识库提取系统方案、历史运维资料与保障说明，作为申报材料编制依据；将与已同步资产和本次服务周期核对后整理上传。';
  }
  if (a.cmd === 'guide') {
    if (!gate(s, f, { ...a, cmd: 'discover-capability' })) return;
    const agent = s.catalog.find((entry) => entry.id === projectAgent && entry.owned);
    lastOp(f).detail = agent
      ? `匹配结果：${agent.name} · ${agent.publisher}。适用于运维项目申报路径、材料要求及费用估算入口咨询；已获取，${agent.enabled ? '已启用，可调用' : '尚未启用，暂不可调用'}。`
      : '查询完成：当前已获取的能力中未找到适用的项目统筹处数字人。';
  }
  if (!gate(s, f, a)) return;
  const id = f.id;
  switch (a.cmd) {
    case 'read-payments':
      f.stage = 'review';
      f.status = '处理中';
      say(
        s,
        id,
        'assistant',
        `智慧财政支付系统连接器返回本周期 2 条院校支付申请，已按申请编号和版本去重。以下为原始用途描述：\n\n${originalRemarks.map((x, i) => `${i + 1}. ${x}`).join('\n\n')}`,
      );
      break;
    case 'review':
      f.stage = 'findings';
      f.status = '等待疑点确认';
      say(
        s,
        id,
        'assistant',
        `已调用“支付备注隐晦表达审查”Skill，两条申请均触发用途描述预警，需人工二次确认。\n\n预警范围：院校支付申请的用途描述含${paymentWarningTerms.map((term) => `“${term}”`).join('、')}等字样。\n\n${originalRemarks.map((remark, i) => `${i + 1}. 命中“${paymentWarningTerms.filter((term) => remark.includes(term)).join('、')}”：${remark}\n待核实：${i === 0 ? '年薪补差、一次性奖金转基本户的实际支付事项、对象与依据。' : '“绩效”是否属于平台产品名称，需结合数据库服务合同和实际支付内容确认。'}`).join('\n\n')}\n\n以上为关键词预警，不代表已经认定违规。请人工二次确认两笔申请的实际用途和处理意见；也可以补充核对方法。`,
      );
      break;
    case 'save-method': {
      if (!f.candidate) {
        s.notice = '请先在对话中说明核对方法。';
        return;
      }
      if (f.memoryId) {
        s.notice = '本次方法已保存，请到记忆详情纠正版本。';
        return;
      }
      s.memory = memoryReducer(s.memory, {
        type: 'create',
        title: methodName,
        payload: f.candidate,
        taskId: id,
      });
      const saved = s.memory.memories.find(
        (m) =>
          current(m).source.taskId === id &&
          current(m).payload.kind === 'procedural' &&
          current(m).title === methodName,
      );
      if (!saved) {
        lastOp(f).status = '失败';
        lastOp(f).detail = s.memory.notice;
        s.notice = s.memory.notice;
        return;
      }
      f.memoryId = saved.id;
      workPoint(s, id, '确认并保存支付用途备注核对方法。', 'decision');
      break;
    }
    case 'share-method': {
      const m = s.memory.memories.find((x) => x.id === f.memoryId);
      if (
        !m ||
        !eligible(m, s.memory.now) ||
        current(m).payload.kind !== 'procedural'
      ) {
        s.notice = '请先保存有效程序记忆。';
        return;
      }
      if (f.contributionId) {
        s.notice = '该方法已提交组织经验，等待维护者处理。';
        return;
      }
      const p = current(m).payload as Extract<Payload, { kind: 'procedural' }>;
      if (/BX\d|12-14601|46个院系|手机号|账户号/.test(contributionBody(p))) {
        s.notice = '共享内容仍含具体业务标识，请在记忆详情去除后再贡献。';
        return;
      }
      s.memory = memoryReducer(s.memory, {
        type: 'contribute',
        id: m.id,
        target: 'department',
        content: contributionBody(p),
        sharedPayload: p,
      });
      f.contributionId = s.memory.contributions[0].id;
      lastOp(f).receipt = 'CONTRIBUTION-' + f.contributionId;
      say(
        s,
        id,
        'assistant',
        '已提交组织经验。仅包含预览中的方法、适用条件、步骤与例外，等待组织维护者采纳；个人原始对话和支付记录留在个人工作空间。',
      );
      break;
    }
    case 'confirm-findings': {
      f.findings = [
        a.value?.first || '用途描述存疑，退回补充说明',
        a.value?.second || '用途描述存疑，退回补充说明',
      ];
      f.stage = 'rules';
      f.status = '处理中';
      const text = `已确认疑点处理：第一笔${f.findings[0]}；第二笔${f.findings[1]}。`;
      f.decisions.push({ at: iso(s.memory.now), text, version: f.version });
      say(s, id, 'user', text);
      workPoint(s, id, text, 'decision');
      break;
    }
    case 'check-rules':
      f.rulePassed = true;
      f.stage = 'report';
      say(
        s,
        id,
        'assistant',
        '财政穿透式监管系统返回：申请标识完整、支付对象字段齐备、关联事项一致性检查通过。上述检查不覆盖你已确认的备注疑点，两笔仍按人工确认的补充说明意见处理。',
      );
      lastOp(f).receipt = 'CZ-CHK-' + id;
      break;
    case 'report': {
      const policy = '政策依据：《支持地方高校改革发展资金管理办法》（财教〔2021〕315号）第十二条（节选）：支持地方高校改革发展资金不得用于基本建设、对外投资、偿还债务、支付利息、支付罚款、捐赠赞助等支出，不得用于在全校范围内普遍提高人员薪酬待遇。\n适用前提：先核实资金来源属于支持地方高校改革发展资金；资金来源未明确时不得直接套用该专项资金规则。';
      const warning = `预警规则：院校支付申请用途描述包含${paymentWarningTerms.join('、')}等字样时提示人工二次确认。关键词命中仅为预警，不等于认定违规。`;
      const method = f.memoryId
        ? `程序记忆：用户提供核对要求与政策依据后已保存，记忆标识 ${f.memoryId}；组织共享及采纳状态以对应记录为准。`
        : '程序记忆：本轮尚未保存新的程序记忆。';
      const checks = f.operations.findLast((o) => o.cmd === 'check-rules' && o.status === '成功');
      const rows = originalRemarks.map((r, i) => `申请 ${i + 1}（PAY-${i + 1} / v1，院校支付申请）\n原始用途描述：${r}\n命中预警词：${paymentWarningTerms.filter((term) => r.includes(term)).join('、')}\n人工二次确认：${f.findings[i]}`);
      artifact(
        s, f, '财政支付审查汇总',
        `财政支付审查汇总\n周期：${formatTime(f.period!.start)}（含）至 ${formatTime(f.period!.end)}（不含）\n\n一、读取与审查过程\n通过智慧财政支付系统连接器读取本周期2条院校申请，按申请编号及版本去重；调用支付备注隐晦表达审查 Skill，两条均触发预警，再由人工二次确认。\n${warning}\n\n二、政策与核对要求\n${policy}\n核对实际事项、支付对象、合同标的和支付依据；不通过替换词语掩盖用途。\n${method}\n\n三、逐笔结果\n${rows.join('\n\n')}\n\n四、其他必要检查\n${f.rulePassed ? '财政穿透式监管系统返回申请标识、支付对象字段及关联事项一致性检查通过' : '未完成必要检查'}；回执：${checks?.receipt || '尚未取得'}。该检查不消除两笔待补充说明的事项，也不替代支付审批。\n\n五、结果使用\n本文件生成时等待用户最终确认回写或仅保留草稿。回写范围仅包括审查意见、疑点标记与汇总附件，不执行支付审批或资金拨付。`,
        '智慧财政连接器、支付表达审查 Skill、人工确认及穿透监管回执',
      );
      artifact(
        s, f, '驳回意见',
        paymentReturnOpinions.join('\n\n'),
        '两笔申请 · 待回写智慧财政',
      );
      f.stage = 'delivery';
      f.status = '等待最终决定';
      say(
        s,
        id,
        'assistant',
        '审查结果已生成。请查看审查汇总和驳回意见，确认后可自动回写智慧财政，也可以只保留草稿，由你到对应系统执行确认。',
      );
      break;
    }
    case 'draft-only':
      say(s, id, 'user', '仅生成草稿，由我到智慧财政系统执行确认。');
      finish(s, f, '已保留审查草稿，未向智慧财政回写。');
      break;
    case 'writeback': {
      if (
        f.operations
          .slice(0, -1)
          .some((o) => o.cmd === 'writeback' && o.status === '待核实')
      ) {
        lastOp(f).status = '已阻止';
        lastOp(f).detail = '上次回执待核实，请先查询回执。';
        s.notice = lastOp(f).detail;
        return;
      }
      const outcome = s.nextOutcome;
      s.nextOutcome = 'success';
      const op = lastOp(f);
      const ids = ['PAY-1:v1', 'PAY-2:v1'];
      if (outcome === 'unknown') {
        op.status = '待核实';
        op.detail = '请求已发出，回执未返回。先查询回执，不能盲目重发。';
        f.stage = 'receipt';
        f.status = '回执待核实';
      } else {
        const remaining = ids.filter((x) => !f.written[x]);
        remaining.forEach((key, i) => {
          if (outcome !== 'partial' || i === 0)
            f.written[key] = /补充说明/.test(f.findings[ids.indexOf(key)]) ? paymentReturnOpinions[ids.indexOf(key)] : f.findings[ids.indexOf(key)];
        });
        op.items = ids.map((x) => ({
          id: x,
          status: f.written[x] ? '成功' : '失败',
        }));
        op.status = ids.every((x) => f.written[x]) ? '成功' : '部分成功';
        op.receipt = 'CZ-RECEIPT-' + id;
        op.detail =
          op.status === '成功'
            ? '两笔审查意见已写入智慧财政草稿箱，尚未正式提交。建议你前往智慧财政系统，再次核对两笔审查意见，确认无误后手动提交。'
            : '已保留成功项；重试只处理失败项。';
        f.stage = op.status === '成功' ? 'complete' : 'receipt';
        f.status = op.status === '成功' ? '已完成' : '部分成功';
      }
      if (f.stage === 'complete') {
        workPoint(s, id, op.detail);
        gate(s, f, { type: 'command', taskId: id, cmd: 'check-payment-submission' });
        lastOp(f).detail = '未获得明确的正式提交指令，高风险检查未通过，未发起提交；两笔意见保留在智慧财政草稿箱。';
        f.status = '已存草稿，未提交';
        s.notice = '';
      }
      say(s, id, 'assistant', op.detail);
      break;
    }
    case 'query-receipt': {
      const prior = f.operations.findLast(
        (o) => o.cmd === 'writeback' && o.status === '待核实',
      );
      if (prior) {
        prior.status = '成功';
        prior.detail = '查询回执确认两笔意见已保存至智慧财政草稿箱，未正式提交。';
        prior.receipt = 'CZ-RECEIPT-' + id;
        f.written = Object.fromEntries(['PAY-1:v1', 'PAY-2:v1'].map((key, i) => [key, /补充说明/.test(f.findings[i]) ? paymentReturnOpinions[i] : f.findings[i]]));
        lastOp(f).receipt = prior.receipt;
        finish(s, f, prior.detail);
        gate(s, f, { type: 'command', taskId: id, cmd: 'check-payment-submission' });
        lastOp(f).detail = '未获得明确的正式提交指令，高风险检查未通过，未发起提交；两笔意见保留在智慧财政草稿箱。';
        f.status = '已存草稿，未提交';
        s.notice = '';
      } else
        say(
          s,
          id,
          'assistant',
          '已读取回执，已成功的申请保持不变，可重试剩余失败项。',
        );
      break;
    }
    case 'read-oa':
      f.stage = 'guide';
      f.status = '等待办理咨询';
      say(
        s,
        id,
        'assistant',
        `已通过财政局 OA 连接器读取交办单 ${oaAssignment.id}，并核对承办人为你。该事项要求向政数局申报本单位财政资金穿透式监管系统运维项目，并获得费用估算。`,
      );
      break;
    case 'guide':
      lastOp(f).detail = '已调用用户已获取且启用的项目统筹处数字人；咨询内容为运维项目申报步骤、材料要求及费用估算入口。已返回办理指引。';
      f.stage = 'create';
      f.status = '等待用户启动办理';
      say(
        s,
        id,
        'assistant',
        '项目统筹处数字人已返回办理指引，接下来按以下路径办理：\n\n1. 在项管平台选择“运维类项目”，填报基本信息并关联历史建设项目。\n2. 从一体化数字资源管理系统（原 CDOS）关联本单位运维资产并同步。\n3. 根据本处室资料准备方案及附件，核对平台与材料一致性后上传。\n4. 读取项管平台费用估算；经你确认后正式提交，进入主管单位内审。\n\n本次指引引用了项目统筹处数字人的程序记忆《运维项目申报办理流程》。该记忆由政数局工作人员在日常办理中沉淀，经组织确认后纳入数字人。',
      );
      f.agentId = projectAgent;
      break;
    case 'create-project':
      f.stage = 'fill';
      f.status = '填写基础信息';
      lastOp(f).receipt = 'PM-DRAFT-' + id;
      say(
        s,
        id,
        'assistant',
        '已建立运维项目申报草稿。下一步核对基本信息、服务周期和关联历史建设项目。',
      );
      break;
    case 'save-project': {
      const p = { ...f.project, ...a.value };
      if (
        !p.name.trim() ||
        !p.history.trim() ||
        !p.contact.trim() ||
        ![p.unit, p.constructionUnit, p.budgetUnit].every(
          (x) => x === '深圳市财政局',
        ) ||
        Number(p.months) < 1 ||
        Number(p.months) > 36 ||
        !Number.isInteger(Number(p.months)) ||
        !/^20\d{2}$/.test(p.year)
      ) {
        lastOp(f).status = '失败';
        lastOp(f).detail =
          '请核对项目名称、联系人、申报／建设／预算单位、历史项目及服务周期（1—36月）。';
        s.notice = lastOp(f).detail;
        return;
      }
      f.project = p;
      invalidate(f);
      f.stage = f.syncedIds.length ? 'materials' : 'assets';
      f.status = '准备资产与材料';
      say(
        s,
        id,
        'assistant',
        '基础信息已保存到项管平台草稿；此前材料及估算需要与当前版本重新核对。',
      );
      break;
    }
    case 'select-assets': {
      const selected = [...new Set(a.assetIds || [])];
      if (selected.some((x) => !assets.some((y) => y.id === x))) {
        s.notice = '包含不在授权项目内的资产。';
        lastOp(f).status = '已阻止';
        return;
      }
      f.assetIds = selected;
      invalidate(f);
      f.stage = 'assets';
      say(
        s,
        id,
        'assistant',
        `已暂存 ${selected.length} 项资产选择，尚未同步至项管平台。`,
      );
      break;
    }
    case 'sync-assets':
      if (!f.assetIds.length) {
        s.notice = '请先选择至少一项资产。';
        lastOp(f).status = '失败';
        return;
      }
      f.syncedIds = [...f.assetIds];
      invalidate(f);
      f.stage = 'materials';
      say(
        s,
        id,
        'assistant',
        `已将 ${f.syncedIds.length} 项资产同步至项管平台的运维对象清单。此操作只同步资产，不启动审批。`,
      );
      break;
    case 'prepare-materials': {
      if (!f.syncedIds.length) {
        s.notice = '资产尚未同步，不能生成一致的申报材料。';
        return;
      }
      const p = f.project,
        selected = assets.filter((x) => f.syncedIds.includes(x.id));
      artifact(
        s,
        f,
        `${p.name}—立项申请表`,
        `${p.name}\n申报单位：${p.unit}\n建设单位：${p.constructionUnit}\n预算单位：${p.budgetUnit}\n联系人：${p.contact}；电话：${p.phone}\n预算年度：${p.year}\n服务周期：${p.months}个月\n历史建设项目：${p.history}\n\n申请事项：现有系统运行维护服务。${p.content}`,
        '财政局本处室系统与运维资料 / 项管平台基本信息',
      );
      artifact(
        s,
        f,
        `${p.name}—运维项目方案`,
        `${p.name}\n\n一、项目背景\n现有财政资金穿透式监管系统承担支付数据关联、规则核查及监管查询工作，需要持续运行保障。\n\n二、运维对象\n${selected.map((x) => `${x.id} · ${x.name} · ${x.quantity}套 · ${x.importance}`).join('\n')}\n\n三、服务范围\n${p.content}\n\n四、服务方式\n${p.months}个月，${p.service}。按月巡检、记录工单、核对接口运行状态；重大异常及时通知经办人员并留存处理记录。\n\n五、交付与验收\n按月提交巡检和问题处理记录，服务期末核对资产范围、故障处理、备份恢复记录及遗留事项。\n\n六、费用依据\n以项管平台对本版资产及服务内容形成的估算为准。`,
        '财政局本处室系统与运维资料',
      );
      artifact(
        s,
        f,
        `${p.name}—立项方案（基础设施、软件开发、通用正版软件、第三方等服务分册）`,
        `项目：${p.name}\n服务周期：${p.months}个月；${p.service}\n服务范围：${p.content}\n\n运维对象与资产依据\n历史项目：${p.history}\n建设合同：CZ-CT-2024-01\n${selected.map((x) => `${x.id} | ${x.name} | ${x.category} | 数量${x.quantity} | ${x.importance} | 在用 | 采购额${x.purchase}万元 | 质保至${x.warrantyEnd}`).join('\n')}\n\n以上资产与合同为本次场景统一设定。`,
        '一体化数字资源管理系统 / 已同步清单',
      );
      artifact(
        s,
        f,
        `${p.name}—立项方案（数据资源分册）`,
        `项目：${p.name}\n\n数据范围：系统内财政支付关联信息和监管处理记录。\n访问管理：运维人员使用受控身份，按工单和最小必要范围临时授权；敏感数据不得复制到个人设备。\n运维留痕：访问、配置修改与异常处理保留记录，重要操作经业务负责人确认。\n备份恢复：定期核对备份结果，恢复演练记录纳入运维验收。\n外部报送：仅上传申报所需系统说明和资产摘要，原始支付记录不作为申报附件。`,
        '财政局本处室系统与运维资料',
      );
      artifact(s, f, `${p.name}—预算表`,
        `项目：${p.name}\n预算年度：${p.year}\n预算单位：${p.budgetUnit}\n服务周期：${p.months}个月；${p.service}\n\n预算服务项目\n${selected.map((x) => `${x.name} | ${x.quantity}套 | 服务${p.months}个月 | 金额待项管平台核算`).join('\n')}\n\n服务内容：${p.content}\n核算状态：本表提供申报范围和核算输入；上传材料后，由项管平台计算费用，结果另见费用估算明细。当前不填入未取得的平台金额。`,
        '本单位运维资料 / 已同步资产 / 项管平台申报信息');
      artifact(s, f, `${p.name}—立项方案（网络安全设计分册）`,
        `项目：${p.name}\n服务周期：${p.months}个月\n\n一、保护范围\n覆盖本次${selected.length}项运维资产及财政支付关联、规则核查接口。\n二、访问控制\n运维账号按工单授权，遵循最小权限，重要配置变更经确认并保留日志。\n三、安全运维\n定期检查漏洞、异常访问和接口运行状态；修复前备份并明确回退步骤。\n四、数据保护\n不将原始支付数据作为申报附件，不向个人设备复制敏感数据。\n五、应急与验收\n记录异常发现、处置与恢复过程；巡检、权限复核及备份恢复记录纳入服务验收。`,
        '本单位系统及运维资料 / 安全保障要求');
      artifact(s, f, `${p.name}—立项方案（信创分册）`,
        `项目：${p.name}\n服务周期：${p.months}个月\n\n一、适用范围\n本次为现有系统运维，不新增未经确认的软件替换或迁移采购。\n二、环境核对\n依据资产台账逐项核对操作系统、数据库、中间件和应用依赖版本；未提供的品牌与适配认证信息列为待核实。\n三、兼容性保障\n补丁或版本升级前验证应用、接口及数据库兼容性，形成测试和回退记录。\n四、服务交付\n交付环境清单、适配问题记录和升级验证报告；发现需新增改造事项时另行确认范围与费用。`,
        '本单位系统及运维资料 / 信创保障要求');
      f.materialsVersion = f.version;
      f.stage = 'upload';
      f.status = '等待材料上传确认';
      say(
        s,
        id,
        'assistant',
        '已整理七份申报材料，并核对单位、运维对象及服务周期一致。请先预览，再确认上传项管平台。',
      );
      break;
    }
    case 'upload-materials':
      if (f.materialsVersion !== f.version) {
        s.notice = '材料版本已过期，请重新整理。';
        lastOp(f).status = '已阻止';
        return;
      }
      f.uploadedVersion = f.version;
      lastOp(f).receipt = 'PM-FILES-' + id + '-v' + f.version;
      lastOp(f).detail = '项管平台已接收当前版本的七份申报材料，未发起审批。';
      f.stage = 'estimate';
      f.status = '获取费用估算';
      say(
        s,
        id,
        'assistant',
        '七份当前版本材料已上传至项管平台草稿，尚未正式提交审批。',
      );
      break;
    case 'estimate': {
      if (f.uploadedVersion !== f.version) {
        s.notice = '请先上传当前版本材料。';
        lastOp(f).status = '已阻止';
        return;
      }
      const months = Number(f.project.months),
        factor = f.project.service === '加强保障' ? 1.25 : 1,
        rows = assets
          .filter((x) => f.syncedIds.includes(x.id))
          .map((x) => ({
            name: x.name,
            annual: Number((x.monthly * months * factor).toFixed(2)),
          }));
      f.estimate = {
        version: f.version,
        rows,
        total: Number(rows.reduce((n, x) => n + x.annual, 0).toFixed(2)),
      };
      artifact(
        s,
        f,
        '运维服务费用估算明细',
        `项目：${f.project.name}\n来源：项管平台费用估算\n输入版本：v${f.version}\n周期：${months}个月；${f.project.service}\n\n${rows.map((x) => `${x.name}：${x.annual.toFixed(2)}万元`).join('\n')}\n合计：${f.estimate.total.toFixed(2)}万元\n\n场景计算依据：各软件资产月度服务参数 × 服务月数 × 保障系数（标准1／加强1.25）。用于说明平台计算与智能体读取的关系，不是深圳实际计价标准或批复金额。`,
        '项管平台计算返回 / 场景费用参数',
      );
      f.stage = 'submit';
      f.status = '等待提交方式决定';
      say(
        s,
        id,
        'assistant',
        `项管平台返回费用估算 ${f.estimate.total.toFixed(2)} 万元，覆盖 ${rows.length} 项资产、${months} 个月${f.project.service}。明细与计算依据已放入成果。此金额为估算，不是批复金额。\n\n你可以确认后由我自动提交，也可以本人前往项管平台提交。`,
      );
      lastOp(f).receipt = 'PM-EST-' + id + '-v' + f.version;
      break;
    }
    case 'manual-submit':
      f.submission = 'manual-selected';
      f.stage = 'manual';
      f.status = '等待本人提交';
      say(s, id, 'user', '我自己去项管平台提交。');
      f.decisions.push({
        at: iso(s.memory.now),
        text: '由本人前往项管平台提交。',
        version: f.version,
      });
      say(
        s,
        id,
        'assistant',
        '申报草稿与材料已准备好。完成提交后告诉我，我会根据这项工作的状态协助跟进。',
      );
      break;
    case 'submit-project':
      if (!f.estimate || f.estimate.version !== f.version) {
        s.notice = '当前估算无效，请重新获取。';
        lastOp(f).status = '已阻止';
        return;
      }
      f.submission = 'system-confirmed';
      f.stage = 'tracking';
      f.status = '待决定反馈追踪';
      lastOp(f).receipt = 'PM-SUBMIT-' + id;
      say(
        s,
        id,
        'assistant',
        '项管平台返回提交成功，进入主管单位内审。是否为此创建审核反馈追踪？收到反馈后向你推送，并列出修改清单和建议。',
      );
      break;
    case 'track': {
      if (!['user-reported', 'system-confirmed'].includes(f.submission)) {
        s.notice = '提交尚未发生。';
        return;
      }
      const aid = 'feedback-' + id;
      if (!s.automations.some((x) => x.id === aid))
        s.automations.push({
          id: aid,
          name: '运维项目审核反馈追踪',
          enabled: true,
          kind: 'feedback',
          cadence: 'event',
          weekday: 4,
          time: '09:00',
          createdAt: iso(s.memory.now),
          runs: [],
          evaluated: [],
          taskId: id,
          prompt:
            '收到本项目反馈时通知本人，解析原因，列出修改清单及建议；不自动改写或重提。',
        });
      f.tracking = aid;
      finish(
        s,
        f,
        '已创建审核反馈追踪。目前尚未收到审核反馈。提交来源与后续平台反馈分别保留，收到新反馈时再生成跟进任务。',
      );
      break;
    }
    case 'no-track':
      say(s, id, 'user', '暂不创建反馈追踪。');
      finish(s, f, '已保留提交记录。需要时可继续在本任务询问后续办理事项。');
      break;
  }
}
function adopt(s: WorkspaceState, id: string) {
  const f = s.flows[id],
    c = s.memory.contributions.find((x) => x.id === f?.contributionId);
  if (!f || !c || c.status !== 'submitted') {
    s.notice = '没有等待维护者采纳的贡献。';
    return;
  }
  s.memory = memoryReducer(s.memory, {
    type: 'contribution',
    id: c.id,
    status: 'accepted',
    reply:
      '组织维护者核对共享范围与方法后采纳，加入资金监管数字人的可用组织经验。',
  });
  const m = s.memory.memories.find((x) => x.id === 'org-' + c.id);
  if (!m) return;
  const event = say(
    s,
    id,
    'system',
    '组织维护者已采纳该贡献，资金监管数字人现在可引用这条组织经验。',
  );
  f.operations.push({
    id: nextId(s, 'op'),
    messageId: event,
    cmd: 'organization-adoption',
    risk: '高',
    scope: '发布已预览的组织经验版本',
    actor: '组织维护者',
    at: iso(s.memory.now),
    version: current(m).number,
    status: '成功',
    checks: [
      { label: '维护者身份及经验维护权限', passed: true },
      { label: '贡献范围已核对', passed: true },
      { label: '独立组织版本已建立', passed: true },
    ],
    detail: '个人原话未发布，数字人引用组织版本。',
    receipt: 'ORG-' + c.id,
  });
  workPoint(s, id, '程序记忆贡献经组织维护者采纳，可供资金监管数字人引用。');
}
function consult(
  s: WorkspaceState,
  id: string,
  agentId: string,
  text: string,
  confirmed = false,
  revision?: number,
) {
  const agent = s.catalog.find((x) => x.id === agentId),
    f = s.flows[id];
  if (
    !gate(s, f, {
      type: 'command',
      taskId: id,
      cmd: 'consultation',
      text,
      confirmed,
      revision,
    }) ||
    !agent
  )
    return;
  f.status = '可继续咨询';
  lastOp(f).detail = '咨询使用基础指导和有效组织经验，不获取其他单位内部资料。';
  if (agentId === projectAgent) {
    say(
      s,
      id,
      'assistant',
      '项目统筹处数字人提供的指引：先在项管平台建立运维类项目，填写基础信息并关联历史项目；从一体化数字资源管理系统关联资产；按本单位资料整理材料后获取平台估算，最后确认提交。CDOS 是一体化数字资源管理系统的过往称谓。\n\n依据：深圳市政务服务和数据管理局《项目统筹处》公开职责及本次申报流程资料。',
    );
    return;
  }
  if (agentId === fiscalAgent) {
    const memories = s.memory.memories.filter(
      (m) =>
        m.scope !== 'personal' &&
        eligible(m, s.memory.now) &&
        current(m).payload.kind === 'procedural' &&
        /支付/.test(current(m).title),
    );
    let answer =
      '资金监管数字人建议：如实说明实际支付用途，准备支付对象、事项和支付依据；材料不足时先补充核实。';
    if (memories.length && /支付|用途|绩效|备注|年薪/.test(text)) {
      answer += '\n\n本次采用的组织经验：';
      for (const m of memories) {
        const p = current(m).payload as Extract<
          Payload,
          { kind: 'procedural' }
        >;
        answer += `\n${p.method} · v${current(m).number}\n适用条件：${p.conditions}\n${p.steps.join('\n')}\n例外：${p.exceptions}`;
        taskFor(s, id).uses.push({
          ...refFor(m),
          taskId: id,
          at: iso(s.memory.now),
          effect: '资金监管数字人依据组织已采纳的方法回答',
        });
      }
    } else answer += '\n\n当前没有可引用的新增组织方法，以上为基础办理指导。';
    say(s, id, 'assistant', answer);
  } else
    say(
      s,
      id,
      'assistant',
      `${agent.name}的能力范围：${agent.details.join('；')}。请补充具体材料与目标，我会结合已授权上下文整理本次任务。`,
    );
}
function base(now: number): WorkspaceState {
  return {
    memory: initialMemoryState(now),
    flows: {},
    artifacts: {},
    catalog: initialCatalog(),
    library: initialLibraryState(),
    auth: Object.fromEntries(
      Object.keys(systems).map((k) => [
        k,
        {
          enabled: true,
          expires: now + 30 * 86400000,
          read: true,
          write: true,
          identity: true,
        },
      ]),
    ) as Record<SystemId, Auth>,
    automations: [
      {
        id: 'fiscal-weekly',
        name: '财政支付审查',
        enabled: true,
        kind: 'payment',
        cadence: 'weekly',
        weekday: 4,
        time: '09:00',
        createdAt: '2026-08-27T01:00:00.000Z',
        runs: [],
        evaluated: [],
        prompt:
          '读取当前周期支付申请，审查备注，疑点与最终回写分别交本人确认。',
      },
    ],
    folders: ['财政支付审查'],
    folderTasks: {},
    nextOutcome: 'success',
    notice: '',
    feedbackIds: [],
  };
}
export function initialWorkspace(
  now = Date.parse('2026-09-08T09:00:00+08:00'),
): WorkspaceState {
  let s = base(now);
  s.memory.now = Date.parse('2026-09-03T09:00:00+08:00');
  start(s, 'payment', 'payment-history', s.memory.now);
  const exec = (
    id: string,
    cmd: Command,
    extra: Partial<CommandAction> = {},
  ) => {
    s.memory.now += 60000;
    applyCommand(s, {
      type: 'command',
      taskId: id,
      cmd,
      confirmed: true,
      ...extra,
    });
  };
  exec('payment-history', 'read-payments');
  exec('payment-history', 'review');
  s = workspaceReducer(s, {
    type: 'say',
    taskId: 'payment-history',
    text: teachingExample,
  });
  exec('payment-history', 'save-method');
  exec('payment-history', 'share-method');
  adopt(s, 'payment-history');
  exec('payment-history', 'confirm-findings');
  exec('payment-history', 'check-rules');
  exec('payment-history', 'report');
  exec('payment-history', 'writeback');
  s.automations[0].runs = ['payment-history'];
  s.automations[0].evaluated = ['2026-09-03T01:00:00.000Z'];
  s.memory.now = Date.parse('2026-09-07T09:00:00+08:00');
  start(s, 'maintenance', 'maintenance-history');
  exec('maintenance-history', 'read-oa');
  s = workspaceReducer(s, {
    type: 'say',
    taskId: 'maintenance-history',
    text: '领导让我申报这个系统的运维项目，我不知道怎么操作，这事该怎么办？',
  });
  s = workspaceReducer(s, {
    type: 'say',
    taskId: 'maintenance-history',
    text: '按刚才的指引，开始帮我办理这个运维项目申报。',
  });
  exec('maintenance-history', 'save-project');
  exec('maintenance-history', 'select-assets', {
    assetIds: assets.map((x) => x.id),
  });
  exec('maintenance-history', 'sync-assets');
  exec('maintenance-history', 'prepare-materials');
  exec('maintenance-history', 'upload-materials');
  exec('maintenance-history', 'estimate');
  exec('maintenance-history', 'manual-submit');
  s = workspaceReducer(s, {
    type: 'say',
    taskId: 'maintenance-history',
    text: '我已经在项管平台手动提交了。',
  });
  exec('maintenance-history', 'track');
  Object.values(s.flows).forEach((f) => (f.historical = true));
  s.memory.now = now;
  s.notice = '';
  return s;
}
export function workspaceReducer(
  previous: WorkspaceState,
  a: WorkspaceAction,
): WorkspaceState {
  if (a.type === 'return-history') return previous.archive || previous;
  if (a.type === 'replay') {
    const s = base(previous.memory.now);
    s.archive = structuredClone(previous.archive || previous);
    // A replay is a fresh session. Do not catch up an old scheduled period
    // while the user is manually replaying that same period.
    s.automations[0].createdAt = iso(s.memory.now);
    start(
      s,
      a.kind,
      'replay-' + a.kind,
      a.kind === 'payment'
        ? Date.parse('2026-09-03T09:00:00+08:00')
        : s.memory.now,
    );
    return s;
  }
  const s = structuredClone(previous);
  s.notice = '';
  switch (a.type) {
    case 'command':
      applyCommand(s, a);
      break;
    case 'start':
      start(s, a.kind, a.id, a.periodEnd);
      break;
    case 'memory':
      s.memory = memoryReducer(s.memory, a.action);
      break;
    case 'workspace-feedback': {
      if (taskFor(s, a.taskId) && a.text.trim()) {
        const messageId = say(s, a.taskId, 'user', a.text.trim());
        (s.workspaceFeedback ||= []).push({taskId:a.taskId,messageId,annotations:a.annotations || []});
        say(s, a.taskId, 'assistant', '已收到这些标注意见，来源和定位已保留在本次对话中。');
      }
      break;
    }
    case 'say': {
      const f = s.flows[a.taskId];
      if (!f) {
        s.memory = memoryReducer(s.memory, {
          type: 'message',
          taskId: a.taskId,
          text: a.text,
        });
        break;
      }
      if (f.stopped) {
        s.notice = '任务已暂停，请恢复后继续。输入草稿已保留。';
        break;
      }
      if (f.historical || f.stage === 'complete') {
        // Continue the same conversation; past operations and their authorizations remain evidence only.
        s.memory = memoryReducer(s.memory, {
          type: 'message',
          taskId: a.taskId,
          text: a.text,
        });
        taskFor(s, a.taskId).draftText = '';
        break;
      }
      say(s, f.id, 'user', a.text);
      taskFor(s, f.id).draftText = '';
      if (f.kind === 'payment' && f.stage === 'findings') {
        const p = extractMethod(a.text);
        if (p) {
          f.candidate = p;
          say(
            s,
            f.id,
            'assistant',
            '我已把你的指导整理为一条程序记忆候选。请核对下面的方法与例外；保存后可以预览共享内容并贡献给组织。',
          );
          workPoint(
            s,
            f.id,
            '用户指导支付备注核对，要求结合真实业务材料。',
            'requirement',
          );
        } else
          say(
            s,
            f.id,
            'assistant',
            '已记录补充。请说明核对步骤和例外；如果不需要保存方法，可以直接确认疑点处理意见。',
          );
      } else if (
        f.kind === 'maintenance' &&
        f.stage === 'manual' &&
        /已.*提交|提交.*完成/.test(a.text) &&
        !/未|没有|还没|尚未/.test(a.text)
      ) {
        f.submission = 'user-reported';
        f.stage = 'tracking';
        f.status = '待决定反馈追踪';
        say(
          s,
          f.id,
          'assistant',
          '已记录你告知的手动提交情况。是否为这个项目创建审核反馈追踪？收到反馈时我会主动推送，解析原因并给出修改清单和建议。',
        );
        workPoint(
          s,
          f.id,
          '本人告知已在项管平台手动提交，未取得系统提交回执。',
          'result',
        );
      } else if (
        f.kind === 'maintenance' &&
        f.stage === 'guide' &&
        /怎么|如何|流程|申报/.test(a.text)
      )
        applyCommand(s, { type: 'command', taskId: f.id, cmd: 'guide' });
      else if (
        f.kind === 'maintenance' && f.stage === 'create' &&
        /开始|启动|按.*指引.*办理/.test(a.text) &&
        !/不|别|暂缓|等等|稍后|先问/.test(a.text)
      )
        applyCommand(s, { type: 'command', taskId: f.id, cmd: 'create-project' });
      else if (f.kind === 'consultation')
        consult(s, f.id, f.agentId || fiscalAgent, a.text);
      else
        say(
          s,
          f.id,
          'assistant',
          f.stage === 'guide'
            ? '这项工作可以请项目统筹处数字人提供办理指引，接着协助准备申报。'
            : '已记录你的补充，请按当前待办继续；需要改变材料时可在任务浏览器核对并修改。',
        );
      break;
    }
    case 'adopt':
      adopt(s, a.taskId);
      break;
    case 'cancel-pending': {
      const f = s.flows[a.taskId];
      if (f?.pending && !f.historical) {
        const op = f.operations.findLast(
          (o) => o.status === '待确认' && o.cmd === f.pending?.cmd,
        );
        if (op) {
          op.status = '已取消';
          op.detail = '本人取消，未执行该操作。';
        }
        f.pending = undefined;
        f.status = '等待本人操作';
        say(s, f.id, 'user', '取消本次操作。');
      }
      break;
    }
    case 'auth':
      Object.assign(s.auth[a.system], a.patch);
      break;
    case 'outcome':
      s.nextOutcome = a.value;
      break;
    case 'stop': {
      const f = s.flows[a.taskId];
      if (f) {
        f.stopped = a.stopped;
        say(
          s,
          f.id,
          'system',
          a.stopped
            ? '任务已暂停，停止发起后续操作；已发出请求仍按回执核实。'
            : '任务已恢复，下一次操作将重新检查授权。',
        );
      }
      break;
    }
    case 'create-skill': {
      const fields = [a.name, a.category, a.summary, a.instructions, a.publisher].map(value => value.trim());
      if (fields.some(value => !value)) break;
      const [name, category, summary, instructions, publisher] = fields;
      s.catalog.push({ id: nextId(s, 'custom-skill'), kind: 'Skill', name, category, summary, publisher, version: '1.0', owned: true, enabled: true, details: [instructions] });
      break;
    }
    case 'library-add-local': {
      const existing = s.library.personalItems.findIndex(
        (item) => item.id === a.item.id,
      );
      if (existing >= 0) s.library.personalItems[existing] = a.item;
      else s.library.personalItems.unshift(a.item);
      s.notice = `已加入本地资料：${a.item.name}。文件内容未上传。`;
      break;
    }
    case 'library-request-cloud': {
      const suffix =
        s.library.personalItems.filter(
          (item) => item.availability === 'pending',
        ).length + 1;
      s.library.personalItems.unshift({
        id: `cloud-request-${suffix}`,
        name: a.name,
        storage: 'cloud',
        itemType: '文件夹',
        format: '云端资料目录',
        location: `个人云空间 / ${a.location}`,
        source: '本人发起的云空间连接申请',
        modifiedAt: new Date(s.memory.now).toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          hour12: false,
        }),
        sizeLabel: '等待连接后读取',
        availability: 'pending',
        availabilityLabel: '等待授权',
        access: a.access,
        recentUses: [],
        boundaries: [
          '当前只记录了连接范围，未获得外部云空间授权。',
          '授权完成前不展示目录内容，也不能加入任务。',
        ],
      });
      s.notice =
        '已记录个人云空间连接申请，完成授权后才可使用。';
      break;
    }
    case 'catalog': {
      const c = s.catalog.find((x) => x.id === a.id);
      if (c) {
        if (a.owned !== undefined) c.owned = a.owned;
        if (a.enabled !== undefined) c.enabled = a.enabled;
      }
      break;
    }
    case 'automation': {
      const old = s.automations.findIndex((x) => x.id === a.item.id);
      if (old < 0) s.automations.push(a.item);
      else s.automations[old] = a.item;
      break;
    }
    case 'run-automation': {
      const c = s.automations.find((x) => x.id === a.id);
      if (!c || !c.enabled) {
        s.notice = '自动化已停用。';
        break;
      }
      if (c.kind === 'feedback') {
        s.notice = '等待项管平台反馈事件，无新反馈不会生成重复任务。';
        break;
      }
      const slot = a.slot || s.memory.now,
        key = iso(slot);
      if (c.evaluated.includes(key)) {
        s.notice = '该周期已运行，未重复创建。';
        break;
      }
      c.evaluated.push(key);
      const id = nextId(s, 'run');
      if (c.kind === 'payment') {
        start(s, 'payment', id, slot);
        applyCommand(s, { type: 'command', taskId: id, cmd: 'read-payments' });
        applyCommand(s, { type: 'command', taskId: id, cmd: 'review' });
      } else {
        s.memory = memoryReducer(s.memory, {
          type: 'new-task',
          id,
          text: c.prompt,
          refs: [],
        });
      }
      c.runs.unshift(id);
      break;
    }
    case 'tick': {
      s.memory = memoryReducer(s.memory, { type: 'tick', now: a.now });
      for (const c of s.automations) {
        if (!c.enabled || c.cadence === 'event') continue;
        const shape = {
          ...c,
          cadence: c.cadence,
          timezone: 'Asia/Shanghai',
        } as unknown as Schedule;
        const slot = dueSlot(shape, s.memory.now);
        if (
          slot &&
          slot >= Date.parse(c.createdAt) &&
          !c.evaluated.includes(iso(slot))
        )
          return workspaceReducer(s, {
            type: 'run-automation',
            id: c.id,
            slot,
          });
      }
      break;
    }
    case 'new-task': {
      s.memory = memoryReducer(s.memory, {
        type: 'new-task',
        id: a.id,
        text: a.text,
        refs: a.refs || [],
        settings: {
          contexts: a.settings,
          permissionMode: a.permissionMode,
          commandMode: a.commandMode,
        },
      });
      if (a.agentId) {
        const t = taskFor(s, a.id);
        t.messages = t.messages.filter((x) => x.role === 'user');
        s.flows[a.id] = {
          ...structuredClone(
            Object.values(s.flows)[0] || { project: projectDefaults },
          ),
          id: a.id,
          kind: 'consultation',
          stage: 'consult',
          status: '可继续咨询',
          source: '本人咨询 · 专业智能体',
          historical: false,
          stopped: false,
          version: 1,
          operations: [],
          artifactIds: [],
          decisions: [],
          findings: [],
          rulePassed: false,
          written: {},
          memoryId: undefined,
          contributionId: undefined,
          candidate: undefined,
          pending: undefined,
          assetIds: [],
          syncedIds: [],
          materialsVersion: 0,
          uploadedVersion: 0,
          submission: 'draft',
          tracking: undefined,
          agentId: a.agentId,
          folder: '',
        };
        consult(s, a.id, a.agentId, a.text);
      }
      break;
    }
    case 'annotate': {
      const art = s.artifacts[a.id];
      if (art && a.text.trim())
        art.annotations.push({ text: a.text.trim(), at: iso(s.memory.now) });
      break;
    }
    case 'folder':
      if (a.name.trim()) {
        if (!s.folders.includes(a.name.trim())) s.folders.push(a.name.trim());
        if (a.taskId) s.folderTasks[a.taskId] = a.name.trim();
      }
      break;
    case 'feedback': {
      const f = s.flows[a.taskId],
        c = s.automations.find((x) => x.id === f?.tracking);
      if (!f || !c?.enabled) {
        s.notice = '该项目尚未创建或已停用反馈追踪。';
        break;
      }
      if (
        !s.auth.pm.enabled ||
        !s.auth.pm.read ||
        !s.auth.pm.identity ||
        s.auth.pm.expires <= s.memory.now ||
        !s.catalog.find((x) => x.system === 'pm')?.enabled
      ) {
        s.notice = '项管平台读取授权失效，反馈尚未读取；恢复授权后可重新接收。';
        break;
      }
      if (s.feedbackIds.includes(a.eventId)) {
        s.notice = '该反馈已处理，无重复通知。';
        break;
      }
      s.feedbackIds.push(a.eventId);
      const id = nextId(s, 'feedback');
      s.memory = memoryReducer(s.memory, {
        type: 'new-task',
        id,
        text: '处理运维项目审核反馈',
        refs: [],
      });
      const t = taskFor(s, id);
      t.title = '运维申报审核反馈 · 待补充说明';
      t.messages = [];
      s.flows[id] = {
        ...structuredClone(f),
        id,
        kind: 'feedback',
        historical: false,
        stage: 'feedback',
        status: '等待本人处理',
        source: '项管平台 · 审核反馈',
        operations: [],
        artifactIds: [],
        decisions: [],
        pending: undefined,
      };
      if (!gate(s, s.flows[id], { type: 'command', taskId: id, cmd: 'read-feedback' })) break;
      say(
        s,
        id,
        'system',
        '项管平台反馈：请补充运维资产范围及重要程度说明，并完善服务保障内容。',
      );
      say(
        s,
        id,
        'assistant',
        '收到本项目的新反馈。\n\n原因解析：审核方需要更清晰的资产范围依据及服务保障安排。\n\n修改清单：\n1. 在方案“运维对象”章节逐项说明资产范围、数量和重要程度，并与平台清单核对。\n2. 补充巡检频次、故障响应、备份恢复及访问授权安排。\n3. 修改方案后核对材料版本，再由你决定重新提交。\n\n建议先核对数字资源系统当前资产记录，再修改方案。本次未修改材料、未重新提交，也未推定办理期限。',
      );
      artifact(
        s,
        s.flows[id],
        '审核反馈修改清单',
        t.messages.at(-1)!.text,
        '项管平台反馈 / 本次解析建议',
      );
      c.runs.unshift(id);
      workPoint(s, id, '收到审核反馈，列出修改清单和建议，等待本人修订。');
      s.notice =
        '收到运维项目审核反馈，已生成“运维申报审核反馈 · 待补充说明”任务。';
      break;
    }
    case 'notice':
      s.notice = a.text;
      break;
  }
  return s;
}
