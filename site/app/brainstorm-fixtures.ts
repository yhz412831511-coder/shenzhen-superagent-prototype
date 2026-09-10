import type {
  BrainstormConflict,
  BrainstormContribution,
  BrainstormFact,
  BrainstormParticipant,
  BrainstormPolicy,
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
  participant('office', '办公室', 'synthesis', '结构、统稿、政务文风、篇幅和统计口径一致性'),
  participant('party', '机关党委（人事人才处）', 'synthesis', '党建、干部人才和组织保障'),
  participant('digital-development', '数字化发展处', 'strategy', '数字化发展、改革方向、人工智能与数据要素展望'),
  participant('data-policy', '数据制度建设处', 'strategy', '数据制度、政策衔接、规则与权责边界'),
  participant('government-service', '政务服务处', 'service', '服务改革、高频事项和办事质效'),
  participant('public-concerns', '民生诉求服务中心', 'service', '诉求协同、数据反馈和机制治理', '2021'),
  participant('data-resource', '数据资源管理处', 'data-project', '数据资源、共享利用和统计口径'),
  participant('project-planning', '项目统筹处', 'data-project', '项目全周期统筹和集约建设'),
  participant('application', '应用推进处', 'data-project', '场景应用、推广使用和业务协同'),
  participant('big-data-center', '大数据资源管理中心', 'data-project', '平台支撑、数据运营和技术服务视角', '2021'),
  participant('infrastructure', '基础设施处', 'security', '云、网、算力和运行保障边界'),
  participant('digital-security', '数字安全管理处', 'security', '数据与数字化安全治理、承诺边界'),
  participant('info-security-center', '信息安全管理中心', 'security', '安全运行、监测处置和技术保障视角', '2021'),
];

export const brainstormTopics: BrainstormTopic[] = [
  {
    id: 'ai-government',
    title: '人工智能＋政务',
    summary: '以政策要求、数据与语料基础、政务AI场景、可核验成效和安全治理共同界定创新力度。',
    participantIds: ['digital-development', 'data-policy', 'data-resource', 'application', 'infrastructure', 'digital-security', 'info-security-center', 'office'],
    contributionIds: [],
    status: 'pending',
  },
  { id: 'service-quality', title: '政务服务提质增效', summary: '围绕流程优化、服务评价和诉求协同形成跨处室工作点。', participantIds: ['government-service', 'public-concerns', 'office'], contributionIds: [], status: 'pending' },
  { id: 'data-use', title: '数据资源与要素利用', summary: '统筹数据资源、制度建设、共享利用与价值释放。', participantIds: ['data-resource', 'data-policy', 'digital-development', 'big-data-center'], contributionIds: [], status: 'pending' },
  { id: 'project-application', title: '项目统筹与应用建设', summary: '将项目全周期管理、集约建设和应用推广统一表达。', participantIds: ['project-planning', 'application', 'big-data-center'], contributionIds: [], status: 'pending' },
  { id: 'infrastructure-operations', title: '基础设施与运行保障', summary: '说明云网算力和平台运行的支撑作用与边界。', participantIds: ['infrastructure', 'big-data-center', 'info-security-center'], contributionIds: [], status: 'pending' },
  { id: 'security-governance', title: '数字安全与治理', summary: '把安全要求落实到数据、应用、运行和承诺边界。', participantIds: ['digital-security', 'info-security-center', 'data-policy'], contributionIds: [], status: 'pending' },
  { id: 'organization', title: '党建人才与组织保障', summary: '以党建引领、人才队伍和协同机制保障任务落实。', participantIds: ['party', 'office'], contributionIds: [], status: 'pending' },
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
  { id: 'policy-central', level: '中央', title: '中央层年度政策依据（待核验）', sourceId: 'policy-source-central-pending', sourceDate: '', publicationStatus: 'unpublished_or_unknown', topicIds: ['ai-government', 'data-use'] },
  { id: 'policy-guangdong', level: '广东省', title: '广东省年度政策依据（待核验）', sourceId: 'policy-source-guangdong-pending', sourceDate: '', publicationStatus: 'unpublished_or_unknown', topicIds: ['ai-government', 'service-quality'] },
  { id: 'policy-shenzhen', level: '深圳市', title: '深圳市年度政策依据（待核验）', sourceId: 'policy-source-shenzhen-pending', sourceDate: '', publicationStatus: 'unpublished_or_unknown', topicIds: ['ai-government', 'project-application'] },
];

const capabilities = Object.fromEntries(
  brainstormParticipants.map((item) => [item.id, item.scenarioCapability]),
);

export const brainstormContributions: BrainstormContribution[] = brainstormParticipants.map((item) => ({
  id: `contrib-${item.id}`,
  participantId: item.id,
  achievement: `${capabilities[item.id]}相关工作形成了阶段性进展；具体事实以本岗位授权材料和正式统计为准。`,
  problem: '当前材料的统计周期、来源完整性或责任边界仍需在统稿前复核。',
  policyResponses: ['中央、广东省、深圳市政策响应位置已预留，政策名称与发布日期待核验。'],
  nextYearSuggestion: item.id === 'digital-development'
    ? '建议把人工智能与数据要素作为增长点，以治理实效、数据基础和安全边界约束承诺。'
    : `建议围绕${capabilities[item.id]}形成可核验、可承诺的2027年工作安排。`,
  factIds: item.id === 'government-service'
    ? ['fact-online-rate', 'fact-time-reduction']
    : item.id === 'public-concerns'
      ? ['fact-concern-outcome']
      : ['digital-development', 'application'].includes(item.id)
        ? ['fact-ai-outcome']
        : [],
  sourceRefs: [`source-${item.id}-authorized-summary`],
  subtitle: item.id === 'government-service'
    ? '聚焦便民利企，政务服务质效实现新提升'
    : `强化${capabilities[item.id]}，推动年度重点任务取得新进展`,
  collaborationNeeds: item.groupId === 'synthesis' ? ['与各主题责任岗位校核结构和口径'] : ['与办公室校核统计口径和主稿表述'],
  status: 'ready',
}));

export const brainstormConsensus = [
  { id: 'consensus-theme', text: '报告按跨处室主题组织，不按13个机构逐项拼接。' },
  { id: 'consensus-facts', text: '核心数字必须说明统计口径、截止日期、来源和核定状态。' },
  { id: 'consensus-boundary', text: '工作版本不代表正式审定或报送。' },
  { id: 'consensus-single-draft', text: '形成一份推荐主稿，分歧通过决定记录留痕。' },
  { id: 'consensus-policy', text: '2027年尚未发布或未核验的政策不得写成既成事实。' },
  { id: 'consensus-ai', text: '人工智能＋政务作为第一主题，但年度报告仍覆盖全局职责。' },
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
    title: '2027年AI创新力度与安全、可承诺边界',
    kind: 'high_impact',
    category: 'direction',
    participantIds: ['digital-development', 'application', 'digital-security', 'info-security-center', 'office'],
    inquiryRounds: 0,
    status: 'pending',
    summary: '该分歧影响开篇定调、主题排序、2027年任务和结尾承诺。',
    options: [
      { id: 'balanced', label: '采用平衡主线', recommended: true, impact: '以治理实效为主线，AI作为增长点，并以安全和可核验事实约束承诺。' },
      { id: 'innovation', label: '突出创新突破', impact: '前瞻性更强，但必须补齐可核验案例、年度数据和风险控制安排。' },
      { id: 'safety', label: '突出安全稳健', impact: '口径更审慎，但会弱化人工智能与数据要素的年度展望。' },
    ],
  },
];

export const brainstormIssue = {
  title: '深圳市政数局2026年度工作报告',
  goal: '总结2026年有效成果，谋划2027年重点工作，形成完整主稿及支撑材料。',
  audience: '局领导班子',
  period: '总结2026年，谋划2027年',
  policyRange: '中央—广东省—深圳市',
  outputs: ['年度工作报告主稿', '事实底稿', '政策响应矩阵', '分歧与用户决定记录'],
  quality: '有效成果数字、跨处室工作点、精炼子标题和政务文风',
  boundary: '合成与待核内容必须保留状态；工作版本不代表正式审定或报送。',
  confirmed: false,
};

export const brainstormArtifactBodies = {
  report: `# 深圳市政务服务和数据管理局2026年度工作报告\n\n> 工作版本 · 合成示例内容 · 不代表正式审定或报送\n\n## 一、以人工智能赋能政务工作，推动数字化发展取得新进展\n\n围绕数据与语料基础、政务场景、治理实效和安全边界，系统谋划人工智能与政务工作融合。具体年度成效尚待正式场景台账核定，当前不写入未经核实的精确数字。\n\n## 二、聚焦便民利企，政务服务质效实现新提升\n\n合成示例显示，全程网办率为96.4%，高频事项办理时限压缩32%。两项数据统计截止2026年11月30日，均待年终核定。\n\n## 三、强化数据赋能，城市治理协同取得新进展\n\n围绕数据资源、制度建设、项目统筹、应用推进和平台支撑，推动跨处室工作从材料汇集转向主题协同。\n\n## 四、坚持问题导向，准确把握新形势新要求\n\n数据价值释放、跨部门协同、事实核定和安全治理仍需持续加强。\n\n## 五、突出实干实效，系统谋划2027年重点工作\n\n坚持治理实效导向，将人工智能和数据要素作为增长点，以安全合规、责任清晰和事实可核验为边界。2027年政策名称及具体承诺待正式依据发布和有权人员核定。`,
  facts: `# 事实底稿\n\n| 事实 | 数值 | 截止日 | 性质 | 核定状态 |\n|---|---:|---|---|---|\n| 全程网办率 | 96.4% | 2026-11-30 | 合成示例 | 待年终核定 |\n| 办理时限压缩 | 32% | 2026-11-30 | 合成示例 | 待年终核定 |\n| 政务AI场景年度成效 | — | 2026-11-30 | 待补材料 | 不进入主稿数值 |\n| 诉求协同处置成效 | — | 2026-11-30 | 待统一口径 | 不进入主稿数值 |`,
  policies: `# 中央—广东省—深圳市政策响应矩阵\n\n| 层级 | 政策依据 | 发布状态 | 响应位置 |\n|---|---|---|---|\n| 中央 | 年度政策依据待核验 | 未发布或未知 | 人工智能＋政务、数据资源 |\n| 广东省 | 年度政策依据待核验 | 未发布或未知 | 人工智能＋政务、政务服务 |\n| 深圳市 | 年度政策依据待核验 | 未发布或未知 | 人工智能＋政务、项目与应用 |\n\n未核验政策不进入主稿既成事实。`,
  decisions: `# 分歧与用户决定记录\n\n## 普通分歧\n\n两个服务指标统计周期不同。主持人经政务服务处与办公室定向询证后，统一按各自口径展示，并保留2026-11-30截止日期。\n\n## 高影响分歧\n\n2027年AI创新力度与安全、可承诺边界。最终选择与影响由任务中的业务骨干决定记录生成；该决定是工作版本取舍，不代表领导审定。`,
};
