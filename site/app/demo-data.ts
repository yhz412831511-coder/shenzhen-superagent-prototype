export type TaskKey = 'legal' | 'inspection' | 'annual' | 'daily' | 'tracking';

export type TimelineItem =
  | { type: 'stage'; label: string; time: string }
  | { type: 'user'; text: string; time: string }
  | {
      type: 'assistant';
      title?: string;
      text: string;
      bullets?: string[];
      time: string;
    }
  | { type: 'plan'; title: string; steps: string[]; time: string }
  | {
      type: 'evidence';
      title: string;
      summary: string;
      sources: string[];
      tone?: 'warning' | 'normal';
      time: string;
    }
  | {
      type: 'confirmation';
      title: string;
      summary: string;
      result: string;
      time: string;
    }
  | {
      type: 'quality';
      title: string;
      issue: string;
      resolution: string;
      time: string;
    }
  | { type: 'artifacts'; title: string; files: string[]; time: string }
  | { type: 'receipt'; title: string; details: string[]; time: string }
  | {
      type: 'completion';
      title: string;
      summary: string;
      highlights: string[];
      time: string;
    };

export type TaskSurface =
  | {
      type: 'browser';
      stepIndex: number;
      title: string;
      url: string;
      zone: '互联网' | '政务外网' | '本地预览';
      status: string;
      permission: string;
      action: string;
      pageTitle: string;
      pageMeta: string;
      excerpts: string[];
    }
  | {
      type: 'terminal';
      stepIndex: number;
      title: string;
      directory: string;
      status: string;
      command: string;
      summary: string;
      lines: {
        text: string;
        tone?: 'normal' | 'muted' | 'success' | 'warning';
      }[];
    };

export type DemoTask = {
  id: TaskKey;
  title: string;
  shortTitle: string;
  status: string;
  externalState: string;
  updatedAt: string;
  sourceCount: number;
  artifactCount: number;
  agent: string;
  skills: string[];
  memories: {
    name: string;
    kind: '经验' | '规则' | '偏好' | '纠错结论';
    action: '调用' | '新增';
    detail: string;
    state: string;
  }[];
  artifacts: { name: string; meta: string; state: string }[];
  evidence: { name: string; meta: string; state: string }[];
  versions: {
    name: string;
    meta: string;
    active?: boolean;
    locked?: boolean;
  }[];
  run: {
    phase: string;
    duration: string;
    mode: string;
    steps: {
      title: string;
      summary: string;
      meta: string;
      state: 'done' | 'resolved' | 'running' | 'waiting';
      output: string;
    }[];
    surfaces: TaskSurface[];
    calls: {
      name: string;
      kind:
        | '智能体'
        | 'Skill'
        | '插件'
        | 'MCP'
        | '知识源'
        | '连接器'
        | '资料库'
        | 'Memory';
      detail: string;
      state: string;
    }[];
    interventions: {
      stepIndex: number;
      title: string;
      meta: string;
      state: string;
      tone: 'success' | 'warning' | 'normal';
    }[];
  };
  timeline: TimelineItem[];
};

export const demoTasks: Record<TaskKey, DemoTask> = {
  legal: {
    id: 'legal',
    title: '审查《深圳经济特区城市管理条例（草案送审稿）》',
    shortTitle: '城市管理条例草案审查',
    status: '已完成',
    externalState: 'OA已归档',
    updatedAt: '今天 10:42',
    sourceCount: 6,
    artifactCount: 3,
    agent: '政务材料智能体',
    skills: ['法规一致性审查', '意见冲突核验', '公文质量检查'],
    memories: [
      {
        name: '正式审查意见分类规则',
        kind: '规则',
        action: '调用',
        detail: '区分必须修改、建议修改、需协调和技术性问题。',
        state: '组织规则 · 只读',
      },
      {
        name: '材料冲突不代替部门立场',
        kind: '纠错结论',
        action: '新增',
        detail: '同一事项表述不一致时保留分歧并请求用户决定。',
        state: '已保存至本任务',
      },
    ],
    artifacts: [
      { name: '审查意见', meta: 'DOCX · OA归档版 v1', state: '只读' },
      { name: '重点问题清单', meta: 'XLSX · 3项重点问题', state: '已核验' },
      { name: '意见处理对照', meta: 'XLSX · 演示材料', state: '已归档' },
    ],
    evidence: [
      {
        name: '深圳市人民政府立法工作规程（试行）',
        meta: '官方来源 · 相关条款已定位',
        state: '已核验',
      },
      {
        name: '中华人民共和国行政处罚法',
        meta: '官方来源 · 现行有效',
        state: '已核验',
      },
      { name: '内部材料一致性核验', meta: '2份演示材料 · 1处不一致', state: '已处理' },
    ],
    versions: [
      {
        name: 'OA归档版 v1',
        meta: '今天 10:42 · 林思远确认',
        active: true,
        locked: true,
      },
      { name: '归档前工作稿 v1', meta: '今天 10:31 · 质量复检通过' },
    ],
    run: {
      phase: '全部步骤已完成',
      duration: '46分钟',
      mode: '自然语言触发 · 多能力协同',
      steps: [
        {
          title: '核对送审版本和附件',
          summary: '识别当前OA事项中的4份已授权演示材料。',
          meta: '09:16—09:20 · 4分钟',
          state: 'done',
          output: '送审稿、起草说明、意见采纳表和会议纪要已进入任务上下文。',
        },
        {
          title: '检索并定位官方依据',
          summary: '只保留与当前问题直接相关的官方来源。',
          meta: '09:20—09:27 · 7分钟',
          state: 'done',
          output: '两项官方来源完成定位，原文可在任务浏览器中打开。',
        },
        {
          title: '交叉核验材料并处理冲突',
          summary: '识别意见采纳表与会议纪要的状态不一致。',
          meta: '09:27—09:35 · 8分钟',
          state: 'resolved',
          output: '用户确认列为需协调事项；智能体未代替任何部门立场。',
        },
        {
          title: '形成三项关联成果',
          summary: '生成主成果、问题清单和意见处理对照。',
          meta: '09:35—10:18 · 23分钟',
          state: 'done',
          output: '三项成果共享问题ID和来源定位，可独立审阅和批注。',
        },
        {
          title: '一致性检查并归档OA',
          summary: '核对来源属性、问题状态、版本和附件范围。',
          meta: '10:18—10:42 · 24分钟',
          state: 'resolved',
          output: '质量门复检通过；用户在OA演示页完成归档。',
        },
      ],
      surfaces: [
        {
          type: 'browser',
          stepIndex: 1,
          title: '深圳市人民政府立法工作规程',
          url: 'https://www.sz.gov.cn/szsrmzfxxgk/zc/gz/content/post_9452773.html',
          zone: '互联网',
          status: '只读核验完成',
          permission: '本任务已允许',
          action: '核验送审材料、意见协调和审查要求',
          pageTitle: '深圳市人民政府立法工作规程（试行）',
          pageMeta: '深圳市人民政府官方发布',
          excerpts: [
            '送审材料应当包含送审稿、说明、意见采纳情况和相关依据材料。',
            '有关单位存在较大意见分歧时，应当组织协调并保留处理情况。',
            '审查关注合法合理、可行性、可操作性和立法技术规范。',
          ],
        },
      ],
      calls: [
        {
          name: '政务材料智能体',
          kind: '智能体',
          detail: '统筹材料、依据、成果与归档',
          state: '完成',
        },
        {
          name: '法规一致性审查',
          kind: 'Skill',
          detail: '核对权限、程序和来源定位',
          state: '完成',
        },
        {
          name: '意见冲突核验',
          kind: 'Skill',
          detail: '比较已授权演示材料',
          state: '完成',
        },
        {
          name: '公文质量检查',
          kind: 'Skill',
          detail: '核对三项成果的一致性',
          state: '完成',
        },
        {
          name: '官方法规知识源',
          kind: '知识源',
          detail: '两项官方来源及命中位置',
          state: '已核验',
        },
        {
          name: '深圳OA',
          kind: '连接器',
          detail: '读取当前事项并归档3项成果',
          state: '已归档',
        },
      ],
      interventions: [
        {
          stepIndex: 2,
          title: '演示材料状态不一致',
          meta: '用户确认列为需协调 · 09:33',
          state: '已确认',
          tone: 'warning',
        },
        {
          stepIndex: 4,
          title: '跨成果一致性阻断',
          meta: '自动修正后复检通过 · 10:27',
          state: '已恢复',
          tone: 'warning',
        },
        {
          stepIndex: 4,
          title: '用户在OA页面完成归档',
          meta: '林思远本人确认 · 10:42',
          state: '已归档',
          tone: 'success',
        },
      ],
    },
    timeline: [
      { type: 'stage', label: '理解目标', time: '09:16' },
      {
        type: 'user',
        text: '请审查这份条例草案，重点检查权限和程序边界，形成可以进入OA办理的审查材料。',
        time: '09:16',
      },
      {
        type: 'assistant',
        title: '已建立审查任务',
        text: '我已识别当前OA事项中的送审稿及附件。接下来会定位官方依据，交叉核验材料，形成三项关联成果，并在一致性检查后准备OA归档。',
        bullets: [
          '无需选择工作模式或配置工具链',
          '内部材料统一标为演示材料',
          '无法代替你的判断时才会暂停询问',
        ],
        time: '09:17',
      },
      {
        type: 'plan',
        title: '任务计划 · 5步',
        steps: [
          '核对送审稿与附件版本',
          '检索并定位官方依据',
          '交叉核验材料并处理冲突',
          '形成三项关联成果',
          '一致性检查后归档OA',
        ],
        time: '09:18',
      },
      {
        type: 'assistant',
        title: '上下文已自动组装',
        text: '已读取当前事项内4份演示材料，并从官方法规知识源定位2项直接相关依据。所有来源均保留名称、属性和命中位置。',
        bullets: ['OA附件：当前事项内已授权', '官方依据：只读检索', '未读取其他事项或个人文件'],
        time: '09:22',
      },
      { type: 'stage', label: '交叉核验与决策', time: '09:27' },
      {
        type: 'evidence',
        title: '已定位两项官方依据',
        summary: '只保留与本任务直接相关的审查要求和程序边界，点击来源可在任务浏览器中查看命中范围。',
        sources: ['深圳市人民政府立法工作规程（试行）', '中华人民共和国行政处罚法'],
        time: '09:27',
      },
      {
        type: 'evidence',
        title: '发现一处演示材料冲突',
        summary: '部门意见采纳表将同一事项标记为“已协调一致”，会议纪要仍写“需要进一步确认”。智能体不能代替任何部门判断真实立场。',
        sources: ['部门意见采纳表 · 职责分工行 · 演示材料', '协调会议纪要 · 第3页 · 演示材料'],
        tone: 'warning',
        time: '09:29',
      },
      {
        type: 'confirmation',
        title: '需要你决定冲突如何进入成果',
        summary: '推荐列为“需协调”，在审查意见中保留分歧并建议再次确认；相关段落暂不形成确定结论，其余内容继续处理。',
        result: '林思远已按建议处理 · 09:33',
        time: '09:33',
      },
      {
        type: 'assistant',
        title: '计划已继续执行',
        text: '该事项已统一标为“需协调”，两份材料的原始定位继续保留。其余无冲突内容已进入成果生成。',
        time: '09:34',
      },
      { type: 'stage', label: '质量检查与交付', time: '10:18' },
      {
        type: 'quality',
        title: '跨成果一致性检查阻断了归档',
        issue: '意见处理对照中的一项状态仍为“已协调”，与用户确认的“需协调”不一致。',
        resolution: '已同步三项成果的状态和来源定位，并确认未把演示材料写成官方来源，复检通过。',
        time: '10:27',
      },
      {
        type: 'artifacts',
        title: '三项关联成果已生成',
        files: ['审查意见.docx', '重点问题清单.xlsx', '意见处理对照.xlsx'],
        time: '10:31',
      },
      {
        type: 'receipt',
        title: 'OA演示连接回执',
        details: [
          '动作：归档审查意见、重点问题清单和意见处理对照',
          '身份：林思远（综合处经办岗）本人确认',
          '结果：成功，事项 LS-2026-DEMO-027（演示）',
        ],
        time: '10:42',
      },
      {
        type: 'completion',
        title: '审查材料已完成并归档',
        summary: '两项官方依据可追溯，演示材料冲突已按用户决定保留，三项关联成果通过一致性检查并完成OA归档。',
        highlights: [
          '自然语言交办后自动完成任务规划与上下文组织',
          '无法代替人的判断只请求一次确认',
          'OA归档版只读，继续修改将创建工作副本',
        ],
        time: '10:42',
      },
    ],
  },
  inspection: {
    id: 'inspection',
    title: '涉企行政检查有关问题批示件拟办',
    shortTitle: '涉企行政检查批示件拟办',
    status: '已完成',
    externalState: 'OA待领导审阅',
    updatedAt: '昨天 17:26',
    sourceCount: 11,
    artifactCount: 3,
    agent: '政务材料智能体',
    skills: ['批示件拟办', '检查记录归并', '事实口径核验'],
    memories: [
      {
        name: '涉企检查统计口径',
        kind: '规则',
        action: '新增',
        detail: '入企活动不等于行政检查；联合检查按同一事件归并。',
        state: '已保存至个人',
      },
    ],
    artifacts: [
      { name: '拟办意见', meta: 'DOCX · 398字', state: 'OA待审' },
      { name: '检查事件归并表', meta: 'XLSX · 22次事件', state: '内部' },
      { name: '待核实问题清单', meta: 'XLSX · 4项', state: '内部' },
    ],
    evidence: [
      {
        name: '企业投诉情况报告',
        meta: '1份 · 126条入企活动',
        state: '已核验',
      },
      { name: '行政检查登记', meta: '28条原始记录', state: '已归并' },
      { name: '联合检查参与记录', meta: '6条', state: '已合并' },
      { name: '扫码与补录记录', meta: '4项异常', state: '待核实' },
    ],
    versions: [
      {
        name: 'OA拟办稿 v1',
        meta: '昨天 17:26 · 等待领导审阅',
        active: true,
        locked: true,
      },
      { name: '核验稿 v3', meta: '昨天 17:18 · 398字' },
      { name: '初稿 v1', meta: '昨天 16:41 · 口径待修正' },
    ],
    run: {
      phase: '任务完成 · 等待领导审阅',
      duration: '1小时18分',
      mode: '计划执行 · 人工确认写入',
      steps: [
        {
          title: '核对投诉与批示',
          summary: '拆分领导要求、投诉事实与交付边界。',
          meta: '16:08—16:24 · 16分钟',
          state: 'done',
          output: '锁定约400字决策型拟办，不新建平台、不发起专项行动。',
        },
        {
          title: '归并实际检查事件',
          summary: '按时间、对象和事项归并原始登记。',
          meta: '16:24—16:42 · 18分钟',
          state: 'resolved',
          output: '28条登记归并为22次实际检查；6条联合参与记录不重复计算。',
        },
        {
          title: '标记待核实问题',
          summary: '将证据不足的异常保持为待核实。',
          meta: '16:42—17:08 · 26分钟',
          state: 'done',
          output: '保留疑似重复1项、漏扫码1项、迟录2项及责任反馈期限。',
        },
        {
          title: '形成拟办并写入OA',
          summary: '收敛成稿、保存个人规则、确认后写入。',
          meta: '17:08—17:26 · 18分钟',
          state: 'done',
          output: '398字拟办已写入OA拟办栏；两张内部核验表未上传。',
        },
      ],
      surfaces: [],
      calls: [
        {
          name: '政务材料智能体',
          kind: '智能体',
          detail: '归并事实并形成拟办',
          state: '完成',
        },
        {
          name: '检查记录归并',
          kind: 'Skill',
          detail: '28条记录归并为22次事件',
          state: '完成',
        },
        {
          name: '事实口径核验',
          kind: 'Skill',
          detail: '区分入企活动与行政检查',
          state: '完成',
        },
        {
          name: '深圳OA',
          kind: '连接器',
          detail: '仅写入398字拟办草稿',
          state: '已确认',
        },
      ],
      interventions: [
        {
          stepIndex: 1,
          title: '统计口径校正',
          meta: '联合检查按一次事件归并 · 16:36',
          state: '已解决',
          tone: 'warning',
        },
        {
          stepIndex: 3,
          title: '保存个人Memory',
          meta: '用户确认，未自动共享 · 16:52',
          state: '已批准',
          tone: 'normal',
        },
        {
          stepIndex: 3,
          title: '写入OA拟办栏',
          meta: '用户确认 · 17:26',
          state: '已批准',
          tone: 'success',
        },
      ],
    },
    timeline: [
      { type: 'stage', label: '理解目标', time: '16:08' },
      {
        type: 'user',
        text: '根据企业投诉情况报告和领导批示，形成一份约400字的拟办意见。要能给领导决策，不要泛泛讲加强管理。',
        time: '16:08',
      },
      {
        type: 'assistant',
        text: '我会先拆分投诉事实、检查记录和待核实问题，再提出责任清晰、动作克制的拟办建议。不会把所有“入企活动”直接认定为行政检查。',
        bullets: [
          '不新建平台',
          '不建议一刀切专项行动',
          '事实不确定项保持待核实',
        ],
        time: '16:10',
      },
      {
        type: 'plan',
        title: '任务计划 · 4步',
        steps: [
          '核对投诉与批示',
          '归并检查事件',
          '标记待核实问题',
          '形成400字拟办并写入OA',
        ],
        time: '16:11',
      },
      { type: 'stage', label: '执行与取证', time: '16:24' },
      {
        type: 'evidence',
        title: '126条入企活动不能直接作为检查次数',
        summary:
          '28条检查登记中有6条属于同一次联合检查的参与记录。按时间、对象和事项归并后为22次实际检查事件。',
        sources: ['企业投诉情况报告 · 附表1', '行政检查登记台账 · 2026年7—8月'],
        time: '16:36',
      },
      {
        type: 'assistant',
        title: '保留4项待核实',
        text: '当前证据不足以直接下结论：疑似重复1项、漏扫码1项、迟录2项。拟办意见将使用“请责任单位限期核查并反馈”的表述，不把异常直接认定为违规。',
        time: '16:42',
      },
      {
        type: 'user',
        text: '这个口径以后都按：入企活动不等于行政检查，联合检查按一次事件归并。可以建议我记住，但不要自动共享给别人。',
        time: '16:49',
      },
      {
        type: 'confirmation',
        title: '保存为个人Memory',
        summary:
          '保存工作规则：“涉企检查统计中，入企活动不直接等同于行政检查；联合检查按同一事件归并。”部门候选将另行脱敏并提交审核。',
        result: '已保存个人Memory · 部门候选审核中',
        time: '16:52',
      },
      { type: 'stage', label: '形成成果', time: '17:08' },
      {
        type: 'artifacts',
        title: '拟办意见已收敛至398字',
        files: ['拟办意见.docx', '检查事件归并表.xlsx', '待核实问题清单.xlsx'],
        time: '17:18',
      },
      {
        type: 'confirmation',
        title: '确认写入OA拟办栏',
        summary: '只写入398字拟办草稿，不上传内部核验表，不自动转办或催办。',
        result: '已确认并写入 · 17:26',
        time: '17:26',
      },
      {
        type: 'completion',
        title: '拟办已完成，等待领导审阅',
        summary:
          '已按22次实际检查事件形成决策型拟办；4项异常保持待核实，建议精准核查和纠偏整改。',
        highlights: [
          '126条入企活动不等于126次检查',
          '不新建平台、不搞一刀切行动',
          '4项问题均保留核实责任与反馈期限',
        ],
        time: '17:26',
      },
    ],
  },
  annual: {
    id: 'annual',
    title: '形成2025年度全市司法行政工作报告及配套材料',
    shortTitle: '2025年度司法行政工作报告',
    status: '已完成',
    externalState: '已提交会议服务',
    updatedAt: '1月18日 22:14',
    sourceCount: 6,
    artifactCount: 4,
    agent: '政务材料智能体',
    skills: ['来源分级与事实底账', '多成果派生', '跨成果一致性检查'],
    memories: [
      {
        name: '年度材料事实优先级',
        kind: '规则',
        action: '调用',
        detail: '正式台账优先于汇总性、宣传性表述。',
        state: '组织规则 · 只读',
      },
      {
        name: '母稿口径变化触发派生成果复检',
        kind: '纠错结论',
        action: '新增',
        detail: '派生成果引用母稿事实节点，节点变化后自动标记影响范围。',
        state: '已保存至本任务',
      },
    ],
    artifacts: [
      { name: '2025年度司法行政工作报告', meta: 'DOCX · 会议服务版 v1', state: '已锁定' },
      { name: '领导汇报提纲', meta: 'PPTX · 会议服务版 v1', state: '已锁定' },
      { name: '领导讲话参考', meta: 'DOCX · 会议服务版 v1', state: '已锁定' },
      { name: '备答要点', meta: 'DOCX · 会议服务版 v1', state: '已锁定' },
    ],
    evidence: [
      {
        name: '年度事实底账',
        meta: '演示材料 · 母稿与派生成果共用',
        state: '已核验',
      },
      {
        name: '深圳市司法局2024年工作总结和2025年工作计划',
        meta: '官方来源 · 背景与方向',
        state: '已核验',
      },
      {
        name: '2025年全省司法行政工作要点',
        meta: '官方来源 · 上位工作要求',
        state: '已核验',
      },
      {
        name: '任务内年度材料',
        meta: '4项演示材料 · 已授权',
        state: '已综合',
      },
    ],
    versions: [
      {
        name: '会议服务版 v1',
        meta: '1月18日 22:14 · 已锁定',
        active: true,
        locked: true,
      },
      { name: '跨成果复检稿', meta: '1月18日 21:40' },
      { name: '母稿与派生稿', meta: '1月18日 19:25' },
      { name: '事实底账初稿', meta: '1月17日 18:20' },
    ],
    run: {
      phase: '会议服务版已锁定',
      duration: '1天6小时42分',
      mode: '长任务 · 事实底账与母稿派生',
      steps: [
        {
          title: '锁定来源与用途',
          summary: '区分内部演示材料、官方背景和上位工作要求。',
          meta: '1月17日 15:32—18:20',
          state: 'done',
          output: '6项来源完成分层；官方来源不替代内部完成数据。',
        },
        {
          title: '建立年度事实底账',
          summary: '把可用事实、来源位置和使用范围组织为共享节点。',
          meta: '1月17日 18:20—1月18日 10:18',
          state: 'resolved',
          output: '发现一处演示材料口径冲突，等待用户完成责任判断。',
        },
        {
          title: '确定冲突处理口径',
          summary: '以正式台账为准，避免把汇总性表述写成事实。',
          meta: '1月18日 10:31—13:40',
          state: 'resolved',
          output: '统一写为“稳步推进”，不写覆盖范围和比例。',
        },
        {
          title: '形成母报告',
          summary: '用共享事实节点组织年度回顾、问题和下一步安排。',
          meta: '1月18日 13:40—18:12',
          state: 'done',
          output: '母报告中的事实与判断均保留来源和可用范围。',
        },
        {
          title: '生成三项派生成果',
          summary: '从母稿结论节点派生PPT、讲话参考和备答要点。',
          meta: '1月18日 18:12—19:25',
          state: 'done',
          output: '四项成果形成可追溯的母稿—派生关系。',
        },
        {
          title: '一致性复检并提交',
          summary: '检查事实节点、派生引用和锁定范围后提交会议服务。',
          meta: '1月18日 19:25—22:14',
          state: 'resolved',
          output: '修复PPT残留旧口径；四项成果同源并完成演示提交。',
        },
      ],
      surfaces: [],
      calls: [
        {
          name: '政务材料智能体',
          kind: '智能体',
          detail: '统筹长材料综合与派生',
          state: '完成',
        },
        {
          name: '来源分级与事实底账',
          kind: 'Skill',
          detail: '维护来源层级与共享事实节点',
          state: '完成',
        },
        {
          name: '多成果派生',
          kind: 'Skill',
          detail: '建立母稿与三项派生成果关系',
          state: '完成',
        },
        {
          name: '跨成果一致性检查',
          kind: 'Skill',
          detail: '阻断旧口径和断链引用',
          state: '完成',
        },
        {
          name: '司法行政官方政策源',
          kind: '知识源',
          detail: '2项官方来源已核验',
          state: '只读',
        },
        {
          name: '会议材料服务',
          kind: '连接器',
          detail: '提交4项锁定成果',
          state: '已确认',
        },
      ],
      interventions: [
        {
          stepIndex: 1,
          title: '演示材料口径冲突',
          meta: '用户确认按正式台账处理 · 10:31',
          state: '已解决',
          tone: 'warning',
        },
        {
          stepIndex: 5,
          title: 'PPT残留旧口径',
          meta: '自动定位并同步修复 · 21:40',
          state: '已恢复',
          tone: 'success',
        },
        {
          stepIndex: 5,
          title: '提交会议材料服务',
          meta: '用户确认 · 22:14',
          state: '已批准',
          tone: 'success',
        },
      ],
    },
    timeline: [
      { type: 'stage', label: '理解目标', time: '1月17日 15:32' },
      {
        type: 'user',
        text: '请综合年度工作汇总、任务台账和官方公开材料，形成2025年度司法行政工作报告，并同步准备汇报提纲、讲话参考和备答。所有事实要可追溯，四项成果口径必须一致。',
        time: '15:32',
      },
      {
        type: 'assistant',
        text: '我会先建立共享事实底账，再形成母报告并派生三项配套成果。官方来源只用于核对方向和职能边界，内部完成情况只采用已授权演示材料。',
        bullets: [
          '母报告是唯一事实母稿',
          'PPT、讲话和备答引用母稿事实节点',
          '正式提交前执行跨成果一致性检查',
        ],
        time: '15:36',
      },
      {
        type: 'plan',
        title: '任务计划 · 6步',
        steps: [
          '锁定来源与用途',
          '建立年度事实底账',
          '确定冲突处理口径',
          '形成母报告',
          '生成三项派生成果',
          '一致性复检并提交',
        ],
        time: '15:41',
      },
      { type: 'stage', label: '执行与取证', time: '1月17日 18:20' },
      {
        type: 'assistant',
        title: '来源与使用边界已自动整理',
        text: '4项任务附件均标记为演示材料；两项官方来源用于核对年度方向和职能边界，不被用来证明内部完成情况。',
        time: '18:20',
      },
      {
        type: 'evidence',
        title: '一处演示材料口径冲突',
        summary:
          '年度工作汇总写“已全面覆盖”，重点任务台账写“仍处试点推进”。系统已阻断覆盖范围和比例进入母报告。',
        sources: [
          '年度工作汇总.docx · 演示材料',
          '重点任务台账.xlsx · 演示材料',
        ],
        tone: 'warning',
        time: '1月18日 10:18',
      },
      {
        type: 'user',
        text: '按正式台账处理，只写“稳步推进”，不要写覆盖范围和比例。这个口径同步到PPT、讲话和备答。',
        time: '10:26',
      },
      {
        type: 'assistant',
        text: '已把这项决定写入事实底账，并建立影响关系。母稿或事实节点发生变化时，三个派生成果会自动进入复检范围。',
        time: '10:31',
      },
      {
        type: 'evidence',
        title: '两项官方来源已定位',
        summary: '官方材料只用于校验年度工作方向、职能范围和表述边界，不替代任务内台账。',
        sources: [
          '深圳市司法局2024年工作总结和2025年工作计划',
          '2025年全省司法行政工作要点',
        ],
        time: '10:36',
      },
      { type: 'stage', label: '形成成果', time: '1月18日 19:25' },
      {
        type: 'artifacts',
        title: '母报告与配套材料已生成',
        files: [
          '2025年度司法行政工作报告.docx',
          '领导汇报提纲.pptx',
          '领导讲话参考.docx',
          '备答要点.docx',
        ],
        time: '19:25',
      },
      {
        type: 'quality',
        title: '旧口径阻断会议服务提交',
        issue:
          '母报告已使用“稳步推进”，但领导汇报提纲中仍残留旧的“全面覆盖”。',
        resolution:
          '系统定位受影响页面及关联讲话、备答节点，统一更新后复检通过，恢复会议服务提交。',
        time: '21:40',
      },
      {
        type: 'receipt',
        title: '会议服务演示回执',
        details: [
          '提交：母报告、领导汇报提纲、讲话参考、备答要点',
          '提交人：林思远（综合处）',
          '结果：会议材料服务已接收',
        ],
        time: '22:14',
      },
      {
        type: 'completion',
        title: '年度报告及配套材料已完成',
        summary:
          '母报告与三项派生成果共用同一事实底账，演示材料冲突已按用户决定处理，并完成会议服务提交。',
        highlights: [
          '两项官方来源可下探核验',
          '母稿变化能够定位全部受影响成果',
          '会议服务版锁定，后续修改创建协同草稿',
        ],
        time: '22:14',
      },
    ],
  },
  daily: {
    id: 'daily',
    title: '9月2日待办梳理',
    shortTitle: '9月2日待办梳理',
    status: '已完成',
    externalState: '来源事项未自动改变',
    updatedAt: '今天 08:05',
    sourceCount: 3,
    artifactCount: 2,
    agent: '办公协同智能体',
    skills: ['多源待办归并', '事项优先级整理'],
    memories: [
      {
        name: '上午优先处理需本人决策事项',
        kind: '偏好',
        action: '调用',
        detail: '只影响清单排序，不自动改变来源事项。',
        state: '个人记忆 · 已调用',
      },
    ],
    artifacts: [
      { name: '9月2日待办清单', meta: 'DOCX · 自动化运行成果', state: '已生成' },
      { name: '回复草稿', meta: 'DOCX · 未发送', state: '待审阅' },
    ],
    evidence: [
      { name: 'OA待办', meta: '演示连接 · 只读', state: '已读取' },
      { name: '会议日程', meta: '演示连接 · 只读', state: '已读取' },
      { name: '日常待办项目', meta: '项目上下文', state: '已读取' },
    ],
    versions: [
      { name: '本次运行成果', meta: '今天 08:05', active: true },
      { name: '自动化配置', meta: '工作日 08:00 · 本任务只读引用' },
    ],
    run: {
      phase: '本次自动化运行已完成',
      duration: '5分钟',
      mode: '自动化运行 · 普通任务',
      steps: [
        {
          title: '读取授权来源',
          summary: '读取OA待办、会议日程和项目上下文。',
          meta: '08:00—08:01',
          state: 'done',
          output: '只读取已授权范围，未改变任何来源事项。',
        },
        {
          title: '归并与去重',
          summary: '按事项身份合并重复提醒。',
          meta: '08:01—08:03',
          state: 'resolved',
          output: '保留来源链接和冲突标记，不自行选择来源状态。',
        },
        {
          title: '生成今日清单',
          summary: '结合个人排序偏好形成可执行清单。',
          meta: '08:03—08:04',
          state: 'done',
          output: '需本人决策的事项排在前面，普通提醒随后。',
        },
        {
          title: '准备回复草稿',
          summary: '对可回复事项生成草稿但不自动发送。',
          meta: '08:04—08:05',
          state: 'done',
          output: '回复草稿已生成，外发动作仍需用户本人确认。',
        },
      ],
      surfaces: [],
      calls: [
        { name: '办公协同智能体', kind: '智能体', detail: '组织本次自动化运行', state: '完成' },
        { name: '多源待办归并', kind: 'Skill', detail: '合并来源事项并保留链接', state: '完成' },
        { name: '事项优先级整理', kind: 'Skill', detail: '应用个人排序偏好', state: '完成' },
        { name: 'OA与日程', kind: '连接器', detail: '本次只读', state: '完成' },
      ],
      interventions: [
        {
          stepIndex: 1,
          title: '来源状态不一致',
          meta: '保留两处来源状态 · 未自动修改',
          state: '已保留',
          tone: 'warning',
        },
      ],
    },
    timeline: [
      { type: 'stage', label: '自动化运行', time: '今天 08:00' },
      {
        type: 'assistant',
        title: '工作日待办梳理已启动',
        text: '本次运行读取OA待办、会议日程和“日常待办”项目上下文。只读范围沿用自动化配置，任何外发或来源状态修改仍需用户确认。',
        time: '08:00',
      },
      {
        type: 'plan',
        title: '本次运行 · 4步',
        steps: ['读取授权来源', '归并与去重', '生成今日清单', '准备回复草稿'],
        time: '08:01',
      },
      {
        type: 'evidence',
        title: '一项事项的来源状态不一致',
        summary: 'OA仍显示待处理，会议纪要中已标记完成。系统保留两处来源状态，没有自动关闭OA事项。',
        sources: ['OA待办 · 演示连接', '会议日程 · 演示连接'],
        tone: 'warning',
        time: '08:03',
      },
      {
        type: 'artifacts',
        title: '本次运行成果已生成',
        files: ['9月2日待办清单.docx', '回复草稿.docx'],
        time: '08:05',
      },
      {
        type: 'completion',
        title: '待办梳理已完成',
        summary: '清单和回复草稿已归入普通任务历史；来源事项状态、外发动作和自动化配置均未被自动改变。',
        highlights: ['可从项目下直接重新打开', '成果进入统一任务浏览器', '继续批注会形成任务内新版本'],
        time: '08:05',
      },
    ],
  },
  tracking: {
    id: 'tracking',
    title: '9月2日重点任务跟踪',
    shortTitle: '9月2日重点任务跟踪',
    status: '已完成',
    externalState: '催办草稿未发送',
    updatedAt: '今天 09:12',
    sourceCount: 3,
    artifactCount: 2,
    agent: '任务跟踪智能体',
    skills: ['里程碑对照', '催办草稿生成'],
    memories: [
      {
        name: '来源冲突先保留、不自动催办',
        kind: '规则',
        action: '调用',
        detail: '缺少明确状态时只生成待核实项。',
        state: '项目规则 · 已调用',
      },
    ],
    artifacts: [
      { name: '重点任务跟踪清单', meta: 'XLSX · 自动化运行成果', state: '已生成' },
      { name: '催办草稿', meta: 'DOCX · 未发送', state: '待审阅' },
    ],
    evidence: [
      { name: '项目任务台账', meta: '演示材料 · 当前版本', state: '已读取' },
      { name: 'OA办理状态', meta: '演示连接 · 只读', state: '已读取' },
      { name: '周例会纪要', meta: '演示材料', state: '已读取' },
    ],
    versions: [
      { name: '本次运行成果', meta: '今天 09:12', active: true },
      { name: '自动化配置', meta: '工作日 09:00 · 本任务只读引用' },
    ],
    run: {
      phase: '本次自动化运行已完成',
      duration: '12分钟',
      mode: '自动化运行 · 普通任务',
      steps: [
        {
          title: '读取项目里程碑',
          summary: '读取项目台账、OA状态和周例会纪要。',
          meta: '09:00—09:03',
          state: 'done',
          output: '三类来源进入本次运行上下文，原件状态未改变。',
        },
        {
          title: '对照进度与来源',
          summary: '定位延期、临期和来源冲突。',
          meta: '09:03—09:08',
          state: 'resolved',
          output: '一项里程碑存在状态冲突，已保留为待核实。',
        },
        {
          title: '形成跟踪清单',
          summary: '输出状态、来源和下一步责任。',
          meta: '09:08—09:10',
          state: 'done',
          output: '清单保留来源定位，没有把冲突事项写成确定延期。',
        },
        {
          title: '生成催办草稿',
          summary: '只为状态明确的事项准备催办文本。',
          meta: '09:10—09:12',
          state: 'done',
          output: '催办草稿未发送；冲突事项未进入外发范围。',
        },
      ],
      surfaces: [],
      calls: [
        { name: '任务跟踪智能体', kind: '智能体', detail: '组织项目进度核验', state: '完成' },
        { name: '里程碑对照', kind: 'Skill', detail: '比较任务台账与来源状态', state: '完成' },
        { name: '催办草稿生成', kind: 'Skill', detail: '仅生成未发送草稿', state: '完成' },
        { name: 'OA办理状态', kind: '连接器', detail: '本次只读', state: '完成' },
      ],
      interventions: [
        {
          stepIndex: 1,
          title: '里程碑状态冲突',
          meta: '保留为待核实 · 未自动催办',
          state: '已隔离',
          tone: 'warning',
        },
      ],
    },
    timeline: [
      { type: 'stage', label: '自动化运行', time: '今天 09:00' },
      {
        type: 'assistant',
        title: '重点任务跟踪已启动',
        text: '本次运行只读取“重点任务跟踪”项目中的台账、OA状态和周例会纪要。系统会生成清单和催办草稿，但不会自动发送。',
        time: '09:00',
      },
      {
        type: 'plan',
        title: '本次运行 · 4步',
        steps: ['读取项目里程碑', '对照进度与来源', '形成跟踪清单', '生成催办草稿'],
        time: '09:01',
      },
      {
        type: 'evidence',
        title: '一项里程碑状态存在冲突',
        summary: '项目台账标记为延期，周例会纪要记录为已完成待验收。系统保留两处原始状态，并把该项排除出自动催办范围。',
        sources: ['项目任务台账 · 演示材料', '周例会纪要 · 演示材料'],
        tone: 'warning',
        time: '09:08',
      },
      {
        type: 'artifacts',
        title: '跟踪成果已生成',
        files: ['重点任务跟踪清单.xlsx', '催办草稿.docx'],
        time: '09:12',
      },
      {
        type: 'completion',
        title: '重点任务跟踪已完成',
        summary: '跟踪清单和未发送催办草稿已归入本次运行任务；来源冲突保留为待核实，没有触发自动外发。',
        highlights: ['自动化运行仍是一条普通任务', '冲突来源可以回看', '成果可继续批注修订'],
        time: '09:12',
      },
    ],
  },
};
