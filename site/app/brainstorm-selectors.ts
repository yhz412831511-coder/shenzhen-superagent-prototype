import type { TaskProgressItem } from './task-progress.ts';
import type { BrainstormFlow, BrainstormPhase } from './brainstorm-types.ts';

const steps: { id: BrainstormPhase; title: string }[] = [
  { id: 'issue_preparation', title: '议题准备' },
  { id: 'material_authorization', title: '材料盘点与授权' },
  { id: 'theme_contribution', title: '主题贡献' },
  { id: 'cross_inquiry', title: '协同询证' },
  { id: 'decision_outline', title: '决策与大纲收敛' },
  { id: 'drafting_delivery', title: '统稿、审校与交付' },
];

export const brainstormPhaseLabel = (phase: BrainstormPhase) =>
  steps.find((item) => item.id === phase)?.title || '脑暴协作';

export function brainstormProgress(flow: BrainstormFlow): TaskProgressItem[] {
  const active = steps.findIndex((item) => item.id === flow.phase);
  const completed = flow.phaseStatus === 'completed';
  const detail = flow.stopped
    ? '任务已暂停'
    : flow.phaseStatus.startsWith('awaiting_') || flow.phaseStatus === 'fact_gap_attention'
      ? '等待本人确认'
      : undefined;
  return steps.map((step, index) => ({
    id: step.id,
    title: step.title,
    status: completed || index < active ? 'completed' : index === active ? 'in_progress' : 'not_started',
    ...(index === active && detail ? { statusDetail: detail } : {}),
  }));
}

export function brainstormSummary(flow: BrainstormFlow) {
  const selected = flow.participants.filter((item) => item.selected);
  const submitted = selected.filter((item) => item.status === 'submitted').length;
  const readyTopics = flow.topics.filter((item) => item.status === 'ready').length;
  const unresolved = flow.conflicts.filter((item) => item.status === 'pending');
  return {
    selected: selected.length,
    submitted,
    readyTopics,
    consensus: flow.consensus.length,
    ordinaryConflicts: unresolved.filter((item) => item.kind === 'ordinary').length,
    highImpactConflicts: unresolved.filter((item) => item.kind === 'high_impact').length,
    gaps: flow.facts.filter((item) => item.verificationStatus !== 'verified' && !item.resolution).length,
  };
}
