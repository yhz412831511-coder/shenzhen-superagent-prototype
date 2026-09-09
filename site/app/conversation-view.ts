import type { Message, WorkTask } from './memory-domain.ts';
import type { Artifact, Operation } from './fiscal-domain.ts';

export type ConversationBlock = { message: Message; operation?: Operation };
export type ConversationTurn = {
  id: string;
  role: Message['role'];
  blocks: ConversationBlock[];
  artifacts: Artifact[];
};

/** A view over events; never mutates, executes or merges the underlying business records. */
export function conversationTurns(
  task: WorkTask,
  operations: Operation[] = [],
  artifacts: Artifact[] = [],
): ConversationTurn[] {
  const ops = new Map(operations.map((op) => [op.messageId, op]));
  const turns: ConversationTurn[] = [];
  const eventTurns = new Map<string, ConversationTurn>();
  for (const message of task.messages) {
    let turn = turns.at(-1);
    if (message.role !== 'assistant' || turn?.role !== 'assistant') {
      turn = { id: message.id, role: message.role, blocks: [], artifacts: [] };
      turns.push(turn);
    }
    turn!.blocks.push({ message, operation: ops.get(message.id) });
    eventTurns.set(message.id, turn!);
  }
  for (const artifact of artifacts) {
    if (artifact.taskId !== task.id) continue;
    // Only attach a file to a proven source event. Unlinked legacy files remain in the right panel.
    const turn = artifact.originMessageId
      ? eventTurns.get(artifact.originMessageId)
      : undefined;
    if (
      turn?.role === 'assistant' &&
      !turn.artifacts.some((a) => a.id === artifact.id)
    )
      turn.artifacts.push(artifact);
  }
  return turns;
}

export function turnText(turn: ConversationTurn) {
  return turn.blocks
    .filter((block) => !block.operation)
    .map((block) => block.message.text)
    .join('\n\n');
}

const operationNames: Record<string, string> = {
  'read-payments': '调用智慧财政连接器读取周期支付申请',
  review: '调用支付备注隐晦表达审查 Skill',
  'save-method': '保存程序记忆',
  'share-method': '提交组织经验',
  'organization-adoption': '由组织维护者采纳并发布经验',
  'check-rules': '核查穿透监管规则',
  report: '生成审查汇总与疑点清单',
  writeback: '写入智慧财政草稿箱',
  'check-payment-submission': '正式提交权限检查',
  'query-receipt': '查询执行回执',
  'read-oa': '读取 OA 交办事项',
  'read-project-requirements': '调用项管平台连接器读取申报要求',
  'read-resource-assets': '调用 CDOS 连接器查询运维资产',
  'read-knowledge-plans': '从知识库提取系统方案与运维资料',
  'discover-capability': '查询适用技能与专业智能体',
  guide: '咨询项目统筹处数字人',
  'create-project': '建立运维申报草稿',
  'save-project': '保存项目基础信息',
  'select-assets': '关联运维资产',
  'sync-assets': '同步资产至项管平台',
  'prepare-materials': '整理申报材料',
  'upload-materials': '上传申报材料',
  estimate: '获取平台费用估算',
  'submit-project': '提交项目申报',
  track: '创建反馈追踪',
  consultation: '咨询专业智能体',
};
export function operationTitle(op: Operation) {
  return `${op.status === '成功' ? '已' : ''}${operationNames[op.cmd] || op.scope}`;
}

export function confirmationResolution(op: Operation, operations: Operation[]) {
  if (op.status !== '待确认') return undefined;
  return operations
    .slice(operations.indexOf(op) + 1)
    .find(
      (next) =>
        next.cmd === op.cmd &&
        next.version === op.version &&
        next.system === op.system &&
        next.checks.some(
          (check) => check.label === '本人确认当前对象与影响' && check.passed,
        ),
    );
}

/** Authorization precedes execution; never infer authorization from success alone. */
export function authorizationLabel(op: Operation) {
  if (op.risk === '无') return '本地处理';
  if (!op.checks.length) return '鉴权待核实';
  if (op.status === '待确认') return '待授权确认';
  return op.checks.every((check) => check.passed) ? '鉴权通过' : '鉴权未通过';
}
