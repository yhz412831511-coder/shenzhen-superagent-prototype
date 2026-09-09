import type {
  Memory,
  MemoryApplication,
  MemoryState,
  Payload,
  Scope,
  Source,
} from './memory-domain';

export function initialMemoryState(now: number): MemoryState {
  const date = new Date(now).toISOString();
  const source: Source = {
    label: '本人工作记录',
    quote:
      '记忆内容来自当前用户已完成或正在办理的工作，具体业务结论仍以原始材料和系统回执为准。',
    nature: 'event',
    accessible: true,
  };
  const create = (
    id: string,
    title: string,
    payload: Payload,
    application: MemoryApplication,
    scope: Scope = 'personal',
    status: 'active' | 'candidate' = 'active',
    extra: Partial<Source> = {},
    owner?: string,
  ): Memory => ({
    id,
    scope,
    owner:
      owner ||
      (scope === 'personal' ? '林思远' : '市财政局 · 组织经验'),
    current: id + '-v1',
    subscribed: scope !== 'personal',
    revisions: [
      {
        id: id + '-v1',
        number: 1,
        title,
        payload,
        application,
        source: { ...source, ...extra },
        validFrom: extra.url ? '2026-09-08T00:00:00+08:00' : date,
        validTo: '',
        recordedAt: date,
        status,
        reason: '从工作过程形成',
        confirmedBy:
          status === 'active'
            ? extra.url
              ? '依据公开来源核对'
              : '本人工作记录'
            : '',
      },
    ],
    events: [{ at: date, text: '从工作过程形成' }],
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
        'term-payment-performance',
        '“绩效分析”在支付备注中的含义',
        {
          kind: 'semantic',
          term: '绩效分析',
          aliases: ['ERS电子资源利用绩效分析平台'],
          definition:
            '在本笔申请中，“绩效分析”是数据库服务所对应平台名称的一部分，表示对电子资源利用情况进行分析。',
          context: '财政支付审查 · ERS平台数据库费',
          distinction:
            '不能仅因出现“绩效”二字，就认定为人员绩效发放或普遍提高薪酬待遇；仍需核对合同标的、支付对象、实际用途和支付依据。',
          example:
            '核对ERS电子资源利用绩效分析平台数据库费时，先按信息化服务理解“绩效分析”，再结合业务材料判断实际用途。',
        },
        {
          workRole: '识别支付备注中的专业名称，避免把产品名称误解为人员支出。',
          applicableWork: '财政支付审查 · ERS平台数据库费',
          workBenefit:
            '帮助排除单纯由关键词触发的错误疑点，把审查重点转回合同标的、支付对象和实际用途。',
          responsibilityBoundary:
            '该解释只适用于本笔信息化服务申请；不代表申请已通过，也不能替代原始合同和支付依据核验。',
        },
        'personal',
        'active',
        {
          taskId: 'payment-history',
          label: '财政支付审查 · 2026-09-03',
          quote:
            '产品名称里的“绩效分析”不能直接当成人员绩效发放，应结合实际事项、支付对象、合同标的和支付依据判断。',
        },
      ),
      create(
        'term-cdos',
        'CDOS',
        {
          kind: 'semantic',
          term: 'CDOS',
          aliases: ['一体化数字资源管理系统'],
          definition:
            'CDOS是当前“一体化数字资源管理系统”的过往称谓。本次运维项目申报通过该系统查询并关联本单位历史项目资产。',
          context: '政务信息化运维项目申报',
          distinction:
            '名称变化不代表存在两套独立系统；资产查询和同步仍需使用当前有效的一体化数字资源管理系统连接器及本人权限。',
          example:
            '从一体化数字资源管理系统（原CDOS）选择本单位运维资产，并同步至项管平台。',
        },
        {
          workRole: '把历史称谓与当前系统名称对应起来，保持跨材料和跨系统理解一致。',
          applicableWork: '财政资金穿透式监管系统运维项目申报',
          workBenefit:
            '阅读旧材料时能直接定位当前办理入口，避免把同一系统误判为两个资产来源。',
          responsibilityBoundary:
            '名称对应关系不扩大访问范围；只能查询本人已有权限的本单位关联资产。',
        },
        'personal',
        'active',
        {
          taskId: 'maintenance-history',
          label: '运维项目申报 · 系统名称核对',
          quote:
            '申报过程中使用一体化数字资源管理系统关联资产；业务材料中的CDOS为该系统过往称谓。',
        },
      ),
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
        {
          workRole: '识别深圳政务服务中的专有名称及其访问关系。',
          applicableWork: '政策咨询、办事引导及政务服务入口说明',
          workBenefit:
            '回答相关咨询时能区分服务能力与访问入口，避免把“深小i”和“i深圳”当作同一产品。',
          responsibilityBoundary:
            '只提供名称理解和公开信息说明；不代表已连接深小i，也不授予查询或代办权限。',
        },
        'personal',
        'active',
        {
          taskId: undefined,
          eventId: undefined,
          label: '深圳市政务服务和数据管理局 · 业务知识库 · 2025-03-12',
          quote:
            '公开答复说明：深小i为企业群众提供政策解答和办事引导，可在i深圳APP中进入对话。此处为来源摘要，术语用途于2026-09-08核对。',
          url: 'https://www.sz.gov.cn/hdjl/ywzsk/zwfwsjglj/zwfw/content/post_12068659.html',
          nature: 'published',
        },
      ),
      create(
        'method-maintenance-application',
        '运维项目申报办理流程',
        {
          kind: 'procedural',
          method:
            '从本人指定的OA交办事项出发，按项管建项、资产关联、材料核对、平台估算、本人提交和反馈跟踪的顺序办理。',
          conditions:
            '本单位政务信息化系统运维项目申报，且经办人员已取得OA、项管平台和资产系统相应权限。',
          steps: [
            '读取本人指定的OA交办单并核对承办范围',
            '在项管平台建立运维类项目并关联历史建设项目',
            '从一体化数字资源管理系统关联本单位资产并同步',
            '依据本处室资料准备申报材料并核对版本一致性',
            '读取并解释项管平台费用估算',
            '由本人核对后完成正式提交；收到告知后再创建反馈跟踪',
          ],
          exceptions:
            '智能体不代替本人作出正式提交决定；平台估算不是批复金额。提交回执不明确时先查询状态，不重复提交。',
        },
        {
          workRole: '复用跨OA、项管平台和资产系统的完整申报顺序。',
          applicableWork: '本单位政务信息化系统运维项目申报',
          workBenefit:
            '把分散在多个系统和材料中的办理要求组织成连续步骤，明确每一步的输入、结果和下一步。',
          responsibilityBoundary:
            '办理指引不代替立项审批或本人正式提交；费用以项管平台结果为准，正式金额以审批结果为准。',
        },
        'city',
        'active',
        {
          label: '项目统筹处数字人 · 运维项目申报办理指引',
          quote:
            '办理指引依据项目统筹处公开职责、本次运维申报流程资料和系统截图整理；具体字段和审批要求以当前平台为准。',
          nature: 'published',
        },
        '深圳市政务服务和数据管理局 · 项目统筹处',
      ),
      create(
        'event-performance-review',
        '“绩效分析平台数据库费”疑点排除经过',
        {
          kind: 'episodic',
          subtype: 'past',
          context: '财政支付审查 · ERS平台数据库费',
          event:
            '支付备注出现“绩效分析”，初步关键词检查提示可能涉及人员绩效支出。',
          decision:
            '本人要求结合产品名称、合同标的和实际用途核对，不能只凭“绩效”二字认定违规。',
          outcome:
            '核对后按数据库服务事项理解该名称，本项关键词疑点被排除；支付申请仍按其他有效规则和材料继续审查。',
          occurredAt: '2026-09-03T09:04:00+08:00',
        },
        {
          workRole: '保留一次关键词疑点被业务事实纠正的完整处理经过。',
          applicableWork: '支付备注含有容易误判的专业名称或产品名称时',
          workBenefit:
            '遇到相似情况时先核对真实业务对象和材料，避免把关键词命中直接当成违规结论。',
          responsibilityBoundary:
            '本次排除只针对该笔数据库服务申请，不改变其他支付事项的审查要求。',
        },
        'personal',
        'active',
        {
          taskId: 'payment-history',
          label: '财政支付审查 · 疑点确认记录',
          quote:
            '第二笔记录中的“绩效分析”属于平台产品名称，不能直接当成人员绩效发放；本项疑点按产品含义排除。',
        },
      ),
      create(
        'plan-maintenance-feedback',
        '运维项目提交后的反馈跟进',
        {
          kind: 'episodic',
          subtype: 'plan',
          goal:
            '收到项管平台审核反馈后，核对反馈对象和申报版本，整理退回原因、修改清单和处理建议。',
          context: '财政资金穿透式监管系统运维项目申报',
          responsible: '本人',
          due: '',
          phase: '收到项管平台审核反馈后',
          completion:
            '形成逐项修改清单并由本人确认下一步；不自动修改材料或重新提交。',
          progress: 'planned',
        },
        {
          workRole: '在提交后持续保留待办状态，收到反馈时接续处理。',
          applicableWork: '运维项目已由本人提交、正在等待项管平台审核反馈',
          workBenefit:
            '反馈到达时直接生成跟进任务并形成修改清单，不必重新梳理项目背景和提交版本。',
          responsibilityBoundary:
            '当前尚未收到审核反馈，不补造时间和结果；所有材料修改与再次提交仍由本人确认。',
        },
        'personal',
        'active',
        {
          taskId: 'maintenance-history',
          label: '运维项目申报 · 本人提交告知与反馈跟踪记录',
          quote:
            '本人告知已在项管平台手动提交，未取得系统提交回执；随后确认创建审核反馈追踪，目前尚未收到反馈。',
        },
      ),
      create(
        'assignment-payment-review',
        '财政支付审查事项分工',
        {
          kind: 'functional',
          subtype: 'assignment',
          entity: '本人、超级智能体与业务系统',
          responsibility:
            '超级智能体负责读取已授权申请、整理疑点、执行规则核查并生成审查意见；本人确认疑点判断和最终回写；智慧财政系统记录审查意见，财政穿透式监管系统返回其他规则检查结果。',
          context: '财政支付审查 · 2026-09-03',
          confirmedBy: '本人任务决定与系统操作回执',
        },
        {
          workRole: '明确支付审查中人、智能体和业务系统各自承担的工作。',
          applicableWork: '财政支付审查及审查意见回写',
          workBenefit:
            '智能体可以连续完成材料整理和规则核查，同时把疑点确认、正式回写等关键决定保留给本人。',
          responsibilityBoundary:
            '回写内容仅为审查意见，不批准支付或拨款；完全访问也不能突破来源系统权限。',
        },
        'personal',
        'active',
        {
          taskId: 'payment-history',
          label: '财政支付审查 · 操作决定与回执',
          quote:
            '疑点决定和最终回写分别由本人确认；智能体只回写审查意见，不批准支付或拨款。',
        },
      ),
      create(
        'function-project-office',
        '项目统筹处正式职能依据',
        {
          kind: 'functional',
          subtype: 'formal',
          entity: '深圳市政务服务和数据管理局 · 项目统筹处',
          responsibility:
            '承担全市政务信息化项目统筹及相关平台建设，以及有关市级政务信息化服务项目立项审批职责。',
          context: '政务信息化项目统筹与立项审批',
          confirmedBy: '深圳市政务服务和数据管理局公开职能页面',
        },
        {
          workRole: '确认运维项目申报指引应依据哪个机构的正式职责和公开口径。',
          applicableWork: '市级政务信息化服务项目申报、统筹和办理咨询',
          workBenefit:
            '申报人员能够找到职责匹配的咨询来源，并把办理指导与财政局本人的申报责任区分开。',
          responsibilityBoundary:
            '公开职能用于确认职责范围；数字人提供办理咨询，不代表项目已获立项审批。',
        },
        'city',
        'active',
        {
          taskId: undefined,
          eventId: undefined,
          label: '深圳市政务服务和数据管理局 · 项目统筹处 · 2024-05-08',
          quote:
            '公开职责包含全市政务信息化项目统筹及相关平台建设，以及有关市级政务信息化服务项目立项审批。',
          url: 'https://www.sz.gov.cn/zwfwsjglj_2019/jgzn/nzjg/content/post_11276192.html',
          nature: 'published',
        },
        '深圳市政务服务和数据管理局 · 项目统筹处',
      ),
    ],
  };
}
