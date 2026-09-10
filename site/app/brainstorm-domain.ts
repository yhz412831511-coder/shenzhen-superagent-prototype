import {
  brainstormArtifactBodies,
  brainstormConflicts,
  brainstormConsensus,
  brainstormContributions,
  brainstormFacts,
  brainstormIssue,
  brainstormParticipants,
  brainstormPolicies,
  brainstormRounds,
  brainstormTopics,
  brainstormEvolution,
} from './brainstorm-fixtures.ts';
import type {
  BrainstormAction,
  BrainstormEffect,
  BrainstormFlow,
  BrainstormPhase,
  BrainstormState,
  BrainstormTransition,
} from './brainstorm-types.ts';

export const initialBrainstormState = (): BrainstormState => ({ flows: {} });

const event = (
  flow: BrainstormFlow,
  type: string,
  at: string,
  actor: string,
  entityId: string,
  from: string,
  to: string,
  reason: string,
) => {
  flow.eventLog.push({
    id: `brainstorm-event-${flow.eventLog.length + 1}`,
    type,
    at,
    actor,
    entityId,
    from,
    to,
    reason,
  });
};

export function createBrainstormFlow(
  taskId: string,
  initialText: string,
  at = '2026-12-18T01:00:00.000Z',
): { flow: BrainstormFlow; effects: BrainstormEffect[] } {
  const flow: BrainstormFlow = {
    id: `brainstorm-${taskId}`,
    taskId,
    version: 1,
    phase: 'issue_preparation',
    phaseStatus: 'awaiting_issue_confirmation',
    stopped: false,
    source: '本人发起 · 脑暴协作',
    scenarioAt: at,
    factCutoff: '2026-11-30',
    issue: structuredClone(brainstormIssue),
    participants: structuredClone(brainstormParticipants),
    sourceScopes: {
      publicDuties: true,
      authorizedSummaries: true,
      crossOfficeOriginals: false,
      personalMemory: false,
      confirmed: false,
    },
    topics: structuredClone(brainstormTopics),
    contributions: structuredClone(brainstormContributions),
    rounds: structuredClone(brainstormRounds),
    evolution: structuredClone(brainstormEvolution),
    consensus: structuredClone(brainstormConsensus),
    conflicts: structuredClone(brainstormConflicts),
    decisions: [],
    facts: structuredClone(brainstormFacts),
    policies: structuredClone(brainstormPolicies),
    artifactIds: [],
    artifactMeta: [],
    completedPhaseIds: [],
    pendingAttention: [],
    anchors: {},
    eventLog: [],
  };
  event(
    flow,
    'brainstorm/create',
    at,
    '业务骨干',
    taskId,
    '',
    flow.phaseStatus,
    initialText,
  );
  return {
    flow,
    effects: [
      {
        type: 'message',
        role: 'assistant',
        text: '我先把这项工作整理为议题卡。确认后，再推荐参与岗位和本任务可使用的材料范围。',
        anchor: 'issue',
      },
    ],
  };
}

function blocked(
  state: BrainstormState,
  taskId: string,
  notice: string,
): BrainstormTransition {
  return { state, effects: [], notice };
}

function advance(
  flow: BrainstormFlow,
  phase: BrainstormPhase,
  phaseStatus: BrainstormFlow['phaseStatus'],
) {
  if (!flow.completedPhaseIds.includes(flow.phase))
    flow.completedPhaseIds.push(flow.phase);
  flow.phase = phase;
  flow.phaseStatus = phaseStatus;
  flow.version += 1;
}

export function brainstormReducer(
  previous: BrainstormState,
  action: BrainstormAction,
  at: string,
): BrainstormTransition {
  const taskId = action.taskId;
  const original = previous.flows[action.taskId];
  if (!original)
    return blocked(previous, action.taskId, '当前任务不是脑暴协作。');
  if (original.stopped && action.type !== 'resume')
    return blocked(previous, action.taskId, '任务已暂停，请恢复后继续。');
  const state = structuredClone(previous);
  const flow = state.flows[action.taskId];
  const effects: BrainstormEffect[] = [];
  const change = (
    type: string,
    entityId: string,
    from: string,
    to: string,
    reason: string,
    actor = '业务骨干',
  ) => event(flow, type, at, actor, entityId, from, to, reason);

  if (action.type === 'pause') {
    flow.stopped = true;
    change('flow/pause', flow.id, 'running', 'paused', '用户暂停任务');
    effects.push({
      type: 'message',
      role: 'system',
      text: '脑暴协作已暂停；已完成贡献、询证和决定均已保留。',
    });
    return { state, effects };
  }
  if (action.type === 'resume') {
    flow.stopped = false;
    change('flow/resume', flow.id, 'paused', flow.phaseStatus, '用户恢复任务');
    effects.push({
      type: 'message',
      role: 'system',
      text: '脑暴协作已恢复，将从当前业务步骤继续。',
    });
    return { state, effects };
  }
  if (action.type === 'issue-update') {
    if (flow.phaseStatus !== 'awaiting_issue_confirmation')
      return blocked(
        previous,
        action.taskId,
        '议题卡已经确认，请在当前任务中补充变更要求。',
      );
    const old = flow.issue[action.field];
    flow.issue[action.field] = action.value.trim();
    change(
      'issue/update',
      action.field,
      old,
      flow.issue[action.field],
      '用户修改议题卡字段',
    );
    return { state, effects };
  }
  if (action.type === 'issue-confirm') {
    if (flow.phaseStatus !== 'awaiting_issue_confirmation')
      return blocked(previous, action.taskId, '议题卡当前无需重复确认。');
    if (
      ![
        flow.issue.goal,
        flow.issue.audience,
        flow.issue.period,
        flow.issue.quality,
      ].every((value) => value.trim())
    )
      return blocked(
        previous,
        action.taskId,
        '请补齐目标、汇报对象、时间范围和质量重点。',
      );
    flow.issue.confirmed = true;
    advance(flow, 'material_authorization', 'awaiting_participants');
    change('issue/confirm', flow.id, 'draft', 'confirmed', '用户确认议题卡');
    effects.push(
      { type: 'message', role: 'user', text: '确认议题卡，请推荐参与岗位。' },
      {
        type: 'message',
        role: 'assistant',
        text: '议题已确认。我按五个议题组推荐13个岗位参与；你可以调整，移除时会显示可能缺失的职责视角。',
        anchor: 'participants',
      },
    );
    return { state, effects };
  }
  if (action.type === 'participants-toggle') {
    if (flow.phaseStatus !== 'awaiting_participants')
      return blocked(previous, action.taskId, '岗位组合已经确认。');
    const item = flow.participants.find(
      (candidate) => candidate.id === action.participantId,
    );
    if (!item) return blocked(previous, action.taskId, '未找到该岗位。');
    item.selected = !item.selected;
    change(
      'participants/toggle',
      item.id,
      String(!item.selected),
      String(item.selected),
      '用户调整参与岗位',
    );
    return { state, effects };
  }
  if (action.type === 'participants-confirm') {
    if (flow.phaseStatus !== 'awaiting_participants')
      return blocked(previous, action.taskId, '岗位组合当前无需重复确认。');
    const selected = flow.participants.filter((item) => item.selected);
    if (!selected.some((item) => item.id === 'office'))
      return blocked(
        previous,
        action.taskId,
        '年度报告任务必须保留办公室统稿责任。',
      );
    const requiredGroups = new Set(
      flow.participants.map((item) => item.groupId),
    );
    if (
      [...requiredGroups].some(
        (groupId) => !selected.some((item) => item.groupId === groupId),
      )
    )
      return blocked(
        previous,
        action.taskId,
        '每个议题组至少保留一个职责岗位。',
      );
    flow.phaseStatus = 'awaiting_scope';
    change(
      'participants/confirm',
      flow.id,
      'draft',
      'confirmed',
      `确认${selected.length}个岗位`,
    );
    effects.push(
      {
        type: 'message',
        role: 'user',
        text: `确认${selected.length}个岗位参与本次协作。`,
      },
      {
        type: 'message',
        role: 'assistant',
        text: '岗位组合已确认。默认只使用公开职责、本岗位授权材料和当前议题必要摘要；跨处室原文或个人记忆需要单独授权。',
        anchor: 'scope',
      },
    );
    return { state, effects };
  }
  if (action.type === 'scope-toggle') {
    if (flow.phaseStatus !== 'awaiting_scope')
      return blocked(previous, action.taskId, '调用范围已经确认。');
    flow.sourceScopes[action.field] = !flow.sourceScopes[action.field];
    change(
      'scope/toggle',
      action.field,
      String(!flow.sourceScopes[action.field]),
      String(flow.sourceScopes[action.field]),
      '用户调整调用范围',
    );
    return { state, effects };
  }
  if (action.type === 'scope-confirm') {
    if (flow.phaseStatus !== 'awaiting_scope')
      return blocked(previous, action.taskId, '调用范围当前无需重复确认。');
    flow.sourceScopes.confirmed = true;
    advance(flow, 'theme_contribution', 'collecting');
    change(
      'scope/confirm',
      flow.id,
      'draft',
      'confirmed',
      '用户确认最小必要调用范围',
    );
    effects.push(
      {
        type: 'message',
        role: 'user',
        text: '确认按当前范围使用材料，开始形成年度报告主题盘点。',
      },
      {
        type: 'message',
        role: 'assistant',
        text: '调用范围已确认。下一步先汇集13个岗位的独立输出，并形成年度报告七个主题的完整盘点；系统只会推荐优先处理顺序，不会直接发起讨论。',
        anchor: 'synthesis',
      },
    );
    return { state, effects };
  }
  if (action.type === 'collect') {
    if (flow.phaseStatus !== 'collecting')
      return blocked(previous, action.taskId, '岗位贡献已经汇集。');
    const selectedIds = new Set(
      flow.participants.filter((item) => item.selected).map((item) => item.id),
    );
    flow.participants.forEach((item) => {
      if (selectedIds.has(item.id)) item.status = 'submitted';
    });
    flow.topics.forEach((topic) => {
      topic.contributionIds = flow.contributions
        .filter(
          (item) =>
            topic.participantIds.includes(item.participantId) &&
            selectedIds.has(item.participantId),
        )
        .map((item) => item.id);
      topic.status = topic.contributionIds.length ? 'ready' : 'needs_attention';
    });
    flow.phaseStatus = 'partial_ready';
    flow.rounds[0].status = 'completed';
    flow.rounds[1].status = 'pending';
    change(
      'contribution/receive',
      flow.id,
      'collecting',
      'partial_ready',
      'fixture中的岗位贡献已按主题归并',
      '超级智能体',
    );
    effects.push({
      type: 'message',
      role: 'assistant',
      text: '13个岗位已完成独立贡献，V0初步汇集版和七主题盘点已经形成。人工智能＋政务涉及8个岗位、3项实质分歧，并影响2027年任务排序和安全边界，建议优先处理；请由你确认是否先进入该主题。',
      anchor: 'synthesis',
    });
    return { state, effects };
  }
  if (action.type === 'inquire') {
    if (!['partial_ready', 'inquiring'].includes(flow.phaseStatus))
      return blocked(previous, action.taskId, '当前无需重复发起协同询证。');
    const ordinary = flow.conflicts.find((item) => item.kind === 'ordinary')!;
    const high = flow.conflicts.find((item) => item.kind === 'high_impact')!;
    if (flow.phaseStatus === 'partial_ready') {
      advance(flow, 'cross_inquiry', 'inquiring');
      ordinary.inquiryRounds = 1;
      ordinary.status = 'resolved';
      high.inquiryRounds = 1;
      flow.rounds[1].status = 'completed';
      flow.rounds[2].status = 'active';
      change(
        'topic/prioritize',
        'ai-government',
        'recommended_first',
        'confirmed_first',
        '用户确认先处理人工智能＋政务主题',
      );
      change(
        'inquiry/round-1',
        high.id,
        'pending',
        'round_1_completed',
        '建设方式与准入条件形成三项一致、三项未决',
        '超级智能体',
      );
      effects.push(
        {
          type: 'message',
          role: 'user',
          text: '按建议先处理“人工智能＋政务”主题，开始第一轮讨论。',
        },
        {
          type: 'message',
          role: 'assistant',
          text: '第一轮岗位互证已完成：不以场景数量为首要成绩、稳定数据和可评测结果是试点条件、共性能力统一沉淀。仍有三项事实、责任和顺序问题，需要用具体场景进入第二轮补证。该主题处理后仍会回到其余六个主题和完整年度报告大纲。',
          anchor: 'round',
        },
      );
      return { state, effects };
    }
    flow.phaseStatus = 'awaiting_high_impact_decision';
    flow.version += 1;
    high.inquiryRounds = 2;
    flow.rounds[2].status = 'completed';
    change(
      'inquiry/round-2',
      high.id,
      'round_1_completed',
      'awaiting_user',
      '两个具体场景补证后只保留建设路径高影响取舍',
      '超级智能体',
    );
    change(
      'conflict/escalate',
      high.id,
      'pending',
      'awaiting_user',
      '两轮询证后仍影响年度任务排序和资源安排',
      '超级智能体',
    );
    effects.push({
      type: 'message',
      role: 'assistant',
      text: '第二轮已用政务服务办理辅助和民生诉求趋势研判完成补证，数据、安全、评测、人工复核、日志和停用条件已经明确。场景牵引还是底座优先仍会改变年度任务排序，需要你决定。',
      anchor: 'decision',
    });
    return { state, effects };
  }
  if (action.type === 'decision-resolve') {
    if (flow.phaseStatus !== 'awaiting_high_impact_decision')
      return blocked(previous, action.taskId, '当前没有等待处理的高影响决定。');
    const conflict = flow.conflicts.find(
      (item) => item.id === action.conflictId && item.kind === 'high_impact',
    );
    const option = conflict?.options.find(
      (item) => item.id === action.optionId,
    );
    if (!conflict || !option)
      return blocked(previous, action.taskId, '请选择有效的高影响选项。');
    conflict.status = 'resolved';
    conflict.selectedOptionId = option.id;
    flow.evolution.finalText = option.impact;
    flow.decisions.push({
      id: `decision-${flow.decisions.length + 1}`,
      conflictId: conflict.id,
      optionId: option.id,
      actor: '业务骨干',
      at,
      impact: option.impact,
      boundary: '工作版本取舍，不代表领导审定或正式承诺。',
    });
    advance(flow, 'decision_outline', 'awaiting_outline_confirmation');
    change(
      'decision/resolve',
      conflict.id,
      'pending',
      option.id,
      option.impact,
    );
    effects.push(
      { type: 'message', role: 'user', text: `选择“${option.label}”。` },
      {
        type: 'message',
        role: 'assistant',
        text: `已记录决定：${option.impact} 我已据此调整开篇、主题排序、2027年任务和结尾表述，形成综合大纲。`,
        anchor: 'outline',
      },
    );
    return { state, effects };
  }
  if (action.type === 'outline-confirm') {
    if (flow.phaseStatus !== 'awaiting_outline_confirmation')
      return blocked(previous, action.taskId, '综合大纲当前无需重复确认。');
    if (
      flow.conflicts.some(
        (item) => item.kind === 'high_impact' && item.status === 'pending',
      )
    )
      return blocked(previous, action.taskId, '高影响分歧尚未处理。');
    flow.phaseStatus = 'outline_ready';
    change(
      'outline/confirm',
      flow.id,
      'awaiting',
      'confirmed',
      '业务骨干确认综合大纲',
    );
    effects.push(
      {
        type: 'message',
        role: 'user',
        text: '确认综合大纲，继续形成工作版本。',
      },
      {
        type: 'message',
        role: 'assistant',
        text: '综合大纲已确认。将按同一事实与决定记录生成一份推荐主稿和三项支撑材料。',
        anchor: 'outline',
      },
    );
    return { state, effects };
  }
  if (action.type === 'artifacts-generate') {
    if (flow.phaseStatus !== 'outline_ready')
      return blocked(previous, action.taskId, '请先确认综合大纲。');
    const highImpact = flow.conflicts.find(
      (item) => item.kind === 'high_impact',
    );
    const selectedOption = highImpact?.options.find(
      (item) => item.id === highImpact.selectedOptionId,
    );
    const decisionLine = selectedOption
      ? `\n\n## 用户决定\n\n选择“${selectedOption.label}”：${selectedOption.impact}\n\n边界：工作版本取舍，不代表领导审定或正式承诺。`
      : '';
    const reportBody = selectedOption
      ? brainstormArtifactBodies.report.replace(
          '2027年AI智能场景建设路径待业务骨干根据两轮岗位询证结果决定。',
          selectedOption.impact,
        )
      : brainstormArtifactBodies.report;
    advance(flow, 'drafting_delivery', 'fact_gap_attention');
    change(
      'artifacts/generate',
      flow.id,
      'outline',
      'four_artifacts',
      '生成一份主稿和三项支撑材料',
      '超级智能体',
    );
    effects.push(
      {
        type: 'message',
        role: 'assistant',
        text: '主稿初版和三项支撑材料已经形成。两项合成数值仍待年终核定，另有两项事实缺口未写入具体数值；请明确缺口处理方式。',
        anchor: 'gaps',
      },
      {
        type: 'artifact',
        name: '2026年度工作报告主稿',
        body: reportBody,
        source: '13个岗位合成贡献／用户决定／合成示例事实',
        evidenceIds: [
          'fact-online-rate',
          'fact-time-reduction',
          'conflict-ai-balance',
        ],
      },
      {
        type: 'artifact',
        name: '年度工作报告事实底稿',
        body: brainstormArtifactBodies.facts,
        source: '岗位授权摘要／合成示例事实／待补材料',
        evidenceIds: flow.facts.map((item) => item.id),
      },
      {
        type: 'artifact',
        name: '中央—广东省—深圳市政策响应矩阵',
        body: brainstormArtifactBodies.policies,
        source: '待核验政策位置，不代表已发布政策',
        evidenceIds: flow.policies.map((item) => item.id),
      },
      {
        type: 'artifact',
        name: '分歧与用户决定记录',
        body: brainstormArtifactBodies.decisions + decisionLine,
        source: '协同询证记录／业务骨干工作版本决定',
        evidenceIds: flow.conflicts.map((item) => item.id),
      },
    );
    return { state, effects };
  }
  if (action.type === 'fact-gap-resolve') {
    if (flow.phaseStatus !== 'fact_gap_attention')
      return blocked(previous, action.taskId, '当前没有待处理的事实缺口。');
    flow.facts
      .filter((item) => item.verificationStatus !== 'verified')
      .forEach((item) => {
        item.resolution = action.resolution;
      });
    flow.version += 1;
    flow.phaseStatus = 'awaiting_working_version_confirmation';
    change(
      'fact-gap/resolve',
      flow.id,
      'pending',
      action.resolution,
      action.resolution === 'keep_limited'
        ? '保留合成／待核限定并继续'
        : '从主稿移除未核定数值',
    );
    effects.push(
      {
        type: 'message',
        role: 'user',
        text:
          action.resolution === 'keep_limited'
            ? '保留合成和待核状态标识，继续审阅工作版本。'
            : '从主稿移除未核定数值，继续审阅工作版本。',
      },
      {
        type: 'message',
        role: 'assistant',
        text: '事实缺口处理方式已记录。四项成果已齐全，核心分歧已有决定；请审阅并确认最终工作版本。',
        anchor: 'final',
      },
    );
    return { state, effects };
  }
  if (action.type === 'working-version-confirm') {
    if (flow.phaseStatus !== 'awaiting_working_version_confirmation')
      return blocked(previous, action.taskId, '尚未满足最终工作版本确认条件。');
    if (flow.artifactIds.length !== 4)
      return blocked(previous, action.taskId, '四项成果尚未齐全。');
    if (
      flow.facts.some(
        (item) => item.verificationStatus !== 'verified' && !item.resolution,
      )
    )
      return blocked(previous, action.taskId, '仍有事实缺口未明确处理方式。');
    flow.phaseStatus = 'completed';
    if (!flow.completedPhaseIds.includes(flow.phase))
      flow.completedPhaseIds.push(flow.phase);
    flow.artifactMeta.forEach((item) => (item.verificationStatus = 'reviewed'));
    change(
      'working-version/confirm',
      flow.id,
      'awaiting',
      'completed',
      '业务骨干确认最终工作版本',
    );
    effects.push(
      { type: 'message', role: 'user', text: '确认最终工作版本。' },
      {
        type: 'message',
        role: 'assistant',
        text: '本次脑暴协作已完成：一份推荐主稿、事实底稿、政策响应矩阵和分歧决定记录均已形成。该结果仍是工作版本，不代表正式审定或报送。',
      },
    );
    return { state, effects };
  }
  return blocked(previous, taskId, '当前事件不适用于此任务状态。');
}
