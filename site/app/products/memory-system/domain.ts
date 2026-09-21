import {
  CASE_AS_OF,
  memoryCases,
  type MemoryCase,
  type MemoryKind,
} from '../../shared/story-corpus.ts';

export type MemoryStateLabel = MemoryCase['state'] | '已停用' | '已归档';
export type QualityState = '当前' | '待重算' | '降级可用' | '已失效';
export type RetentionState = '保留' | '归档' | '撤回' | '待删除';
export type AutomationLevel =
  | 'A 自动维护'
  | 'B 自动继承'
  | 'C 有界试用'
  | 'D 业务判断';

export type ManagedMemory = Omit<MemoryCase, 'state'> & {
  state: MemoryStateLabel;
  quality: QualityState;
  retention: RetentionState;
  automation: AutomationLevel;
  protected: boolean;
  protectedReason?: string;
  effect: string;
  nextAction: string;
  reminder?: string;
  contribution?: '未贡献' | '待组织评测' | '已有组织版本';
};

export type MemorySource = {
  id: string;
  name: string;
  category: string;
  authority: string;
  watermark: string;
  status: '同步正常' | '存在更新' | '连接异常' | '权限已收缩';
  scope: string;
  affected: string[];
};

export type AccessGrant = {
  id: string;
  ai: string;
  purpose: string;
  kinds: MemoryKind[];
  scope: string;
  expires: string;
  lastUsed: string;
  status: '有效' | '已撤销' | '已到期';
  storyIds?: string[];
};

export type MemoryCall = {
  id: string;
  ai: string;
  purpose: string;
  time: string;
  result: '已提供' | '已阻断' | '部分提供';
  evidence: string;
  coverage: string;
  storyId?: string;
};

export type MaintenanceJob = {
  id: string;
  name: string;
  type: '采集' | '整合' | '压缩' | '冷热迁移' | '纠错重算' | '索引更新';
  status: '已完成' | '运行中' | '待执行' | '已降级' | '失败';
  affected: number;
  updatedAt: string;
  result: string;
  retryable: boolean;
};

export type MemoryIssue = {
  id: string;
  level: '需要本人判断' | '系统处理中' | '已降级';
  title: string;
  reason: string;
  impact: string;
  status: '待处理' | '处理中' | '已解决' | '保留待核';
  related: string[];
};

export type AuditEntry = {
  id: string;
  action: string;
  object: string;
  result: string;
  time: string;
  actor: '本人' | '系统自动维护' | '权威来源';
  storyId?: string;
};

export type ContributionSnapshot = {
  id: string;
  personalMemoryId: string;
  personalVersion: string;
  title: string;
  createdAt: string;
  status: '待组织评测' | '已形成组织版本';
  organizationMemoryId?: string;
};

export type MemorySystemState = {
  memories: ManagedMemory[];
  sources: MemorySource[];
  grants: AccessGrant[];
  calls: MemoryCall[];
  jobs: MaintenanceJob[];
  issues: MemoryIssue[];
  audit: AuditEntry[];
  contributions: ContributionSnapshot[];
  notice?: string;
  meetingPackGenerated: boolean;
  permissionPropagation: boolean;
  revision: number;
};

const KIND_DEFAULTS: Record<
  MemoryKind,
  Pick<ManagedMemory, 'automation' | 'effect' | 'nextAction'>
> = {
  M1: {
    automation: 'A 自动维护',
    effect: '支持从正确断点恢复当前工作。',
    nextAction: '核对阻塞与下一步，必要时返回原任务。',
  },
  M2: {
    automation: 'B 自动继承',
    effect: '为当前任务提供有来源、带有效期的解释。',
    nextAction: '来源变化时比较版本，个人纠正不改写权威事实。',
  },
  M3: {
    automation: 'C 有界试用',
    effect: '复用本人已经验证的检查步骤与方法。',
    nextAction: '可编辑、停用或提交不可变快照供组织评测。',
  },
  M4: {
    automation: 'A 自动维护',
    effect: '保留当时发生的经过、决定与证据语境。',
    nextAction: '补充说明或纠正关联，历史事件本身不覆盖。',
  },
  M5: {
    automation: 'B 自动继承',
    effect: '持续跟踪已有依据的责任、期限与提醒。',
    nextAction: '个人可调提醒；正式责任变化回到原流程确认。',
  },
  M6: {
    automation: 'B 自动继承',
    effect: '在本人当前权限内使用组织经验和职责规则。',
    nextAction: '只可使用、反馈或申请权限，不能直接修改。',
  },
};

function decorateMemory(memory: MemoryCase): ManagedMemory {
  const protectedMemory =
    memory.kind === 'M5' ||
    memory.kind === 'M6' ||
    (memory.kind === 'M1' && memory.state !== '已替代');
  return {
    ...memory,
    ...KIND_DEFAULTS[memory.kind],
    quality: memory.state === '已替代' ? '已失效' : '当前',
    retention: memory.state === '已替代' ? '归档' : '保留',
    protected: protectedMemory,
    protectedReason:
      memory.kind === 'M5'
        ? '未完成承诺不能因时间或降温退出活跃集合'
        : memory.kind === 'M6'
          ? '当前有效权限始终参与读取校验'
          : protectedMemory
            ? '当前工作恢复所需'
            : undefined,
    reminder: memory.kind === 'M5' ? '到期前1个工作日提醒' : undefined,
    contribution:
      memory.kind === 'M3'
        ? memory.id === 'fiscal-personal'
          ? '已有组织版本'
          : '未贡献'
        : undefined,
  };
}

const initialSources: MemorySource[] = [
  {
    id: 'source-workbench',
    name: '超级智能体任务与成果',
    category: '本人工作台',
    authority: '本人任务与工作稿',
    watermark: CASE_AS_OF,
    status: '同步正常',
    scope: '本人参与的任务、确认和成果版本',
    affected: ['m13-working', 'm13-method', 'ops-working', 'data-method'],
  },
  {
    id: 'source-meeting',
    name: '党组会纪要与落实记录',
    category: '授权业务来源',
    authority: '会议纪要与责任处室更正记录',
    watermark: '2026-09-25 16:40',
    status: '存在更新',
    scope: '第13—14次会议本人获准范围',
    affected: [
      'm13-working',
      'm13-correction',
      'm13-episode',
      'm13-commitment',
      'm13-old',
    ],
  },
  {
    id: 'source-fiscal',
    name: '财政支付审查记录',
    category: '本人明确使用',
    authority: '审查对话与组织经验发布记录',
    watermark: '2026-09-08 09:00',
    status: '同步正常',
    scope: '本人财政核查辅助',
    affected: ['fiscal-term', 'fiscal-personal', 'fiscal-org'],
  },
  {
    id: 'source-identity',
    name: '统一身份与业务授权',
    category: '权威权限来源',
    authority: '当前身份、组织和原始业务权限',
    watermark: '2026-09-25 17:20',
    status: '同步正常',
    scope: '读取时实时复验，不保存为个人自授权限',
    affected: ['fiscal-org', 'role-consult', 'm13-commitment'],
  },
];

const initialGrants: AccessGrant[] = [
  {
    id: 'grant-superagent',
    ai: '深圳政务超级智能体',
    purpose: '本人发起的日常任务续接与材料处理',
    kinds: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
    scope: '每次任务按最小必要范围组装证据包',
    expires: '持续有效，可随时撤销',
    lastUsed: '2026-09-25 17:18',
    status: '有效',
    storyIds: [
      'policy-consultation',
      'training-speech',
      'party-meeting',
      'annual-brainstorm',
      'maintenance-application',
    ],
  },
  {
    id: 'grant-meeting',
    ai: '党组会筹备场景工作智能体',
    purpose: '第14次会议材料准备与落实跟踪',
    kinds: ['M1', 'M2', 'M4', 'M5'],
    scope: '第13—14次会议；不含其他个人事项',
    expires: '2026-09-30 18:00',
    lastUsed: '2026-09-25 16:42',
    status: '有效',
    storyIds: ['party-meeting'],
  },
  {
    id: 'grant-fiscal',
    ai: '财政资金监管岗位',
    purpose: '支付用途说明核对与办理咨询',
    kinds: ['M2', 'M3', 'M6'],
    scope: '财政支付审查；只提供脱敏方法与有效解释',
    expires: '2026-12-31 23:59',
    lastUsed: '2026-09-08 09:18',
    status: '有效',
    storyIds: ['maintenance-application'],
  },
];

const initialCalls: MemoryCall[] = [
  {
    id: 'call-1',
    ai: '党组会筹备场景工作智能体',
    purpose: '恢复第13次会议当前有效背景',
    time: '2026-09-25 16:42',
    result: '已提供',
    evidence: '5条记忆、4个来源锚点、1项明确缺口',
    coverage: '只包含第13—14次会议授权范围',
    storyId: 'party-meeting',
  },
  {
    id: 'call-2',
    ai: '深圳政务超级智能体',
    purpose: '继续运维申报反馈处理',
    time: '2026-09-25 09:20',
    result: '部分提供',
    evidence: '工作状态与个人方法；正式受理状态仍待源核验',
    coverage: '运维申报本人工作范围',
    storyId: 'maintenance-application',
  },
  {
    id: 'call-3',
    ai: '财政资金监管岗位',
    purpose: '核对支付备注业务语境',
    time: '2026-09-08 09:18',
    result: '已提供',
    evidence: 'M2术语解释、M3组织方法、来源版本',
    coverage: '不含个人原始单据',
  },
  {
    id: 'call-policy-consultation',
    ai: '深圳政务超级智能体',
    purpose: '形成惠企咨询专业答复（固定合成快照）',
    time: '2026-09-21 10:04',
    result: '已提供',
    evidence: '4项最小必要合成依据；无外部系统调用、无资格或金额结论',
    coverage: '仅本地案例的窗口答复范围',
    storyId: 'policy-consultation',
  },
  {
    id: 'call-training-speech',
    ai: '深圳政务超级智能体',
    purpose: '组织培训讲稿送审工作稿（固定合成快照）',
    time: '2026-09-21 10:18',
    result: '部分提供',
    evidence: '旧稿沿革、授课方法、当前口径和待核提醒；未核成效未进入正文',
    coverage: '仅讲稿送审准备，不含组织发布',
    storyId: 'training-speech',
  },
  {
    id: 'call-annual-brainstorm',
    ai: '深圳政务超级智能体',
    purpose: '工作报告脑暴的依据整理（固定合成快照）',
    time: '2026-09-21 10:26',
    result: '部分提供',
    evidence: '仅返回目标、沿革和审稿方法摘要；指标与案例仍待核',
    coverage: '报告工作稿范围，不含正式发布',
    storyId: 'annual-brainstorm',
  },
];

const initialJobs: MaintenanceJob[] = [
  {
    id: 'job-collect',
    name: '任务与成果增量采集',
    type: '采集',
    status: '已完成',
    affected: 7,
    updatedAt: '2026-09-25 17:26',
    result: '新增2条事件；5条重复记录自动去重',
    retryable: false,
  },
  {
    id: 'job-current',
    name: '党组会当前有效视图更新',
    type: '纠错重算',
    status: '已完成',
    affected: 5,
    updatedAt: '2026-09-25 16:45',
    result: '旧整体完成判断退出当前视图；未完成承诺保持活跃',
    retryable: false,
  },
  {
    id: 'job-tier',
    name: '冷热数据自动处理',
    type: '冷热迁移',
    status: '已完成',
    affected: 4,
    updatedAt: '2026-09-25 02:10',
    result: '3条低频经历转温；1条旧判断转冷；保护对象未迁移',
    retryable: false,
  },
  {
    id: 'job-summary',
    name: '运维申报阶段摘要更新',
    type: '压缩',
    status: '已降级',
    affected: 3,
    updatedAt: '2026-09-25 09:24',
    result: '摘要遗漏“源系统回执待核”，已拒绝发布并降级到原文',
    retryable: true,
  },
  {
    id: 'job-index',
    name: '个人记忆索引增量更新',
    type: '索引更新',
    status: '已完成',
    affected: 11,
    updatedAt: '2026-09-25 17:27',
    result: '当前索引水位与内容、权限版本一致',
    retryable: false,
  },
];

const initialIssues: MemoryIssue[] = [
  {
    id: 'issue-source-correction',
    level: '系统处理中',
    title: '会议完成状态的来源更正已传播',
    reason: '责任处室补充说明“技术验收完成”不代表手续材料齐套。',
    impact: '5条相关记忆已重算，旧判断保留审计但不再用于续接。',
    status: '已解决',
    related: ['m13-working', 'm13-correction', 'm13-old'],
  },
  {
    id: 'issue-summary-gap',
    level: '已降级',
    title: '运维阶段摘要遗漏回执限制',
    reason: '自动摘要未保留“本人告知提交与源系统受理不同”的限定。',
    impact: '候选摘要拒绝发布，当前查询降级到结构化状态和来源原文。',
    status: '待处理',
    related: ['ops-working'],
  },
  {
    id: 'issue-metric',
    level: '需要本人判断',
    title: '会议材料中的完成率仍有两个口径',
    reason: '85%与72%来自不同统计时点，权威来源尚未统一。',
    impact: '第14次材料保持“待责任处室核实”，系统不自动选取一个数字。',
    status: '保留待核',
    related: ['m13-working'],
  },
];

const initialAudit: AuditEntry[] = [
  {
    id: 'audit-1',
    action: '纠错传播',
    object: '党组会完成状态',
    result: '5条派生记忆重算，旧判断退出当前视图',
    time: '2026-09-25 16:45',
    actor: '系统自动维护',
    storyId: 'party-meeting',
  },
  {
    id: 'audit-2',
    action: '冷热迁移',
    object: '低频经历与旧版本',
    result: '3条转温、1条转冷；保护对象未迁移',
    time: '2026-09-25 02:10',
    actor: '系统自动维护',
    storyId: 'party-meeting',
  },
  {
    id: 'audit-3',
    action: '组织经验发布结果同步',
    object: '支付用途备注核对方法',
    result: '组织v1.0可用；个人v2保持独立',
    time: '2026-09-05 15:30',
    actor: '权威来源',
  },
  {
    id: 'audit-policy-consultation',
    action: '固定案例依据调用',
    object: '惠企政策咨询',
    result: '仅返回最小必要合成证据；未调用外部系统，未形成正式结论',
    time: '2026-09-21 10:04',
    actor: '系统自动维护',
    storyId: 'policy-consultation',
  },
  {
    id: 'audit-training-speech',
    action: '送审工作稿留痕',
    object: '局长培训讲稿',
    result: '旧稿与当前口径分开；待核项保留，未发布组织口径',
    time: '2026-09-21 10:18',
    actor: '系统自动维护',
    storyId: 'training-speech',
  },
  {
    id: 'audit-annual-brainstorm',
    action: '脑暴依据包生成',
    object: '工作报告脑暴',
    result: '仅提供目标、沿革与审稿方法摘要；不把待核事实写成结论',
    time: '2026-09-21 10:26',
    actor: '系统自动维护',
    storyId: 'annual-brainstorm',
  },
  {
    id: 'audit-maintenance-application',
    action: '历史申报续办边界核查',
    object: '财政系统运维费用申报',
    result: '历史手动提交与新反馈分开；无源系统回执不标记受理成功',
    time: '2026-09-21 10:34',
    actor: '系统自动维护',
    storyId: 'maintenance-application',
  },
];

const initialContributions: ContributionSnapshot[] = [
  {
    id: 'snapshot-fiscal-personal-v1',
    personalMemoryId: 'fiscal-personal',
    personalVersion: '1',
    title: '支付用途备注核对方法',
    createdAt: '2026-09-05 14:10',
    status: '已形成组织版本',
    organizationMemoryId: 'fiscal-org',
  },
];

export function createInitialMemoryState(): MemorySystemState {
  return {
    memories: memoryCases.map(decorateMemory),
    sources: structuredClone(initialSources),
    grants: structuredClone(initialGrants),
    calls: structuredClone(initialCalls),
    jobs: structuredClone(initialJobs),
    issues: structuredClone(initialIssues),
    audit: structuredClone(initialAudit),
    contributions: structuredClone(initialContributions),
    meetingPackGenerated: false,
    permissionPropagation: false,
    revision: 1,
  };
}

export type MemoryAction =
  | { type: 'clear-notice' }
  | { type: 'reset' }
  | { type: 'add'; text: string; kind: MemoryKind }
  | { type: 'correct'; id: string; text?: string }
  | { type: 'toggle-active'; id: string }
  | { type: 'archive'; id: string }
  | { type: 'withdraw'; id: string }
  | { type: 'restore'; id: string }
  | { type: 'delete-derived'; id: string }
  | { type: 'contribute'; id: string }
  | { type: 'feedback'; id: string }
  | { type: 'complete-commitment'; id: string }
  | { type: 'update-reminder'; id: string }
  | { type: 'rebuild'; id: string }
  | { type: 'retry-job'; id: string }
  | { type: 'resolve-issue'; id: string }
  | { type: 'revoke-grant'; id: string }
  | { type: 'adjust-grant'; id: string }
  | { type: 'generate-meeting-pack' }
  | { type: 'run-temperature' }
  | { type: 'propagate-source-revocation' };

function audit(
  state: MemorySystemState,
  action: string,
  object: string,
  result: string,
  actor: AuditEntry['actor'] = '本人',
): AuditEntry[] {
  return [
    {
      id: `audit-${state.revision + 10}`,
      action,
      object,
      result,
      time: `2026-09-25 17:${String(30 + (state.revision % 20)).padStart(2, '0')}`,
      actor,
    },
    ...state.audit,
  ];
}

function updateMemory(
  state: MemorySystemState,
  id: string,
  updater: (memory: ManagedMemory) => ManagedMemory,
  notice: string,
  auditAction: string,
): MemorySystemState {
  const target = state.memories.find((memory) => memory.id === id);
  if (!target) return { ...state, notice: '未找到对应记忆。' };
  const updated = updater(target);
  return {
    ...state,
    memories: state.memories.map((memory) =>
      memory.id === id ? updated : memory,
    ),
    audit: audit(state, auditAction, target.title, notice),
    notice,
    revision: state.revision + 1,
  };
}

export function inferMemoryKind(text: string): MemoryKind {
  if (/截止|提醒|到期|承诺|跟踪/.test(text)) return 'M5';
  if (/步骤|方法|清单|流程|先.*再/.test(text)) return 'M3';
  if (/会议|发生|当时|经过|反馈/.test(text)) return 'M4';
  if (/权限|岗位|职责|组织|授权/.test(text)) return 'M6';
  if (/规则|政策|术语|口径|解释/.test(text)) return 'M2';
  return 'M1';
}

export function memoryReducer(
  state: MemorySystemState,
  action: MemoryAction,
): MemorySystemState {
  if (action.type === 'reset') return createInitialMemoryState();
  if (action.type === 'clear-notice') return { ...state, notice: undefined };
  if (action.type === 'add') {
    const id = `personal-${state.revision}`;
    const next: ManagedMemory = {
      id,
      kind: action.kind,
      title: action.text.slice(0, 22) || '本人新增记忆',
      content: action.text,
      owner: '杨XX',
      scope: '本人私有；仅在具体任务授权后调用',
      state: '有效',
      tier: '热',
      version: '1',
      taskId: 'party-history',
      source: '本人主动补充 / 自然语言入口',
      evidence: '由本人明确输入，未自动升级为组织事实或正式业务记录。',
      date: '2026-09-25',
      lastUsed: '尚未调用',
      related: [],
      history: [
        {
          version: '1',
          date: '2026-09-25',
          reason: '本人明确新增',
          content: action.text,
        },
      ],
      ...KIND_DEFAULTS[action.kind],
      quality: '当前',
      retention: '保留',
      protected: action.kind === 'M1' || action.kind === 'M5',
      protectedReason:
        action.kind === 'M1'
          ? '当前工作恢复所需'
          : action.kind === 'M5'
            ? '未完成承诺不能自动降温'
            : undefined,
      reminder: action.kind === 'M5' ? '到期前1个工作日提醒' : undefined,
      contribution: action.kind === 'M3' ? '未贡献' : undefined,
    };
    const notice = `已保存为${action.kind}，分类和范围可继续纠正。`;
    return {
      ...state,
      memories: [next, ...state.memories],
      audit: audit(state, '新增个人记忆', next.title, notice),
      notice,
      revision: state.revision + 1,
    };
  }
  if (action.type === 'correct')
    return updateMemory(
      state,
      action.id,
      (memory) => {
        const version = String(Number.parseFloat(memory.version) + 1);
        const content =
          action.text || `${memory.content}（本人已核对并补充适用边界）`;
        return {
          ...memory,
          content,
          version,
          state: '有效',
          quality: '当前',
          history: [
            ...memory.history,
            {
              version,
              date: '2026-09-25',
              reason: '本人纠正形成新版本',
              content,
            },
          ],
        };
      },
      '已生成新版本，旧版本和来源证据仍保留。',
      '纠正记忆',
    );
  if (action.type === 'toggle-active')
    return updateMemory(
      state,
      action.id,
      (memory) => ({
        ...memory,
        state: memory.state === '已停用' ? '有效' : '已停用',
        quality: memory.state === '已停用' ? '当前' : '已失效',
      }),
      state.memories.find((m) => m.id === action.id)?.state === '已停用'
        ? '已恢复后续调用。'
        : '已停止后续调用，历史证据仍保留。',
      '启停记忆',
    );
  if (action.type === 'archive')
    if (state.memories.find((memory) => memory.id === action.id)?.protected)
      return {
        ...state,
        notice: '该对象受生命周期保护，不能因冷热处理或时间自动归档。',
      };
    else
      return updateMemory(
        state,
        action.id,
        (memory) => ({
          ...memory,
          state: '已归档',
          retention: '归档',
          tier: memory.protected ? memory.tier : '冷',
        }),
        '已归档；仍可恢复，不等于删除或撤回。',
        '归档记忆',
      );
  if (action.type === 'withdraw')
    return updateMemory(
      state,
      action.id,
      (memory) => ({
        ...memory,
        state: '已停用',
        retention: '撤回',
        quality: '已失效',
      }),
      '已撤回当前个人发布版本；后续不再读取，历史版本和来源仍可审计。',
      '撤回个人版本',
    );
  if (action.type === 'restore')
    return updateMemory(
      state,
      action.id,
      (memory) => ({
        ...memory,
        state: memory.state === '已替代' ? '已替代' : '有效',
        retention: memory.state === '已替代' ? '归档' : '保留',
        tier: memory.state === '已替代' ? '冷' : '温',
      }),
      '已恢复到按需调用层；有效性与权限仍独立校验。',
      '恢复记忆',
    );
  if (action.type === 'delete-derived')
    return updateMemory(
      state,
      action.id,
      (memory) => ({
        ...memory,
        state: '已停用',
        retention: '待删除',
        quality: '已失效',
        content: '个人派生内容已进入删除流程；来源引用仅保留必要审计标识。',
      }),
      '个人派生内容已停止读取并进入删除流程，源系统原始记录不受影响。',
      '删除个人派生内容',
    );
  if (action.type === 'contribute') {
    const target = state.memories.find((memory) => memory.id === action.id);
    if (!target) return state;
    if (
      state.contributions.some(
        (snapshot) =>
          snapshot.personalMemoryId === target.id &&
          snapshot.personalVersion === target.version,
      )
    )
      return { ...state, notice: '当前个人版本已有独立贡献快照。' };
    const notice =
      '已生成当前个人版本的不可变快照；后续修改不会覆盖组织评测对象。';
    return {
      ...state,
      memories: state.memories.map((memory) =>
        memory.id === action.id
          ? { ...memory, contribution: '待组织评测' as const }
          : memory,
      ),
      contributions: [
        {
          id: `snapshot-${target.id}-v${target.version}`,
          personalMemoryId: target.id,
          personalVersion: target.version,
          title: target.title,
          createdAt: '2026-09-25 17:39',
          status: '待组织评测',
        },
        ...state.contributions,
      ],
      audit: audit(state, '贡献个人方法快照', target.title, notice),
      notice,
      revision: state.revision + 1,
    };
  }
  if (action.type === 'feedback') {
    const target = state.memories.find((memory) => memory.id === action.id);
    if (!target) return state;
    return {
      ...state,
      audit: audit(
        state,
        '提交组织记忆反馈',
        target.title,
        '已提交纠错线索；组织版本和权限未被个人直接修改',
      ),
      notice: '反馈已提交，组织版本保持不变，等待有权流程处理。',
      revision: state.revision + 1,
    };
  }
  if (action.type === 'complete-commitment')
    return updateMemory(
      state,
      action.id,
      (memory) => ({
        ...memory,
        content: `${memory.content} 本人已标记完成，等待来源回执核验。`,
        quality: '待重算',
        protected: true,
        protectedReason: '本人完成标记尚未取得权威来源回执',
      }),
      '已记录本人完成标记；未取得源系统回执前不会退出活跃集合。',
      '更新承诺状态',
    );
  if (action.type === 'update-reminder')
    return updateMemory(
      state,
      action.id,
      (memory) => ({
        ...memory,
        reminder:
          memory.reminder === '到期前1个工作日提醒'
            ? '到期前2个工作日提醒'
            : '到期前1个工作日提醒',
      }),
      '已更新个人提醒偏好，不改变正式责任与期限。',
      '调整提醒',
    );
  if (action.type === 'rebuild') {
    const target = state.memories.find((memory) => memory.id === action.id);
    if (!target) return state;
    return {
      ...state,
      memories: state.memories.map((memory) =>
        memory.id === action.id
          ? { ...memory, quality: '当前' as const }
          : memory,
      ),
      jobs: [
        {
          id: `job-rebuild-${state.revision}`,
          name: `${target.title}局部重算`,
          type: '纠错重算',
          status: '已完成',
          affected: 1,
          updatedAt: '2026-09-25 17:38',
          result: '固定输入版本校验通过，当前视图和索引已更新',
          retryable: false,
        },
        ...state.jobs,
      ],
      audit: audit(
        state,
        '局部重算',
        target.title,
        '当前视图和索引已更新',
        '系统自动维护',
      ),
      notice: '局部重算完成，未受影响的记忆保持原版本。',
      revision: state.revision + 1,
    };
  }
  if (action.type === 'retry-job') {
    const target = state.jobs.find((job) => job.id === action.id);
    if (!target) return state;
    return {
      ...state,
      jobs: state.jobs.map((job) =>
        job.id === action.id
          ? {
              ...job,
              status: '已完成' as const,
              updatedAt: '2026-09-25 17:40',
              result: '使用结构化必须保留清单重新生成，质量闸门通过',
              retryable: false,
            }
          : job,
      ),
      issues: state.issues.map((issue) =>
        issue.id === 'issue-summary-gap'
          ? { ...issue, status: '已解决' as const }
          : issue,
      ),
      audit: audit(
        state,
        '安全重试',
        target.name,
        '质量闸门通过并发布新摘要',
        '系统自动维护',
      ),
      notice: '安全重试完成，新摘要已保留回执限制。',
      revision: state.revision + 1,
    };
  }
  if (action.type === 'resolve-issue') {
    const target = state.issues.find((issue) => issue.id === action.id);
    if (!target) return state;
    return {
      ...state,
      issues: state.issues.map((issue) =>
        issue.id === action.id
          ? { ...issue, status: '保留待核' as const }
          : issue,
      ),
      audit: audit(
        state,
        '处理异常',
        target.title,
        '保留待核，不自动选择未经统一的业务口径',
      ),
      notice: '已保留待核；相关任务会继续显示缺口。',
      revision: state.revision + 1,
    };
  }
  if (action.type === 'adjust-grant') {
    const target = state.grants.find((grant) => grant.id === action.id);
    if (!target) return state;
    const hasM4 = target.kinds.includes('M4');
    return {
      ...state,
      grants: state.grants.map((grant) =>
        grant.id === action.id
          ? {
              ...grant,
              kinds: hasM4
                ? grant.kinds.filter((kind) => kind !== 'M4')
                : [...grant.kinds, 'M4'],
            }
          : grant,
      ),
      audit: audit(
        state,
        '调整AI调用范围',
        target.ai,
        hasM4 ? '已移除M4经历原文' : '已增加M4经历摘要',
      ),
      notice: hasM4
        ? '已移除M4经历原文，其他授权保持不变。'
        : '已增加M4经历摘要，仍按任务最小必要范围提供。',
      revision: state.revision + 1,
    };
  }
  if (action.type === 'revoke-grant') {
    const target = state.grants.find((grant) => grant.id === action.id);
    if (!target) return state;
    const restored = target.status === '已撤销';
    const nextStatus = restored ? '有效' : '已撤销';
    return {
      ...state,
      grants: state.grants.map((grant) =>
        grant.id === action.id ? { ...grant, status: nextStatus } : grant,
      ),
      calls: restored
        ? state.calls
        : [
            {
              id: `call-blocked-${state.revision}`,
              ai: target.ai,
              purpose: '撤权后的再次读取校验',
              time: '2026-09-25 17:42',
              result: '已阻断',
              evidence: '个人授权已撤销；未返回记忆正文或缓存内容',
              coverage: target.scope,
            },
            ...state.calls,
          ],
      audit: audit(
        state,
        restored ? '恢复AI调用授权' : '撤销AI调用授权',
        target.ai,
        restored
          ? '后续任务可重新按最小必要范围请求'
          : '后续读取立即阻断；历史调用保留审计',
      ),
      notice: restored
        ? '已恢复授权，后续仍会按当前任务重新校验。'
        : '授权已撤销；下一次读取已阻断，历史调用仍可审计。',
      permissionPropagation: restored ? state.permissionPropagation : true,
      revision: state.revision + 1,
    };
  }
  if (action.type === 'generate-meeting-pack') {
    const notice = '已生成第14次会议最小必要证据包，旧判断和无关记忆未进入。';
    return {
      ...state,
      meetingPackGenerated: true,
      calls: [
        {
          id: `call-meeting-${state.revision}`,
          ai: '党组会筹备场景工作智能体',
          purpose: '生成第14次会议最小必要证据包',
          time: '2026-09-25 17:44',
          result: '已提供',
          evidence: 'M1/M2/M3/M4/M5/M6各一项；4个来源锚点；1项待核缺口',
          coverage: '第13—14次会议本人获准范围',
        },
        ...state.calls,
      ],
      audit: audit(state, '生成证据包', '第14次党组会续接', notice),
      notice,
      revision: state.revision + 1,
    };
  }
  if (action.type === 'run-temperature') {
    const protectedBefore = state.memories
      .filter((memory) => memory.protected)
      .map((memory) => [memory.id, memory.tier] as const);
    const memories = state.memories.map((memory) => {
      if (memory.protected || memory.state === '已替代') return memory;
      if (memory.retention === '归档')
        return { ...memory, tier: '冷' as const };
      return {
        ...memory,
        tier:
          memory.lastUsed <= '2026-09-08' ? ('冷' as const) : ('温' as const),
      };
    });
    const protectedChanged = protectedBefore.some(([id, tier]) =>
      memories.some((memory) => memory.id === id && memory.tier !== tier),
    );
    const affected = memories.filter(
      (memory, index) => memory.tier !== state.memories[index].tier,
    ).length;
    const notice = `冷热自动评估完成：${affected}条迁移，保护对象${protectedChanged ? '异常变化' : '全部保持原层级'}。`;
    return {
      ...state,
      memories,
      jobs: [
        {
          id: `job-tier-${state.revision}`,
          name: '冷热数据自动处理',
          type: '冷热迁移',
          status: '已完成',
          affected,
          updatedAt: '2026-09-25 17:45',
          result: `${affected}条访问层级调整；当前工作、未完承诺和有效权限未迁移`,
          retryable: false,
        },
        ...state.jobs,
      ],
      audit: audit(
        state,
        '执行冷热自动评估',
        '个人记忆有效集合',
        notice,
        '系统自动维护',
      ),
      notice,
      revision: state.revision + 1,
    };
  }
  if (action.type === 'propagate-source-revocation') {
    const affected = new Set(['m13-episode', 'm13-correction']);
    const notice = '权威来源撤权已传播：当前视图收缩、缓存失效，历史审计保留。';
    return {
      ...state,
      sources: state.sources.map((source) =>
        source.id === 'source-meeting'
          ? { ...source, status: '权限已收缩' as const }
          : source,
      ),
      memories: state.memories.map((memory) =>
        affected.has(memory.id)
          ? {
              ...memory,
              quality: '已失效' as const,
              state: '已停用' as const,
              protected: true,
              protectedReason: '来源权限已收缩，历史仅保留不可读审计标识',
            }
          : memory,
      ),
      calls: [
        {
          id: `call-source-blocked-${state.revision}`,
          ai: '党组会筹备场景工作智能体',
          purpose: '读取已撤权会议证据',
          time: '2026-09-25 17:46',
          result: '已阻断',
          evidence: '读取前权限复验失败；缓存和派生可见范围已收缩',
          coverage: '不返回已撤权原文与摘要',
        },
        ...state.calls,
      ],
      jobs: [
        {
          id: `job-acl-${state.revision}`,
          name: '来源撤权影响传播',
          type: '纠错重算',
          status: '已完成',
          affected: affected.size,
          updatedAt: '2026-09-25 17:46',
          result: '当前视图收缩、缓存失效、后续调用阻断',
          retryable: false,
        },
        ...state.jobs,
      ],
      audit: audit(
        state,
        '来源权限变化传播',
        '党组会纪要与落实记录',
        notice,
        '权威来源',
      ),
      notice,
      permissionPropagation: true,
      revision: state.revision + 1,
    };
  }
  return state;
}

export const KIND_MANAGEMENT: Record<
  MemoryKind,
  {
    question: string;
    job: string;
    result: string;
    fields: string[];
    guardrail: string;
  }
> = {
  M1: {
    question: '现在做到哪里？',
    job: '恢复断点、核对阻塞、继续工作',
    result: '得到可恢复的当前状态与下一步',
    fields: ['当前目标', '步骤与阻塞', '下一步', '恢复来源'],
    guardrail: '不把工作记忆当作正式业务台账。',
  },
  M2: {
    question: '当前有效依据是什么？',
    job: '比较来源、版本、适用范围与冲突',
    result: '得到可追溯且带边界的当前解释',
    fields: ['事实或解释', '有效区间', '来源版本', '冲突与替代'],
    guardrail: '个人纠正不能改写权威来源。',
  },
  M3: {
    question: '这类工作应该怎样办？',
    job: '维护个人方法、试用结果与贡献快照',
    result: '得到可复用、可停用、可独立发布的方法',
    fields: ['适用场景', '步骤与检查', '例外', '验证与贡献'],
    guardrail: '单次成功不自动成为组织制度。',
  },
  M4: {
    question: '过去发生了什么？',
    job: '追溯事件、决定、结果与当时证据',
    result: '得到不覆盖历史的可核验时间线',
    fields: ['事件时间', '参与者', '决定与结果', '证据锚点'],
    guardrail: '补充说明通过新事件表达。',
  },
  M5: {
    question: '下一步何时由谁做？',
    job: '跟踪已有承诺、期限、条件和提醒',
    result: '得到不会因时间或降温丢失的承诺视图',
    fields: ['责任来源', '期限', '触发条件', '完成依据'],
    guardrail: '系统不能替任何人新作正式承诺。',
  },
  M6: {
    question: '谁能看、谁来办、谁确认？',
    job: '使用本人获准的组织经验与职责规则',
    result: '得到符合当前权限的组织记忆',
    fields: ['组织所有者', '适用岗位', '权限与有效期', '反馈入口'],
    guardrail: '个人无权修改组织发布版本。',
  },
};
