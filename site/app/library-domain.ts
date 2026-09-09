import type { SavedContext } from './memory-domain';

export type PersonalStorage = 'local' | 'cloud';
export type PersonalAvailability =
  | 'available'
  | 'synced'
  | 'reauthorize'
  | 'pending';

export type LibraryUse = {
  taskId: string;
  title: string;
  at: string;
};

export type PersonalLibraryItem = {
  id: string;
  name: string;
  storage: PersonalStorage;
  itemType: '文件' | '文件夹';
  format: string;
  location: string;
  source: string;
  modifiedAt: string;
  sizeLabel: string;
  availability: PersonalAvailability;
  availabilityLabel: string;
  access: string;
  summary?: string;
  preview?: string[];
  recentUses: LibraryUse[];
  boundaries: string[];
};

export type KnowledgeBaseProfile = {
  catalogId: string;
  name: string;
  level: string;
  sourceType: string;
  maintainer: string;
  connectionStatus: string;
  updatedAt: string;
  accessScope: string;
  searchableScope: string;
  capabilities: string[];
  sourceLabel: string;
  sourceUrl?: string;
  boundaries: string[];
};

export type LibraryState = {
  personalItems: PersonalLibraryItem[];
};

export const initialPersonalLibraryItems: PersonalLibraryItem[] = [
  {
    id: 'local-payment-review-source',
    name: '0709关键字--疑点核实-全部(1).xlsx',
    storage: 'local',
    itemType: '文件',
    format: 'Excel 工作簿',
    location: '本机 / 财政工作 / 支付审查',
    source: '本人选择的本地资料',
    modifiedAt: '2026-07-09 14:23',
    sizeLabel: '9.8 KB',
    availability: 'available',
    availabilityLabel: '本机可用',
    access: '仅本人当前工作区可读',
    summary:
      '支付用途疑点核实原始工作簿，用于核对原文、支付对象、合同标的和补充说明。',
    preview: [
      '12-14601 转材料系等46个院系人员年薪补差-一次性奖金计税至基本户代扣代缴',
      'ERS电子资源利用绩效分析平台（数据库费）|BX2026030900029',
    ],
    recentUses: [
      {
        taskId: 'payment-history',
        title: '财政支付审查 · 2026-09-03',
        at: '2026-09-03',
      },
    ],
    boundaries: [
      '原文保留在本地文件中，加入任务不会将文件转为组织知识。',
      '未经本人明确授权，不会上传、共享或贡献到其他范围。',
    ],
  },
  {
    id: 'local-memory-framework',
    name: '政务AI_Memory可落地性与六层记忆构建方案.pdf',
    storage: 'local',
    itemType: '文件',
    format: 'PDF 文档',
    location: '本机 / 项目资料 / AI Memory',
    source: '本人选择的本地资料',
    modifiedAt: '2026-09-06 16:35',
    sizeLabel: '282 KB',
    availability: 'available',
    availabilityLabel: '本机可用',
    access: '仅本人当前工作区可读',
    summary:
      '用于理解政务AI记忆的分层、生效边界、经验流动与可落地方式。',
    recentUses: [],
    boundaries: [
      '该文件是任务参考资料，不会因为加入任务自动生成AI记忆。',
      '文档中的方案和建议需结合当前业务要求确认后使用。',
    ],
  },
  {
    id: 'local-maintenance-folder',
    name: '财政资金穿透式监管系统运维项目申报',
    storage: 'local',
    itemType: '文件夹',
    format: '项目资料目录',
    location: '本机 / 财政工作 / 运维项目申报',
    source: '本人选择的本地目录',
    modifiedAt: '2026-09-07 17:40',
    sizeLabel: '7 份文件',
    availability: 'available',
    availabilityLabel: '本机可用',
    access: '仅本人当前工作区可读',
    summary:
      '已由本人选择的运维申报材料目录，包含申请表、预算、方案和相关分册。',
    recentUses: [
      {
        taskId: 'maintenance-history',
        title: '财政资金穿透式监管系统运维项目申报',
        at: '2026-09-07',
      },
    ],
    boundaries: [
      '该目录是本人主动加入的资料索引，不是任务成果的自动备份。',
      '任务中只按当前授权读取，不会自动移动、修改或上传文件。',
    ],
  },
  {
    id: 'cloud-maintenance-collaboration',
    name: '运维项目申报协作资料',
    storage: 'cloud',
    itemType: '文件夹',
    format: '云端协作目录',
    location: '个人云空间 / 财政工作 / 运维申报',
    source: '当前账号授权的个人云空间',
    modifiedAt: '2026-09-07 18:10',
    sizeLabel: '9 项',
    availability: 'synced',
    availabilityLabel: '已同步',
    access: '本人可读写',
    summary:
      '与运维项目申报相关的云端协作目录，包含材料版本和修订记录。',
    recentUses: [
      {
        taskId: 'maintenance-history',
        title: '财政资金穿透式监管系统运维项目申报',
        at: '2026-09-07',
      },
    ],
    boundaries: [
      '仅授权当前目录，不扩大到个人云空间的其他位置。',
      '加入任务只授权本次使用，不会自动加入项目或组织知识库。',
    ],
  },
  {
    id: 'cloud-payment-reference',
    name: '财政支付审查参考材料',
    storage: 'cloud',
    itemType: '文件夹',
    format: '云端资料目录',
    location: '个人云空间 / 财政工作 / 支付审查',
    source: '当前账号授权的个人云空间',
    modifiedAt: '2026-09-03 16:20',
    sizeLabel: '6 项',
    availability: 'synced',
    availabilityLabel: '已同步',
    access: '本人只读',
    summary:
      '个人收集的支付审查参考材料，仅用于当前任务核对。',
    recentUses: [
      {
        taskId: 'payment-history',
        title: '财政支付审查 · 2026-09-03',
        at: '2026-09-03',
      },
    ],
    boundaries: [
      '只读授权不允许任务修改或覆盖云端原件。',
      '个人云资料不因为被使用而转为单位知识。',
    ],
  },
  {
    id: 'cloud-annual-archive',
    name: '历史年度工作材料',
    storage: 'cloud',
    itemType: '文件夹',
    format: '云端归档目录',
    location: '个人云空间 / 历史材料',
    source: '过往连接的个人云空间',
    modifiedAt: '2026-06-30 10:00',
    sizeLabel: '暂不可读',
    availability: 'reauthorize',
    availabilityLabel: '需重新授权',
    access: '当前无读取权限',
    recentUses: [],
    boundaries: [
      '授权已失效，当前不展示内容摘要，也不能加入任务。',
      '重新授权时需由本人确认可读目录和权限范围。',
    ],
  },
];

export const knowledgeBaseProfiles: KnowledgeBaseProfile[] = [
  {
    catalogId: 'knowledge-city-lexiang',
    name: '市中台乐享知识库',
    level: '市级共享',
    sourceType: '外接知识库配置',
    maintainer: '接入配置待确认',
    connectionStatus: '已接入',
    updatedAt: '2026-09-09 08:30',
    accessScope: '当前账号可检索市级共享目录中的可见内容',
    searchableScope: '市级通用业务知识与已授权共享资料',
    capabilities: ['语义检索', '跨库匹配', '来源定位'],
    sourceLabel: '用户确认的外接配置名称',
    boundaries: [
      '库名来自当前接入配置，维护单位和正式服务范围需在实际接入时确认。',
      '平台只检索当前账号可见内容，不借由跨库检索扩大原系统权限。',
    ],
  },
  {
    catalogId: 'knowledge-finance-public',
    name: '财政局公开库',
    level: '部门公开',
    sourceType: '政府公开网站信息索引',
    maintainer: '深圳市财政局网站公开信息来源',
    connectionStatus: '公开来源可用',
    updatedAt: '2026-09-09',
    accessScope: '当前账号可检索公开发布内容',
    searchableScope: '财政局官网公开的机构职能、政策文件、通知公告等信息',
    capabilities: ['全文检索', '发布日期筛选', '官方原文定位'],
    sourceLabel: '深圳市财政局政府信息公开平台',
    sourceUrl: 'https://szfb.sz.gov.cn/gkmlpt/index',
    boundaries: [
      '这是对政府公开网站内容的检索索引，不表示财政局已发布同名RAG服务。',
      '检索结果以官方原文和当前有效状态为准。',
    ],
  },
  {
    catalogId: 'finance-knowledge',
    name: '财政发展中心库',
    level: '当前单位',
    sourceType: '单位内部知识库',
    maintainer: '深圳市财政发展综合保障中心',
    connectionStatus: '已接入',
    updatedAt: '2026-09-08 18:00',
    accessScope: '当前单位中本人已授权的系统建设和运维资料',
    searchableScope: '历史项目、资产台账、运维范围和服务保障要求',
    capabilities: ['语义检索', '项目关联', '材料来源引用'],
    sourceLabel: '深圳市财政发展综合保障中心章程（机构名称与职责范围依据）',
    sourceUrl: 'https://szfb.sz.gov.cn/xwzx/tzgg/content/post_10902183.html',
    boundaries: [
      '单位名称和职能范围有公开依据；库内资料和连接状态来自当前工作区配置。',
      '只返回本人在单位知识库中有权访问的内容，不展示库内文档目录。',
    ],
  },
  {
    catalogId: 'knowledge-city-public',
    name: '全市公开信息库',
    level: '全市公开',
    sourceType: '深圳政府在线公开信息索引',
    maintainer: '深圳政府在线公开信息来源',
    connectionStatus: '公开来源可用',
    updatedAt: '2026-09-09',
    accessScope: '公开信息可检索',
    searchableScope: '市级部门公开的机构职能、政策、通知、业务知识等信息',
    capabilities: ['按部门检索', '跨来源核对', '官方页面定位'],
    sourceLabel: '深圳政府在线业务知识库及部门公开平台',
    sourceUrl: 'https://www.sz.gov.cn/hdjl/ywzsk',
    boundaries: [
      '这是对全市政府公开信息的统一检索索引，不替代各部门原网站。',
      '只有实际被任务检索和引用的内容才记录为本次任务来源。',
    ],
  },
  {
    catalogId: 'knowledge-fiscal-policy',
    name: '财政政策法规库',
    level: '财政业务专题',
    sourceType: '公开政策法规索引',
    maintainer: '政策法规公开来源',
    connectionStatus: '公开来源可用',
    updatedAt: '2026-09-09',
    accessScope: '公开政策法规可检索',
    searchableScope: '财政政策、规范性文件、资金管理办法及已公开政策解读',
    capabilities: ['文号检索', '有效性提示', '条款原文定位'],
    sourceLabel: '深圳市财政局政策法规公开来源',
    sourceUrl: 'https://szfb.sz.gov.cn/gkmlpt/index',
    boundaries: [
      '政策检索结果不自动代替适用性判断，使用前需核对发文主体、有效状态和适用范围。',
      '平台保留官方原文链接，不改写或补造政策条款。',
    ],
  },
];

export function initialLibraryState(): LibraryState {
  return { personalItems: structuredClone(initialPersonalLibraryItems) };
}

export function canUsePersonalItem(item: PersonalLibraryItem) {
  return item.availability === 'available' || item.availability === 'synced';
}

export function personalItemContext(item: PersonalLibraryItem): SavedContext {
  return { id: item.id, kind: '资料', label: item.name };
}

export function knowledgeBaseContext(
  profile: KnowledgeBaseProfile,
): SavedContext {
  return {
    id: profile.catalogId,
    kind: '知识库',
    label: profile.name,
  };
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
