export type ModelCategory = '通用' | '推理' | '多模态' | '高效';
export type ModelStatus = 'available' | 'evaluating' | 'unavailable';

export type RoutingLevel = 'L1' | 'L2' | 'L3';
export type DeterministicTaskType =
  | '规则判断'
  | '缓存复用'
  | '确定性检索'
  | '格式校验';
export type AtomicTaskType =
  | '分类'
  | '抽取'
  | '摘要'
  | '整理'
  | '理解'
  | '起草'
  | '比对'
  | '分析'
  | '深度研究'
  | '复杂推理'
  | '全局规划';

export type ModelCatalogItem = {
  id: string;
  name: string;
  maker: string;
  initials: string;
  description: string;
  categories: ModelCategory[];
  scale: string;
  status: ModelStatus;
  recommendedLevels: RoutingLevel[];
};

export type ModelMode = { type: 'smart' } | { type: 'fixed'; modelId: string };

export type RoutingConfig = Record<
  RoutingLevel,
  {
    primaryModelId: string;
    fallbackModelId: string;
    autoUpgrade: boolean;
  }
>;

export type RoutingRule = {
  taskType: AtomicTaskType;
  level: RoutingLevel;
  primaryModelId: string;
  fallbackModelId: string;
  scope: string;
  roleScope: string;
  autoUpgrade: boolean;
  upgradeConditions: string[];
  contextLimit: number;
  stepTokenLimit: number;
  failureAction: '使用备用模型' | '暂停并请求人工决定';
};

export type RoutingPolicySnapshot = {
  id: string;
  version: string;
  status: '已生效' | '候选' | '待评测' | '评测通过' | '试用中' | '已回退';
  effectiveAt: string;
  previousVersion: string;
  evaluationStatus: string;
  rules: RoutingRule[];
};

export type RoutingDecision = {
  taskType: AtomicTaskType;
  level: RoutingLevel;
  modelId: string;
  policyVersion: string;
  reason: string;
  upgradedFrom?: RoutingLevel;
  fallbackUsed?: boolean;
};

export type EvaluationType =
  | '模型准入'
  | '能力质量与安全'
  | '路由回归'
  | '改进效果';

export type EvaluationRun = {
  id: string;
  name: string;
  type: EvaluationType;
  target: string;
  baselineVersion: string;
  candidateVersion: string;
  sampleSet: string;
  status: '待执行' | '评测中' | '通过' | '未通过' | '待复测';
  qualityGate: string;
  safetyGate: string;
  tokenMethod: string;
  evidence: string;
};

export const atomicTaskGroups: Array<{
  level: RoutingLevel;
  name: string;
  tasks: AtomicTaskType[];
}> = [
  { level: 'L1', name: '轻度任务', tasks: ['分类', '抽取', '摘要', '整理'] },
  { level: 'L2', name: '中度任务', tasks: ['理解', '起草', '比对', '分析'] },
  {
    level: 'L3',
    name: '重度任务',
    tasks: ['深度研究', '复杂推理', '全局规划'],
  },
];

export const atomicTaskTypes = atomicTaskGroups.flatMap((group) => group.tasks);

export const levelForTask = (taskType: AtomicTaskType): RoutingLevel =>
  atomicTaskGroups.find((group) => group.tasks.includes(taskType))!.level;

export const modelCatalog: ModelCatalogItem[] = [
  {
    id: 'qwen-3-8-2t',
    name: 'Qwen3.8-2.4T-A95B',
    maker: '通义千问',
    initials: 'Q',
    description: '超大规模通用与复杂任务推理',
    categories: ['通用', '推理'],
    scale: '旗舰',
    status: 'available',
    recommendedLevels: ['L3'],
  },
  {
    id: 'deepseek-v4-pro',
    name: 'DeepSeek-V4-Pro-0813',
    maker: '深度求索',
    initials: 'D',
    description: '复杂推理、规划与长链路执行',
    categories: ['推理', '通用'],
    scale: '旗舰',
    status: 'available',
    recommendedLevels: ['L3'],
  },
  {
    id: 'glm-5-3',
    name: 'GLM-5.3',
    maker: '智谱',
    initials: 'G',
    description: '通用办公、工具调用与智能体任务',
    categories: ['通用', '推理'],
    scale: '旗舰',
    status: 'available',
    recommendedLevels: ['L3'],
  },
  {
    id: 'kimi-k3',
    name: 'Kimi K3',
    maker: '月之暗面',
    initials: 'K',
    description: '长文本理解、研究与复杂信息整合',
    categories: ['通用', '推理'],
    scale: '旗舰',
    status: 'available',
    recommendedLevels: ['L3'],
  },
  {
    id: 'hunyuan-hy4',
    name: 'Hy4 preview',
    maker: '腾讯混元',
    initials: 'H',
    description: '综合推理与多任务协同预览模型',
    categories: ['通用', '推理'],
    scale: '旗舰',
    status: 'evaluating',
    recommendedLevels: ['L3'],
  },
  {
    id: 'minimax-m2-7',
    name: 'MiniMax-M2.7',
    maker: 'MiniMax',
    initials: 'M',
    description: '低激活参数的高效智能体模型',
    categories: ['高效', '通用'],
    scale: '约10B激活',
    status: 'available',
    recommendedLevels: ['L2', 'L3'],
  },
  {
    id: 'step-3-7-flash',
    name: 'Step-3.7-Flash',
    maker: '阶跃星辰',
    initials: 'S',
    description: '快速推理、工具调用与并发任务',
    categories: ['高效', '推理'],
    scale: '约11B激活',
    status: 'available',
    recommendedLevels: ['L2', 'L3'],
  },
  {
    id: 'mimo-v2-5-pro',
    name: 'MiMo-V2.5-Pro',
    maker: '小米',
    initials: 'Mi',
    description: '复杂推理与智能体执行增强版本',
    categories: ['推理', '通用'],
    scale: '旗舰',
    status: 'available',
    recommendedLevels: ['L3'],
  },
  {
    id: 'ernie-4-5-300b',
    name: 'ERNIE-4.5-300B-A47B',
    maker: '百度飞桨',
    initials: 'E',
    description: '国产开源通用语言旗舰模型',
    categories: ['通用', '推理'],
    scale: '47B激活',
    status: 'available',
    recommendedLevels: ['L3'],
  },
  {
    id: 'qwen-3-8-27b',
    name: 'Qwen3.8-27B',
    maker: '通义千问',
    initials: 'Q',
    description: '质量与吞吐均衡的通用主力模型',
    categories: ['通用', '高效'],
    scale: '27B',
    status: 'available',
    recommendedLevels: ['L2'],
  },
  {
    id: 'deepseek-v4-flash',
    name: 'DeepSeek-V4-Flash-0731',
    maker: '深度求索',
    initials: 'D',
    description: '轻中度推理与批量任务处理',
    categories: ['高效', '推理'],
    scale: '高效',
    status: 'available',
    recommendedLevels: ['L1', 'L2'],
  },
  {
    id: 'glm-5-3-flash',
    name: 'GLM-5.3-Flash',
    maker: '智谱',
    initials: 'G',
    description: '低延迟办公处理与工具调用',
    categories: ['高效', '通用'],
    scale: '高效',
    status: 'available',
    recommendedLevels: ['L1', 'L2'],
  },
  {
    id: 'ernie-4-5-21b',
    name: 'ERNIE-4.5-21B-A3B',
    maker: '百度飞桨',
    initials: 'E',
    description: '小激活参数的分类、摘要与抽取',
    categories: ['高效', '通用'],
    scale: '3B激活',
    status: 'available',
    recommendedLevels: ['L1'],
  },
  {
    id: 'qwen-3-5-9b',
    name: 'Qwen3.5-9B',
    maker: '通义千问',
    initials: 'Q',
    description: '结构化提取、摘要与轻量理解',
    categories: ['高效', '通用'],
    scale: '9B',
    status: 'available',
    recommendedLevels: ['L1'],
  },
  {
    id: 'internlm3-8b',
    name: 'InternLM3-8B-Instruct',
    maker: '书生浦语',
    initials: 'I',
    description: '指令跟随、信息整理与本地部署',
    categories: ['高效', '通用'],
    scale: '8B',
    status: 'available',
    recommendedLevels: ['L1'],
  },
  {
    id: 'glm-4-1v-9b',
    name: 'GLM-4.1V-9B-Thinking',
    maker: '智谱',
    initials: 'G',
    description: '图片、扫描件与页面内容理解',
    categories: ['多模态', '高效'],
    scale: '9B',
    status: 'available',
    recommendedLevels: ['L1', 'L2'],
  },
  {
    id: 'minicpm-v-4-6',
    name: 'MiniCPM-V 4.6',
    maker: '面壁智能',
    initials: 'C',
    description: '端侧视觉理解、OCR与文档识别',
    categories: ['多模态', '高效'],
    scale: '端侧',
    status: 'available',
    recommendedLevels: ['L1'],
  },
  {
    id: 'intern-s1-pro',
    name: 'Intern-S1-Pro',
    maker: '书生浦语',
    initials: 'I',
    description: '科研与专业分析特化模型',
    categories: ['推理', '多模态'],
    scale: '专业',
    status: 'unavailable',
    recommendedLevels: ['L3'],
  },
];

export const defaultRoutingConfig: RoutingConfig = {
  L1: {
    primaryModelId: 'ernie-4-5-21b',
    fallbackModelId: 'glm-5-3-flash',
    autoUpgrade: true,
  },
  L2: {
    primaryModelId: 'qwen-3-8-27b',
    fallbackModelId: 'minimax-m2-7',
    autoUpgrade: true,
  },
  L3: {
    primaryModelId: 'deepseek-v4-pro',
    fallbackModelId: 'qwen-3-8-2t',
    autoUpgrade: true,
  },
};

export function cloneRoutingConfig(config: RoutingConfig): RoutingConfig {
  return {
    L1: { ...config.L1 },
    L2: { ...config.L2 },
    L3: { ...config.L3 },
  };
}

export function modelById(modelId: string) {
  return modelCatalog.find((model) => model.id === modelId);
}

const taskRuleDefaults: Record<
  RoutingLevel,
  Omit<RoutingRule, 'taskType' | 'level'>
> = {
  L1: {
    ...defaultRoutingConfig.L1,
    scope: '全市已授权单位',
    roleScope: '任务执行岗位',
    upgradeConditions: ['多材料输入', '来源冲突', '质量门未通过'],
    contextLimit: 16000,
    stepTokenLimit: 6000,
    failureAction: '使用备用模型',
  },
  L2: {
    ...defaultRoutingConfig.L2,
    scope: '全市已授权单位',
    roleScope: '任务执行岗位',
    upgradeConditions: ['长上下文', '专业语境', '关键结论冲突'],
    contextLimit: 64000,
    stepTokenLimit: 18000,
    failureAction: '使用备用模型',
  },
  L3: {
    ...defaultRoutingConfig.L3,
    scope: '全市已授权单位',
    roleScope: '任务执行岗位',
    upgradeConditions: [],
    contextLimit: 128000,
    stepTokenLimit: 36000,
    failureAction: '暂停并请求人工决定',
  },
};

const ROUTING_POLICY_STORAGE_KEY = 'aip-routing-policy-current-v1';

const initialPublishedRoutingPolicy: RoutingPolicySnapshot = {
  id: 'ROUTE-POLICY-CITY',
  version: '2.0',
  status: '已生效',
  effectiveAt: '2026-09-25 18:00',
  previousVersion: '1.0',
  evaluationStatus: '固定样本11/11通过',
  rules: atomicTaskTypes.map((taskType) => {
    const level = levelForTask(taskType);
    return { taskType, level, ...taskRuleDefaults[level] };
  }),
};

function storedRoutingPolicy() {
  if (typeof window === 'undefined') return undefined;
  try {
    const value = JSON.parse(
      window.localStorage.getItem(ROUTING_POLICY_STORAGE_KEY) ?? 'null',
    ) as RoutingPolicySnapshot | null;
    if (
      value?.id === 'ROUTE-POLICY-CITY' &&
      Array.isArray(value.rules) &&
      value.rules.length === atomicTaskTypes.length
    )
      return value;
  } catch {
    // A damaged local prototype snapshot falls back to the shipped baseline.
  }
  return undefined;
}

export const publishedRoutingPolicy: RoutingPolicySnapshot =
  storedRoutingPolicy() ?? structuredClone(initialPublishedRoutingPolicy);

const restoredRoutingConfig = routingConfigFromPolicy(publishedRoutingPolicy);
Object.assign(defaultRoutingConfig.L1, restoredRoutingConfig.L1);
Object.assign(defaultRoutingConfig.L2, restoredRoutingConfig.L2);
Object.assign(defaultRoutingConfig.L3, restoredRoutingConfig.L3);

export function publishRoutingPolicy(policy: RoutingPolicySnapshot) {
  Object.assign(publishedRoutingPolicy, structuredClone(policy), {
    status: '已生效' as const,
  });
  const next = routingConfigFromPolicy(publishedRoutingPolicy);
  Object.assign(defaultRoutingConfig.L1, next.L1);
  Object.assign(defaultRoutingConfig.L2, next.L2);
  Object.assign(defaultRoutingConfig.L3, next.L3);
  if (typeof window !== 'undefined')
    window.localStorage.setItem(
      ROUTING_POLICY_STORAGE_KEY,
      JSON.stringify(publishedRoutingPolicy),
    );
}

export function routingConfigFromPolicy(
  policy: RoutingPolicySnapshot,
): RoutingConfig {
  const config = (level: RoutingLevel) => {
    const rule = policy.rules.find((item) => item.level === level)!;
    return {
      primaryModelId: rule.primaryModelId,
      fallbackModelId: rule.fallbackModelId,
      autoUpgrade: rule.autoUpgrade,
    };
  };
  return {
    L1: config('L1'),
    L2: config('L2'),
    L3: config('L3'),
  };
}
