import { postMeetingTransition } from './party-postmeeting.ts';
/** Party meeting P1. Deterministic local records; no external system is called. */
export const PARTY_PROJECT = '党组会';
export const PARTY_PROMPT =
  '准备第14次党组会，接续上次会议安排，核查落实情况、收集议题并形成会前材料。';
export const PARTY_SOURCE = '会务合成记录 · 本地执行结果不证明真实OA提交';
export const PARTY_SYSTEMS = [
  {
    id: 'oa',
    name: 'OA办公系统',
    purpose: '查阅第13次会议纪要及待发送通知',
    scope: '本人获准参与的会议文件；发送另行确认',
    impact: '未选择时只形成通知工作稿',
    recommended: true,
    available: true,
  },
  {
    id: 'topics',
    name: '议题报送系统',
    purpose: '收集本次议题及处室报送材料',
    scope: '第14次会议的6个报送处室',
    impact: '未选择时议题清单保留待补，不推定收件齐套',
    recommended: true,
    available: true,
  },
  {
    id: 'tracking',
    name: '督办跟踪系统',
    purpose: '核对上次决定落实与本次进度',
    scope: '本次会务授权的12项督办记录',
    impact: '未选择时不生成已核实的督办统计',
    recommended: true,
    available: true,
  },
  {
    id: 'resources',
    name: '数字资源管理系统（CODES）',
    purpose: '核对信息系统相关议题的支撑材料',
    scope: '会务资料包明确引用的系统记录',
    impact: '可补充系统议题依据，不读取其他项目数据',
    recommended: false,
    available: true,
  },
  {
    id: 'inspection',
    name: '专项督查系统',
    purpose: '补充专项督查相关议题依据',
    scope: '当前身份尚无该系统会务读取权限',
    impact: '不能通过本次选择取得权限，可改用授权材料',
    recommended: false,
    available: false,
  },
] as const;
export type PartySystem = (typeof PARTY_SYSTEMS)[number]['id'];
export const PARTY_HISTORY_SYSTEMS: PartySystem[] = ['oa', 'topics', 'tracking'];
export const partySystemTargetId = (id: PartySystem) => `party-${id}`;
export const partySystemFromTargetId = (id: string) =>
  id.startsWith('party-') &&
  PARTY_SYSTEMS.some((system) => system.id === id.slice(6))
    ? (id.slice(6) as PartySystem)
    : undefined;
export function partySystemResult(
  id: PartySystem,
  historical = false,
): { purpose: string; result: string; status: string } {
  const results: Record<PartySystem, string> = {
    oa: historical
      ? '已读取第13次会议纪要v2及通知回执；本次只读历史，未重复发送。'
      : '已读取第13次纪要v2、9月21日更正及本次通知范围；发送动作另行确认。',
    topics: historical
      ? '已收集会议议题和报送材料；基础设施处附件缺口单列跟踪。'
      : '已收到5个处室报送，基础设施处附件尚未齐套；未推定材料已收全。',
    tracking: historical
      ? '已核对上次决定和督办记录；技术验收与手续材料分别保留。'
      : '已核对12项督办记录；摘要85%与台账72%分母不同，完成率保持待核。',
    resources: historical
      ? '已读取会务资料包引用的信息系统记录，未读取其他项目数据。'
      : '已读取会务资料包内的信息系统支撑材料，作为相关议题依据。',
    inspection: '当前身份无会务读取权限，未执行调用。',
  };
  const entry = PARTY_SYSTEMS.find((system) => system.id === id)!;
  return {
    purpose: entry.purpose,
    result: results[id],
    status: id === 'inspection' ? '未调用 · 无权限' : '已调用 · 只读',
  };
}
export type PartyStage =
  | 'systems'
  | 'plan'
  | 'collecting'
  | 'gap'
  | 'waiting'
  | 'review'
  | 'confirm'
  | 'sending'
  | 'failed'
  | 'unknown'
  | 'sent'
  | 'internal'
  | 'minutes'
  | 'minutes-confirm'
  | 'minutes-submitted'
  | 'minutes-sending'
  | 'minutes-failed'
  | 'minutes-unknown'
  | 'closed';
export type PartyDecision = {
  anchor: string;
  label: string;
  summary: string;
  version: number;
};
export type PartyPlanDraft = {
  meetingAt: string;
  cutoff: string;
  extraTopic: string;
  recipients: string[];
};
export type PartyFlow = {
  minutesNotes?: string;
  minutesVersion?: number;
  minutesArtifact?: string;
  minutesReceipt?: string;
  approvalSource?: string;
  selectionDraft?: PartySystem[];
  planDraft?: Partial<PartyPlanDraft>;
  gapDraft?: 'wait' | 'provisional' | 'exclude';
  id: string;
  stage: PartyStage;
  revision: number;
  planVersion: number;
  at: string;
  anchor: string;
  selected: PartySystem[];
  unavailable: PartySystem[];
  meetingAt: string;
  cutoff: string;
  extraTopic: string;
  recipients: string[];
  reuseEvidence?: boolean;
  gapDecision?: 'provisional' | 'exclude';
  decisions: PartyDecision[];
  artifacts: string[];
  noticeArtifact?: string;
  receipt?: string;
  feedback: string;
  outcome: 'success' | 'failure' | 'unknown';
  requestId?: string;
  submittedRequestId?: string;
  stopped: boolean;
};
export type PartyAction = {
  taskId: string;
  revision: number;
} & (
  | { type: 'systems-confirm'; selected: PartySystem[] }
  | {
      type: 'draft';
      selected?: PartySystem[];
      gapChoice?: 'wait' | 'provisional' | 'exclude';
      plan?: Partial<PartyPlanDraft>;
      discardPlan?: boolean;
    }
  | {
      type:
        | 'systems-edit'
        | 'plan-confirm'
        | 'collect-finish'
        | 'prepare-send'
        | 'send'
        | 'send-finish'
        | 'cancel-send'
        | 'internal'
        | 'query-receipt'
        | 'retry'
        | 'minutes-review'
        | 'minutes-submit'
        | 'minutes-cancel'
        | 'minutes-finish'
        | 'minutes-query'
        | 'minutes-retry';
    }
  | {
      type: 'revise';
      meetingAt: string;
      cutoff: string;
      extraTopic: string;
      recipients: string[];
    }
  | { type: 'gap'; choice: 'wait' | 'provisional' | 'exclude' }
  | { type: 'say'; text: string }
  | { type: 'pause'; stopped: boolean }
  | { type: 'exercise'; outcome: PartyFlow['outcome']; oaUnavailable: boolean }
);
export type PartyEffect =
  | {
      type: 'message';
      role: 'user' | 'assistant' | 'system';
      text: string;
      anchor?: boolean;
    }
  | {
      type: 'artifact';
      name: string;
      body: string;
      notice?: boolean;
      minutes?: boolean;
      version?: number;
    }
  | { type: 'remember'; text: string };
export const PARTY_RECIPIENTS = [
  '办公室',
  '政策法规处',
  '政务服务处',
  '数据管理处',
  '基础设施处',
  '网络安全处',
];
export function isPartyRequest(text: string) {
  return /党组会/.test(text) && /第?\s*(14|十四)\s*次|下次|新一轮/.test(text);
}
export function createPartyFlow(id: string): {
  flow: PartyFlow;
  effects: PartyEffect[];
} {
  return {
    flow: {
      id,
      stage: 'systems',
      revision: 1,
      planVersion: 1,
      at: '2026-09-22T14:00:00+08:00',
      anchor: '',
      selected: ['oa', 'topics', 'tracking'],
      unavailable: ['inspection'],
      meetingAt: '2026-09-24T09:30',
      cutoff: '2026-09-23T16:00',
      extraTopic: '',
      recipients: [...PARTY_RECIPIENTS],
      decisions: [],
      artifacts: [],
      feedback: '',
      outcome: 'success',
      stopped: false,
    },
    effects: [
      {
        type: 'message',
        role: 'assistant',
        anchor: true,
        text: '第13次会议仍有一项未闭环：基础设施处验收支撑材料待补。9月21日处室已更正原记录，“技术验收通过”不能作为整体办结依据。此次会前检查将沿用材料、时点和责任意见三项核对方法。\n\n请先核对本次要使用的系统。已为你选中必要来源，尚未开始读取或发送。',
      },
    ],
  };
}
export const partySystemNames = (ids: PartySystem[]) =>
  ids.map((id) => PARTY_SYSTEMS.find((s) => s.id === id)?.name).join('、');
export function partyPlan(flow: PartyFlow) {
  return [
    flow.selected.includes('oa')
      ? '引用第13次纪要v2和9月21日更正，核对未完成承诺'
      : '只引用已有会务摘要，原纪要全文待提供',
    flow.selected.includes('topics')
      ? '收集6个处室议题与材料，列明收件缺口'
      : '议题材料待本人补充，不推定已收齐',
    flow.selected.includes('tracking')
      ? '对照督办进度与来源口径，差异保留待核'
      : '督办来源暂未选择，仅列核查清单',
    ...(flow.selected.includes('resources')
      ? ['核对会务资料包内的信息系统支撑材料']
      : []),
    ...(flow.extraTopic ? [`补充议题：${flow.extraTopic}`] : []),
    '形成议程、落实清单、督办报告及通知工作稿，交你审阅',
    flow.selected.includes('oa')
      ? '你逐项确认后才发送通知，并核对结果'
      : '保留通知工作稿，等待具备授权的发送途径',
  ];
}
export function partyStageLabel(flow: PartyFlow) {
  if (flow.stopped) return '已暂停';
  return {
    systems: '核对系统',
    plan: '审阅计划',
    collecting: '收集与核查中',
    gap: '处理材料缺口',
    waiting: '等待核实',
    review: '成果待审阅',
    confirm: '发送待确认',
    sending: '等待发送结果',
    failed: '发送失败',
    unknown: '结果待核实',
    sent: '通知结果已记录',
    internal: '已保留内部工作稿',
    minutes: '纪要待审阅',
    'minutes-confirm': '纪要提交待确认',
    'minutes-submitted': '纪要待审定',
    closed: '承诺跟踪中',
    'minutes-sending': '等待纪要提交结果',
    'minutes-failed': '纪要提交失败',
    'minutes-unknown': '纪要提交结果待核',
  }[flow.stage];
}
export function partyTransition(
  previous: PartyFlow,
  action: PartyAction,
): { flow: PartyFlow; effects: PartyEffect[] } {
  if (action.taskId !== previous.id) return { flow: previous, effects: [] };
  const f = structuredClone(previous);
  const effects: PartyEffect[] = [];
  const reject = (text: string) => {
    f.feedback = text;
    return { flow: f, effects: [] };
  };
  if (action.revision !== f.revision)
    return reject('记录已更新，请按当前卡片核对后操作。未重复执行。');
  f.feedback = '';
  const message = (
    text: string,
    anchor = true,
    role: 'assistant' | 'user' | 'system' = 'assistant',
  ) => effects.push({ type: 'message', role, text, anchor });
  const settle = (label: string, summary: string) => {
    if (f.anchor)
      f.decisions.push({
        anchor: f.anchor,
        label,
        summary,
        version: f.planVersion,
      });
    message(summary, false, 'user');
  };
  const finish = () => {
    f.revision++;
    return { flow: f, effects };
  };
  if (action.type === 'pause') {
    if (
      ['sending', 'minutes-sending', 'unknown', 'minutes-unknown'].includes(
        f.stage,
      )
    )
      return reject('请求已发出，不能以暂停撤销。请等待或查询结果。');
    f.stopped = action.stopped;
    return finish();
  }
  if (f.stopped) return reject('当前工作已暂停，请恢复后继续。');
  const post = postMeetingTransition(previous, action);
  if (post) return post;
  if (action.type === 'draft') {
    if (action.selected && f.stage === 'systems')
      f.selectionDraft = [...action.selected];
    if (action.gapChoice && ['gap', 'waiting'].includes(f.stage))
      f.gapDraft = action.gapChoice;
    if (action.discardPlan) f.planDraft = undefined;
    if (
      action.plan &&
      ['plan', 'review', 'confirm', 'internal'].includes(f.stage)
    ) {
      const draft = { ...f.planDraft, ...action.plan };
      f.planDraft = Object.fromEntries(
        Object.entries(draft).filter(
          ([key, value]) =>
            JSON.stringify(value) !==
            JSON.stringify(f[key as keyof PartyPlanDraft]),
        ),
      );
    }
    return { flow: f, effects };
  }
  if (action.type === 'exercise') {
    if (
      ['sending', 'unknown', 'minutes-sending', 'minutes-unknown'].includes(
        f.stage,
      )
    )
      return reject('发送结果待确认期间不改变执行设置，请先核对结果。');
    f.outcome = action.outcome;
    f.unavailable = action.oaUnavailable
      ? [...new Set([...f.unavailable, 'oa' as const])]
      : f.unavailable.filter((id) => id !== 'oa');
    return finish();
  }
  if (action.type === 'say') {
    const text = action.text.trim();
    if (!text) return { flow: previous, effects };
    const local = (next: PartyAction) => partyTransition(previous, next);
    if (/不发送|取消发送/.test(text) && f.stage === 'confirm')
      return local({ ...action, type: 'cancel-send' });
    if (
      /仅内部|内部版|内部流转/.test(text) &&
      ['review', 'confirm', 'failed'].includes(f.stage)
    )
      return local({ ...action, type: 'internal' });
    if (/重选系统|调整系统|更换系统/.test(text))
      return local({ ...action, type: 'systems-edit' });
    if (
      /待核.*继续|保留.*待核/.test(text) &&
      ['gap', 'waiting'].includes(f.stage)
    )
      return local({ ...action, type: 'gap', choice: 'provisional' });
    if (
      /不引用|不采用.*指标|排除.*指标/.test(text) &&
      ['gap', 'waiting'].includes(f.stage)
    )
      return local({ ...action, type: 'gap', choice: 'exclude' });
    if (
      /再检查|重新核查|重新检查/.test(text) &&
      ![
        'sending',
        'unknown',
        'sent',
        'minutes',
        'minutes-confirm',
        'minutes-sending',
        'minutes-unknown',
        'minutes-failed',
        'minutes-submitted',
        'closed',
      ].includes(f.stage)
    ) {
      settle('重新核查', text);
      f.stage = 'plan';
      f.reuseEvidence = false;
      message(
        '可以重新核查。请审阅当前计划，确认后重新读取所选范围；不会因此发送任何通知。',
      );
      return finish();
    }
    const time = /(?:截止|收件).*?(\d{1,2})[:：](\d{2})/.exec(text);
    const topic =
      /(?:增加|新增|补充|追加)(?:一个)?(?:议题)?[：:：\s]*(.+?)(?:议题)?[。！!]?$/u.exec(
        text,
      );
    if (
      (time || topic) &&
      ![
        'sending',
        'unknown',
        'sent',
        'minutes',
        'minutes-confirm',
        'minutes-sending',
        'minutes-unknown',
        'minutes-failed',
        'minutes-submitted',
        'closed',
      ].includes(f.stage)
    ) {
      const cutoff = time
        ? f.cutoff.slice(0, 11) + time[1].padStart(2, '0') + ':' + time[2]
        : f.cutoff;
      return local({
        taskId: f.id,
        revision: f.revision,
        type: 'revise',
        meetingAt: f.meetingAt,
        cutoff,
        extraTopic: topic ? topic[1].replace(/[。！!]$/, '') : f.extraTopic,
        recipients: f.recipients,
      });
    }
    message(text, false, 'user');
    message(
      /会后|纪要|会议结果/.test(text) && f.stage === 'sent'
        ? '已收到会后补充。会前通知记录保持不变；请提供会议决定与责任分工，当前不会据此自动提交纪要或发布组织方法。'
        : '请在当前卡片中核对具体选择。你也可以补充“材料截止改为17:00”“增加营商环境议题”或“调整系统”。这段说明没有改变已确认范围，也没有执行发送。',
      false,
    );
    return finish();
  }
  if (action.type === 'systems-confirm') {
    if (f.stage !== 'systems') return reject('当前不在系统选择阶段。');
    if (action.selected.some((id) => !PARTY_SYSTEMS.some((s) => s.id === id)))
      return reject('包含未知系统，未改变本次范围。');
    if (!action.selected.length)
      return reject('至少选择一个授权来源，或先在对话中补充材料。');
    if (action.selected.some((id) => f.unavailable.includes(id)))
      return reject('所选系统当前不可用。请取消该来源；勾选不能取得权限。');
    f.selected = [...new Set(action.selected)];
    f.selectionDraft = undefined;
    settle(
      '系统已选定',
      `本次使用：${partySystemNames(f.selected)}。仅在现有会务授权范围读取。`,
    );
    f.stage = 'plan';
    message('本次系统范围已确定。下面是具体计划，正式发送仍会单独请你确认。');
    return finish();
  }
  if (action.type === 'systems-edit') {
    if (
      [
        'sending',
        'unknown',
        'sent',
        'minutes',
        'minutes-confirm',
        'minutes-sending',
        'minutes-unknown',
        'minutes-failed',
        'minutes-submitted',
        'closed',
      ].includes(f.stage)
    )
      return reject('已有发送请求或结果，不能修改其来源。请先核对结果。');
    settle('调整系统范围', '重新选择本次使用的系统；已有工作稿保留为旧版本。');
    f.stage = 'systems';
    f.planDraft = undefined;
    f.selectionDraft = undefined;
    f.planVersion++;
    f.reuseEvidence = false;
    f.gapDecision = undefined;
    f.artifacts = [];
    f.noticeArtifact = undefined;
    message('请重新核对系统。新范围确认后重审计划，旧稿和旧确认不会用于发送。');
    return finish();
  }
  if (action.type === 'revise') {
    if (
      [
        'systems',
        'sending',
        'unknown',
        'sent',
        'minutes',
        'minutes-confirm',
        'minutes-sending',
        'minutes-unknown',
        'minutes-failed',
        'minutes-submitted',
        'closed',
      ].includes(f.stage)
    )
      return reject('请先完成系统选择，或核对已发出的请求结果。');
    const parseLocal = (value: string) =>
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
        ? Date.parse(value + ':00+08:00')
        : NaN;
    if (
      !Number.isFinite(parseLocal(action.meetingAt)) ||
      !Number.isFinite(parseLocal(action.cutoff))
    )
      return reject('请填写完整且有效的会议与材料截止时间。');
    if (parseLocal(action.cutoff) >= parseLocal(action.meetingAt))
      return reject('材料截止时间必须早于会议时间。');
    if (
      !action.recipients.length ||
      action.recipients.some((r) => !PARTY_RECIPIENTS.includes(r))
    )
      return reject('接收范围须为已授权会务处室，至少保留一个接收方。');
    if (action.extraTopic.length > 120)
      return reject('补充议题请控制在120字以内。');
    const changes = [
      f.meetingAt !== action.meetingAt
        ? `会议时间：${f.meetingAt.replace('T', ' ')} → ${action.meetingAt.replace('T', ' ')}`
        : '',
      f.cutoff !== action.cutoff
        ? `材料截止：${f.cutoff.replace('T', ' ')} → ${action.cutoff.replace('T', ' ')}`
        : '',
      f.extraTopic !== action.extraTopic
        ? `补充议题：${f.extraTopic || '无'} → ${action.extraTopic || '无'}`
        : '',
      f.recipients.join() !== action.recipients.join()
        ? `通知范围：${action.recipients.join('、')}`
        : '',
    ].filter(Boolean);
    if (!changes.length) return reject('没有变更，当前计划及工作稿保持不变。');
    settle('变更已记录', changes.join('\n'));
    f.reuseEvidence =
      Boolean(f.gapDecision) && f.extraTopic === action.extraTopic.trim();
    f.meetingAt = action.meetingAt;
    f.cutoff = action.cutoff;
    f.extraTopic = action.extraTopic.trim();
    f.recipients = [...new Set(action.recipients)];
    f.planDraft = undefined;
    f.planVersion++;
    f.stage = 'plan';
    f.artifacts = [];
    f.noticeArtifact = undefined;
    f.requestId = undefined;
    if (!f.reuseEvidence) f.gapDecision = undefined;
    message(
      `已形成计划 v${f.planVersion}。旧稿继续保留；${f.reuseEvidence ? '已有来源核查和缺口决定继续沿用，只更新受影响的会前材料。' : '接下来按新范围核查并重新形成成果。'}此前发送确认已失效。`,
    );
    return finish();
  }
  if (action.type === 'plan-confirm') {
    if (Object.keys(f.planDraft || {}).length)
      return reject('有未保存的计划调整，请先保存或放弃修改。');
    if (f.stage !== 'plan') return reject('当前没有待审阅的计划。');
    if (f.selected.some((id) => f.unavailable.includes(id)))
      return reject('有来源已不可用，请调整系统选择后重审计划。');
    settle(
      '计划已确认',
      `按计划 v${f.planVersion} 开始读取与核查；正式发送另行确认。`,
    );
    f.stage = 'collecting';
    message('正在读取授权资料、核对第13次未完成项，并整理本次会前材料。');
    return finish();
  }
  if (action.type === 'collect-finish') {
    if (f.stage !== 'collecting') return { flow: previous, effects: [] };
    if (f.selected.some((id) => f.unavailable.includes(id))) {
      f.stage = 'systems';
      message(
        '读取前复核发现来源不可用，相关操作已停止。请调整系统，不会自动换用未选择来源。',
      );
      return finish();
    }
    if (f.reuseEvidence && f.gapDecision) {
      f.stage = 'review';
      message(
        '已沿用上一轮来源核查和缺口处理，更新受影响材料。请审阅新版本，发送需重新确认。',
      );
      effects.push(...partyArtifacts(f));
      return finish();
    }
    f.stage = 'gap';
    message(
      [
        f.selected.includes('topics')
          ? '议题材料收到5个处室，基础设施处的附件尚未齐套。'
          : '未选择议题报送系统，收件情况保留为待提供。',
        f.selected.includes('tracking')
          ? '督办摘要写“85%”，跟踪台账写“72%”，统计分母不同，尚无责任处室对本次口径的确认。'
          : '未选择督办跟踪系统，本次不提供已核实的完成率。',
        '我不会自行选一个数值作为正式结论。请决定工作稿如何处理这些缺口。',
      ].join('\n\n'),
    );
    return finish();
  }
  if (action.type === 'gap') {
    if (!['gap', 'waiting'].includes(f.stage))
      return reject('当前没有待处理的材料缺口。');
    if (action.choice === 'wait') {
      settle(
        '等待责任处室核实',
        '暂停形成最终材料，等待责任处室补件和确认口径；未自动发起催办。',
      );
      f.stage = 'waiting';
      message('已保留断点。可以稍后继续，或先形成带待核标记的工作稿。');
      return finish();
    }
    f.gapDecision = action.choice;
    settle(
      '工作稿处理方式已确定',
      action.choice === 'exclude'
        ? '暂不引用完成率，将缺件与口径问题列入单独核查清单。'
        : '先形成工作稿，未齐附件和统计口径均保留待核标记。',
    );
    f.stage = 'review';
    message(
      '会前工作稿已形成。请先预览材料；通知只说明会议安排与报送要求，不包含未经核实的进度结论。',
    );
    effects.push(...partyArtifacts(f));
    return finish();
  }
  if (action.type === 'prepare-send') {
    if (f.stage !== 'review') return reject('请先审阅当前工作稿。');
    if (!f.selected.includes('oa') || f.unavailable.includes('oa'))
      return reject(
        '当前未选择可用OA来源，只能保留工作稿。若要发送，请调整系统并重审计划。',
      );
    settle('准备发送通知', '准备发送当前版本会议通知；尚未发送。');
    f.stage = 'confirm';
    message(
      '请核对下方唯一发送动作。议程及督办工作稿中的待核项不会随这次通知发送。',
    );
    return finish();
  }
  if (action.type === 'cancel-send') {
    if (f.stage !== 'confirm') return reject('当前没有待确认发送。');
    settle('未发送', '暂不发送，返回工作稿审阅。');
    f.stage = 'review';
    message('通知仍为工作稿，可以继续修改。没有产生发送请求。');
    return finish();
  }
  if (action.type === 'internal') {
    if (!['review', 'confirm', 'failed'].includes(f.stage))
      return reject('当前不能改为内部稿，请先核对已发请求结果。');
    settle('仅保留内部稿', '仅保留本人会前工作稿，不发送通知。');
    f.stage = 'internal';
    message(
      '已保留内部工作稿，全部发送动作停止。可在对话中提出修改后重新审阅。',
    );
    return finish();
  }
  if (action.type === 'send') {
    if (Object.keys(f.planDraft || {}).length)
      return reject('有未保存的内容或范围调整，请先保存或放弃修改。未发送。');
    if (f.stage !== 'confirm')
      return reject('当前没有有效的逐项发送确认，未执行操作。');
    if (!f.selected.includes('oa') || f.unavailable.includes('oa'))
      return reject(
        '发送前复核未通过：OA当前不可用，未发出请求。请取消后调整来源。',
      );
    settle(
      '已确认本次发送',
      `确认发送通知 v${f.planVersion} 至${f.recipients.join('、')}，不包含待核工作稿。`,
    );
    f.requestId = `${f.id}-notice-v${f.planVersion}-${f.revision}`;
    f.submittedRequestId = f.requestId;
    f.stage = 'sending';
    message('通知请求已发出，正在等待对应结果。请勿重复发送。');
    return finish();
  }
  const completeSend = () => {
    f.stage = 'sent';
    f.receipt = `LOCAL-OA-${f.requestId}`;
    message(
      '已收到本次通知的本地样例回执。通知版本和接收范围已关联留存，待核工作稿未随通知发送。',
    );
    effects.push({
      type: 'remember',
      text: `第14次党组会通知v${f.planVersion}已获得合成回执；会议${f.meetingAt}，材料截止${f.cutoff}。进度口径仍待核，不记录为正式事实。`,
    });
  };
  if (action.type === 'send-finish') {
    if (f.stage !== 'sending') return { flow: previous, effects: [] };
    if (f.outcome === 'failure') {
      f.stage = 'failed';
      message(
        '执行端明确返回发送失败，没有成功回执。当前内容保留，可以核对后重新确认发送。',
      );
    } else if (f.outcome === 'unknown') {
      f.stage = 'unknown';
      message(
        '尚未收到可核验结果，不能标记发送成功。请按原请求编号查询，不直接重发。',
      );
    } else completeSend();
    return finish();
  }
  if (action.type === 'query-receipt') {
    if (f.stage !== 'unknown') return reject('当前没有结果未知的请求。');
    if (f.unavailable.includes('oa'))
      return reject('OA查询当前不可用，原请求继续保持未知；未重发。');
    settle('查询原请求', `查询请求 ${f.requestId} 的处理结果，不重新发送。`);
    completeSend();
    return finish();
  }
  if (action.type === 'retry') {
    if (f.stage !== 'failed')
      return reject('只有明确失败的请求才允许重新准备发送。');
    settle('重新核对发送', '重新核对接收方和内容版本，再确认本次重试。');
    f.stage = 'confirm';
    message('请重新确认本次发送。上次失败记录保留，不沿用旧确认。');
    return finish();
  }
  return { flow: previous, effects: [] };
}

function partyArtifacts(f: PartyFlow): PartyEffect[] {
  const format = (value: string) => value.replace('T', ' ');
  const heading = `第14次党组会 · 工作版本 v${f.planVersion}`;
  const note = `\n\n---\n来源说明：${PARTY_SOURCE}。记录时点2026-09-22；仅用于逻辑与交互核验，正式状态以外部系统为准。`;
  const metric =
    f.gapDecision === 'exclude'
      ? '本版不引用完成率。85%与72%的来源差异保留在核查清单中。'
      : '完成率待核：摘要85%与跟踪台账72%的分母不同，未经责任处室确认，不作为会议结论。';
  const topics = f.selected.includes('topics')
    ? '已汇集5个处室报送，基础设施处附件待补；最终上会顺序待办公室审定。'
    : '未读取议题报送系统，议题及材料待本人提供，不标记为已收齐。';
  return [
    {
      type: 'artifact',
      name: '第14次党组会议程（工作稿）',
      body: `# ${heading}\n\n会议时间：${format(f.meetingAt)}\n\n材料截止：${format(f.cutoff)}\n\n## 拟议安排\n1. 核对第13次会议未完成跟踪项。\n2. 审阅本次处室议题及相关材料。\n3. 核查督办进展与证据缺口。${f.extraTopic ? `\n4. ${f.extraTopic}。` : ''}\n\n## 收件与审阅\n${topics}\n\n本文件为工作稿，不代表正式议程获批。${note}`,
    },
    {
      type: 'artifact',
      name: '议定事项落实核对清单（工作稿）',
      body: `# 第13次会议落实核对清单\n\n${heading}\n\n| 核对内容 | 当前依据 | 后续工作 |\n| --- | --- | --- |\n| 验收状态更正 | 技术验收通过，手续材料未齐；采用COR-13-01，旧结论已替代 | 不作整体办结判断 |\n| 上次材料与责任分工 | ${f.selected.includes('oa') ? '会议纪要的会务授权引用' : '仅有历史摘要，纪要原文待提供'} | 按来源逐项复核 |\n| 基础设施处附件 | ${f.selected.includes('topics') ? '本次报送缺少支撑附件' : '未读取报送记录'} | 等待处室提供，不推定已闭环 |\n| 督办统计口径 | ${f.selected.includes('tracking') ? '摘要与台账分母不同' : '未读取督办来源'} | 责任处室核实后再引用 |\n\n未完成项继续保留，未自动创建正式督办或发送催办。${note}`,
    },
    {
      type: 'artifact',
      name: '督办情况核查报告（工作稿）',
      body: `# 督办情况核查报告\n\n${heading}\n\n## 来源范围\n${partySystemNames(f.selected)}。\n\n## 核查结果\n${f.selected.includes('tracking') ? metric : '未读取督办跟踪系统，本版不提供完成率或已核实进度。'}\n\n## 待核事项\n核实统计时点、分母、附件齐套及责任处室意见。缺口尚未关闭，不能作为正式进度结论。${f.extraTopic ? `\n\n## 补充议题\n${f.extraTopic}的依据待核，不从原有记录推断新的正式事实。` : ''}${note}`,
    },
    {
      type: 'artifact',
      notice: true,
      name: '第14次党组会会议通知（待发送）',
      body: `# 关于报送第14次党组会材料的通知\n\n接收范围：${f.recipients.join('、')}\n\n拟定会议时间：${format(f.meetingAt)}。请于${format(f.cutoff)}前提供议题说明及必要支撑材料，由办公室汇总核对。\n\n${f.extraTopic ? `本次另补充“${f.extraTopic}”议题，请相关处室提供授权范围内的材料。\n\n` : ''}本通知不包含尚未核实的进度数字，不随附待核督办工作稿。会议具体安排以正式通知为准。\n\n版本：v${f.planVersion}；当前为待发送工作稿。发送对象或内容变更后需重新确认。${note}`,
    },
  ];
}
