import type {
  BrainstormConflict,
  BrainstormContribution,
  BrainstormFact,
  BrainstormParticipant,
  BrainstormPolicy,
  BrainstormRound,
  BrainstormTopic,
} from './brainstorm-types.ts';

const participant = (
  id: string,
  name: string,
  groupId: string,
  scenarioCapability: string,
  dutyBasisDate = '2024',
): BrainstormParticipant => ({
  id,
  name,
  groupId,
  dutyBasis: `深圳市政务服务和数据管理局公开机构职责（${dutyBasisDate}年资料，实施前复核）`,
  dutyBasisDate,
  scenarioCapability,
  materialScope: '公开职责、本岗位授权材料和当前议题必要摘要',
  contributionIds: [`contrib-${id}`],
  selected: true,
  status: 'pending',
  retryCount: 0,
});

export const brainstormParticipants: BrainstormParticipant[] = [
  participant(
    'office',
    '办公室',
    'synthesis',
    '结构、统稿、政务文风、篇幅和统计口径一致性',
  ),
  participant(
    'party',
    '机关党委（人事人才处）',
    'synthesis',
    '党建、干部人才和组织保障',
  ),
  participant(
    'digital-development',
    '数字化发展处',
    'strategy',
    '数字化发展、改革方向、人工智能与数据要素展望',
  ),
  participant(
    'data-policy',
    '数据制度建设处',
    'strategy',
    '数据制度、政策衔接、规则与权责边界',
  ),
  participant(
    'government-service',
    '政务服务处',
    'service',
    '服务改革、高频事项和办事质效',
  ),
  participant(
    'public-concerns',
    '民生诉求服务中心',
    'service',
    '诉求协同、数据反馈和机制治理',
    '2021',
  ),
  participant(
    'data-resource',
    '数据资源管理处',
    'data-project',
    '数据资源、共享利用和统计口径',
  ),
  participant(
    'project-planning',
    '项目统筹处',
    'data-project',
    '项目全周期统筹和集约建设',
  ),
  participant(
    'application',
    '应用推进处',
    'data-project',
    '场景应用、推广使用和业务协同',
  ),
  participant(
    'big-data-center',
    '大数据资源管理中心',
    'data-project',
    '平台支撑、数据运营和技术服务视角',
    '2021',
  ),
  participant(
    'infrastructure',
    '基础设施处',
    'security',
    '云、网、算力和运行保障边界',
  ),
  participant(
    'digital-security',
    '数字安全管理处',
    'security',
    '数据与数字化安全治理、承诺边界',
  ),
  participant(
    'info-security-center',
    '信息安全管理中心',
    'security',
    '安全运行、监测处置和技术保障视角',
    '2021',
  ),
];

export const brainstormTopics: BrainstormTopic[] = [
  {
    id: 'ai-government',
    title: '人工智能＋政务',
    summary:
      '以政策要求、数据与语料基础、政务AI场景、可核验成效和安全治理共同界定创新力度。',
    attentionLabel: '3项实质分歧',
    assessment: '影响2027年任务排序与安全边界',
    priority: 'recommended_first',
    participantIds: [
      'digital-development',
      'data-policy',
      'data-resource',
      'application',
      'infrastructure',
      'digital-security',
      'info-security-center',
      'office',
    ],
    contributionIds: [],
    status: 'pending',
  },
  {
    id: 'service-quality',
    title: '政务服务提质增效',
    summary: '围绕流程优化、服务评价和诉求协同形成跨处室工作点。',
    attentionLabel: '1项数据待核',
    assessment: '成效数字待年终核定',
    priority: 'normal',
    participantIds: ['government-service', 'public-concerns', 'office'],
    contributionIds: [],
    status: 'pending',
  },
  {
    id: 'data-use',
    title: '数据资源与要素利用',
    summary: '统筹数据资源、制度建设、共享利用与价值释放。',
    attentionLabel: '1项材料缺口',
    assessment: '暂可归并，不影响方向',
    priority: 'normal',
    participantIds: [
      'data-resource',
      'data-policy',
      'digital-development',
      'big-data-center',
    ],
    contributionIds: [],
    status: 'pending',
  },
  {
    id: 'project-application',
    title: '项目统筹与应用建设',
    summary: '将项目全周期管理、集约建设和应用推广统一表达。',
    attentionLabel: '无高影响分歧',
    assessment: '归入全局大纲后审阅',
    priority: 'normal',
    participantIds: ['project-planning', 'application', 'big-data-center'],
    contributionIds: [],
    status: 'pending',
  },
  {
    id: 'infrastructure-operations',
    title: '基础设施与运行保障',
    summary: '说明云网算力和平台运行的支撑作用与边界。',
    attentionLabel: '无高影响分歧',
    assessment: '归入全局大纲后审阅',
    priority: 'normal',
    participantIds: [
      'infrastructure',
      'big-data-center',
      'info-security-center',
    ],
    contributionIds: [],
    status: 'pending',
  },
  {
    id: 'security-governance',
    title: '数字安全与治理',
    summary: '把安全要求落实到数据、应用、运行和承诺边界。',
    attentionLabel: '1项与AI关联',
    assessment: '与AI主题的上线条件合并处理',
    priority: 'linked',
    participantIds: ['digital-security', 'info-security-center', 'data-policy'],
    contributionIds: [],
    status: 'pending',
  },
  {
    id: 'organization',
    title: '党建人才与组织保障',
    summary: '以党建引领、人才队伍和协同机制保障任务落实。',
    attentionLabel: '无高影响分歧',
    assessment: '保留至全局收束',
    priority: 'normal',
    participantIds: ['party', 'office'],
    contributionIds: [],
    status: 'pending',
  },
];

export const brainstormFacts: BrainstormFact[] = [
  {
    id: 'fact-online-rate',
    label: '全程网办率',
    value: '96.4',
    unit: '%',
    nature: 'synthetic',
    sourceId: 'source-service-summary',
    asOf: '2026-11-30',
    statisticScope: '合成的政务服务事项年度阶段统计口径',
    verificationStatus: 'pending_year_end',
    usedIn: ['service-quality'],
  },
  {
    id: 'fact-time-reduction',
    label: '办理时限压缩',
    value: '32',
    unit: '%',
    nature: 'synthetic',
    sourceId: 'source-service-summary',
    asOf: '2026-11-30',
    statisticScope: '合成的高频事项平均办理时限比较口径',
    verificationStatus: 'pending_year_end',
    usedIn: ['service-quality'],
  },
  {
    id: 'fact-ai-outcome',
    label: '政务AI场景年度成效',
    value: null,
    nature: 'pending',
    sourceId: 'source-ai-ledger-pending',
    asOf: '2026-11-30',
    statisticScope: '待按正式场景台账核定',
    verificationStatus: 'missing',
    usedIn: ['ai-government'],
  },
  {
    id: 'fact-concern-outcome',
    label: '诉求协同处置成效',
    value: null,
    nature: 'pending',
    sourceId: 'source-concerns-pending',
    asOf: '2026-11-30',
    statisticScope: '待补充统一统计周期与口径',
    verificationStatus: 'missing',
    usedIn: ['service-quality'],
  },
];

export const brainstormPolicies: BrainstormPolicy[] = [
  {
    id: 'policy-central',
    level: '中央',
    title: '中央层年度政策依据（待核验）',
    sourceId: 'policy-source-central-pending',
    sourceDate: '',
    publicationStatus: 'unpublished_or_unknown',
    topicIds: ['ai-government', 'data-use'],
  },
  {
    id: 'policy-guangdong',
    level: '广东省',
    title: '广东省年度政策依据（待核验）',
    sourceId: 'policy-source-guangdong-pending',
    sourceDate: '',
    publicationStatus: 'unpublished_or_unknown',
    topicIds: ['ai-government', 'service-quality'],
  },
  {
    id: 'policy-shenzhen',
    level: '深圳市',
    title: '深圳市年度政策依据（待核验）',
    sourceId: 'policy-source-shenzhen-pending',
    sourceDate: '',
    publicationStatus: 'unpublished_or_unknown',
    topicIds: ['ai-government', 'project-application'],
  },
];

const capabilities = Object.fromEntries(
  brainstormParticipants.map((item) => [item.id, item.scenarioCapability]),
);

const roleArguments: Record<
  string,
  {
    position: string;
    basisStatus: string;
    questions: { participantId: string; text: string }[];
    draftImpact: string;
  }
> = {
  office: {
    position:
      '年度报告只能写入已有事实依据的成效；2027年安排必须区分工作方向、拟定目标和待核承诺。',
    basisStatus: '统稿规则／工作要求，正式口径待有权人员确认',
    questions: [
      {
        participantId: 'digital-development',
        text: '哪些表述可以成为局级安排，哪些只能保留为岗位建议？',
      },
    ],
    draftImpact: '降级未实施场景和未经核定的成效表述，统一年度报告口径。',
  },
  party: {
    position:
      '每个AI场景必须明确岗位责任和人员能力要求，不能以模型替代有权人员。',
    basisStatus: '岗位责任与人员能力视角，具体安排待核',
    questions: [
      {
        participantId: 'digital-security',
        text: '哪些环节必须建立人工确认责任？',
      },
    ],
    draftImpact: '把人员责任、能力建设和人工确认写入保障措施。',
  },
  'digital-development': {
    position: '以跨处室标杆场景牵引2027年AI应用，不以场景数量作为首要目标。',
    basisStatus: '发展方向建议，不代表正式规划',
    questions: [
      {
        participantId: 'application',
        text: '哪些场景能够形成可核验、可复用的治理成效？',
      },
    ],
    draftImpact: '将AI作为增长点，但必须补齐准入条件和转扩展门槛。',
  },
  'data-policy': {
    position:
      '场景建设前要明确数据使用依据、责任主体和跨处室最小必要共享规则。',
    basisStatus: '制度视角，具体依据待逐项核验',
    questions: [
      {
        participantId: 'digital-security',
        text: '模型错误和越权使用发生时由谁负责、如何追溯？',
      },
    ],
    draftImpact: '在建设理念中增加合法依据、责任主体和最小共享边界。',
  },
  'government-service': {
    position: '优先从高频办事中的材料预审、政策问答和办理辅助切入。',
    basisStatus: '场景工作示例，成效与材料待核',
    questions: [
      {
        participantId: 'digital-security',
        text: '错答、误导和办理结论的人工复核如何控制？',
      },
    ],
    draftImpact: '把抽象的AI建设方向落到内部办理辅助场景。',
  },
  'public-concerns': {
    position: '优先建设诉求归类、趋势研判和协同派单辅助，不直接自动答复群众。',
    basisStatus: '场景工作示例，诉求数据权限待核',
    questions: [
      {
        participantId: 'data-resource',
        text: '诉求数据可以在哪些训练、检索和评测环节使用？',
      },
    ],
    draftImpact: '形成第二个可验证场景，并明确不得自动对外答复。',
  },
  'data-resource': {
    position: '场景立项前必须说明数据目录、语料来源、质量状态和授权范围。',
    basisStatus: '数据条件视角，授权状态待核',
    questions: [
      {
        participantId: 'project-planning',
        text: '无法取得稳定数据的场景是否继续投入？',
      },
    ],
    draftImpact: '把数据目录、语料授权和质量基线加入场景准入条件。',
  },
  'project-planning': {
    position: '项目按“验证—评估—扩展”设置门槛，不同步铺开同类能力。',
    basisStatus: '项目统筹建议，投入标准待核',
    questions: [
      {
        participantId: 'digital-development',
        text: '以什么业务和治理条件决定追加建设投入？',
      },
    ],
    draftImpact: '删除以覆盖数量衡量成效的表述，改变任务排序和投入方式。',
  },
  application: {
    position: '只建设能够跨处室复用的共性能力，避免形成一次性展示项目。',
    basisStatus: '应用推进建议，复用范围待验证',
    questions: [
      {
        participantId: 'big-data-center',
        text: '谁负责场景从试点转入常态运行？',
      },
    ],
    draftImpact: '把复用和常态运营作为标杆场景成立条件。',
  },
  'big-data-center': {
    position: '优先沉淀模型服务、知识检索、评测和日志等共性支撑。',
    basisStatus: '技术支撑视角，不代表已建成能力',
    questions: [
      {
        participantId: 'application',
        text: '各场景是否接受统一技术接入和评测规范？',
      },
    ],
    draftImpact: '形成跨处室共性建设任务，避免各场景重复建设。',
  },
  infrastructure: {
    position: '建设规模必须与算力、并发、运行成本和国产化适配条件相匹配。',
    basisStatus: '基础设施条件待场景需求核定',
    questions: [
      {
        participantId: 'application',
        text: '哪些需求必须实时推理，哪些可以离线处理？',
      },
    ],
    draftImpact: '把运行规模和成本条件加入建设边界。',
  },
  'digital-security': {
    position: '按场景风险分级，面向群众或影响办理结论的输出必须保留人工复核。',
    basisStatus: '安全治理视角，不代表正式安全评估',
    questions: [
      {
        participantId: 'info-security-center',
        text: '哪些高风险场景需要上线前专项测试和停用预案？',
      },
    ],
    draftImpact: '将智能办理限定为内部辅助，并写入人工复核和分级准入。',
  },
  'info-security-center': {
    position: '上线前应具备攻击测试、内容安全测试、全量日志和快速停用能力。',
    basisStatus: '安全运行视角，具体测试结果待核',
    questions: [
      {
        participantId: 'application',
        text: '异常发现后由谁暂停场景、何时恢复？',
      },
    ],
    draftImpact: '形成上线测试、审计和异常恢复门槛。',
  },
};

export const brainstormContributions: BrainstormContribution[] =
  brainstormParticipants.map((item) => ({
    id: `contrib-${item.id}`,
    participantId: item.id,
    ...roleArguments[item.id],
    achievement: `${capabilities[item.id]}相关工作形成了阶段性进展；具体事实以本岗位授权材料和正式统计为准。`,
    problem: '当前材料的统计周期、来源完整性或责任边界仍需在统稿前复核。',
    policyResponses: [
      '中央、广东省、深圳市政策响应位置已预留，政策名称与发布日期待核验。',
    ],
    nextYearSuggestion:
      item.id === 'digital-development'
        ? '建议把人工智能与数据要素作为增长点，以治理实效、数据基础和安全边界约束承诺。'
        : `建议围绕${capabilities[item.id]}形成可核验、可承诺的2027年工作安排。`,
    factIds:
      item.id === 'government-service'
        ? ['fact-online-rate', 'fact-time-reduction']
        : item.id === 'public-concerns'
          ? ['fact-concern-outcome']
          : ['digital-development', 'application'].includes(item.id)
            ? ['fact-ai-outcome']
            : [],
    sourceRefs: [`source-${item.id}-authorized-summary`],
    subtitle:
      item.id === 'government-service'
        ? '聚焦便民利企，政务服务质效实现新提升'
        : `强化${capabilities[item.id]}，推动年度重点任务取得新进展`,
    collaborationNeeds:
      item.groupId === 'synthesis'
        ? ['与各主题责任岗位校核结构和口径']
        : ['与办公室校核统计口径和主稿表述'],
    status: 'ready',
  }));

export const brainstormRounds: BrainstormRound[] = [
  {
    id: 'v0',
    version: 0,
    title: 'V0：13个岗位独立输出',
    focus: '2027年AI智能场景建设应采用什么总体理念？',
    description: '相同议题与材料范围，仅完成去重和编排，尚未发生岗位互证。',
    entries: brainstormParticipants.map((item) => ({
      participantId: item.id,
      effect: 'origin',
      statement: roleArguments[item.id].position,
      basisStatus: roleArguments[item.id].basisStatus,
      outcome: '待互证',
    })),
    consensus: [
      '13个岗位均完成职责化输出',
      '形成相同材料范围下可比较的初步汇集版本',
    ],
    conflicts: ['建设顺序、准入条件和评价方式尚未统一', '岗位观点尚未相互验证'],
    artifacts: ['岗位输出清单V0', '初步汇集稿V0'],
    continuationReason: '独立输出存在重复、缺口和潜在矛盾，需要岗位互证。',
    status: 'pending',
  },
  {
    id: 'v1',
    version: 1,
    title: '第一轮：建设方式与准入条件',
    focus: '全面铺开，还是满足统一条件后再进入试点？',
    description: '相关岗位针对同一主张补充、质疑和校正。',
    entries: [
      [
        'digital-development',
        'origin',
        '以跨处室标杆场景牵引，不以场景数量作为首要目标。',
        '发展方向建议',
        '保留',
      ],
      [
        'application',
        'add',
        '标杆场景必须沉淀可复用能力，不能形成一次性项目。',
        '应用推进建议',
        '已采纳',
      ],
      [
        'project-planning',
        'challenge',
        '若没有验证—评估—扩展门槛，标杆仍可能变成分散建设。',
        '项目统筹建议',
        '待回应',
      ],
      [
        'data-resource',
        'challenge',
        '无稳定数据目录、语料来源和授权范围的场景不应进入试点。',
        '授权状态待核',
        '待回应',
      ],
      [
        'digital-security',
        'correct',
        '面向群众或影响办理结论的输出必须保留人工复核。',
        '安全治理视角',
        '已采纳',
      ],
      [
        'big-data-center',
        'add',
        '模型服务、检索、评测和日志应作为统一共性能力。',
        '技术支撑视角',
        '形成一致',
      ],
      [
        'office',
        'keep',
        '年度报告只能写工作方向，不能把未实施场景表述为年度成效。',
        '统稿规则',
        '形成一致',
      ],
    ].map(([participantId, effect, statement, basisStatus, outcome]) => ({
      participantId,
      effect: effect as BrainstormRound['entries'][number]['effect'],
      statement,
      basisStatus,
      outcome,
      responseToParticipantId:
        participantId === 'digital-development'
          ? undefined
          : 'digital-development',
    })),
    consensus: [
      '不以场景数量作为首要成绩',
      '有业务责任人、稳定数据和可评测结果才进入试点',
      '共性能力统一沉淀',
    ],
    conflicts: [
      '先上场景再补治理，还是条件齐备后试点',
      '以什么条件决定从试点转向扩展',
      '谁负责场景转入常态运行',
    ],
    artifacts: ['观点与依据图V1', '一致／矛盾清单V1', '候选场景准入条件V1'],
    continuationReason:
      '事实、责任和准入问题仍未解决，需要用具体场景继续补证。',
    status: 'pending',
  },
  {
    id: 'v2',
    version: 2,
    title: '第二轮：用两个场景验证建设理念',
    focus: '两个工作示例能否满足数据、安全、评测和运行准入？',
    description:
      '只围绕V1未决问题，用政务服务办理辅助和民生诉求趋势研判继续补证。',
    entries: [
      [
        'government-service',
        'add',
        '材料预审先用于内部辅助，办理结论继续由工作人员确认。',
        '场景材料待核',
        '条件接受',
      ],
      [
        'public-concerns',
        'correct',
        '只做诉求归类和趋势研判，不自动生成群众答复。',
        '诉求数据权限待核',
        '条件接受',
      ],
      [
        'data-resource',
        'add',
        '试点前形成数据目录、用途说明和质量基线，缺项不得上线。',
        '授权状态待核',
        '形成一致',
      ],
      [
        'digital-security',
        'correct',
        '按场景风险分级，高风险输出实行人工复核和专项评估。',
        '安全治理视角',
        '形成一致',
      ],
      [
        'info-security-center',
        'add',
        '上线前完成攻击测试、内容测试、全量日志和快速停用预案。',
        '测试结果待核',
        '形成一致',
      ],
      [
        'big-data-center',
        'add',
        '两个场景共用检索、评测、日志和模型服务，避免重复建设。',
        '技术支撑视角',
        '形成一致',
      ],
      [
        'project-planning',
        'challenge',
        '仍需决定用真实场景牵引底座，还是底座完成后再开放场景。',
        '项目统筹建议',
        '升级裁决',
      ],
    ].map(([participantId, effect, statement, basisStatus, outcome]) => ({
      participantId,
      effect: effect as BrainstormRound['entries'][number]['effect'],
      statement,
      basisStatus,
      outcome,
      responseToParticipantId: 'digital-development',
    })),
    consensus: [
      '两个场景先以内部辅助方式试点',
      '数据、评测、人工复核、日志和停用机制是准入条件',
      '共性能力统一沉淀',
    ],
    conflicts: ['场景牵引还是底座优先将改变年度任务排序和资源安排'],
    artifacts: [
      '两类场景条件对照V2',
      '协同询证纪要V2',
      '一致／矛盾清单V2',
      'AI场景建设理念V2',
    ],
    continuationReason:
      '高影响建设路径无法由岗位协同自行裁定，需要业务骨干决定。',
    status: 'pending',
  },
];

export const brainstormEvolution = {
  baselineTitle: 'V0 初步汇集版 · 尚未岗位互证',
  baselineText:
    '2027年将全面推进人工智能场景建设，扩大应用覆盖面，聚焦政务服务和城市治理重点领域，加快形成一批应用成果。各处室结合业务需求推进场景建设，持续完善数据、算力和安全保障。',
  convergedTitle: 'V2 协作收敛版 · 两轮询证后',
  convergedText:
    '2027年以高频政务服务办理辅助和民生诉求趋势研判等工作为切入，选择具备业务责任人、授权数据、可评测结果和人工复核条件的场景分层试点。共性模型服务、知识检索、评测和日志能力统一沉淀；面向群众或影响办理结论的输出不得由模型自动完成。通过评估后再决定扩展。',
  changes: [
    {
      kind: 'added_condition' as const,
      participantIds: ['data-resource'],
      text: '新增数据目录、语料授权和质量基线准入要求',
      impact: '改变场景立项条件',
    },
    {
      kind: 'corrected_boundary' as const,
      participantIds: ['digital-security', 'government-service'],
      text: '将智能办理限定为内部辅助，办理结论继续人工确认',
      impact: '降低对外承诺风险',
    },
    {
      kind: 'added_condition' as const,
      participantIds: ['info-security-center'],
      text: '新增攻击测试、内容测试、全量日志和快速停用机制',
      impact: '形成上线门槛',
    },
    {
      kind: 'formed_dependency' as const,
      participantIds: ['big-data-center', 'application'],
      text: '共性模型、检索、评测和日志能力统一沉淀',
      impact: '形成跨处室协同任务',
    },
    {
      kind: 'reduced_claim' as const,
      participantIds: ['project-planning', 'digital-development'],
      text: '删除以覆盖数量衡量成效，改用验证—评估—扩展门槛',
      impact: '改变年度任务顺序',
    },
    {
      kind: 'reduced_claim' as const,
      participantIds: ['office'],
      text: '未实施场景只写工作安排，不作为2026年度成效',
      impact: '保持事实边界',
    },
  ],
};

export const brainstormConsensus = [
  {
    id: 'consensus-theme',
    text: '报告按跨处室主题组织，不按13个机构逐项拼接。',
  },
  {
    id: 'consensus-facts',
    text: '核心数字必须说明统计口径、截止日期、来源和核定状态。',
  },
  { id: 'consensus-boundary', text: '工作版本不代表正式审定或报送。' },
  {
    id: 'consensus-single-draft',
    text: '形成一份推荐主稿，分歧通过决定记录留痕。',
  },
  {
    id: 'consensus-policy',
    text: '2027年尚未发布或未核验的政策不得写成既成事实。',
  },
  {
    id: 'consensus-ai',
    text: '人工智能＋政务作为第一主题，但年度报告仍覆盖全局职责。',
  },
];

export const brainstormConflicts: BrainstormConflict[] = [
  {
    id: 'conflict-stat-period',
    title: '两个服务指标统计周期不同',
    kind: 'ordinary',
    category: 'wording',
    participantIds: ['government-service', 'office'],
    inquiryRounds: 0,
    status: 'pending',
    summary: '主持人需统一截止日期并保留各指标统计口径，不打断用户。',
    options: [],
  },
  {
    id: 'conflict-ai-balance',
    title: '2027年AI智能场景建设路径',
    kind: 'high_impact',
    category: 'direction',
    participantIds: [
      'digital-development',
      'application',
      'digital-security',
      'info-security-center',
      'office',
    ],
    inquiryRounds: 0,
    status: 'pending',
    summary:
      '两轮询证已明确场景、数据、安全、评测和人工责任条件；仍需决定场景与底座的推进顺序。',
    options: [
      {
        id: 'balanced',
        label: '场景牵引、分层准入',
        recommended: true,
        impact:
          '以高频政务服务办理辅助和民生诉求趋势研判等工作为切入，场景与数据、安全、评测、人工复核条件同步验证，通过评估后再扩展。',
      },
      {
        id: 'innovation',
        label: '场景快速铺开',
        impact:
          '各处室同步申报并建设场景，未达到统一数据、安全和评测条件的场景仅限内部试用；探索面更广，但重复建设和治理成本更高。',
      },
      {
        id: 'safety',
        label: '底座治理优先',
        impact:
          '先完善统一数据、模型服务、评测、安全和运行体系，再开放业务场景；风险与复用边界更清晰，但年度内可见业务成果较慢。',
      },
    ],
  },
];

export const brainstormIssue = {
  title: '深圳市政数局2026年度工作报告',
  goal: '总结2026年有效成果，谋划2027年重点工作，形成完整主稿及支撑材料。',
  audience: '局领导班子',
  period: '总结2026年，谋划2027年',
  policyRange: '中央—广东省—深圳市',
  outputs: [
    '年度工作报告主稿',
    '事实底稿',
    '政策响应矩阵',
    '分歧与用户决定记录',
  ],
  quality: '有效成果数字、跨处室工作点、精炼子标题和政务文风',
  boundary: '合成与待核内容必须保留状态；工作版本不代表正式审定或报送。',
  confirmed: false,
};

export const brainstormArtifactBodies = {
  report: `# 深圳市政务服务和数据管理局2026年度工作报告\n\n> 工作版本 · 合成示例内容 · 不代表正式审定或报送\n\n## 一、以人工智能赋能政务工作，推动数字化发展取得新进展\n\n围绕数据与语料基础、政务场景、治理实效和安全边界，系统谋划人工智能与政务工作融合。具体年度成效尚待正式场景台账核定，当前不写入未经核实的精确数字。\n\n## 二、聚焦便民利企，政务服务质效实现新提升\n\n合成示例显示，全程网办率为96.4%，高频事项办理时限压缩32%。两项数据统计截止2026年11月30日，均待年终核定。\n\n## 三、强化数据赋能，城市治理协同取得新进展\n\n围绕数据资源、制度建设、项目统筹、应用推进和平台支撑，推动跨处室工作从材料汇集转向主题协同。\n\n## 四、坚持问题导向，准确把握新形势新要求\n\n数据价值释放、跨部门协同、事实核定和安全治理仍需持续加强。\n\n## 五、突出实干实效，系统谋划2027年重点工作\n\n2027年AI智能场景建设路径待业务骨干根据两轮岗位询证结果决定。2027年政策名称及具体承诺待正式依据发布和有权人员核定。`,
  facts: `# 事实底稿\n\n| 事实 | 数值 | 截止日 | 性质 | 核定状态 |\n|---|---:|---|---|---|\n| 全程网办率 | 96.4% | 2026-11-30 | 合成示例 | 待年终核定 |\n| 办理时限压缩 | 32% | 2026-11-30 | 合成示例 | 待年终核定 |\n| 政务AI场景年度成效 | — | 2026-11-30 | 待补材料 | 不进入主稿数值 |\n| 诉求协同处置成效 | — | 2026-11-30 | 待统一口径 | 不进入主稿数值 |`,
  policies: `# 中央—广东省—深圳市政策响应矩阵\n\n| 层级 | 政策依据 | 发布状态 | 响应位置 |\n|---|---|---|---|\n| 中央 | 年度政策依据待核验 | 未发布或未知 | 人工智能＋政务、数据资源 |\n| 广东省 | 年度政策依据待核验 | 未发布或未知 | 人工智能＋政务、政务服务 |\n| 深圳市 | 年度政策依据待核验 | 未发布或未知 | 人工智能＋政务、项目与应用 |\n\n未核验政策不进入主稿既成事实。`,
  decisions: `# 分歧与用户决定记录\n\n## V1 建设方式与准入条件\n\n形成一致：不以场景数量作为首要成绩；有业务责任人、稳定数据和可评测结果才进入试点；共性能力统一沉淀。仍有三项事实、责任和顺序问题进入第二轮。\n\n## V2 具体场景补证\n\n以高频政务服务办理辅助和民生诉求趋势研判作为工作示例，形成数据、评测、人工复核、日志和停用准入条件。场景牵引还是底座优先仍影响年度任务排序，升级给业务骨干决定。\n\n## 普通分歧\n\n两个服务指标统计周期不同。主持人经政务服务处与办公室定向询证后，统一按各自口径展示，并保留2026-11-30截止日期。\n\n## 协作增益\n\n相较V0初步汇集版，两轮岗位互证补齐场景准入条件、纠正自动办理边界、形成共性能力建设依赖，并降级未实施和未核定表述。\n\n## 高影响分歧\n\n2027年AI智能场景建设路径。最终选择与影响由任务中的业务骨干决定记录生成；该决定是工作版本取舍，不代表领导审定。`,
};
