/** Shared immutable case snapshots. Product-owned runtime objects never live here. */
export const CASE_SOURCE = '合成案例 · 固定阶段快照';
export const CASE_AS_OF = '2026-09-25 17:30';
export const MEETING_13 = {
  id: 'party-history',
  title: '第13次党组会 · 会议与落实跟踪',
  at: '2026-09-16T09:00:00+08:00',
  source: 'M13-MINUTES-v2',
  correction: 'COR-13-01',
  policy: 'meeting-policy-1.0',
  completed: [
    '形成议程与会前材料',
    '经本人确认发送会议通知',
    '会议结果形成纪要并经审核后提交',
  ],
  open: '基础设施处补齐验收支撑材料，原约定2026-09-23 16:00前报送。',
  correctionText:
    '9月21日责任处室更正：原“验收完成”只指技术验收，手续材料仍未齐套。旧来源v1停止作为整体办结依据，当前采用v2。',
  method:
    '检查完成状态时同时核对支撑材料、统计时点与责任处室意见。该个人做法来自上次核查，不自行成为组织制度。',
};
export const MEMORY_KINDS = [
  {
    id: 'M1',
    name: '语义记忆',
    definition: '保留专业领域的规则、定义、术语与对象关系，并说明适用边界。',
    distinction: '用于准确理解专业概念，例如 CODES 的业务含义；不以单笔解释泛化为普遍规则。',
  },
  {
    id: 'M2',
    name: '程序记忆',
    definition: '保留把任务办成的实操经验、检查顺序和例外处理。',
    distinction: '区别于明面的制度章程；个人方法与组织发布版本保持独立。',
  },
  {
    id: 'M3',
    name: '情景记忆',
    definition: '保留上一次发生过什么、当时如何判断及关键背景。',
    distinction: '历史经过不等于当前结论；本次仍须核对最新依据。',
  },
  {
    id: 'M4',
    name: '前瞻记忆',
    definition: '在办理节点提示下一步、复核条件与待办，而非持续制造提醒噪音。',
    distinction: '只提示已有依据的下一步；可静默或标记已处理，不替任何人新增承诺。',
  },
  {
    id: 'M5',
    name: '情感记忆',
    definition: '保留影响判断方向的关键教训、红线和指导性原则。',
    distinction: '政务场景中以风险权重表达，不拟人化；必须有来源、适用范围和人工判断边界。',
  },
] as const;
export type MemoryKind = (typeof MEMORY_KINDS)[number]['id'];
export type MemoryCase = {
  id: string;
  kind: MemoryKind;
  title: string;
  content: string;
  owner: string;
  scope: string;
  state: '有效' | '待核' | '已替代';
  tier: '热' | '温' | '冷';
  version: string;
  taskId: string;
  source: string;
  evidence: string;
  date: string;
  lastUsed: string;
  related: string[];
  history: { version: string; date: string; reason: string; content: string }[];
};
export const memoryCases: MemoryCase[] = [
  {
    id: 'm13-working',
    kind: 'M3',
    title: '第13次会议：仍待补齐的验收材料',
    content: MEETING_13.open,
    owner: '杨XX',
    scope: '本人会务授权范围',
    state: '有效',
    tier: '热',
    version: '2',
    taskId: 'party-history',
    source: MEETING_13.source,
    evidence: '纪要v2引用处室更正记录COR-13-01。技术验收与材料齐套分别跟踪。',
    date: '2026-09-21',
    lastUsed: '2026-09-22',
    related: ['m13-correction', 'm13-commitment'],
    history: [
      {
        version: '1',
        date: '2026-09-16',
        reason: '首次核对',
        content: '原记录将技术验收描述为整体完成。',
      },
      {
        version: '2',
        date: '2026-09-21',
        reason: '源记录更正传播',
        content: '整体办结依据不足，支撑材料待补。',
      },
    ],
  },
  {
    id: 'm13-correction',
    kind: 'M5',
    title: '技术验收不等于手续材料齐套',
    content:
      '本次会议语境下，“技术验收完成”只说明技术环节，不能推导整体办结或正式归档。',
    owner: '杨XX',
    scope: '第13—14次会务',
    state: '有效',
    tier: '热',
    version: '2',
    taskId: 'party-history',
    source: 'COR-13-01',
    evidence: MEETING_13.correctionText,
    date: '2026-09-21',
    lastUsed: '2026-09-22',
    related: ['m13-working', 'm13-method', 'm13-old'],
    history: [
      {
        version: '1',
        date: '2026-09-16',
        reason: '原来源',
        content: '完成状态依据不完整。',
      },
      {
        version: '2',
        date: '2026-09-21',
        reason: '责任处室更正',
        content: '区分技术验收、材料齐套与正式办结。',
      },
    ],
  },
  {
    id: 'm13-method',
    kind: 'M2',
    title: '会议落实情况的证据核对方法',
    content: MEETING_13.method,
    owner: '杨XX',
    scope: '本人会务核查',
    state: '有效',
    tier: '温',
    version: '1',
    taskId: 'party-history',
    source: 'M13-REVIEW-03',
    evidence: '第13次审阅纠错产生的方法；第14次计划主动加入证据检查。',
    date: '2026-09-16',
    lastUsed: '2026-09-22',
    related: ['m13-correction', 'm13-episode'],
    history: [
      {
        version: '1',
        date: '2026-09-16',
        reason: '从已确认工作处理形成个人方法',
        content: '核对状态时同时检查证据、口径和时间。',
      },
    ],
  },
  {
    id: 'm13-episode',
    kind: 'M3',
    title: '第13次会议材料审阅经过',
    content:
      '会前审阅发现“状态完成”与附件不齐并存，承办人要求单列缺件，会议决定继续跟踪，不以系统标签代替证据。',
    owner: '杨XX',
    scope: '本人参与的会议',
    state: '有效',
    tier: '温',
    version: '1',
    taskId: 'party-history',
    source: 'M13-REVIEW-03 / M13-MINUTES-v2',
    evidence: '保留当时选择与会后决定；个人经历不自动扩大到全单位共享。',
    date: '2026-09-16',
    lastUsed: '2026-09-22',
    related: ['m13-method', 'm13-commitment'],
    history: [
      {
        version: '1',
        date: '2026-09-16',
        reason: '会议闭环',
        content: '保存关键经历及依据引用。',
      },
    ],
  },
  {
    id: 'm13-commitment',
    kind: 'M4',
    title: '基础设施处补报验收支撑材料',
    content: MEETING_13.open,
    owner: '杨XX的跟踪视图',
    scope: '原纪要授权的跟踪范围',
    state: '有效',
    tier: '热',
    version: '1',
    taskId: 'party-history',
    source: 'M13-MINUTES-v2 / 第三项决定',
    evidence: '责任来自已审核纪要，本人仅跟踪，不新增责任人或变更期限。',
    date: '2026-09-16',
    lastUsed: '2026-09-22',
    related: ['m13-working', 'm13-episode'],
    history: [
      {
        version: '1',
        date: '2026-09-16',
        reason: '依据会议决定记录',
        content: '到期检查补件情况，未回执则继续待核。',
      },
    ],
  },
  {
    id: 'fiscal-term',
    kind: 'M1',
    title: '支付备注中的“绩效分析”',
    content:
      'ERS电子资源利用绩效分析平台数据库费中的“绩效分析”属于产品名称，应结合合同标的、服务内容、支付对象及依据核对，不仅凭关键词认定为人员绩效奖励。',
    owner: '杨XX',
    scope: '该笔数据库服务申请',
    state: '有效',
    tier: '温',
    version: '1',
    taskId: 'payment-history',
    source: '财政支付审查 / 用途说明',
    evidence: '来自使用者对原备注的纠正；不代表支付申请审核通过。',
    date: '2026-09-03',
    lastUsed: '2026-09-08',
    related: ['fiscal-personal', 'fiscal-org'],
    history: [
      {
        version: '1',
        date: '2026-09-03',
        reason: '用户提供业务语境',
        content: '保留产品名称与实际用途的区别。',
      },
    ],
  },
  {
    id: 'fiscal-personal',
    kind: 'M2',
    title: '支付用途备注核对与补充说明方法',
    content:
      '先读用途与合同材料；确认资金性质；核对支付对象与适用依据；对缺口形成补充说明请求。关键词仅作线索，不直接裁决。',
    owner: '杨XX',
    scope: '本人财政核查辅助',
    state: '有效',
    tier: '温',
    version: '2',
    taskId: 'payment-history',
    source: '个人教法记录 / 财政审查对话',
    evidence:
      '个人源版本v2；曾贡献不含单据、账号和人员信息的方法快照v1，组织副本独立更新。',
    date: '2026-09-03',
    lastUsed: '2026-09-08',
    related: ['fiscal-term', 'fiscal-org'],
    history: [
      {
        version: '1',
        date: '2026-09-03',
        reason: '提取已确认教法',
        content: '不能只凭绩效关键词判断。',
      },
      {
        version: '2',
        date: '2026-09-08',
        reason: '个人补充适用例外',
        content: '先核定资金性质；无依据保持待核。',
      },
    ],
  },
  {
    id: 'fiscal-org',
    kind: 'M2',
    title: '支付用途备注核对与补充说明方法',
    content:
      '组织采用脱敏方法快照，供财政资金监管岗位咨询使用。适用条件、检查步骤、例外和来源齐全；不包含个人原始单据。',
    owner: '财政资金监管业务组',
    scope: '本人获准使用的岗位经验',
    state: '有效',
    tier: '温',
    version: '1.0',
    taskId: 'payment-history',
    source: 'ORG-METHOD-01 / 独立组织版本',
    evidence:
      '组织采纳记录ORG-ADOPT-01，来源为个人v1快照。个人后续改动不会自动覆盖组织版本。',
    date: '2026-09-05',
    lastUsed: '2026-09-08',
    related: ['fiscal-personal', 'role-consult'],
    history: [
      {
        version: '1.0',
        date: '2026-09-05',
        reason: '组织评测与批准采用',
        content: '以独立组织对象发布授权岗位方法。',
      },
    ],
  },
  {
    id: 'ops-working',
    kind: 'M3',
    title: '2027年运维申报的材料版本与反馈',
    content:
      '运维项目已形成申报材料；提交来源为本人告知，未取得真实源系统回执。继续核对审核反馈与材料版本。',
    owner: '杨XX',
    scope: '本人项目申报',
    state: '待核',
    tier: '热',
    version: '4',
    taskId: 'maintenance-history',
    source: '运维申报历史 / 用户提交说明',
    evidence:
      '“我已在平台提交”与平台受理回执是不同证据，不能直接推定正式受理。',
    date: '2026-09-07',
    lastUsed: '2026-09-08',
    related: ['ops-method', 'ops-commitment'],
    history: [
      {
        version: '3',
        date: '2026-09-07',
        reason: '材料整理',
        content: '形成工作稿。',
      },
      {
        version: '4',
        date: '2026-09-07',
        reason: '用户告知已提交',
        content: '记录提交来源，等待平台反馈依据。',
      },
    ],
  },
  {
    id: 'ops-method',
    kind: 'M2',
    title: '运维项目申报材料检查清单',
    content:
      '先确定运维边界与既有资产，核对服务期、费用口径、必要附件和版本，再交本人到业务平台确认提交。',
    owner: '杨XX',
    scope: '同类运维申报辅助',
    state: '有效',
    tier: '温',
    version: '1',
    taskId: 'maintenance-history',
    source: '项目统筹岗位咨询摘要',
    evidence: '岗位建议是办理指引，不能代替项目审批或费用核定。',
    date: '2026-09-07',
    lastUsed: '2026-09-08',
    related: ['ops-working', 'role-consult'],
    history: [
      {
        version: '1',
        date: '2026-09-07',
        reason: '依据授权咨询及办理过程',
        content: '形成个人材料核对方法。',
      },
    ],
  },
  {
    id: 'ops-commitment',
    kind: 'M4',
    title: '跟踪运维项目审核反馈',
    content:
      '本人已要求持续关注该申报的反馈；出现退补材料时回到原对话，核对原因并形成修订清单。',
    owner: '杨XX',
    scope: '本人已授权的反馈跟踪',
    state: '有效',
    tier: '热',
    version: '1',
    taskId: 'maintenance-history',
    source: '运维对话 / 开启反馈追踪的选择',
    evidence: '只有已有授权范围内的反馈读取，修订和再次提交分别确认。',
    date: '2026-09-07',
    lastUsed: '2026-09-08',
    related: ['ops-working'],
    history: [
      {
        version: '1',
        date: '2026-09-07',
        reason: '继承本人跟踪授权',
        content: '反馈到达后提醒并提供处理建议。',
      },
    ],
  },
  {
    id: 'role-consult',
    kind: 'M1',
    title: '岗位咨询与业务审批的职责边界',
    content:
      '财政资金监管岗位提供用途核对建议；项目统筹岗位提供运维申报指引。咨询答复不构成正式审批，也不会因一次提问启动系统提交。',
    owner: '杨XX',
    scope: '财政与运维岗位咨询',
    state: '有效',
    tier: '温',
    version: '1',
    taskId: 'maintenance-history',
    source: '岗位职责摘要及咨询对话',
    evidence: '仅采用公开职责与授权经验，不暴露其他处室原文或个人记忆。',
    date: '2026-09-08',
    lastUsed: '2026-09-08',
    related: ['fiscal-org', 'ops-method'],
    history: [
      {
        version: '1',
        date: '2026-09-08',
        reason: '咨询职责说明',
        content: '区分建议、本人判断和正式业务执行。',
      },
    ],
  },
  {
    id: 'data-method',
    kind: 'M5',
    title: '拟外发分析结果的隐私检查方法',
    content:
      '完成授权范围内的数据汇聚后，在生成拟外发报告前检查分析推理结果。若结果可能识别个人或小群体，立即停止生成与外发，等待本人明确脱敏和删减要求；处理后重新复核结果粒度、接收方和用途。',
    owner: '杨XX',
    scope: '跨系统报告编制',
    state: '有效',
    tier: '温',
    version: '1',
    taskId: 'data-history',
    source: 'DATA-RISK-01 / 处置记录',
    evidence:
      '一体化数字资源管理系统、人口基础信息服务、民政服务数据接口和一体化政务服务平台的四次单源读取均在授权范围内；汇聚后的初步分析对年龄、街道、独居情况与办件记录进行交叉推理，产生组合隐私风险并触发主动停止。按用户指令脱敏和删减后重新生成聚合版本。',
    date: '2026-09-18',
    lastUsed: '2026-09-18',
    related: ['role-consult'],
    history: [
      {
        version: '1',
        date: '2026-09-18',
        reason: '由已完成处置提取方法',
        content:
          '授权读取不等于分析推理结果可以外发；拟外发结果需单独检查隐私风险。',
      },
    ],
  },
  {
    id: 'policy-rule', kind: 'M1', title: '惠企咨询：当前适用条件（合成）',
    content: '仅在当前合成案例中，先核对采购路径、关联关系和支持范围；信息不全时不下资格或金额结论。',
    owner: '组织政策服务岗', scope: '惠企受理岗位包', state: '待核', tier: '热', version: '1', taskId: 'policy-consultation-history',
    source: '合成政策条件卡', evidence: '固定演示快照；不代表已核验的真实政策、条款或窗口期。', date: '2026-09-21', lastUsed: '2026-09-21', related: ['policy-case', 'policy-method'],
    history: [{ version: '1', date: '2026-09-21', reason: '演示样例建立', content: '用于解释为何不能只复述通用政策。' }],
  },
  {
    id: 'policy-case', kind: 'M5', title: '惠企咨询：凭证不一致退回教训（合成）',
    content: '历史样例中，材料名称相似但凭证与合同无法对应，需保留待补项而不是直接判断符合。',
    owner: '组织政策服务岗', scope: '惠企受理岗位包', state: '待核', tier: '温', version: '1', taskId: 'policy-consultation-history',
    source: '合成退回案例', evidence: '仅说明演示中的核对方向，不能泛化为真实企业记录或普遍政策。', date: '2026-09-21', lastUsed: '2026-09-21', related: ['policy-rule', 'policy-method'],
    history: [{ version: '1', date: '2026-09-21', reason: '演示样例建立', content: '帮助解释“为什么还要核对”。' }],
  },
  {
    id: 'policy-method', kind: 'M2', title: '惠企咨询：三项初步核对法（合成）',
    content: '先问采购路径与关联关系，再核同类支持范围，最后核凭证、合同与节点；仅用于窗口初步辅助。',
    owner: '组织政策服务岗', scope: '惠企受理岗位包', state: '待核', tier: '热', version: '1', taskId: 'policy-consultation-history',
    source: '已审核合成岗位包', evidence: '演示用岗位经验；正式发布须另经有权人员审核。', date: '2026-09-21', lastUsed: '2026-09-21', related: ['policy-rule', 'policy-reminder'],
    history: [{ version: '1', date: '2026-09-21', reason: '演示样例建立', content: '把泛化回答转为可核对的下一步。' }],
  },
  {
    id: 'policy-reminder', kind: 'M4', title: '惠企咨询：补件与复核提醒（合成）',
    content: '材料补齐或窗口期临近时提醒复核；具体日期和责任人在真实办理时重新确认。',
    owner: '杨XX', scope: '本人窗口跟进授权范围', state: '待核', tier: '温', version: '1', taskId: 'policy-consultation-history',
    source: '合成办理节点', evidence: '演示提醒不构成真实时限、企业承诺或自动办理结果。', date: '2026-09-21', lastUsed: '2026-09-21', related: ['policy-method'],
    history: [{ version: '1', date: '2026-09-21', reason: '演示样例建立', content: '说明前瞻记忆只提示下一步。' }],
  },
  {
    id: 'training-episode', kind: 'M3', title: '培训讲稿：去年案例与修改经历（合成）',
    content: '旧稿中的案例和措辞保留当时版本；本次是否更新须以新的授权依据核对，不从故事需要推定进展。',
    owner: '综合文字岗', scope: '综合文字岗位包', state: '待核', tier: '温', version: '1', taskId: 'training-speech-history',
    source: '合成历史讲稿', evidence: '固定演示快照；不代表真实局长讲稿、案例状态或组织决定。', date: '2026-09-21', lastUsed: '2026-09-21', related: ['training-rule', 'training-method'],
    history: [{ version: '1', date: '2026-09-21', reason: '演示样例建立', content: '说明旧稿如何成为本次核对起点。' }],
  },
  {
    id: 'training-method', kind: 'M2', title: '培训讲稿：案例—做法—成效结构（合成）',
    content: '先用可核实案例进入，再说明做法，最后只使用已核实成效；适用范围限于本类培训。',
    owner: '综合文字岗', scope: '综合文字岗位包', state: '待核', tier: '热', version: '1', taskId: 'training-speech-history',
    source: '已审核合成岗位包', evidence: '演示用方法，不代表个人偏好已成为普遍规范。', date: '2026-09-21', lastUsed: '2026-09-21', related: ['training-episode', 'training-reminder'],
    history: [{ version: '1', date: '2026-09-21', reason: '演示样例建立', content: '组织90分钟讲稿的结构。' }],
  },
  {
    id: 'training-rule', kind: 'M1', title: '培训讲稿：当前口径校验（合成）',
    content: '当前安排与历史描述分别呈现；没有有效依据时标记待业务处室确认，不编造调整原因。',
    owner: '综合文字岗', scope: '综合文字岗位包', state: '待核', tier: '热', version: '1', taskId: 'training-speech-history',
    source: '合成有效口径卡', evidence: '真实使用时须以正式文件和来源版本重新核验。', date: '2026-09-21', lastUsed: '2026-09-21', related: ['training-episode'],
    history: [{ version: '1', date: '2026-09-21', reason: '演示样例建立', content: '防止旧提法被直接沿用。' }],
  },
  {
    id: 'training-reminder', kind: 'M4', title: '培训讲稿：送审与补证提醒（合成）',
    content: '对尚待核实的案例设置送审前复核提醒；建议日期不自动成为其他处室承诺。',
    owner: '杨XX', scope: '本人材料准备授权范围', state: '待核', tier: '温', version: '1', taskId: 'training-speech-history',
    source: '合成工作节点', evidence: '只展示前瞻提醒机制，不代表真实日程或正式送审状态。', date: '2026-09-21', lastUsed: '2026-09-21', related: ['training-method'],
    history: [{ version: '1', date: '2026-09-21', reason: '演示样例建立', content: '防止待核材料遗漏。' }],
  },
  {
    id: 'm13-old',
    kind: 'M1',
    title: '验收事项整体完成（旧判断）',
    content:
      '旧来源曾以技术验收状态推断整体办结。该推断已被更正，不再参与第14次工作续接。',
    owner: '杨XX',
    scope: '历史审计可见；禁止作为当前依据',
    state: '已替代',
    tier: '冷',
    version: '1',
    taskId: 'party-history',
    source: 'M13-MINUTES-v1 → COR-13-01',
    evidence:
      '保留原事件用于追溯，不删除或暗改过去。当前引用“技术验收不等于手续材料齐套”的更正解释。',
    date: '2026-09-16',
    lastUsed: '2026-09-16',
    related: ['m13-correction'],
    history: [
      {
        version: '1',
        date: '2026-09-16',
        reason: '旧来源',
        content: '当时错误推断。',
      },
      {
        version: '替代',
        date: '2026-09-21',
        reason: '源更正',
        content: '退出当前有效检索，仅供历史审计。',
      },
    ],
  },
];
export const MEETING_COMPARISON = [
  {
    step: '恢复背景',
    before: '人工补充上次决定和未完成项',
    after: '按当前权限返回有效纪要、未完成承诺和证据',
    evidence: 'M13-MINUTES-v2 / m13-commitment',
  },
  {
    step: '完成状态检查',
    before: '成果审阅时发现证据缺失',
    after: '计划内预先检查状态与材料，缺口保留待核',
    evidence: 'M13-REVIEW-03 / M14-CHECK-01',
  },
  {
    step: '来源纠错',
    before: '旧稿采用整体完成表述',
    after: '停用旧判断并说明技术验收与材料齐套的区别',
    evidence: 'COR-13-01',
  },
  {
    step: '任务变更',
    before: '人工重新交代材料范围',
    after: '保留来源核查，仅更新受时间和接收范围影响的稿件',
    evidence: '计划版本差异',
  },
];

export const storySnapshots = [
  {
    id: 'party-history',
    name: '第13—14次党组会',
    at: '2026-09-25 17:30',
    source: 'M13-MINUTES-v2 / COR-13-01 / M14-EVAL',
    process:
      '第13次更正后的有效依据进入第14次计划，时间和接收范围变更仅重做受影响工作。',
    risk: '读取不扩权；通知与纪要逐项确认。纪要受理不等于审定。',
    result:
      '固定评测样本通过证据、来源更正及权限三项质量门。承诺依据与源系统状态分别记录。',
  },
  {
    id: 'payment-history',
    name: '财政支付审查',
    at: '2026-09-08 09:00',
    source: 'PAY-1 / PAY-2 / ORG-ADOPT-01',
    process:
      '关键词提示疑点，用户补充业务语境，先核资金性质再核适用依据。个人方法v1贡献快照形成组织独立v1.0，个人后续v2不覆盖组织版。',
    risk: '人工判断与正式审批分离；回写只含审查意见和草稿，不进行支付审批或拨付。',
    result: '两笔疑点保留补充说明要求；合成回写记录不证明真实业务提交。',
  },
  {
    id: 'maintenance-history',
    name: '运维申报与反馈',
    at: '2026-09-08 09:00',
    source: 'CZ-OA-20260907-018 / 材料v4',
    process:
      '先咨询岗位指引，明确办理请求后核对资产与服务边界，再整理材料和费用测算。',
    risk: '费用为案例测算；本人告知已手动提交，与源系统受理回执分别记录。',
    result: '材料v4保留，反馈待核；续办形成新版本，不重放历史提交。',
  },
  {
    id: 'annual-brainstorm',
    name: '年度工作报告',
    at: '2026-09-19 09:05',
    source: '13岗位 / 两轮协作 / 用户结构裁决',
    process:
      '13个岗位按五组提供观点，经两轮交叉审阅，用户选择以业务效果组织成果，删除无依据数字。',
    risk: '计划事实截止11月30日，当前未到期指标全部待核；岗位意见不能冒充正式组织决定。',
    result:
      '主稿、事实核验、政策回应、分歧裁决四项成果；未核实内容不能进入正式成效结论。',
  },
  {
    id: 'data-history',
    name: '跨系统分析与隐私处置',
    at: '2026-09-18 09:05',
    source: '来文〔2026〕87号 / DATA-RISK-01 / LOCAL-DATA-v2',
    process:
      '分别从数字资源、人口基础信息、民政服务和政务服务四个来源完成授权读取，经过字段映射、时点对齐和跨源推理后，拟外发结果出现可识别个人或小群体的组合隐私风险，系统主动停止生成与外发；用户给出脱敏和部分删减指令后重新生成聚合版。',
    risk: '强制阻断不设绕过；接收方、用途、范围和版本变化均使旧确认失效。',
    result:
      '脱敏、删减后的聚合v2通过结果粒度复核，经用户单独确认取得合成受理回执；原始敏感分析保持阻断。',
  },
];

export type StoryMemoryEvidence = {
  id: string;
  label: string;
  source: string;
  condition: string;
  effect: string;
  memoryId?: string;
};

export type AiMemoryStory = {
  id: string;
  taskIds: string[];
  name: string;
  source: string;
  interaction: 'fixed' | 'guided' | 'existing' | 'static';
  progress: string[];
  artifacts: string[];
  closing?: string;
  evidence: StoryMemoryEvidence[];
};

/**
 * Shared, synthetic evidence definitions used by the task conversation, right
 * workspace, memory product and governance evaluation. They are not policy
 * facts, production records or a substitute for source-system receipts.
 */
export const aiMemoryStories: AiMemoryStory[] = [
  {
    id: 'policy-consultation',
    taskIds: ['policy-consultation-history'],
    name: '惠企政策咨询',
    source: CASE_SOURCE,
    interaction: 'fixed',
    progress: ['核对企业实际情况', '比对支持与材料', '给出窗口办理建议'],
    artifacts: [],
    closing: '如需，我可以基于这些已审核口径帮你构建新的企业问答助手。',
    evidence: [
      { id: 'policy-rule', label: '当前政策适用条件', source: '合成政策条件卡', condition: '仅作当前样例的待核依据', effect: '提示先核对采购路径与关联关系。', memoryId: 'policy-rule' },
      { id: 'policy-case', label: '历史退回教训', source: '合成退回案例', condition: '不推广为普遍结论', effect: '提示核对是否存在同类支持及凭证一致性。', memoryId: 'policy-case' },
      { id: 'policy-method', label: '岗位核对方法', source: '已审核合成岗位包', condition: '只适用于窗口初步核对', effect: '将回答组织为三项待核事实与材料清单。', memoryId: 'policy-method' },
      { id: 'policy-reminder', label: '窗口期提醒', source: '合成办理节点', condition: '日期必须在真实办理时重新核实', effect: '给出补件与复核的下一步安排。', memoryId: 'policy-reminder' },
    ],
  },
  {
    id: 'training-speech',
    taskIds: ['training-speech-history'],
    name: '局长培训讲稿',
    source: CASE_SOURCE,
    interaction: 'guided',
    progress: ['核对旧稿与案例沿革', '校验案例状态与当前口径', '形成并修订送审工作稿'],
    artifacts: ['历年案例沿革与更新清单', '90分钟授课提纲', '讲稿初稿与待核清单'],
    evidence: [
      { id: 'training-episode', label: '去年讲稿与修改经历', source: '合成历史讲稿', condition: '历史表述不自动更新为当前事实', effect: '定位需要补充证据的旧案例。', memoryId: 'training-episode' },
      { id: 'training-method', label: '授课组织方法', source: '已审核合成岗位包', condition: '仅适用于本类培训', effect: '采用“案例—做法—成效”结构。', memoryId: 'training-method' },
      { id: 'training-rule', label: '当前口径', source: '合成有效口径卡', condition: '须以正式文件重新核验', effect: '避免把历史提法直接用于当前安排。', memoryId: 'training-rule' },
      { id: 'training-reminder', label: '送审与补证提醒', source: '合成工作节点', condition: '建议不自动成为跨部门承诺', effect: '形成待核事项与送审顺序。', memoryId: 'training-reminder' },
    ],
  },
  {
    id: 'party-meeting',
    taskIds: ['party-history', 'party-meeting-14'],
    name: '党组会准备', source: CASE_SOURCE, interaction: 'existing',
    progress: ['恢复上次决定', '核查落实与缺口', '形成会前材料'],
    artifacts: ['议程与落实清单', '督办核查稿', '会议通知工作稿'],
    evidence: [
      { id: 'm13-correction', label: '来源更正依据', source: 'COR-13-01', condition: '只适用于第13—14次会务', effect: '阻止将技术验收写成整体办结。', memoryId: 'm13-correction' },
      { id: 'm13-method', label: '三项核对方法', source: 'M13-REVIEW-03', condition: '个人方法，未自动成为制度', effect: '同时核对材料、时点与责任意见。', memoryId: 'm13-method' },
      { id: 'm13-commitment', label: '未完成承诺', source: 'M13-MINUTES-v2', condition: '源回执前持续保护', effect: '在会前主动提示补件节点。', memoryId: 'm13-commitment' },
    ],
  },
  {
    id: 'annual-brainstorm',
    taskIds: [], name: '工作报告脑暴', source: CASE_SOURCE, interaction: 'existing',
    progress: ['还原目标与决策沿革', '形成有证据的主线', '保留选择理由与补证安排'],
    artifacts: ['报告主线对照', '事实与证据缺口清单', '脑暴工作稿'],
    evidence: [
      { id: 'annual-goal', label: '目标与成效尺度', source: '合成年度工作材料', condition: '未核实指标保持待核', effect: '区分建设进展与问题解决成效。' },
      { id: 'annual-history', label: '决策与执行沿革', source: '合成会议与审稿记录', condition: '不从结果倒推原因', effect: '支持说明措施为何形成及后续变化。' },
      { id: 'annual-method', label: '审稿方法与教训', source: '合成岗位经验', condition: '本次选择不自动成为固定方法', effect: '约束主线选择并产生补证清单。' },
    ],
  },
  {
    id: 'maintenance-application',
    taskIds: ['maintenance-history'], name: '财政系统运维费用申报', source: CASE_SOURCE, interaction: 'static',
    progress: ['读取既有申报记录', '核对资产与服务范围', '保留反馈续办边界'],
    artifacts: ['申报材料版本', '费用估算明细', '反馈跟踪记录'],
    evidence: [
      { id: 'ops-working', label: '当前申报状态', source: 'CZ-OA-20260907-018', condition: '本人报告提交不等于系统回执', effect: '保持反馈跟踪而不伪造审批状态。', memoryId: 'ops-working' },
      { id: 'ops-method', label: '资产与服务范围核对法', source: '合成历史退回教训', condition: '范围变化后需重新核对', effect: '在材料形成前提示范围差异。', memoryId: 'ops-method' },
      { id: 'ops-commitment', label: '反馈节点', source: '本人授权跟踪设置', condition: '不替他人作出承诺', effect: '在反馈到达时提示下一步处理。', memoryId: 'ops-commitment' },
    ],
  },
];

export function aiMemoryStoryForTask(taskId: string, isBrainstorm = false) {
  if (isBrainstorm)
    return aiMemoryStories.find((story) => story.id === 'annual-brainstorm');
  return aiMemoryStories.find((story) => story.taskIds.includes(taskId));
}
