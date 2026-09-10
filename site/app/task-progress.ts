import type { Flow } from './fiscal-domain';
import type { WorkTask } from './memory-domain';
import type { BrainstormFlow } from './brainstorm-types.ts';
import { brainstormProgress } from './brainstorm-selectors.ts';

export type TaskProgressStatus =
  | 'completed'
  | 'in_progress'
  | 'not_started';

export type TaskProgressItem = {
  id: string;
  title: string;
  status: TaskProgressStatus;
  statusDetail?: string;
};

type StepDefinition = {
  id: string;
  title: string;
  stages: string[];
};

const paymentSteps: StepDefinition[] = [
  { id: 'read', title: '读取本周期支付申请', stages: ['read'] },
  { id: 'review', title: '检查用途备注并识别疑点', stages: ['review'] },
  {
    id: 'findings',
    title: '确认疑点与核对方法',
    stages: ['findings'],
  },
  {
    id: 'rules',
    title: '完成穿透式监管规则核查',
    stages: ['rules'],
  },
  { id: 'report', title: '生成支付审查结果', stages: ['report'] },
  {
    id: 'delivery',
    title: '按本人决定处理审查结果',
    stages: ['delivery', 'receipt'],
  },
];

const maintenanceSteps: StepDefinition[] = [
  { id: 'oa', title: '读取并确认交办要求', stages: ['oa'] },
  { id: 'guide', title: '获取运维申报办理指引', stages: ['guide'] },
  {
    id: 'project',
    title: '建立申报并完善基础信息',
    stages: ['create', 'fill'],
  },
  {
    id: 'assets',
    title: '关联并同步运维资产',
    stages: ['assets'],
  },
  {
    id: 'materials',
    title: '整理并上传申报材料',
    stages: ['materials', 'upload'],
  },
  {
    id: 'submission',
    title: '获取费用估算并完成提交',
    stages: ['estimate', 'submit', 'manual'],
  },
  {
    id: 'tracking',
    title: '决定是否创建审核反馈追踪',
    stages: ['tracking'],
  },
];

const feedbackSteps: StepDefinition[] = [
  { id: 'read', title: '读取项目审核反馈', stages: [] },
  { id: 'analyse', title: '分析反馈原因', stages: [] },
  { id: 'actions', title: '形成修改清单与建议', stages: [] },
  { id: 'revise', title: '根据清单完善申报材料', stages: ['feedback'] },
  { id: 'resubmit', title: '决定是否重新提交', stages: [] },
];

const consultationSteps: StepDefinition[] = [
  { id: 'understand', title: '理解咨询问题与适用范围', stages: [] },
  { id: 'context', title: '核对可用材料与访问范围', stages: [] },
  { id: 'consult', title: '调用专业智能体开展咨询', stages: ['consult'] },
  { id: 'organise', title: '整理咨询结论与依据', stages: [] },
  { id: 'deliver', title: '交付咨询结果', stages: [] },
];

function currentDetail(flow: Flow) {
  if (flow.stopped) return '任务已暂停';
  if (/等待本人确认/.test(flow.status)) return '等待本人确认';
  if (/回执待核实/.test(flow.status)) return '执行回执尚未确认';
  if (/操作已阻止/.test(flow.status)) return '当前操作受阻，等待处理';
  if (/执行失败/.test(flow.status)) return '执行失败，等待重试';
  if (/部分成功/.test(flow.status)) return '部分事项执行失败，等待继续处理';
  if (/等待/.test(flow.status)) return flow.status;
  return undefined;
}

function linearProgress(
  definitions: StepDefinition[],
  flow: Flow,
  currentIndex?: number,
) {
  const completed = flow.stage === 'complete';
  const active =
    currentIndex ??
    definitions.findIndex((step) => step.stages.includes(flow.stage));
  const index = active < 0 ? 0 : active;
  const detail = completed ? undefined : currentDetail(flow);
  return definitions.map<TaskProgressItem>((step, stepIndex) => ({
    id: step.id,
    title: step.title,
    status: completed
      ? 'completed'
      : stepIndex < index
        ? 'completed'
        : stepIndex === index
          ? 'in_progress'
          : 'not_started',
    ...(stepIndex === index && detail ? { statusDetail: detail } : {}),
  }));
}

function consultationProgress(flow: Flow) {
  if (flow.status === '可继续咨询') {
    return consultationSteps.map<TaskProgressItem>((step) => ({
      id: step.id,
      title: step.title,
      status: 'completed',
    }));
  }
  return linearProgress(consultationSteps, flow, 2);
}

function genericProgress(task: WorkTask) {
  const subject = (task.context || task.title || '当前任务').slice(0, 18);
  const definitions: StepDefinition[] =
    task.commandMode === 'plan'
      ? [
          { id: 'goal', title: `明确${subject}的目标与约束`, stages: [] },
          { id: 'context', title: '核对可用材料与工作范围', stages: [] },
          { id: 'plan', title: '制定任务执行计划', stages: [] },
          { id: 'confirm', title: '确认计划与执行边界', stages: [] },
          { id: 'deliver', title: '完成任务并交付结果', stages: [] },
        ]
      : [
          { id: 'goal', title: `明确${subject}的任务要求`, stages: [] },
          { id: 'context', title: '核对可用材料与工作范围', stages: [] },
          { id: 'plan', title: '拆解任务办理步骤', stages: [] },
          { id: 'execute', title: '完成任务核心处理', stages: [] },
          { id: 'deliver', title: '整理并交付任务结果', stages: [] },
        ];
  const hasResult = task.messages.some(
    (message) =>
      message.role === 'assistant' &&
      !message.text.includes('未经确认不执行业务操作') &&
      !message.text.includes('已保存任务目标'),
  );
  const active = hasResult ? definitions.length - 1 : task.commandMode === 'plan' ? 2 : 1;
  return definitions.map<TaskProgressItem>((step, index) => ({
    id: step.id,
    title: step.title,
    status:
      index < active
        ? 'completed'
        : index === active
          ? 'in_progress'
          : 'not_started',
  }));
}

/** A task-facing view of business progress. It never infers work from chat copy or audit records. */
export function taskProgress(task: WorkTask, flow?: Flow, brainstorm?: BrainstormFlow): TaskProgressItem[] {
  if (brainstorm) return brainstormProgress(brainstorm);
  if (!flow) return genericProgress(task);
  if (flow.kind === 'payment') return linearProgress(paymentSteps, flow);
  if (flow.kind === 'maintenance') return linearProgress(maintenanceSteps, flow);
  if (flow.kind === 'feedback') return linearProgress(feedbackSteps, flow, 3);
  return consultationProgress(flow);
}
