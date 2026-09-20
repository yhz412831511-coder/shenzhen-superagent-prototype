import type { SafetyState } from './safety-types.ts';
import { type PageId } from './catalog.ts';
import {
  atomicTaskTypes,
  levelForTask,
  modelCatalog,
  type AtomicTaskType,
  type RoutingLevel,
} from '../../../shared/routing-domain.ts';
export type Row = {
  id: string;
  page: PageId;
  name: string;
  unit: string;
  status: string;
  version: string;
  revision: number;
  fields: Record<string, string>;
  history: { time: string; action: string; detail: string }[];
  pending?: string;
};
export type Call = {
  step?: string;
  id: string;
  task: string;
  unit: string;
  agent: string;
  model: string;
  date: string;
  hour: number;
  type: '模型请求' | '工具调用';
  status: '成功' | '失败' | '进行中' | '安全中止';
  duration: number;
  input: number;
  output: number;
  cached: number;
  metered: boolean;
  entry: string;
  taskType: string;
  businessScenario?: string;
  atomicTaskType?: AtomicTaskType;
  routeLevel?: RoutingLevel;
  policyVersion?: string;
  routeReason?: string;
  upgradedFrom?: RoutingLevel;
  fallbackUsed?: boolean;
  retryTokens?: number;
  routingTokens?: number;
  qualityReceipt?: string;
};
export type Audit = {
  unit?: string;
  id: string;
  time: string;
  record: string;
  page: PageId;
  action: string;
  result: string;
  detail: string;
  actor: string;
};
export type State = {
  comparisons?: Record<string, import('./savings.ts').TaskComparison>;
  safety?: SafetyState;
  rows: Row[];
  calls: Call[];
  audit: Audit[];
  now: string;
  seq: number;
  revision: number;
};
export const TODAY = '2026-09-08';
export const units = [
  { id: 'u1', name: '市政务服务管理局' },
  { id: 'u2', name: '市人力资源保障局' },
  { id: 'u3', name: '市住房建设局' },
  { id: 'u4', name: '市市场监管局' },
  { id: 'u5', name: '市文化广电旅游局' },
  { id: 'u6', name: '市交通运输局' },
];
export function allUnits(s?: State) {
  return [
    ...units,
    ...(s?.rows
      .filter(
        (r) => r.page === 'accounts' && !units.some((u) => u.id === r.unit),
      )
      .map((r) => ({ id: r.unit, name: r.name })) ?? []),
  ];
}
export const unitName = (id: string, s?: State) =>
  allUnits(s).find((u) => u.id === id)?.name ??
  (id === 'all' ? '全市单位' : id);
export const capPages: PageId[] = ['agents', 'skills', 'plugins', 'connectors'];
export function makeRow(
  page: PageId,
  id: string,
  name: string,
  unit = 'all',
  status = '正常',
  fields: Record<string, string> = {},
): Row {
  return {
    id,
    page,
    name,
    unit,
    status,
    version: '1.0',
    revision: 0,
    fields,
    history: [
      {
        time: TODAY + ' 08:00:00',
        action: '登记',
        detail: '市中台登记；责任与范围已记录',
      },
    ],
  };
}
export function initialAdminState(taskCount = 72): State {
  const rows: Row[] = [];
  const calls: Call[] = [];
  const add = (
    p: PageId,
    id: string,
    n: string,
    u: string,
    s: string,
    f: Record<string, string> = {},
  ) => {
    const r = makeRow(p, id, n, u, s, f);
    rows.push(r);
    return r;
  };
  units.forEach((u, i) => {
    add('seats', 'SEAT-' + u.id, u.name, u.id, '已开通', {
      approved: String(120 + i * 40),
      opened: String(120 + i * 40),
      owner: '单位管理员',
      scope: '本单位在岗人员',
      date: '2026-08-01',
      material: '单位使用需求表.pdf',
      purpose: '日常材料处理与业务查询',
    });
    add(
      'applications',
      'APP-' + u.id,
      u.name + '席位增额申请',
      u.id,
      i === 4 ? '待补充' : '待审批',
      {
        amount: String(20 + i * 10),
        purpose: ['扩展材料审核试点', '办事窗口辅助服务', '项目资料整理'][
          i % 3
        ],
        owner: '单位管理员',
        date: TODAY,
        material: '席位使用申请表.pdf；单位需求说明.pdf',
        note: i === 4 ? '请补充使用岗位和实际需求' : '首次受理',
        source: '单位子账号',
      },
    );
    add('quotas', 'QUOTA-' + u.id, u.name, u.id, '正常', {
      quota: String(i === 0 ? 100000 : 3000000 + i * 1000000),
      threshold: '80',
      period: '2026-09',
      increase: i < 2 ? '2000000' : '0',
      requestStatus: i < 2 ? '待审批' : '无申请',
      requestReason: '新增使用岗位，需要扩大本月Token额度',
      owner: '用量运营岗',
    });
    add('accounts', 'ACCOUNT-' + u.id, u.name, u.id, '启用', {
      account: 'unit_admin_' + (i + 1),
      contact: '单位管理联系人',
      phone: '138****' + (1000 + i),
      role: '单位管理员',
      scope: '本单位申请与席位管理',
      note: '单位端不在市级操作范围内',
    });
    add(
      'memory',
      'MEM-' + u.id,
      u.name + '记忆服务',
      u.id,
      i === 2 ? '服务异常' : '已开通',
      {
        quota: '200',
        used: String(31 + i * 12),
        authorized: '组织经验检索、任务上下文授权调用',
        scope: '本单位已开通人员',
        owner: '记忆服务运营岗',
        error: i === 2 ? '索引服务连接超时' : '无',
        privacy: '个人记忆正文不可见',
      },
    );
  });
  const agentNames = [
    '财政资金监管岗位数字人',
    '项目统筹岗位数字人',
    '窗口服务助手',
    '项目资料助手',
    '党组会筹备场景工作智能体',
    '数据整理助手',
    '法规检索助手',
    '工作报告助手',
  ];
  agentNames.forEach((name, i) => {
    add(
      'agents',
      'AG-' + (i + 1),
      name,
      units[i % 6].id,
      i < 6 ? '已上线' : i === 6 ? '待评测' : '待审核',
      {
        category: i < 2 ? '岗位数字人' : '场景工作智能体',
        boundary:
          i < 2
            ? '职责咨询与授权经验调用；不代替本人审批'
            : '组织具体任务步骤；正式动作继承本人逐项确认',
        provider: ['市中台统一建设', '协作软件服务商', '业务系统建设方'][i % 3],
        owner: '能力运营岗',
        scope: '全市单位',
        description: [
          '辅助材料归类与整理',
          '按授权范围检索政策依据',
          '整理任务成果，供用户确认',
        ][i % 3],
        model: 'MODEL-' + ((i % 3) + 1),
        permissions: '政策检索、受控文件处理',
        liveVersion: i < 6 ? '1.0' : '',
        enabled: i < 6 ? '是' : '否',
        date: '2026-09-0' + ((i % 7) + 1),
        review: i < 7 ? '通过' : '待审核',
        failure: i === 6 ? '安全' : '无',
      },
    );
    if (i < 6)
      for (const kind of ['性能', '安全'])
        add(
          'evaluations',
          'EVAL-' + i + '-' + kind,
          name + ' · ' + kind + '评测',
          units[i % 6].id,
          '通过',
          {
            target: 'AG-' + (i + 1),
            targetVersion: '1.0',
            kind,
            testSet: kind === '性能' ? 'PERF-BASE-1.0' : 'SAFE-GOV-1.0',
            owner: '评测管理岗',
            report:
              kind === '性能'
                ? '完成100次调用；成功率99%；平均响应2.6秒；全部必检项通过'
                : '越权读取、未授权写入、文件导出与沙箱访问检查通过',
            progress: '100',
            failures: '无',
            rectification: '',
            gate: '全部必检项通过',
            date: TODAY,
          },
        );
  });
  for (const [p, names] of [
    ['skills', ['材料格式检查', '会议要点整理', '表格核对方法']],
    ['plugins', ['受控文件处理', '政务浏览器', '文档转换服务']],
    [
      'connectors',
      ['公文系统连接器', '政务知识库连接器', '业务查询系统连接器'],
    ],
  ] as [PageId, string[]][]) {
    names.forEach((name, i) =>
      add(
        p,
        p.toUpperCase() + '-' + (i + 1),
        name,
        units[i].id,
        i === 2 ? '待审核' : '已上线',
        {
          provider:
            i === 0
              ? '市中台统一建设'
              : i === 1
                ? '软件服务商'
                : '对应系统建设方',
          owner: '能力运营岗',
          description:
            p === 'skills'
              ? '按约定步骤执行并给出检查结果'
              : p === 'plugins'
                ? '提供授权范围内的软件处理能力'
                : '连接政务业务系统，按身份访问',
          scope: i === 0 ? '全市单位' : units[i].name,
          permissions:
            p === 'connectors'
              ? '只读查询、指定接口'
              : '读取授权材料、生成工作成果',
          liveVersion: i === 2 ? '' : '1.0',
          enabled: i === 2 ? '否' : '是',
          review: i === 2 ? '待审核' : '通过',
          system: name.replace('连接器', ''),
          connection: i === 1 ? '连接异常' : '正常',
          expires: i === 1 ? '2026-09-10' : '2026-12-31',
          error: i === 1 ? '授权即将到期，需责任单位更新' : '无',
          source: '建设方提交',
        },
      ),
    );
  }
  modelCatalog.forEach((model) =>
    add(
      'models',
      model.id,
      model.name,
      'all',
      model.status === 'available'
        ? '可用'
        : model.status === 'evaluating'
          ? '评测中'
          : '暂不可用',
      {
        owner: '模型服务岗',
        scope: '全市单位',
        maker: model.maker,
        category: model.categories.join('、'),
        scale: model.scale,
        level: model.recommendedLevels.join('、'),
        error:
          model.status === 'unavailable'
            ? '服务维护，预计恢复时间待通知'
            : '无',
        version: '2026.09',
        description: model.description,
      },
    ),
  );
  for (let i = 0; i < taskCount; i++) {
    const u = units[[0, 0, 0, 1, 1, 2, 2, 2, 3, 3, 4, 5][i % 12]];
    const day =
      i < Math.ceil(taskCount / 3)
        ? TODAY
        : '2026-09-' + String(7 - (i % 7)).padStart(2, '0');
    const id = 'TASK-' + String(i + 1).padStart(4, '0');
    const status = i === 0 ? '运行中' : i % 13 === 0 ? '失败' : '完成';
    const agent = 'AG-' + ((i % 6) + 1);
    add(
      'tasks',
      id,
      ['材料格式检查', '政策条款查询', '表格汇总核对', '会议记录整理'][i % 4],
      u.id,
      status,
      {
        agent,
        user: 'USER-' + ((i % 31) + 1),
        userLabel: '用户 ' + String((i % 31) + 1).padStart(3, '0'),
        date: day,
        time: day + ' ' + String(8 + (i % 9)).padStart(2, '0') + ':20',
        duration: String(3 + (i % 18)),
        taskType: atomicTaskTypes[(i * 2) % atomicTaskTypes.length],
        businessScenario: ['材料处理', '政策检索', '表格处理', '会议整理'][
          i % 4
        ],
        entry: i % 3 === 0 ? '超级智能体' : '专业智能体',
        sandbox: 'BOX-' + ((i % 12) + 1),
        error: status === '失败' ? '工具调用超时，任务未完成' : '无',
        modelMode: i % 6 === 0 ? '指定模型' : '智能模式',
        model: ['ernie-4-5-21b', 'qwen-3-8-27b', 'deepseek-v4-pro'][i % 3],
        privacy: '仅执行元信息，不包含任务正文',
      },
    );
    for (let j = 0; j < 3; j++) {
      const model = j < 2;
      const atomicTaskType =
        atomicTaskTypes[(i * 2 + j) % atomicTaskTypes.length];
      const routeLevel = levelForTask(atomicTaskType);
      const routeModel =
        routeLevel === 'L1'
          ? 'ernie-4-5-21b'
          : routeLevel === 'L2'
            ? 'qwen-3-8-27b'
            : 'deepseek-v4-pro';
      calls.push({
        id: 'CALL-' + i + '-' + j,
        task: id,
        unit: u.id,
        agent,
        model: routeModel,
        date: day,
        hour: 8 + (i % 9),
        type: model ? '模型请求' : '工具调用',
        status:
          status === '运行中' && j === 2
            ? '进行中'
            : status === '失败' && j === 2
              ? '失败'
              : '成功',
        duration: 800 + ((i * 73 + j * 317) % 5500),
        input: model ? 2300 + (i % 72) * 93 : 0,
        output: model ? 600 + (i % 72) * 31 : 0,
        cached: model && i % 4 === 0 ? 500 : 0,
        metered: i !== 7 || j !== 1,
        entry: i % 3 === 0 ? '超级智能体' : '专业智能体',
        taskType: atomicTaskType,
        atomicTaskType,
        businessScenario: ['材料处理', '政策检索', '表格处理', '会议整理'][
          i % 4
        ],
        routeLevel,
        policyVersion: '2.0',
        routeReason: `${atomicTaskType}默认匹配${routeLevel}`,
        upgradedFrom: i % 17 === 0 && routeLevel === 'L2' ? 'L1' : undefined,
        fallbackUsed: i % 19 === 0,
        retryTokens: model && i % 13 === 0 ? 220 + j * 80 : 0,
        routingTokens: model ? 90 + ((i + j) % 5) * 25 : 0,
        qualityReceipt: model
          ? `QUALITY-TASK-${String(i + 1).padStart(4, '0')}`
          : undefined,
      });
    }
  }
  for (let i = 0; i < 12; i++) {
    const linked = rows.find(
      (r) => r.id === 'TASK-' + String(i + 1).padStart(4, '0'),
    )!;
    const u = units.find((u) => u.id === linked.unit)!;
    add(
      'sandboxes',
      'BOX-' + (i + 1),
      '任务环境 ' + String(i + 1).padStart(2, '0'),
      u.id,
      i === 0 ? '运行中' : i === 1 ? '异常' : i === 2 ? '已隔离' : '闲置',
      {
        task: 'TASK-' + String(i + 1).padStart(4, '0'),
        space: 'SPACE-' + (i + 1),
        owner: '运行运维岗',
        network: '分析域只读 / 执行域受控出口',
        analysis: '分析沙箱：授权资料读取与草稿生成，无正式写入凭据',
        execution: '执行沙箱：逐项确认后单次调用，未知结果先查询不重放',
        template: '通用文件处理 / v1.2',
        cpu: '2核',
        memory: '4GB',
        resource: String(15 + i * 4) + '%',
        lastActive: TODAY + ' 09:' + String(i * 3).padStart(2, '0'),
        retention: i === 3 ? '证据保留' : '无',
        restriction: i === 2 ? '网络隔离' : '基础访问规则',
        error: i === 1 ? '工作进程异常退出' : '无',
        files: '工作成果保存在个人空间；环境回收不删除成果',
      },
    );
    add(
      'spaces',
      'SPACE-' + (i + 1),
      '用户 ' + String(i + 1).padStart(3, '0') + ' 工作空间',
      u.id,
      i === 1 ? '服务异常' : '正常',
      {
        owner: 'USER-' + (i + 1),
        quota: '20',
        used: String(3 + i),
        privacy: '仅容量与服务状态；不提供文件正文',
        error: i === 1 ? '空间挂载失败' : '无',
      },
    );
  }
  ['政务制度知识库', '办事指南知识库', '组织文档知识库'].forEach((n, i) =>
    add(
      'knowledge',
      'KN-' + (i + 1),
      n,
      units[i].id,
      i === 1 ? '同步失败' : i === 2 ? '草稿' : '已发布',
      {
        source: ['政务知识服务', '办事指南服务', '组织文件目录'][i],
        owner: '知识运营岗',
        scope: units[i].name,
        items: String(130 + i * 42),
        vectorService: '统一向量检索服务 / 按来源版本供应索引',
        ownership:
          '原知识归属来源单位；本页管理索引供应、授权与同步，不改变源内容',
        lastSync: TODAY + ' 08:30',
        error: i === 1 ? '来源服务未响应' : '无',
        liveVersion: i === 0 ? '1.0' : '',
        enabled: i === 0 ? '是' : '否',
        content: '来源元信息与版本索引，不展示个人任务内容',
      },
    ),
  );
  ['材料核对检查要点', '会议纪要编排规范', '跨部门事项办理经验'].forEach(
    (n, i) =>
      add(
        'experience',
        'EXP-' + (i + 1),
        n,
        units[i].id,
        i === 0 ? '已发布' : i === 1 ? '待审核' : '草稿',
        {
          source: '组织经验贡献',
          owner: '知识运营岗',
          scope: units[i].name,
          content:
            '1. 核对来源和适用范围。\n2. 检查日期、责任主体与版本。\n3. 将需要人工确认的内容单独列出。',
          liveVersion: i === 0 ? '1.0' : '',
          enabled: i === 0 ? '是' : '否',
        },
      ),
  );
  for (let i = 0; i < 5; i++)
    add(
      'tickets',
      'TICKET-' + (i + 1),
      [
        '任务处理失败',
        '响应速度较慢',
        '空间无法打开',
        '使用范围申请',
        '结果格式反馈',
      ][i],
      units[i].id,
      i === 2 ? '处理中' : '待分派',
      {
        owner: i === 2 ? '运行运维岗' : '未分派',
        task: 'TASK-' + String(i + 1).padStart(4, '0'),
        category: ['运行失败', '响应慢', '服务不可用', '使用咨询', '结果反馈'][
          i
        ],
        description: '单位管理员提交，需协助核查服务运行情况；未提交任务正文。',
        material: '问题摘要.txt',
        feedback: '',
        date: TODAY,
        due: '2026-09-10',
        alert: i === 0 ? 'ALERT-1' : '',
      },
    );
  for (let i = 0; i < 4; i++)
    add(
      'alerts',
      'ALERT-' + (i + 1),
      [
        '工具访问超出授权范围',
        '文件导出等待确认',
        '任务环境访问异常',
        '系统写入权限不匹配',
      ][i],
      units[i].id,
      i === 1 ? '处理中' : '待处理',
      {
        level: i === 0 || i === 2 ? '高危' : '中危',
        owner: i === 1 ? '安全运营岗' : '未分派',
        task: 'TASK-' + String(i + 1).padStart(4, '0'),
        sandbox: 'BOX-' + (i + 1),
        evidence: 'EV-' + (i + 1),
        result: '执行前已阻断',
        actionType: ['工具使用', '文件导出', '沙箱访问', '系统写入'][i],
        rule: 'RULE-' + (i + 1),
        restriction: '未限制',
        material: '执行摘要与权限判定记录；不含任务正文',
        rectification: '',
        review: '',
        due: '2026-09-09',
        date: TODAY,
      },
    );
  [
    '数据访问',
    '文件导出',
    '系统写入',
    '高风险确认',
    '工具使用',
    '沙箱访问',
  ].forEach((n, i) =>
    add('rules', 'RULE-' + (i + 1), n + '控制', 'all', '已生效', {
      category: n,
      tag: i % 2 ? '受限材料' : '全部数据',
      action: i % 2 ? '逐项确认' : '阻断',
      scope: '全市单位',
      owner: '安全运营岗',
      condition: '超出授权范围',
      liveVersion: '1.0',
      liveConfig: JSON.stringify({
        tag: i % 2 ? '受限材料' : '全部数据',
        action: i % 2 ? '逐项确认' : '阻断',
        scope: '全市单位',
        condition: '超出授权范围',
      }),
      checkVersion: '',
      pilot: '',
      previous: '',
      description: '组织授权与任务确认同时有效；未授权访问始终禁止',
    }),
  );
  for (const [i, n] of [
    '市级运营管理员',
    '能力审核岗',
    '运行运维岗',
    '安全运营岗',
    '审计查看岗',
  ].entries())
    add('roles', 'ROLE-' + (i + 1), n, 'all', '启用', {
      scope: '全市单位',
      menus:
        i === 0
          ? '全部目录'
          : i === 1
            ? '能力管理'
            : i === 2
              ? '运行管理'
              : i === 3
                ? '安全管理'
                : '安全管理、运行管理',
      permissions: i === 4 ? '查看' : '查看、审核、配置',
      owner: '平台管理员',
      protected: i === 0 ? '是' : '否',
    });
  for (let i = 0; i < 36; i++)
    add(
      'audit',
      'OP-' + (i + 1),
      ['授权资料查询', '文件生成', '系统写入', '文件导出'][i % 4],
      units[i % 6].id,
      i % 7 === 0 ? '已阻断' : i % 5 === 0 ? '待确认' : '执行成功',
      {
        risk: ['低风险', '中风险', '高风险'][i % 3],
        result:
          i % 7 === 0
            ? '阻断'
            : i % 5 === 0
              ? '转人工确认'
              : i % 4 === 0
                ? '脱敏'
                : '允许',
        task: 'TASK-' + String(i + 1).padStart(4, '0'),
        tag: ['全部数据', '受限材料', '个人敏感信息'][i % 3],
        rule: 'RULE-' + ((i % 6) + 1),
        date: TODAY,
        time: TODAY + ' 09:' + String(i).padStart(2, '0'),
        actor: '工具执行服务',
        material: '脱敏动作摘要与规则编号',
        kind: '安全执行',
      },
    );
  return {
    rows,
    calls,
    audit: [],
    now: TODAY + ' 10:00:00',
    seq: 1000,
    revision: 0,
  };
}
export const records = (s: State, p: PageId) =>
  s.rows.filter((r) => r.page === p);
export function getRow(s: State, id: string) {
  const r = s.rows.find((r) => r.id === id);
  if (!r) throw new Error('记录不存在');
  return r;
}
export const number = (r: Row, k: string) => Number(r.fields[k] ?? 0);
export type Filters = {
  usageView?: 'distribution' | 'savings' | 'calls';
  unit: string;
  search: string;
  status: string;
  from: string;
  to: string;
  agent: string;
  model: string;
  entry: string;
  taskType: string;
  businessScenario: string;
  routeLevel: string;
};
export const defaultFilters = (): Filters => ({
  usageView: 'distribution',
  unit: 'all',
  search: '',
  status: '全部状态',
  from: TODAY,
  to: TODAY,
  agent: 'all',
  model: 'all',
  entry: 'all',
  taskType: 'all',
  businessScenario: 'all',
  routeLevel: 'all',
});
export function filteredCalls(s: State, f: Filters) {
  return s.calls.filter(
    (c) =>
      (f.unit === 'all' || c.unit === f.unit) &&
      c.date >= f.from &&
      c.date <= f.to &&
      (f.agent === 'all' || c.agent === f.agent) &&
      (f.model === 'all' || c.model === f.model) &&
      (f.entry === 'all' || c.entry === f.entry) &&
      (f.taskType === 'all' || c.atomicTaskType === f.taskType) &&
      (f.businessScenario === 'all' ||
        c.businessScenario === f.businessScenario) &&
      (f.routeLevel === 'all' || c.routeLevel === f.routeLevel),
  );
}
export function metrics(s: State, f = defaultFilters()) {
  const rr = (p: PageId) =>
    records(s, p).filter(
      (r) => f.unit === 'all' || r.unit === f.unit || r.unit === 'all',
    );
  const cc = filteredCalls(s, f);
  const ended = cc.filter((c) => !['进行中', '安全中止'].includes(c.status));
  const ok = cc.filter((c) => c.status === '成功');
  const tasks = rr('tasks').filter(
    (t) => t.fields.date >= f.from && t.fields.date <= f.to,
  );
  const ops = rr('audit').filter(
    (r) => r.fields.date >= f.from && r.fields.date <= f.to,
  );
  const metered = cc.filter((c) => c.metered);
  return {
    requests: rr('applications').filter((r) => r.status === '待审批').length,
    requested: rr('applications').reduce((a, r) => a + number(r, 'amount'), 0),
    opened: rr('seats').reduce((a, r) => a + number(r, 'opened'), 0),
    active: new Set(tasks.map((t) => t.fields.user)).size,
    agents: rr('agents').filter((r) => r.fields.enabled === '是').length,
    calls: cc.length,
    success: ended.length ? (ok.length / ended.length) * 100 : null,
    latency: ok.length
      ? ok.reduce((a, c) => a + c.duration, 0) / ok.length / 1000
      : null,
    input: metered.reduce((a, c) => a + c.input, 0),
    output: metered.reduce((a, c) => a + c.output, 0),
    cached: metered.reduce((a, c) => a + c.cached, 0),
    unmetered: cc.filter((c) => !c.metered && c.type === '模型请求').length,
    alerts: rr('alerts').filter((r) => r.status !== '已关闭').length,
    high: rr('alerts').filter(
      (r) => r.status !== '已关闭' && r.fields.level === '高危',
    ).length,
    controlled: ops.filter((r) => r.fields.result !== '允许').length,
    blocked: ops.filter((r) => r.fields.result === '阻断').length,
    review: ops.filter((r) => r.fields.result === '转人工确认').length,
    masked: ops.filter((r) => r.fields.result === '脱敏').length,
    ops,
    sandboxErrors: rr('sandboxes').filter(
      (r) => r.status === '异常' || r.status === '已隔离',
    ).length,
    tasks: tasks.length,
  };
}
export function quotaUsed(s: State, r: Row) {
  return s.calls
    .filter(
      (c) =>
        c.unit === r.unit && c.date.startsWith(r.fields.period) && c.metered,
    )
    .reduce((n, c) => n + c.input + c.output, 0);
}
export function quotaStatus(s: State, r: Row) {
  const used = quotaUsed(s, r),
    quota = number(r, 'quota');
  return quota === 0 && used === 0
    ? '未分配'
    : used >= quota
      ? '超额提醒'
      : used >= (quota * number(r, 'threshold')) / 100
        ? '接近额度'
        : '正常';
}
export function todos(s: State) {
  return s.rows.filter(
    (r) =>
      (r.page === 'systems' &&
        ['待审核', '待开通', '待补充'].includes(r.status)) ||
      (r.page === 'applications' &&
        ['待审批', '开通失败', '待开通'].includes(r.status)) ||
      (r.page === 'alerts' && r.status !== '已关闭') ||
      (r.page === 'tickets' && r.status !== '已关闭') ||
      (r.page === 'quotas' &&
        (r.fields.requestStatus === '待审批' ||
          quotaStatus(s, r) !== '正常')) ||
      (r.page === 'agents' && r.status === '待发布'),
  );
}
export function isPublished(r: Row) {
  return r.fields.enabled === '是' && !!r.fields.liveVersion;
}
