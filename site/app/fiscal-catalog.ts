import retained from './retained-catalog.json' with { type: 'json' };
import profiles from './digital-person-profiles.json' with { type: 'json' };
import agentDetails from './agent-detail-profiles.json' with { type: 'json' };
import { builtOrganizationCarriers, unitForCarrier } from './professional-intelligence-domain.ts';
export const systems = {
  payment: {
    name: '智慧财政支付系统',
    short: '智慧财政',
    scope: '本周期支付申请；审查意见与疑点标记',
    path: '支付管理 / 申请审查',
  },
  supervision: {
    name: '财政穿透式监管系统',
    short: '穿透式监管',
    scope: '本次支付申请的规则核查',
    path: '资金监管 / 支付核查',
  },
  oa: {
    name: '财政局 OA',
    short: '财政局 OA',
    scope: '分配给本人的交办事项',
    path: '我的待办 / 运维项目申报',
  },
  pm: {
    name: '政务信息化项目全周期数字化管理平台',
    short: '项管平台',
    scope: '本单位运维项目草稿、材料、估算与提交',
    path: '项目立项 / 项目申报',
  },
  resources: {
    name: '一体化数字资源管理系统',
    short: '数字资源管理',
    scope: '本单位关联项目资产；原称 CDOS',
    path: '运维资产 / 项目资产关联',
  },
} as const;
export type SystemId = keyof typeof systems;
export type CatalogEntry = {
  id: string;
  name: string;
  kind: string;
  category: string;
  summary: string;
  publisher: string;
  version: string;
  owned: boolean;
  enabled: boolean;
  details: string[];
  system?: SystemId;
  sourceNote?: string;
};
export const digitalProfiles = profiles;
export const agentDetailProfiles = agentDetails;
export const projectAgent = 'project-coordination-digital-person';
export const fiscalAgent = 'fiscal-fund-supervision-digital-person';
export const paymentSkill = 'payment-remark-review';
export function initialCatalog(): CatalogEntry[] {
  return [
    ...builtOrganizationCarriers.map((a) => ({
      id: a.id,
      name: a.displayName,
      kind: '组织智能载体',
      category: '组织岗位',
      summary: a.summary || '',
      publisher: unitForCarrier(a.id)?.formalName || '',
      version: '1.0',
      owned: true,
      enabled: true,
      details: a.services || [],
    })),
    {
      id: paymentSkill,
      name: '支付备注隐晦表达审查',
      kind: 'Skill',
      category: '财政管理',
      summary: '结合支付用途、对象和合同标的识别待核实疑点，区分名称歧义。',
      publisher: '市财政局',
      version: '1.0',
      owned: true,
      enabled: true,
      details: [
        '原文保留与逐项定位',
        '区分薪酬描述与产品名称',
        '提出核实建议，由经办人员确认',
      ],
    },
    ...Object.entries(systems).map(([id, s]) => ({
      id: `connector-${id}`,
      name: s.name,
      kind: '连接器',
      category: '政务系统',
      summary: s.scope,
      publisher: '当前政务工作环境',
      version: '1.0',
      owned: true,
      enabled: true,
      details: [s.path, s.scope, '使用当前经办身份，正式操作另行检查'],
      system: id as SystemId,
    })),
    {
      id: 'finance-knowledge',
      name: '财政发展中心库',
      kind: '知识库',
      category: '当前单位',
      summary: '历史项目、资产台账、运维范围与服务保障要求。',
      publisher: '深圳市财政发展综合保障中心',
      version: '2026.09',
      owned: true,
      enabled: true,
      details: [
        '历史建设项目与资产记录',
        '运行维护工作范围',
        '申报方案与附件基础资料',
      ],
    },
    {
      id: 'knowledge-city-lexiang',
      name: '市中台乐享知识库',
      kind: '知识库',
      category: '市级共享',
      summary: '市级共享目录中当前账号可见的通用业务知识。',
      publisher: '接入配置待确认',
      version: '2026.09',
      owned: true,
      enabled: true,
      details: ['语义检索', '跨库匹配', '来源定位'],
    },
    {
      id: 'knowledge-finance-public',
      name: '财政局公开库',
      kind: '知识库',
      category: '部门公开',
      summary: '财政局官网公开的机构职能、政策文件和通知公告索引。',
      publisher: '深圳市财政局公开信息来源',
      version: '2026.09',
      owned: true,
      enabled: true,
      details: ['全文检索', '发布日期筛选', '官方原文定位'],
    },
    {
      id: 'knowledge-city-public',
      name: '全市公开信息库',
      kind: '知识库',
      category: '全市公开',
      summary: '市级部门公开的机构职能、政策、通知和业务知识索引。',
      publisher: '深圳政府在线公开信息来源',
      version: '2026.09',
      owned: true,
      enabled: true,
      details: ['按部门检索', '跨来源核对', '官方页面定位'],
    },
    {
      id: 'knowledge-fiscal-policy',
      name: '财政政策法规库',
      kind: '知识库',
      category: '财政专题',
      summary: '财政政策、规范性文件、资金管理办法和政策解读索引。',
      publisher: '政策法规公开来源',
      version: '2026.09',
      owned: true,
      enabled: true,
      details: ['文号检索', '有效性提示', '条款原文定位'],
    },
    ...(retained as CatalogEntry[]),
  ];
}
export const paymentWarningTerms = ['基本建设', '基建', '投资', '资本金', '股权', '绩效', '奖金', '社保', '年金', '幼儿园', '附小'];
export const originalRemarks = [
  '12-14601 转材料系等46个院系人员年薪补差-一次性奖金计税至基本户代扣代缴',
  'ERS电子资源利用绩效分析平台（数据库费）|BX2026030900029',
];
export const teachingExample =
  '请将以下核对要求和政策依据加入程序记忆，以后遇到此类申请按这个方法核查。\n\n依据《支持地方高校改革发展资金管理办法》（财教〔2021〕315号）第十二条（节选）：“支持地方高校改革发展资金不得用于基本建设、对外投资、偿还债务、支付利息、支付罚款、捐赠赞助等支出，不得用于在全校范围内普遍提高人员薪酬待遇”。\n\n先核对申请资金是否属于支持地方高校改革发展资金，再结合实际事项、支付对象、合同标的和支付依据判断。人员年薪补差转基本户且说明不充分的，要补充核实是否涉及全校范围内普遍提高薪酬待遇；产品名称里的“绩效分析”不能直接当成人员绩效发放。资金来源或材料不足时先补充核实，不要仅凭关键词认定违规，也不要建议通过换词掩盖真实用途。';
export const assets = [
  {
    id: 'CZ-ZC-001',
    name: '财政资金穿透式监管核心应用',
    category: '定制开发软件',
    quantity: 1,
    purchase: 360,
    monthly: 3,
    importance: '核心',
    acceptance: '2024-12-20',
    warrantyEnd: '2025-12-19',
  },
  {
    id: 'CZ-ZC-002',
    name: '财政支付数据交换组件',
    category: '定制开发软件',
    quantity: 1,
    purchase: 240,
    monthly: 2,
    importance: '重要',
    acceptance: '2024-12-20',
    warrantyEnd: '2025-12-19',
  },
  {
    id: 'CZ-ZC-003',
    name: '资金监管规则分析组件',
    category: '定制开发软件',
    quantity: 1,
    purchase: 240,
    monthly: 2,
    importance: '重要',
    acceptance: '2024-12-20',
    warrantyEnd: '2025-12-19',
  },
  {
    id: 'CZ-ZC-004',
    name: '监管报表与查询组件',
    category: '定制开发软件',
    quantity: 1,
    purchase: 120,
    monthly: 1,
    importance: '一般',
    acceptance: '2024-12-20',
    warrantyEnd: '2025-12-19',
  },
];
export const sourceStatement =
  '两条支付备注来自用户提供的 Excel，机构职责来自归档政府公开资料。运维资产、合同、人员联系信息、费用参数和办理回执为统一场景资料；不代表真实财政支出、平台定价或已接入的政府系统。当前页面状态仅在本次会话中有效，刷新恢复初始历史。';
export const knowledgeText =
  '财政资金穿透式监管系统已形成核心监管应用、支付数据交换、规则分析和监管报表四类软件资产。2027 年运维范围包括运行巡检、故障响应、数据接口维护、既有规则维护和报表运行保障；本期不包含新增系统建设。关联历史项目为“财政资金穿透式监管系统建设项目”，建设合同为 CZ-CT-2024-01。维护对象应与资产清单逐项对应，保障内容应列明服务时间、响应方式、备份恢复和访问授权要求。';

/** 交办单号为本地故事设定，所有读取入口使用同一单据。 */
export const oaAssignment = {
  id: 'CZ-OA-20260907-018',
  request: '请帮我处理财政内部交办事项，单号是 CZ-OA-20260907-018。先帮我看看具体要求是什么。',
} as const;

export const paymentReturnOpinions = [
  '本笔“年薪补差、一次性奖金”用途描述存疑，请发起单位重新准确描述实际支付事项、发放对象及范围，说明是否涉及全校范围内普遍提高人员薪酬待遇，并补充支付依据后重新提交。',
  '本笔“绩效分析平台（数据库费）”用途描述存疑，请发起单位重新准确描述实际采购或建设内容，说明属于数据库资源使用、平台服务还是建设支出，并补充合同标的及支付依据后重新提交。',
];
