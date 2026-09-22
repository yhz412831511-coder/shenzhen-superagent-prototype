export type GateEvidence = {
  label: string;
  objectId: string;
  result: string;
  detail: string;
};
export type PersonGrant = {
  id: string;
  user: string;
  label: string;
  unit: string;
  status: '已授权' | '已停用';
  scope: string;
  approvedBy: string;
  approvedAt: string;
};
export type SafetyCheck = {
  id: string;
  task: string;
  unit: string;
  time: string;
  action: string;
  risk: '低风险' | '中风险' | '高风险' | '红线';
  control: '允许' | '限域允许' | '本人确认' | '全局阻断';
  outcome: '允许' | '脱敏' | '转人工确认' | '阻断';
  reason: string;
  ruleIds: string[];
  ruleVersions: string[];
  evidence: GateEvidence[];
  receipt: string;
  callId?: string;
};
export type RuntimeStage =
  | '任务进入'
  | '安全检查'
  | '受控执行'
  | '结果完成'
  | '等待确认'
  | '已阻断'
  | '技术异常'
  | '安全中止';
export type RuntimeEvent = {
  id: string;
  task: string;
  time: string;
  stage: RuntimeStage;
  detail: string;
};
export type SafetyState = {
  grants: PersonGrant[];
  checks: SafetyCheck[];
  events: RuntimeEvent[];
  tick: number;
};
