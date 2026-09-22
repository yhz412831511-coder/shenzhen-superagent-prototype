/**
 * Shared safety contract for the super-agent and the governance console.
 * It deliberately models control semantics, not real identity or system grants.
 */
export type RiskTier = '低' | '中' | '高' | '红线';
export type RiskControl = '允许' | '限域允许' | '本人确认' | '全局阻断';

export type RiskPolicyDefinition = {
  level: RiskTier;
  label: string;
  control: RiskControl;
  tone: 'green' | 'blue' | 'amber' | 'red';
  summary: string;
  userHint: string;
  ruleIds: string[];
};

const publishedRuleVersions: Record<string, string> = {
  'RULE-1': '1.0',
  'RULE-2': '1.0',
  'RULE-3': '1.0',
  'RULE-4': '1.0',
  'RULE-5': '1.0',
  'RULE-6': '1.0',
};

export const riskPolicies: Record<RiskTier, RiskPolicyDefinition> = {
  低: {
    level: '低',
    label: '低风险',
    control: '允许',
    tone: 'green',
    summary: '在当前授权范围内允许执行，并保留操作记录。',
    userHint: '按当前授权范围允许执行',
    ruleIds: ['RULE-1'],
  },
  中: {
    level: '中',
    label: '中风险',
    control: '限域允许',
    tone: 'blue',
    summary: '仅在已批准的任务、对象和数据范围内执行，不扩大影响。',
    userHint: '仅限当前任务与授权范围',
    ruleIds: ['RULE-2'],
  },
  高: {
    level: '高',
    label: '高风险',
    control: '本人确认',
    tone: 'amber',
    summary: '需本人逐项确认，且当前业务权限、对象和范围均有效。',
    userHint: '需本人确认并核验权限',
    ruleIds: ['RULE-3', 'RULE-4'],
  },
  红线: {
    level: '红线',
    label: '红线',
    control: '全局阻断',
    tone: 'red',
    summary: '全局禁止，系统立即阻断；不提供确认或单位级例外。',
    userHint: '全局阻断，不可绕过',
    ruleIds: ['RULE-5', 'RULE-6'],
  },
};

/** Historical fixtures used “无” for local work. It is now governed as low risk. */
export function normalizeRisk(risk: RiskTier | '无'): RiskTier {
  return risk === '无' ? '低' : risk;
}

export function riskPolicyFor(risk: RiskTier | '无') {
  return riskPolicies[normalizeRisk(risk)];
}

export function defaultRuleForRisk(risk: RiskTier | '无', action?: string) {
  const policy = riskPolicyFor(risk);
  if (policy.level === '高' && action === '系统写入') return 'RULE-4';
  if (policy.level === '红线' && action === '沙箱访问') return 'RULE-6';
  return policy.ruleIds[0];
}

export function publishedRuleVersion(ruleId: string) {
  return publishedRuleVersions[ruleId] ?? '未发布';
}

/** The static prototype shares this in-memory publication event across products. */
export function publishRiskRule(ruleId: string, version: string) {
  publishedRuleVersions[ruleId] = version;
}

export function controlForRisk(risk: RiskTier | '无') {
  return riskPolicyFor(risk).control;
}
