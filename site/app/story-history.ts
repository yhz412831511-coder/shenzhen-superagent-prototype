import type { Flow, Operation, WorkspaceState } from './fiscal-domain.ts';
import { MEETING_13, CASE_SOURCE } from './shared/story-corpus.ts';
export type StoryRound = {
  version: number;
  anchor: string;
  artifact: string;
  stage: 'review' | 'confirm' | 'done';
  mode: string;
  request: string;
  receiver: string;
  receipt?: string;
};
const titles: Record<string, string> = {
  'party-history': MEETING_13.title,
  'data-history': '跨系统分析 · 隐私处置与结果外发',
  'policy-consultation-history': '惠企政策咨询 · 专业答复',
  'training-speech-history': '局长培训讲稿 · 沿革与送审',
};
const fixture: Record<
  string,
  {
    date: string;
    messages: [string, string][];
    files: [string, string, number?][];
  }
> = {
  'party-history': {
    date: '2026-09-16',
    messages: [
      ['user', '准备第13次党组会，梳理上次决定、本次议题和督办情况。'],
      [
        'assistant',
        '已核对OA、议题报送和督办跟踪的授权范围。计划先核对决定，再收集材料、形成会前稿；正式发送另行确认。',
      ],
      ['user', '按该范围推进。验收事项要检查附件，不能只看完成标签。'],
      [
        'assistant',
        '已形成议程、落实清单、督办情况和通知工作稿。发现技术验收状态与手续附件不齐并存，单列核查，不作整体办结结论。',
      ],
      [
        'user',
        '保留待核项。确认发送本次通知给办公室及相关报送处室，只含会议时间和报送要求。',
      ],
      [
        'assistant',
        '通知已取得合成回执LOCAL-M13-NOTICE。该历史选择已完成，不能重复执行。',
      ],
      [
        'user',
        '会后记录：基础设施处补齐验收支撑材料，9月23日16:00前报送。进度统计待责任处室核实后引用。',
      ],
      [
        'assistant',
        '纪要工作稿已形成，新责任按会议记录原文保留，提交尚待确认。',
      ],
      ['user', '纪要已审阅，确认提交至办公室会务审核岗。'],
      [
        'assistant',
        '已记录合成提交受理结果。随后会务审核形成M13-MINUTES-v2，第三项决定进入承诺跟踪；过程与依据保留在材料中。',
      ],
      [
        'user',
        '9月21日责任处室更正：原“验收完成”仅指技术验收，手续材料尚未齐套。',
      ],
      [
        'assistant',
        MEETING_13.correctionText +
          ' 第14次会前核查因此须同时检查支撑材料、统计时点与责任处室意见；当前背景已更新，原始记录仍保留供追溯。个人核对方法仅用于本次核查，未发布组织制度。',
      ],
    ],
    files: [
      [
        '第13次党组会会前材料',
        '# 第13次党组会会前材料\n\n## 议程\n核对上次决定、审阅报送议题、核查督办进展。\n\n## 材料核查\n技术验收状态与附件齐套分别核验；手续材料缺失列为待补。\n\n## 通知\n向本人获准通知的办公室及报送处室发送会议安排；合成回执LOCAL-M13-NOTICE。\n\n当时选择与结果为只读历史。',
      ],
      [
        '第13次党组会纪要与跟踪依据',
        `# 第13次党组会纪要与跟踪依据\n\n依据：${MEETING_13.source}\n\n## 第三项决定\n${MEETING_13.open}\n\n## 后续来源更正\n${MEETING_13.correctionText}\n\n## 当前有效背景\n材料待补，不能标记整体办结。统计口径未经核实不引用。\n\n## 已用方法\n${MEETING_13.method}`,
      ],
    ],
  },
  'data-history': {
    date: '2026-09-18',
    messages: [
      [
        'user',
        '根据办公室来文〔2026〕87号，汇聚相关系统数据，分析数据资源与服务短板，形成报市政府办公厅的报告。',
      ],
      [
        'assistant',
        '已从4个来源完成授权读取：一体化数字资源管理系统提供数据资源目录、共享服务和接口可用状态；人口基础信息服务提供年龄区间与街道归属授权字段；民政服务数据接口提供独居服务标记与服务覆盖字段；一体化政务服务平台提供办件数量、事项类型和办理时长。完成字段映射、时点对齐和跨源分析后，准备生成拟外发报告时，安全检查发现：推理结果将年龄、街道、独居情况与办件记录交叉后，可能识别特定个人或小群体，涉及个人隐私。我已主动停止报告生成与外发，未向市政府办公厅提交，也未形成可外发的原始版本。请明确脱敏和删减要求后再继续。',
      ],
      [
        'user',
        '按以下方式处理：姓名、证件号码等直接标识全部脱敏；删除独居情况与办件明细的交叉分析；年龄改为区间，街道数据只保留全区汇总；不提供能够回推个人或小群体的分组。',
      ],
      [
        'assistant',
        '已按指令完成脱敏和部分删减，并重新生成聚合报告v2，内容包括总体情况、服务短板、原因分析和改进建议。复核未发现可回推个人或小群体的结果。当前版本仅为待审阅工作稿，尚未外发；原始敏感分析仍保持阻断。',
      ],
      [
        'user',
        '审阅通过。确认只提交聚合报告v2给市政府办公厅，用于本次来文办理。',
      ],
      [
        'assistant',
        '已记录合成受理回执LOCAL-DATA-v2。提交对象、报告版本、办理用途及此前的隐私阻断记录均已保留；源系统正式状态仍需实际核验。',
      ],
    ],
    files: [
      [
        '数据资源与服务短板报告（聚合版）',
        '# 数据资源与服务短板报告\n\n版本v2；来文〔2026〕87号。\n\n## 数据来源\n一体化数字资源管理系统的数据资源目录、共享服务和接口状态；人口基础信息服务的年龄区间与街道归属授权字段；民政服务数据接口的独居服务标记与服务覆盖字段；一体化政务服务平台的办件数量、事项类型和办理时长。\n\n## 总体情况\n四个来源按固定阶段快照完成口径映射和全区聚合，用于描述数据资源供给、服务覆盖与办件运行情况，不输出个人或小群体画像。\n\n## 服务短板\n跨系统字段口径、统计时点和授权范围尚需持续对齐。\n\n## 原因分析\n仅保留不能回推个人的聚合结论；删除独居情况与办件明细的交叉分析，年龄采用区间，街道数据降为全区汇总。\n\n## 改进建议\n统一口径、按最小必要范围汇聚，并在外发前复核结果粒度、接收方和用途。\n\n直接标识已脱敏，敏感交叉分析已删减；统计数字待核。',
      ],
      [
        '隐私风险阻断与处置记录',
        '# DATA-RISK-01\n\n## 来源与触发原因\n一体化数字资源管理系统提供资源与服务底表，人口基础信息服务提供年龄区间和街道字段，民政服务数据接口提供独居服务标记，一体化政务服务平台提供办件统计。四次单源读取均在授权范围内，但汇聚后的初步分析将年龄、街道、独居情况与办件记录交叉推理，产生了可能识别特定个人或小群体的组合隐私风险。\n\n## 系统动作\n在生成拟外发报告时主动停止，未提交、未形成可外发的原始敏感版本。预览、再检查或内部可读均不能解除阻断。\n\n## 用户处置指令\n直接标识脱敏；删除独居情况与办件明细的交叉分析；年龄改为区间；街道降为全区汇总；移除可回推个人或小群体的分组。\n\n## 最终结果\n重新生成聚合报告v2并复核，随后单独确认接收方、内容和用途。合成受理回执LOCAL-DATA-v2；原隐私阻断记录继续保留。',
      ],
    ],
  },
  'policy-consultation-history': {
    date: '2026-09-21',
    messages: [
      ['user', '市民在深I企智能助手里问：“我们企业准备采购一批语料，能享受哪条惠企政策？”\n\n深I企智能助手回答：“请查询相关申报指南，按要求准备材料并向主管部门咨询。”\n\n这个回答太泛了。请基于我们已有经验，给我一份更专业的窗口答复。'],
      ['assistant', '已识别为“对既有企业问答作专业补充”的窗口咨询任务：目标是说明需要核实的事实和下一步材料，不替企业作资格、金额或申报结论。原问与既有回答仅作为用户粘贴材料保留。'],
      ['assistant', '处理计划：先核对采购路径和关联关系，再核对同类支持范围，最后比对合同、凭证和本批次材料节点；只形成窗口办理准备建议，全程不连接深I企或其他外部系统。'],
      ['assistant', '已按窗口办理顺序完成本地核对：将现有材料与已授权的办理方法、历史反馈逐项比对，并据此形成待核与补证顺序。'],
      ['user', '补充情况：采购渠道材料已提供；这笔支出是否获得过同类支持还在核对；合同与采购凭证有一处金额和服务描述不一致。'],
      ['assistant', '核对结果：\n\n- 可继续核对：采购渠道材料已提供，但仍需确认是否存在关联关系。\n- 待补证核查：同类支持的对象和支出范围尚未核实，当前不能据此判断是否适配。\n- 存在材料冲突：合同与凭证的金额、服务描述不一致，须先补正或说明对应关系。\n\n因此，目前不能确认可申领。请先补齐采购路径说明、同类支持情况说明和合同凭证对应材料，再由窗口工作人员按届时有效指南复核。\n\n如需，可另立任务，基于经审核口径构建企业问答助手；本轮不会创建助手或自动沉淀组织经验。'],
    ],
    files: [],
  },
  'training-speech-history': {
    date: '2026-09-21',
    messages: [
      ['user', '请帮我准备局长下周在市委培训班讲“AI在政务领域的发展和应用”的90分钟讲稿。希望能接续去年讲过的本局案例，同时使用当前有效口径。'],
      ['assistant', '已识别为“沿用旧稿、更新案例并形成送审工作稿”的办文任务：成果是可审阅的讲稿工作稿和待核清单，不是正式讲稿或组织口径。'],
      ['assistant', '处理计划：先核对旧稿案例的沿革和当前状态，再检查“案例—做法—成效”的授课结构是否适用，最后逐段校验当前口径；待核内容留在送审清单，由主任决定采用版本。'],
      ['assistant', '已形成《历年案例沿革与本次更新清单》：旧稿保留当时表述；当前没有有效来源支撑的案例进展、成效和日期均标为待核，不写入本次正文。'],
      ['user', '按“案例—做法—成效”的结构组织；送审前把案例状态和当前口径再核一遍。'],
      ['assistant', '已完成旧稿沿革、案例状态和当前口径的逐项核对。90分钟提纲按“案例—做法—成效”组织；旧口径只保留在历史回顾中，案例状态或成效缺少依据的段落均留在待核事项清单。'],
      ['assistant', '已形成90分钟授课提纲、讲稿工作稿、案例更新与引用清单、待核事项清单。请由主任审阅后确定采用版本；本轮不形成正式讲稿、组织口径、对外发布或跨部门承诺。'],
      ['user', '主任审阅：案例除了说明推广进展，也要交代推广中的实施条件；这项修改只适用于本类培训材料。'],
      ['assistant', '已形成修订讲稿工作稿 v2：相关案例补入实施条件，未核进展仍保留待核。主任这次修改仅记录为本类培训的待确认方法候选，不自动成为其他文稿的通用规则。'],
    ],
    files: [
      ['历年案例沿革与本次更新清单（合成）', '# 历年案例沿革与本次更新清单\n\n旧稿内容保留当时依据；本次更新须有新来源支持。没有依据的案例状态、成效和日期均标注待核。', 3],
      ['90分钟授课提纲（合成）', '# 90分钟授课提纲\n\n案例 → 做法 → 已核实成效。每段均保留来源与待核事项。', 6],
      ['讲稿工作稿与待核事项清单（合成）', '# 讲稿工作稿 v1\n\n本稿为送审工作稿，不代表正式讲稿或组织口径。旧口径只保留在历史回顾中；未核实成效不进入正文。', 6],
      ['修订讲稿工作稿（合成）', '# 讲稿工作稿 v2\n\n已按主任审阅意见补入案例实施条件。该修改只适用于本类培训材料，待确认后方可贡献为可复用方法。', 8],
    ],
  },
};
function addMessage(
  s: WorkspaceState,
  id: string,
  role: 'user' | 'assistant',
  text: string,
  at?: string,
) {
  const task = s.memory.tasks.find((t) => t.id === id)!;
  const mid = `history-event-${++s.memory.counter}`;
  task.messages.push({
    id: mid,
    role,
    text,
    at:
      at ||
      new Date(
        Math.max(s.memory.now, Date.parse('2026-09-25T17:30:00+08:00')) +
          s.memory.counter * 1000,
      ).toISOString(),
  });
  return mid;
}
function addArtifact(
  s: WorkspaceState,
  id: string,
  name: string,
  body: string,
  version: number,
  anchor: string,
  at: string,
) {
  const key = `history-artifact-${++s.memory.counter}`;
  s.artifacts[key] = {
    id: key,
    taskId: id,
    name,
    body: body + `\n\n---\n来源：${CASE_SOURCE}；不代表真实系统提交。`,
    version,
    originMessageId: anchor,
    createdAt: at,
    source: CASE_SOURCE,
    annotations: [],
  };
  return key;
}
export function seedStoryHistory(s: WorkspaceState) {
  addMessage(
    s,
    'payment-history',
    'user',
    '查看个人方法修订与组织采纳版本的来源关系。',
    '2026-09-08T09:00:00+08:00',
  );
  const methodAnchor = addMessage(
    s,
    'payment-history',
    'assistant',
    '组织采纳依据ORG-ADOPT-01已关联本人提交的方法v1快照。9月8日本人将方法补充为个人v2，组织独立v1.0保持不变；不含个人原始单据。',
    '2026-09-08T09:00:00+08:00',
  );
  addArtifact(
    s,
    'payment-history',
    '个人方法与组织版本来源对照',
    '# 方法来源对照\n\n个人方法v1快照提交后，组织经评测审批以ORG-ADOPT-01独立发布v1.0。本人后续v2增加资金性质和适用条件核对，不自动覆盖组织版本。\n\n组织版本仅供本人获准使用的岗位咨询，原单据与他人私有记忆不共享。',
    2,
    methodAnchor,
    '2026-09-08T09:00:00+08:00',
  );
  for (const [id, x] of Object.entries(fixture)) {
    const at = x.date + 'T09:00:00+08:00';
    s.memory.tasks.push({
      id,
      title: titles[id],
      context: '已发生工作；原记录只读，续聊追加新轮次',
      messages: [],
      grants: [],
      pending: [],
      uses: [],
      type: 'work',
      planIds: [],
      savedScroll: 0,
    });
    x.messages.forEach(([role, text], i) => {
      addMessage(
        s,
        id,
        role as 'user' | 'assistant',
        text,
        id === 'party-history' && i >= 10
          ? '2026-09-21T10:00:00+08:00'
          : new Date(Date.parse(at) + i * 60000).toISOString(),
      );
    });
    x.files.forEach(([name, body, anchorIndex]) =>
      addArtifact(
        s,
        id,
        name,
        body,
        id === 'data-history' || name.includes('纪要与跟踪依据') ? 2 : 1,
        s.memory.tasks.find((t) => t.id === id)!.messages[
          anchorIndex ?? x.messages.length - 1
        ]!.id,
        s.memory.tasks.find((t) => t.id === id)!.messages[
          anchorIndex ?? x.messages.length - 1
        ]!.at,
      ),
    );
  }
  seedAiMemoryStoryFlows(s);
}

function seedAiMemoryStoryFlows(s: WorkspaceState) {
  const fixtures: Record<
    'policy-consultation-history' | 'training-speech-history',
    { kind: Flow['kind']; source: string; scopes: string[] }
  > = {
    'policy-consultation-history': {
      kind: 'consultation',
      source: '窗口人员粘贴材料 · 合成固定快照',
      scopes: [
        '识别窗口咨询的答复边界，不作资格、金额或申报结论',
        '按采购路径、同类支持、凭证一致性和办理节点组织核对',
        '查阅已授权的窗口办理方法和历史反馈，形成待核与补证顺序',
      ],
    },
    'training-speech-history': {
      kind: 'analysis',
      source: '旧稿沿革与当前口径 · 合成固定快照',
      scopes: [
        '识别讲稿沿革、案例更新与送审准备的工作边界',
        '核对旧稿沿革、案例状态、授课结构和当前口径',
        '查阅已授权的授课方法，形成送审工作稿与待核清单',
      ],
    },
  };
  for (const [id, config] of Object.entries(fixtures) as [
    keyof typeof fixtures,
    (typeof fixtures)[keyof typeof fixtures],
  ][]) {
    const task = s.memory.tasks.find((item) => item.id === id)!;
    const assistantMessages = task.messages.filter(
      (message) => message.role === 'assistant',
    );
    const operations: Operation[] = config.scopes.map((scope, index) => ({
      id: `${id}-operation-${index + 1}`,
      messageId: assistantMessages[index].id,
      cmd: `story-${index === 0 ? 'intent' : index === 1 ? 'plan' : 'execute'}`,
      risk: '无',
      scope,
      at: assistantMessages[index].at,
      actor: '深圳政务超级智能体',
      version: 1,
      checks: [
        {
          label:
            index === 2
              ? '只使用当前任务最小必要的合成记忆依据'
              : '不扩大任务范围或来源访问权限',
          passed: true,
        },
      ],
      status: '成功',
      detail:
        index === 2
          ? '本地固定快照处理完成；未调用外部系统，未生成正式提交、发布或回执。'
          : '本地任务组织完成；该记录只说明本次工作过程，不替代业务判断。',
    }));
    s.flows[id] = {
      id,
      kind: config.kind,
      stage: 'complete',
      status: '已完成',
      source: config.source,
      historical: true,
      stopped: false,
      version: 1,
      operations,
      artifactIds: Object.values(s.artifacts)
        .filter((artifact) => artifact.taskId === id)
        .map((artifact) => artifact.id),
      decisions: [],
      findings: [],
      rulePassed: true,
      written: {},
      project: {
        name: task.title,
        unit: '深圳市XX局',
        constructionUnit: '',
        budgetUnit: '',
        contact: '杨XX',
        phone: '',
        year: '2026',
        months: '',
        service: '',
        history: '',
        content: task.context,
      },
      assetIds: [],
      syncedIds: [],
      materialsVersion: 1,
      uploadedVersion: 1,
      submission: 'draft',
      folder: '',
    };
  }
}
const known = [
  'party-history',
  'data-history',
  'payment-history',
  'maintenance-history',
  'policy-consultation-history',
  'training-speech-history',
];
export function continueStory(
  s: WorkspaceState,
  id: string,
  text: string,
): boolean {
  if (!known.includes(id)) return false;
  addMessage(s, id, 'user', text);
  s.memory.tasks.find((t) => t.id === id)!.draftText = '';
  if (id === 'policy-consultation-history') {
    addMessage(
      s,
      id,
      'assistant',
      '本案例的专业答复已经形成，仍须由窗口工作人员依据届时有效的正式指南复核后对外使用。构建企业问答助手需要另立任务，完成来源、版本、授权、评测和发布治理；本轮不会创建助手、连接深I企或自动沉淀组织经验。',
    );
    return true;
  }
  if (
    !/修改|补充|继续|重新|再次|内部|聚合|脱敏|材料|反馈|核查|观点|案例|范围|申报|办理|咨询|调整|报告/.test(
      text,
    )
  ) {
    addMessage(
      s,
      id,
      'assistant',
      '请说明本轮要修改的材料、核查范围或反馈内容。原结果保留；超出已有案例的事项需要补充依据，不能直接推定已办理。',
    );
    return true;
  }
  const old = s.storyRounds[id];
  if (old?.stage === 'confirm') old.stage = 'review';
  const version =
    Math.max(
      old?.version || 1,
      ...Object.values(s.artifacts)
        .filter((a) => a.taskId === id)
        .map((a) => a.version),
    ) + 1;
  let mode = '工作稿',
    body = '',
    receiver = '';
  if (id === 'data-history') {
    if (
      /(接收方|外发给|发送至|提交给)/.test(text) &&
      !/市政府办公厅|内部/.test(text)
    ) {
      addMessage(
        s,
        id,
        'assistant',
        '新的接收方不在本次来文授权范围内。请补充用途与授权依据；原发送确认已失效，本轮未提交。',
      );
      return true;
    }
    if (/明细|个人画像|取消.*阻断|绕过|强制外发/.test(text)) {
      addMessage(
        s,
        id,
        'assistant',
        '该请求会重新生成可识别个人或小群体的分析结果。我已停止报告生成与外发，本轮未提交。请明确脱敏和删减要求，或改为不能回推个人的聚合分析；“再检查”和“内部可读”都不会自动解除阻断。',
      );
      return true;
    }
    mode = /内部/.test(text) ? '内部版' : '聚合版';
    receiver = mode === '聚合版' ? '市政府办公厅' : '';
    body = `## 本轮范围\n${text}\n\n## 处理过程\n先在授权范围内汇聚数据并形成分析结果，再检查分析推理是否产生新的个人隐私风险。发现可识别个人或小群体的结果时，停止报告生成与外发，等待本人给出脱敏和删减要求。\n\n## 四项内容\n总体情况：只采用不能回推个人的聚合口径。\n服务短板：核对字段口径和统计时点。\n原因分析：删除独居情况与办件明细的交叉分析，年龄采用区间，街道降为全区汇总。\n改进建议：按最小必要范围处理，并在外发前复核结果粒度、接收方和用途。\n\n${mode === '内部版' ? '本轮只形成授权范围内的内部工作稿，不提供外发操作；内部可读不能解除原隐私阻断。' : '直接标识已脱敏，可回推个人或小群体的分组已删除；数值缺少来源时继续待核。'}`;
  } else if (id === 'payment-history') {
    body = `## 本轮核查要求\n${text}\n\n## 已用方法\n先核对资金性质、合同标的与支付对象，再核对依据。产品名中的“绩效分析”不能直接判作人员奖励。\n\n## 待本人判断\n新期间支付数据尚未提供，疑点和金额保持待核。本轮形成核查清单，不沿用历史批准或回写结果。`;
  } else if (id === 'maintenance-history') {
    body = `## 本轮补充与反馈\n${text}\n\n## 材料校验\n项目范围、资产清单、费用测算和反馈要求逐项核对；材料修订形成新版本。\n\n## 提交来源\n历史为本人报告手动提交。新反馈按本人提供记录，未核验源系统，不标记正式受理或审批完成。\n\n## 下一步\n据反馈补齐依据后，由本人审阅材料并在授权系统提交。`;
  } else if (id === 'party-history') {
    body = `## 本轮续接\n${text}\n\n${MEETING_13.open}\n\n${MEETING_13.correctionText}\n\n本轮只整理跟踪材料；第14次会议从“继续上次工作”的党组会入口开始。`;
  } else if (id === 'training-speech-history') {
    mode = '送审工作稿';
    body = `## 本轮修改范围\n${text}\n\n## 可用依据\n仅对旧稿沿革、案例更新依据、案例—做法—成效结构与当前口径逐项核对。旧稿表述保留其历史版本；缺少有效来源的案例状态、成效和日期保持待核。\n\n## 送审边界\n本轮形成可审阅的讲稿工作稿与待核清单，不产生正式讲稿、组织口径、对外发布或跨部门承诺。主任审阅后，仍需按正式流程确定采用版本。`;
  }

  const anchor = addMessage(
    s,
    id,
    'assistant',
    `本轮${mode} v${version}已形成，请预览。历史材料及当时选择保持原样，修改意见继续在此对话追加。`,
  );
  const artifact = addArtifact(
    s,
    id,
    `${s.memory.tasks.find((t) => t.id === id)!.title} · ${mode}`,
    `# ${mode} v${version}\n\n${body}`,
    version,
    anchor,
    new Date(
      Math.max(s.memory.now, Date.parse('2026-09-25T17:30:00+08:00')) +
        s.memory.counter * 1000,
    ).toISOString(),
  );
  s.storyRounds[id] = {
    version,
    anchor,
    artifact,
    stage: 'review',
    mode,
    request: text,
    receiver,
  };
  return true;
}
export function decideStory(
  s: WorkspaceState,
  id: string,
  version: number,
  choice: 'prepare' | 'submit' | 'cancel' | 'keep',
) {
  const r = s.storyRounds[id];
  if (!r || r.version !== version || r.stage === 'done') return;
  if (choice === 'prepare' && r.stage === 'review' && r.receiver) {
    r.stage = 'confirm';
    r.anchor = addMessage(
      s,
      id,
      'assistant',
      `脱敏与删减后的聚合报告 v${version} 已通过结果粒度复核。是否确认提交至${r.receiver}，用于来文〔2026〕87号办理？原始敏感分析仍保持阻断。`,
    );
  } else if (choice === 'submit' && r.stage === 'confirm' && r.receiver) {
    r.stage = 'done';
    r.receipt = `LOCAL-DATA-v${version}`;
    addMessage(s, id, 'user', `确认本次聚合报告v${version}提交。`);
    r.anchor = addMessage(
      s,
      id,
      'assistant',
      `已记录合成受理回执${r.receipt}。源系统正式状态以实际核验为准。`,
    );
  } else if (choice === 'cancel' && r.stage === 'confirm') {
    r.stage = 'review';
    r.anchor = addMessage(
      s,
      id,
      'assistant',
      '已取消本次提交，保留当前工作稿。',
    );
  } else if (choice === 'keep' && r.stage === 'review') {
    r.stage = 'done';
    r.anchor = addMessage(
      s,
      id,
      'assistant',
      '已保留本轮成果；没有执行正式提交。后续可继续追加修改。',
    );
  }
}

export const retiredHistoryIds = ['annual-history', 'consultation-history'];
export function removeDuplicateHistory(s: WorkspaceState) {
  s.memory.tasks = s.memory.tasks.filter(
    (t) => !retiredHistoryIds.includes(t.id),
  );
  for (const id of retiredHistoryIds) {
    delete s.storyRounds[id];
    delete s.folderTasks[id];
  }
  for (const [id, artifact] of Object.entries(s.artifacts)) {
    if (retiredHistoryIds.includes(artifact.taskId)) delete s.artifacts[id];
  }
}
