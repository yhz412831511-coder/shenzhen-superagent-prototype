import type {
  Memory,
  MemoryState,
  Payload,
  Scope,
  Source,
} from './memory-domain';
export function initialMemoryState(now: number): MemoryState {
  const date = new Date(now).toISOString();
  const due = new Date(now + 5 * 86400000).toISOString().slice(0, 10);
  const source: Source = {
    label: '个人材料记录（原对话已删除）',
    quote:
      '本组记录用于核对记忆的形成与使用；职责和术语均为任务样例，不代表正式财政口径。',
    nature: 'user',
    accessible: true,
  };
  const create = (
    id: string,
    title: string,
    payload: Payload,
    scope: Scope = 'personal',
    status: 'active' | 'candidate' = 'active',
    extra: Partial<Source> = {},
  ): Memory => ({
    id,
    scope,
    owner: scope === 'personal' ? '林思远' : '市财政局 · 资金监管处室',
    current: id + '-v1',
    subscribed: scope !== 'personal',
    revisions: [
      {
        id: id + '-v1',
        number: 1,
        title,
        payload,
        source: { ...source, ...extra },
        validFrom: extra.url ? date : '2026-01-01T00:00:00+08:00',
        validTo: '',
        recordedAt: date,
        status,
        reason: '任务材料初始化',
        confirmedBy:
          status === 'active'
            ? extra.url
              ? '依据公开来源整理的个人示例'
              : '样例确认记录'
            : '',
      },
    ],
    events: [{ at: date, text: '从任务工作记录形成' }],
  });

  return {
    now,
    offset: 0,
    counter: 20,
    notice: '',
    tasks: [],
    schedules: [],
    contributions: [],
    memories: [
      create(
        'term-shenxiaoi',
        '深小i',
        {
          kind: 'semantic',
          term: '深小i',
          aliases: ['深小I'],
          definition:
            '深圳面向企业和群众的AI政务助手，提供政策解答和办事引导，可通过“i深圳”APP进入使用。',
          context: '深圳政务服务',
          distinction:
            '“深小i”是AI政务助手，“i深圳”APP是其访问入口之一。理解该名称不代表已连接该服务或取得代办权限。',
          example: '请说明深小i是什么，以及它与i深圳APP的关系。',
        },
        'personal',
        'active',
        {
          taskId: undefined,
          eventId: undefined,
          label: '深圳市政务服务和数据管理局 · 业务知识库 · 2025-03-12',
          quote:
            '公开答复说明：深小i为企业群众提供政策解答和办事引导，可在i深圳APP中进入对话。此处为来源摘要；术语用途于2026-09-08核对。',
          url: 'https://www.sz.gov.cn/hdjl/ywzsk/zwfwsjglj/zwfw/content/post_12068659.html',
          nature: 'published',
        },
      ),
      create('term-set', '材料齐套', {
        kind: 'semantic',
        term: '材料齐套',
        aliases: ['齐套'],
        definition: '本次材料清单要求的文件及其对应版本已齐备。',
        context: '专项材料核对',
        distinction: '材料齐备不代表资金用途已核实，也不代表业务审查通过。',
        example: '先核对材料是否齐套，再登记需要补充的原始凭证。',
      }),
      create(
        'term-service',
        '齐套',
        {
          kind: 'semantic',
          term: '齐套',
          aliases: [],
          definition: '本次服务交付清单中的报告和验收附件已提交。',
          context: '服务交付核对',
          distinction: '提交齐备与验收通过分别判断。',
          example: '请核对服务交付附件是否齐套。',
        },
        'personal',
        'active',
        {
          taskId: undefined,
          eventId: undefined,
          label: '服务交付材料记录',
          quote: '本次服务交付中的齐套指交付清单中的报告和验收附件已经提交。',
        },
      ),
      create(
        'term-candidate',
        '闭合单',
        {
          kind: 'semantic',
          term: '闭合单',
          aliases: [],
          definition: '材料整理人暂用于指称已收到补充材料的记录单。',
          context: '专项材料核对',
          distinction: '这是从材料中提取的称谓，含义需要本人核对。',
          example: '',
        },
        'personal',
        'candidate',
        {
          nature: 'extracted',
          quote: '附件笔记：本次补充材料已经记入闭合单。',
        },
      ),
      create('work-prep', '资金材料准备与下一阶段安排', {
        kind: 'working',
        work: '在超级智能体上梳理资金材料准备要求，并明确后续工作安排。',
        context: '专项材料核对',
        keyPoints: [
          {
            kind: 'requirement',
            text: '核对本次清单要求的材料及版本；材料齐备不代表资金用途已经核实。',
            eventId: 'onboarding',
            at: date,
          },
          {
            kind: 'decision',
            text: '下一阶段先梳理材料缺口，再开展后续核查。',
            eventId: 'onboarding',
            at: date,
          },
        ],
        memories: [
          { memoryId: 'term-set', revisionId: 'term-set-v1' },
          { memoryId: 'plan-next', revisionId: 'plan-next-v1' },
        ],
      }),
      create('method-source', '核对材料时先列来源与版本', {
        kind: 'procedural',
        method: '先列明材料来源和版本，再整理需补充内容。',
        conditions: '专项材料核对',
        steps: ['识别文件及版本', '比对本次材料清单', '列出缺失和待确认内容'],
        exceptions: '遇到不同版本口径冲突时，请本人确认，不自行合并。',
      }),
      create('event-meaning', '明确“材料齐套”的使用边界', {
        kind: 'episodic',
        subtype: 'past',
        context: '专项材料核对',
        event: '经办人员解释了材料齐套的含义。',
        decision: '仅用于描述材料齐备状态。',
        outcome: '后续工作区分材料状态和业务核实结果。',
        occurredAt: date,
      }),
      create('plan-next', '下一阶段梳理资金材料缺口', {
        kind: 'episodic',
        subtype: 'plan',
        goal: '先核对材料齐套情况，形成需要补充的材料清单。',
        context: '专项材料核对',
        responsible: '本人',
        due,
        phase: '下一阶段',
        completion: '形成缺口清单，并逐项标明材料来源和待确认内容。',
        progress: 'planned',
      }),
      create('plan-next-meeting', '准备下一阶段工作沟通', {
        kind: 'episodic',
        subtype: 'plan',
        goal: '围绕资金材料缺口整理需要沟通的问题。',
        context: '专项材料核对',
        responsible: '本人',
        due: '',
        phase: '下次工作沟通前',
        completion: '问题清单经本人核对。',
        progress: 'planned',
      }),
      create(
        'function-base',
        '资金监管处室 · 职能依据待补充',
        {
          kind: 'functional',
          subtype: 'formal',
          entity: '市财政局 · 资金监管处室',
          responsibility:
            '正式职能以单位提供的职能说明为准；当前尚未录入经核验的正式文件。',
          context: '资金监管',
          confirmedBy: '',
        },
        'department',
        'candidate',
        {
          nature: 'extracted',
          label: '职能说明待补充',
          quote: '尚未取得正式职能说明，不能据此确定部门法定职责。',
        },
      ),
      create('assignment-current', '本次材料核对 · 经办分工', {
        kind: 'functional',
        subtype: 'assignment',
        entity: '本人',
        responsibility:
          '负责本事项材料范围整理与缺口记录；业务结论按正式流程确认。',
        context: '专项材料核对',
        confirmedBy: '本事项经办人员',
      }),
    ],
  };
}
