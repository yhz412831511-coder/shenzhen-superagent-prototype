export const groups = [
  {
    name: '管理总览',
    icon: 'section',
    pages: [['overview', '管理总览', '掌握全市使用、运行与安全情况']],
  },
  {
    name: '组织与服务',
    icon: 'section',
    pages: [
      ['applications', '席位申请', '审核单位申请的数量、用途和材料'],
      ['seats', '单位席位', '管理席位额度、开通状态与实际使用'],
      ['tickets', '服务工单', '分派使用问题、跟进处理与反馈'],
      ['accounts', '单位与账号', '维护单位登记与管理员子账号'],
      ['roles', '角色权限', '配置市中台岗位职责与管理范围'],
    ],
  },
  {
    name: '能力与接入',
    icon: 'section',
    pages: [
      ['systems', '系统接入', '审核业务系统接入，管理授权与访问范围'],
      ['agents', '专业智能体', '审核建设成果，管理版本、评测与发布'],
      ['skills', '技能管理', '管理可复用执行方法及适用范围'],
      ['plugins', '插件管理', '管理软件能力、权限与版本'],
      ['connectors', '连接器管理', '管理系统授权与连接状态'],
      ['models', '模型服务', '管理模型目录、版本、健康状态、授权范围和可用性'],
      ['intake', '个人技能接收', '接收个人快照，经评测审批后发布独立组织版本'],
    ],
  },
  {
    name: '运行管理',
    icon: 'section',
    pages: [
      ['tasks', '任务运行', '定位执行链路、耗时与失败原因'],
      ['sandboxes', '沙箱管理', '管理任务环境、隔离与恢复'],
      ['spaces', '个人工作空间', '管理容量、配额与服务可用状态'],
    ],
  },
  {
    name: 'Token与评测',
    icon: 'section',
    pages: [
      ['usage', 'Token分析', '按原子任务核对Token分布、路由效率与计量明细'],
      ['quotas', '额度管理', '管理周期额度、预警和增额申请'],
      ['routing', '任务路由', '配置原子任务分类、模型路由与生效版本'],
      [
        'evaluations',
        '评测与改进',
        '统一管理准入、质量安全、路由回归和改进评测',
      ],
    ],
  },
  {
    name: '安全与审计',
    icon: 'section',
    pages: [
      ['alerts', '安全告警', '核查风险、分派整改与恢复复核'],
      ['rules', '安全规则', '管理控制事项、适用范围与生效版本'],
      ['audit', '审计记录', '核对管理操作、执行结果与责任人'],
    ],
  },
  {
    name: '知识与记忆服务',
    icon: 'section',
    pages: [
      ['knowledge', '组织知识', '管理知识来源、同步、版本与授权'],
      ['experience', '组织经验', '审核、发布与维护组织经验'],
      ['memory', '记忆服务', '管理服务开通、容量与授权记录'],
    ],
  },
] as const;
export type PageId = (typeof groups)[number]['pages'][number][0];
export const pages = groups.flatMap((g) =>
  g.pages.map((p) => ({ id: p[0], name: p[1], purpose: p[2], group: g.name })),
);
export const pageName = (id: PageId) => pages.find((p) => p.id === id)!.name;
