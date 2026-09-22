import { systemProblem } from './safety.ts';
import { type PageId } from './catalog.ts';
import {
  type State,
  type Row,
  getRow,
  records,
  number,
  capPages,
  makeRow,
  allUnits,
  TODAY,
} from './data.ts';
import {
  publishRiskRule,
  riskPolicyFor,
  type RiskTier,
} from '../../../shared/risk-policy.ts';
export type Field = {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'select' | 'multi';
  options?: string[];
  required?: boolean;
  hint?: string;
};
export type ActionSpec = {
  key: string;
  label: string;
  description: string;
  fields?: Field[];
  danger?: boolean;
};
const f = (
  key: string,
  label: string,
  type: Field['type'] = 'text',
  options?: string[],
): Field => ({ key, label, type, options, required: true });
const reason = f('note', '处理说明', 'textarea');
const owner = f('owner', '责任岗位', 'select', [
  '市级运营管理员',
  '能力运营岗',
  '运行运维岗',
  '安全运营岗',
  '知识运营岗',
]);
const a = (
  key: string,
  label: string,
  description: string,
  fields: Field[] = [],
  danger = false,
): ActionSpec => ({ key, label, description, fields, danger });
export function evaluationPassed(s: State, r: Row) {
  return ['性能', '安全'].every((kind) => {
    const report = records(s, 'evaluations')
      .filter(
        (e) =>
          e.fields.target === r.id &&
          e.fields.targetVersion === r.version &&
          e.fields.kind === kind,
      )
      .at(-1);
    return report?.status === '通过';
  });
}
export function actions(s: State, r: Row): ActionSpec[] {
  if (r.pending) return [];
  const scope = f('scope', '可使用单位', 'select', [
    '全市单位',
    ...allUnits(s).map((u) => u.name),
  ]);
  if (r.page === 'systems') {
    const edit = a(
      'systemEdit',
      '编辑接入材料',
      '材料修改后需要重新审核，历史记录保留。',
      newFields('systems', s).filter((f) => !['name', 'unit'].includes(f.key)),
    );
    if (['草稿', '待补充', '已拒绝'].includes(r.status))
      return [
        edit,
        a(
          'systemSubmit',
          '提交接入审核',
          '提交用途、授权范围和责任材料至市中台。',
          [reason],
        ),
      ];
    if (r.status === '待审核')
      return [
        a(
          'systemApprove',
          '审核通过',
          '通过后还需执行开通，未收到回执前不可访问。',
          [reason],
        ),
        a('return', '退回补充', '退回缺失的接入材料。', [reason]),
        a('reject', '拒绝接入', '保留拒绝原因与审批记录。', [reason], true),
      ];
    if (r.status === '待开通')
      return [
        a('systemOpen', '执行开通', '核对授权和连接器，等待开通回执。', [
          reason,
        ]),
      ];
    if (r.status === '已接入')
      return [
        a(
          'systemPause',
          '暂停系统接入',
          '限制该系统后续新调用；已发出的调用保留真实结果。',
          [reason],
          true,
        ),
      ];
    if (r.status === '已暂停')
      return [
        edit,
        a(
          'systemResume',
          '恢复系统接入',
          '重新检查授权和连接状态，恢复不重放历史动作。',
          [reason],
        ),
      ];
    return [];
  }
  const review = [
    a('approve', '审核通过', '由市中台审核当前材料及版本。', [reason]),
    a('return', '退回补充', '记录缺失材料与退回原因。', [reason]),
    a('reject', '拒绝申请', '拒绝后保留申请与审核记录。', [reason], true),
  ];
  const editScope = a(
    'scope',
    '调整使用范围',
    '变更影响后续新发起的使用；保留历史记录。',
    [scope, reason],
  );
  if (r.page === 'applications')
    return r.status === '待审批'
      ? review
      : r.status === '待补充'
        ? [
            a(
              'supplement',
              '获取补充材料',
              '接收单位提交的补充记录，重新进入待审批。',
            ),
          ]
        : ['待开通', '开通失败'].includes(r.status)
          ? [
              a(
                'open',
                '开通席位',
                '执行成功后增加单位已开通额度，失败可重试。',
              ),
            ]
          : [];
  if (r.page === 'seats')
    return [
      a(
        'adjustSeats',
        '调整席位额度',
        '修改已批准与已开通额度，不操作具体人员名单。',
        [f('opened', '席位额度', 'number'), reason],
      ),
    ];
  if (r.page === 'tickets')
    return r.status === '待分派'
      ? [
          a('assign', '分派处理', '明确处理责任岗位与处理要求。', [
            owner,
            reason,
          ]),
        ]
      : r.status === '处理中'
        ? [
            a('resolve', '提交处理结果', '记录排查结果，等待单位反馈。', [
              f('feedback', '处理结果', 'textarea'),
            ]),
          ]
        : r.status === '待反馈'
          ? [a('feedback', '获取单位反馈', '接收单位确认的处理反馈。')]
          : r.status === '待关闭'
            ? [
                a(
                  'close',
                  '关闭工单',
                  '保留处理与反馈记录，不关闭关联安全告警。',
                  [reason],
                ),
              ]
            : [];
  if (capPages.includes(r.page)) {
    const ret: ActionSpec[] = [];
    if (['待审核', '待补充'].includes(r.status))
      ret.push(
        a('approve', '审核通过', '审核当前版本的成果、权限声明与责任单位。', [
          reason,
        ]),
        a('return', '退回补充', '保留当前线上版本，退回本次提交。', [reason]),
      );
    if (
      r.fields.review === '通过' &&
      !records(s, 'evaluations').some(
        (e) =>
          e.fields.target === r.id &&
          e.fields.targetVersion === r.version &&
          e.status !== '评测失败',
      )
    )
      ret.push(
        a(
          'evaluate',
          '启动双项评测',
          '为当前版本发起性能和安全评测，采用预置测试集。',
        ),
      );
    if (
      r.fields.review === '通过' &&
      (r.page !== 'agents' || evaluationPassed(s, r)) &&
      r.fields.liveVersion !== r.version
    )
      ret.push(
        a(
          'publish',
          '发布当前版本',
          '仅当前版本检查通过才能发布，执行成功后更新可用版本。',
          [scope, reason],
        ),
      );
    ret.push(
      a('newVersion', '提交新版本', '保留现网版本；新版本需重新审核与评测。', [
        f('description', '版本变更说明', 'textarea'),
      ]),
      editScope,
    );
    if (r.fields.enabled === '是')
      ret.push(
        a(
          'disable',
          '停用能力',
          '影响后续新任务；运行任务保留记录，请先查看影响范围。',
          [reason],
          true,
        ),
      );
    else if (r.fields.liveVersion)
      ret.push(
        a(
          'enable',
          '恢复已发布版本',
          '仅恢复已有线上版本，不自动执行原任务。',
          [reason],
        ),
      );
    if (r.page === 'connectors')
      ret.push(
        a(
          'linkSystem',
          '关联系统',
          '关联已登记的系统，修改后需要重新检查连接。',
          [
            f(
              'systemId',
              '接入系统',
              'select',
              records(s, 'systems').map((sys) => sys.id),
            ),
            reason,
          ],
        ),
        a(
          'checkConnection',
          '检查连接',
          '检查政务系统连接与授权状态，不读取业务内容。',
        ),
        a(
          'authorize',
          '更新授权范围',
          '记录经责任单位确认的授权范围和有效期。',
          [
            f('permissions', '授权接口与操作范围', 'textarea'),
            f('expires', '有效期至 YYYY-MM-DD'),
            reason,
          ],
        ),
      );
    return ret;
  }
  if (r.page === 'evaluations')
    return r.status === '未通过'
      ? [
          a('rectify', '提交整改说明', '补充具体修改及整改记录后才能复测。', [
            f('rectification', '整改说明', 'textarea'),
          ]),
        ]
      : r.status === '待复测'
        ? [
            a(
              'retest',
              '重新评测',
              '对同一版本重新执行当前测试集，保留原报告历史。',
            ),
          ]
        : [];
  if (r.page === 'models')
    return [
      a(
        'configureModel',
        '调整服务范围',
        '只修改模型服务的授权范围；具体任务路由在“Token与评测－任务路由”配置。',
        [scope, reason],
      ),
      a('modelCheck', '检查服务', '读取模型服务健康结果，不变更已发起任务。'),
    ];
  if (r.page === 'sandboxes') {
    const ar: ActionSpec[] = [];
    if (!['已隔离', '已回收'].includes(r.status))
      ar.push(
        a(
          'isolate',
          '隔离环境',
          '限制该环境访问；运行中任务将暂停，个人空间保留。',
          [reason],
          true,
        ),
      );
    if (!['已停止', '已回收', '闲置'].includes(r.status))
      ar.push(
        a(
          'stop',
          '停止环境',
          '中断当前执行，保留任务记录和个人成果。',
          [reason],
          true,
        ),
      );
    if (['异常', '已隔离', '已停止'].includes(r.status))
      ar.push(
        a(
          'restore',
          '检查并恢复',
          '恢复环境可用性，不自动重放任务或系统写入。',
          [reason],
        ),
      );
    if (r.status !== '已回收')
      ar.push(
        a(
          'recycle',
          '回收闲置环境',
          '仅回收执行环境；存在运行任务或证据保留时不能回收。',
          [reason],
          true,
        ),
      );
    return ar;
  }
  if (r.page === 'spaces')
    return [
      a('capacity', '调整空间配额', '仅修改容量上限，不读取或删除个人成果。', [
        f('quota', '空间配额 / GB', 'number'),
        reason,
      ]),
      ...(r.status === '服务异常'
        ? [
            a(
              'recoverService',
              '恢复空间服务',
              '检查服务并恢复挂载，不查看文件内容。',
            ),
          ]
        : []),
    ];
  if (r.page === 'knowledge')
    return [
      a('sync', '同步知识来源', '更新组织知识索引，失败保留原因并允许重试。'),
      a(
        'editContent',
        '维护来源与范围',
        '更新草稿版本，已发布版本仍按原范围提供服务。',
        [f('source', '知识来源'), scope, reason],
      ),
      ...(r.status !== '同步失败'
        ? [
            a(
              'publishContent',
              '发布知识版本',
              '发布当前组织知识版本与可用范围。',
              [scope, reason],
            ),
          ]
        : []),
    ];
  if (r.page === 'experience')
    return [
      a(
        'editContent',
        '编辑经验草稿',
        '更新后需重新审核，已发布内容保留原版本。',
        [f('content', '组织经验内容', 'textarea'), scope],
      ),
      ...(['草稿', '待审核'].includes(r.status)
        ? [
            a('approveContent', '审核通过', '核对来源、适用范围与经验内容。', [
              reason,
            ]),
          ]
        : []),
      ...(r.status === '待发布'
        ? [
            a('publishContent', '发布组织经验', '发布当前审核通过版本。', [
              scope,
              reason,
            ]),
          ]
        : []),
      ...(r.fields.enabled === '是'
        ? [
            a(
              'withdraw',
              '撤回已发布内容',
              '停止后续检索使用，保留版本与操作历史。',
              [reason],
              true,
            ),
          ]
        : []),
    ];
  if (r.page === 'memory')
    return [
      a(
        'configureMemory',
        '配置记忆服务',
        '仅配置容量和授权能力，不提供个人记忆正文。',
        [
          f('quota', '单位服务容量 / GB', 'number'),
          f('authorized', '授权能力', 'multi', [
            '组织经验检索',
            '任务上下文授权调用',
            '组织知识查询',
          ]),
          scope,
          reason,
        ],
      ),
      ...(r.status === '服务异常'
        ? [
            a(
              'recoverService',
              '恢复记忆服务',
              '恢复服务状态，不访问私有记忆。',
            ),
          ]
        : []),
      ...(r.status === '未开通'
        ? [
            a(
              'enableMemory',
              '开通记忆服务',
              '开通服务不授予私有内容查看权限。',
            ),
          ]
        : [
            a(
              'disableMemory',
              '暂停新调用',
              '限制新发起的记忆调用，保留已有内容。',
              [reason],
              true,
            ),
          ]),
    ];
  if (r.page === 'quotas')
    return [
      a(
        'adjustQuota',
        '调整额度与预警',
        '达到额度仅形成提醒，不自动中断业务。',
        [
          f('quota', '本月Token额度', 'number'),
          f('threshold', '预警阈值 / %', 'number'),
          reason,
        ],
      ),
      ...(r.fields.requestStatus === '待审批'
        ? [
            a(
              'approveIncrease',
              '批准增额',
              '审核本单位本月增额请求，批准后增加额度。',
              [reason],
            ),
            a(
              'rejectIncrease',
              '拒绝增额',
              '保留现有额度与历史用量。',
              [reason],
              true,
            ),
          ]
        : []),
    ];
  if (r.page === 'alerts')
    return r.status === '待处理'
      ? [
          a('assign', '领取并分派', '明确告警责任岗位与处理要求。', [
            owner,
            reason,
          ]),
        ]
      : r.status === '处理中'
        ? [
            a(
              'restrict',
              '限制相关能力',
              '控制相关任务环境，保留正常授权服务。',
              [reason],
              true,
            ),
          ]
        : r.status === '待整改'
          ? [
              a(
                'getRemediation',
                '获取整改材料',
                '接收责任方提交的脱敏整改材料。',
              ),
            ]
          : r.status === '待复测'
            ? [
                a(
                  'retestAlert',
                  '执行恢复检查',
                  '检查控制边界及整改结果，未通过保持限制。',
                ),
              ]
            : r.status === '待复核'
              ? [
                  a(
                    'restoreAlert',
                    '复核并恢复',
                    '解除临时限制，关闭告警；不重放原任务。',
                    [reason],
                  ),
                ]
              : [];
  if (r.page === 'rules') {
    const ar: ActionSpec[] = [];
    if (r.fields.riskLevel !== '红线')
      ar.push(
        a(
          'editRule',
          '编辑规则草稿',
          '修改会使旧变更检查失效；当前生效规则保持。',
          [
            f('riskLevel', '控制等级', 'select', ['低', '中', '高', '红线']),
            f('tag', '数据范围', 'select', [
              '全部数据',
              '受限材料',
              '个人敏感信息',
            ]),
            f('condition', '触发条件', 'select', [
              '超出授权范围',
              '高风险操作',
              '全部操作',
            ]),
            scope,
            reason,
          ],
        ),
      );
    if (r.status === '草稿')
      ar.push(
        a(
          'checkRule',
          '检查变更影响',
          '按当前版本检查预置记录，核对拦截和人工处理影响。',
        ),
      );
    if (r.status === '检查通过' && r.fields.riskLevel !== '红线')
      ar.push(
        a(
          'pilotRule',
          '小范围应用',
          '先对选定单位应用当前版本并核对执行结果。',
          [
            f(
              'pilot',
              '应用单位',
              'select',
              allUnits(s).map((u) => u.name),
            ),
            reason,
          ],
        ),
      );
    if (r.status === '检查通过' && r.fields.riskLevel === '红线')
      ar.push(
        a(
          'publishRule',
          '发布全局红线规则',
          '红线不进入单位试运行；发布后仅能全局阻断，不能产生例外。',
          [reason],
          true,
        ),
      );
    if (r.status === '待发布')
      ar.push(
        a(
          'publishRule',
          '发布规则',
          '当前版本检查有效且小范围应用通过后发布。',
          [reason],
        ),
      );
    if (r.fields.previous)
      ar.push(
        a(
          'rollbackRule',
          '恢复上一版本',
          '恢复规则版本，不撤销历史业务动作。',
          [reason],
          true,
        ),
      );
    return ar;
  }
  if (r.page === 'accounts')
    return [
      a(
        'editAccount',
        '维护单位与账号',
        '更新管理联系人和单位账号状态，不分配个人席位。',
        [f('contact', '管理联系人'), f('account', '单位管理员子账号'), reason],
      ),
      a(
        r.status === '启用' ? 'disableAccount' : 'enableAccount',
        r.status === '启用' ? '停用子账号' : '启用子账号',
        '仅影响单位管理员后续登录与申请，保留历史记录。',
        [reason],
        r.status === '启用',
      ),
    ];
  if (r.page === 'roles')
    return r.fields.protected === '是'
      ? []
      : [
          a(
            'editRole',
            '配置岗位权限',
            '维护岗位可见目录、管理操作和单位范围；当前统一运营账号不变。',
            [
              f('menus', '可见目录', 'multi', [
                '管理总览',
                '开通与服务',
                '能力管理',
                '运行管理',
                '知识与记忆',
                '用量管理',
                '安全管理',
                '系统管理',
              ]),
              f('permissions', '允许操作', 'multi', [
                '查看',
                '审核',
                '配置',
                '发布',
                '处置',
              ]),
              scope,
              reason,
            ],
          ),
        ];
  return [];
}
export type Operation = {
  id: string;
  record: string;
  key: string;
  label: string;
  revision: number;
  values: Record<string, string>;
};
export function beginOperation(
  state: State,
  id: string,
  key: string,
  values: Record<string, string> = {},
  expected?: number,
) {
  const s = structuredClone(state);
  const r = getRow(s, id);
  if (r.pending) throw new Error('该记录正在执行，请等待结果');
  if (expected !== undefined && expected !== r.revision)
    throw new Error('记录已更新，请重新查看后操作');
  const spec = actions(s, r).find((a) => a.key === key);
  if (!spec) throw new Error('当前状态不允许此操作');
  for (const field of spec.fields ?? []) {
    const value = values[field.key]?.trim();
    if (field.required && !value) throw new Error('请填写' + field.label);
    if (
      field.type === 'number' &&
      (!Number.isFinite(Number(value)) || Number(value) < 0)
    )
      throw new Error(field.label + '必须为非负数');
    if (field.type === 'select' && !field.options?.includes(value))
      throw new Error(field.label + '选项无效');
    if (
      field.type === 'multi' &&
      value.split('、').some((v) => !field.options?.includes(v))
    )
      throw new Error(field.label + '选项无效');
  }
  if (
    values.threshold &&
    (Number(values.threshold) > 100 || Number(values.threshold) < 1)
  )
    throw new Error('预警阈值应在1%至100%之间');
  if (
    ['capacity', 'configureMemory'].includes(key) &&
    Number(values.quota) < number(r, 'used')
  )
    throw new Error('配额不能小于已使用容量');
  if (key === 'adjustSeats' && !Number.isInteger(Number(values.opened)))
    throw new Error('席位数量必须为整数');
  if (['systemEdit', 'systemApprove', 'systemSubmit'].includes(key)) {
    const expiry = values.expires ?? r.fields.expires;
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(expiry) ||
      expiry < s.now.slice(0, 10) ||
      Number.isNaN(Date.parse(expiry)) ||
      new Date(expiry).toISOString().slice(0, 10) !== expiry
    )
      throw new Error('请填写有效的系统授权到期日期');
  }
  if (['systemOpen', 'systemResume'].includes(key)) {
    const problem = systemProblem(s, r, true);
    if (problem) throw new Error(problem);
  }
  if (
    key === 'authorize' &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(values.expires) ||
      values.expires < TODAY ||
      Number.isNaN(Date.parse(values.expires)))
  )
    throw new Error('请填写有效的授权到期日期');
  if (
    key === 'restore' &&
    records(s, 'alerts').some(
      (a) =>
        a.fields.sandbox === r.id &&
        a.fields.restriction === '已限制' &&
        a.status !== '已关闭',
    )
  )
    throw new Error('关联告警限制仍生效，请先完成告警恢复复核');
  if (key === 'recycle') {
    const task = getRow(s, r.fields.task);
    if (['运行中', '暂停'].includes(task.status) || r.status === '运行中')
      throw new Error('任务尚未结束，不能回收运行环境');
    if (r.fields.retention !== '无')
      throw new Error('存在证据保留要求，暂不能回收');
  }
  if (
    key === 'retest' &&
    getRow(s, r.fields.target).version !== r.fields.targetVersion
  )
    throw new Error('已有新版本，请为新版本发起评测');
  if (key === 'publish' && r.page === 'agents' && !evaluationPassed(s, r))
    throw new Error('当前版本性能和安全评测均通过后才能发布');
  if (key === 'editRole' && r.fields.protected === '是')
    throw new Error('不能修改当前统一管理账号的基础权限');
  s.seq++;
  const op: Operation = {
    id: 'EXEC-' + s.seq,
    record: id,
    key,
    label: spec.label,
    revision: r.revision,
    values,
  };
  r.pending = op.id;
  if (key === 'evaluate') {
    for (const kind of ['性能', '安全'])
      s.rows.push(
        makeRow(
          'evaluations',
          'EVAL-' + ++s.seq,
          r.name + ' · ' + kind + '评测',
          r.unit,
          '评测中',
          {
            target: r.id,
            targetVersion: r.version,
            kind,
            testSet: kind === '性能' ? 'PERF-BASE-1.0' : 'SAFE-GOV-1.0',
            owner: '评测管理岗',
            progress: '0',
            report: '评测任务已受理，正在执行预置检查项',
            failures: '待检查',
            rectification: '',
            gate: '全部必检项通过',
            date: TODAY,
            execution: op.id,
          },
        ),
      );
  }
  s.revision++;
  s.audit.push({
    id: op.id,
    time: s.now,
    record: r.id,
    page: r.page,
    action: spec.label,
    result: '执行中',
    detail: spec.description,
    actor: '市级运营管理员',
  });
  return { state: s, operation: op };
}
function nextVersion(v: string) {
  return (Number(v) + 0.1).toFixed(1);
}
export function settleOperation(
  state: State,
  op: Operation,
  forceFail = false,
): State {
  const s = structuredClone(state);
  const r = getRow(s, op.record);
  if (r.pending !== op.id || r.revision !== op.revision)
    throw new Error('执行回执已处理或版本失效');
  const audit = s.audit.find((a) => a.id === op.id)!;
  delete r.pending;
  const autoFail =
    op.key === 'sync' && r.status === '同步失败' && !r.fields.retried;
  if (forceFail || autoFail) {
    audit.result = '执行失败';
    audit.detail = '执行端未确认成功，原有配置继续生效，可重新提交。';
    if (op.key === 'open') r.status = '开通失败';
    if (op.key === 'evaluate') {
      r.status = '评测失败';
      for (const report of records(s, 'evaluations').filter(
        (e) => e.fields.execution === op.id,
      )) {
        report.status = '评测失败';
        report.fields.report = '执行服务未返回完整报告，请重新发起评测';
      }
    }
    if (op.key === 'sync') r.fields.retried = '是';
    r.history.push({
      time: s.now,
      action: op.label + '失败',
      detail: audit.detail,
    });
    r.revision++;
    s.revision++;
    return s;
  }
  const v = op.values;
  let detail = v.note ?? op.label + '完成';
  const touch = (rr: Row) => {
    rr.revision++;
  };
  switch (op.key) {
    case 'systemEdit':
      Object.assign(r.fields, v);
      r.status = '草稿';
      r.fields.review = '待审核';
      r.fields.enabled = '否';
      r.version = nextVersion(r.version);
      break;
    case 'systemSubmit':
      r.status = '待审核';
      break;
    case 'systemApprove':
      r.status = '待开通';
      r.fields.review = '通过';
      r.fields.approval = '市级运营管理员 · ' + s.now + ' · ' + v.note;
      break;
    case 'systemOpen':
    case 'systemResume': {
      const problem = systemProblem(s, r, true);
      if (problem) throw new Error(problem);
      r.status = '已接入';
      r.fields.enabled = '是';
      r.fields.receipt = op.id;
      detail += '；执行回执成功，不重放历史动作';
      break;
    }
    case 'systemPause':
      r.status = '已暂停';
      r.fields.enabled = '否';
      r.fields.receipt = op.id;
      break;
    case 'linkSystem':
      r.fields.systemId = v.systemId;
      r.fields.system = getRow(s, v.systemId).name;
      r.fields.connection = '待检查';
      break;

    case 'approve':
      if (r.page === 'applications') {
        const seat = records(s, 'seats').find((t) => t.unit === r.unit)!;
        seat.fields.approved = String(
          number(seat, 'approved') + number(r, 'amount'),
        );
        touch(seat);
      }
      r.status =
        r.page === 'applications'
          ? '待开通'
          : r.page === 'agents'
            ? '待评测'
            : '待发布';
      r.fields.review = '通过';
      break;
    case 'return':
      r.status = '待补充';
      r.fields.note = v.note;
      break;
    case 'reject':
      r.status = '已拒绝';
      break;
    case 'supplement':
      r.status = '待审批';
      r.fields.material += '；岗位使用补充说明.pdf';
      break;
    case 'open': {
      const seat = records(s, 'seats').find((t) => t.unit === r.unit)!;
      seat.fields.opened = String(number(seat, 'opened') + number(r, 'amount'));
      touch(seat);
      r.status = '已开通';
      break;
    }
    case 'adjustSeats':
      r.fields.opened = v.opened;
      r.fields.approved = v.opened;
      break;
    case 'assign':
      r.status = '处理中';
      r.fields.owner = v.owner;
      break;
    case 'resolve':
      r.status = '待反馈';
      r.fields.feedback = v.feedback;
      break;
    case 'feedback':
      r.status = '待关闭';
      r.fields.unitFeedback = '单位管理员确认服务已恢复，处理结果已知悉。';
      break;
    case 'close':
      r.status = '已关闭';
      break;
    case 'newVersion':
      r.version = nextVersion(r.version);
      r.status = '待审核';
      r.fields.review = '待审核';
      r.fields.description = v.description;
      break;
    case 'scope':
      r.fields.scope = v.scope;
      break;
    case 'publish':
      r.status = '已上线';
      r.fields.enabled = '是';
      r.fields.liveVersion = r.version;
      r.fields.scope = v.scope;
      break;
    case 'disable':
      r.fields.enabled = '否';
      r.status = '已停用';
      break;
    case 'enable':
      r.fields.enabled = '是';
      r.status = r.fields.liveVersion === r.version ? '已上线' : '待审核';
      detail += '；恢复版本 ' + r.fields.liveVersion;
      break;
    case 'evaluate': {
      for (const e of records(s, 'evaluations').filter(
        (e) => e.fields.execution === op.id,
      )) {
        const fail = r.fields.failure === e.fields.kind;
        e.status = fail ? '未通过' : '通过';
        e.fields.progress = '100';
        e.fields.report = fail
          ? '越界工具访问检查未通过，需要补充范围校验'
          : '全部必检项通过；调用记录与控制边界符合当前测试集要求';
        e.fields.failures = fail
          ? 'CASE-SAFE-04：未授权工具范围校验缺失'
          : '无';
        e.history.push({
          time: s.now,
          action: '评测完成',
          detail: e.fields.report,
        });
        touch(e);
      }
      r.status = evaluationPassed(s, r) ? '待发布' : '待整改';
      break;
    }
    case 'rectify':
      r.status = '待复测';
      r.fields.rectification = v.rectification;
      break;
    case 'retest': {
      const target = getRow(s, r.fields.target);
      if (target.version !== r.fields.targetVersion)
        throw new Error('已有新版本，请为新版本发起评测');
      r.status = '通过';
      r.fields.report = '整改项复核通过，全部必检项通过';
      r.fields.failures = '无';
      target.fields.failure = '无';
      target.status = evaluationPassed(s, target) ? '待发布' : '待整改';
      touch(target);
      break;
    }
    case 'checkConnection':
      r.fields.connection = r.fields.expires < TODAY ? '授权已到期' : '正常';
      r.fields.error = r.fields.connection === '正常' ? '无' : '需更新系统授权';
      detail = '连接检查：' + r.fields.connection;
      break;
    case 'authorize':
      r.fields.permissions = v.permissions;
      r.fields.expires = v.expires;
      r.fields.connection = '待检查';
      break;
    case 'configureModel':
      Object.assign(r.fields, v);
      delete r.fields.note;
      break;
    case 'modelCheck':
      r.status = '可用';
      r.fields.error = '无';
      detail = '服务健康检查通过；已有任务保持原模型选择';
      break;
    case 'isolate':
      r.status = '已隔离';
      r.fields.manualRestriction = '是';
      r.fields.restriction = '网络隔离';
      {
        const task = getRow(s, r.fields.task);
        if (task.status === '运行中') {
          task.status = '暂停';
          for (const c of s.calls)
            if (c.task === task.id && c.status === '进行中')
              c.status = '安全中止';
          touch(task);
        }
      }
      break;
    case 'stop':
      r.status = '已停止';
      {
        const task = getRow(s, r.fields.task);
        if (['运行中', '暂停'].includes(task.status)) {
          task.status = '已停止';
          for (const c of s.calls)
            if (c.task === task.id && c.status === '进行中')
              c.status = '安全中止';
          touch(task);
        }
      }
      break;
    case 'restore':
      r.status = '闲置';
      r.fields.manualRestriction = '否';
      r.fields.restriction = '基础访问规则';
      r.fields.error = '无';
      detail += '；任务不自动重放，个人文件保留';
      break;
    case 'recycle':
      r.status = '已回收';
      r.fields.resource = '0%';
      break;
    case 'capacity':
      r.fields.quota = v.quota;
      break;
    case 'recoverService':
      r.status = r.page === 'memory' ? '已开通' : '正常';
      r.fields.error = '无';
      break;
    case 'configureMemory':
      Object.assign(r.fields, v);
      delete r.fields.note;
      break;
    case 'enableMemory':
      r.status = '已开通';
      break;
    case 'disableMemory':
      r.status = '未开通';
      break;
    case 'sync':
      r.fields.lastSync = s.now;
      r.fields.error = '无';
      r.version = nextVersion(r.version);
      r.status = '待发布';
      break;
    case 'editContent':
      Object.assign(r.fields, v);
      delete r.fields.note;
      r.version = nextVersion(r.version);
      r.status = '草稿';
      break;
    case 'approveContent':
      r.status = '待发布';
      break;
    case 'publishContent':
      r.status = '已发布';
      r.fields.enabled = '是';
      r.fields.liveVersion = r.version;
      r.fields.scope = v.scope;
      break;
    case 'withdraw':
      r.fields.enabled = '否';
      r.status = '已撤回';
      break;
    case 'adjustQuota':
      r.fields.quota = v.quota;
      r.fields.threshold = v.threshold;
      break;
    case 'approveIncrease':
      r.fields.quota = String(number(r, 'quota') + number(r, 'increase'));
      r.fields.requestStatus = '已批准';
      break;
    case 'rejectIncrease':
      r.fields.requestStatus = '已拒绝';
      break;
    case 'restrict': {
      r.status = '待整改';
      r.fields.restriction = '已限制';
      const box = getRow(s, r.fields.sandbox);
      box.status = '已隔离';
      box.fields.restriction = '告警关联限制';
      touch(box);
      const task = getRow(s, r.fields.task);
      if (task.status === '运行中') {
        task.status = '暂停';
        for (const c of s.calls)
          if (c.task === task.id && c.status === '进行中')
            c.status = '安全中止';
        touch(task);
      }
      break;
    }
    case 'getRemediation':
      r.status = '待复测';
      r.fields.rectification =
        '责任岗位已修正授权范围，提交配置摘要和复核记录（脱敏）。';
      break;
    case 'retestAlert':
      r.status = '待复核';
      r.fields.review = '允许范围查询通过，越界访问仍被阻断；恢复检查通过。';
      break;
    case 'restoreAlert': {
      r.status = '已关闭';
      r.fields.restriction = '已解除临时限制';
      const box = getRow(s, r.fields.sandbox);
      const other = records(s, 'alerts').some(
        (a) =>
          a.id !== r.id &&
          a.fields.sandbox === box.id &&
          a.fields.restriction === '已限制' &&
          a.status !== '已关闭',
      );
      box.status =
        other || box.fields.manualRestriction === '是' ? '已隔离' : '闲置';
      box.fields.restriction = other
        ? '告警关联限制'
        : box.fields.manualRestriction === '是'
          ? '网络隔离'
          : '基础访问规则';
      touch(box);
      detail += '；不补发、不重放原任务';
      break;
    }
    case 'editRule': {
      const riskLevel = (v.riskLevel || r.fields.riskLevel) as RiskTier;
      if (r.fields.riskLevel === '红线' && riskLevel !== '红线')
        throw new Error('红线规则为全局固定底线，不能降级或放宽');
      r.fields.riskLevel = riskLevel;
      r.fields.tag = v.tag;
      r.fields.condition = v.condition;
      r.fields.scope = v.scope;
      r.fields.action = riskPolicyFor(riskLevel).control;
      delete r.fields.note;
      r.version = nextVersion(r.version);
      r.status = '草稿';
      r.fields.checkVersion = '';
      r.fields.pilot = '';
      break;
    }
    case 'checkRule': {
      r.fields.checkVersion = r.version;
      const ops = records(s, 'audit').filter(
        (o) =>
          r.fields.scope === '全市单位' ||
          allUnits(s).find((u) => u.id === o.unit)?.name === r.fields.scope,
      );
      const matched = ops.filter(
        (o) =>
          (r.fields.tag === '全部数据' || o.fields.tag === r.fields.tag) &&
          (r.fields.condition === '全部操作' ||
            (r.fields.condition === '高风险操作' &&
              o.fields.risk === '高风险') ||
            (r.fields.condition === '超出授权范围' && o.status === '已阻断')),
      );
      r.fields.checkResult = JSON.stringify({
        total: ops.length,
        matched: matched.length,
        action: r.fields.action,
        riskLevel: r.fields.riskLevel,
        ids: matched.map((o) => o.id),
        outcomes: ops.map((o) => ({
          id: o.id,
          outcome:
            o.status === '已阻断'
              ? '阻断'
              : matched.some((m) => m.id === o.id)
                ? r.fields.action
                : '允许',
        })),
        note:
          r.fields.riskLevel === '红线'
            ? '命中红线即全局阻断，不提供人工确认或单位级例外'
            : '控制动作由当前风险等级决定；范围变化后需重新检查',
      });
      r.status = '检查通过';
      break;
    }
    case 'pilotRule':
      if (r.fields.checkVersion !== r.version)
        throw new Error('变更检查已失效');
      r.fields.pilot = v.pilot;
      r.status = '待发布';
      break;
    case 'publishRule':
      if (
        r.fields.checkVersion !== r.version ||
        (r.fields.riskLevel !== '红线' && !r.fields.pilot)
      )
        throw new Error(
          r.fields.riskLevel === '红线'
            ? '需完成当前版本影响检查'
            : '需完成有效检查和小范围应用',
        );
      r.fields.previous = JSON.stringify({
        version: r.fields.liveVersion,
        config: r.fields.liveConfig,
      });
      r.fields.liveVersion = r.version;
      r.fields.liveConfig = JSON.stringify({
        riskLevel: r.fields.riskLevel,
        tag: r.fields.tag,
        action: r.fields.action,
        scope: r.fields.scope,
        condition: r.fields.condition,
      });
      r.status = '已生效';
      publishRiskRule(r.id, r.version);
      break;
    case 'rollbackRule': {
      const prev = JSON.parse(r.fields.previous);
      r.fields.liveVersion = prev.version;
      r.fields.liveConfig = prev.config;
      Object.assign(r.fields, JSON.parse(prev.config));
      r.fields.previous = '';
      r.fields.checkVersion = '';
      r.fields.pilot = '';
      r.status = '已生效';
      publishRiskRule(r.id, prev.version);
      detail += '；当前执行版本 ' + prev.version;
      break;
    }
    case 'editAccount':
      r.fields.contact = v.contact;
      r.fields.account = v.account;
      break;
    case 'disableAccount':
      r.status = '停用';
      break;
    case 'enableAccount':
      r.status = '启用';
      break;
    case 'editRole':
      Object.assign(r.fields, v);
      delete r.fields.note;
      break;
  }
  r.revision++;
  s.revision++;
  audit.result = '成功';
  if (s.safety)
    for (const task of records(s, 'tasks')) {
      if (
        ['暂停', '已停止'].includes(task.status) &&
        task.fields.stage !== '安全中止'
      ) {
        task.fields.stage = '安全中止';
        s.safety.events.push({
          id: 'RUN-' + ++s.seq,
          task: task.id,
          time: s.now,
          stage: '安全中止',
          detail: '管理限制已生效；不会自动重放原动作',
        });
      }
    }
  audit.detail = detail;
  r.history.push({ time: s.now, action: op.label, detail });
  return s;
}
export function newFields(page: PageId, state?: State): Field[] {
  const scope = f('scope', '可使用单位', 'select', [
    '全市单位',
    ...allUnits(state).map((u) => u.name),
  ]);
  if (page === 'systems')
    return [
      f('name', '系统名称'),
      f(
        'unit',
        '所属单位',
        'select',
        allUnits(state).map((u) => u.name),
      ),
      f('provider', '系统建设方'),
      f('purpose', '接入用途', 'textarea'),
      f('dataScope', '允许的数据范围', 'textarea'),
      f('permissions', '允许的操作范围', 'textarea'),
      scope,
      f('expires', '授权到期日期'),
      f('material', '接入申请与授权依据', 'textarea'),
    ];
  if (page === 'accounts')
    return [
      f('name', '单位名称'),
      f('contact', '管理联系人'),
      f('account', '单位管理员子账号'),
    ];
  return [
    f('name', page === 'experience' ? '经验名称' : '名称'),
    f(
      'unit',
      '所属单位',
      'select',
      allUnits(state).map((u) => u.name),
    ),
    ...(capPages.includes(page)
      ? [
          f('provider', '建设来源', 'select', [
            '市中台统一建设',
            '软件服务商',
            '对应系统建设方',
            '单位个人提交',
          ]),
          f('description', '成果说明', 'textarea'),
          f('permissions', '权限声明', 'textarea'),
          scope,
        ]
      : page === 'experience'
        ? [f('content', '组织经验内容', 'textarea'), scope]
        : page === 'knowledge'
          ? [f('source', '知识来源'), scope]
          : [f('contact', '管理联系人'), f('account', '单位管理员子账号')]),
  ];
}
export function createRecord(
  state: State,
  page: PageId,
  values: Record<string, string>,
): State {
  if (
    ![...capPages, 'systems', 'knowledge', 'experience', 'accounts'].includes(
      page,
    )
  )
    throw new Error('当前目录不支持新增');
  for (const f of newFields(page, state))
    if (!values[f.key]?.trim()) throw new Error('请填写' + f.label);
  const s = structuredClone(state);
  const id = page.toUpperCase() + '-' + ++s.seq;
  if (
    page === 'accounts' &&
    records(s, 'accounts').some(
      (r) => r.fields.account === values.account || r.name === values.name,
    )
  )
    throw new Error('单位名称或管理员子账号已存在');
  const unit =
    page === 'accounts'
      ? 'unit-' + s.seq
      : allUnits(s).find((u) => u.name === values.unit)?.id;
  if (!unit) throw new Error('单位不存在');
  const fields: Record<string, string> = {
    ...values,
    owner: '市级运营管理员',
    review: '待审核',
    liveVersion: '',
    enabled: '否',
    connection: '待检查',
    expires: values.expires || '2026-12-31',
    items: '0',
    source: values.source || '组织提交',
  };
  delete fields.name;
  delete fields.unit;
  if (page === 'systems') {
    for (const key of ['liveVersion', 'connection', 'items', 'source'])
      delete fields[key];
    fields.approval = '待审核';
    fields.receipt = '待执行';
  }
  s.rows.push(
    makeRow(
      page,
      id,
      values.name,
      unit,
      page === 'accounts'
        ? '启用'
        : ['systems', 'knowledge', 'experience'].includes(page)
          ? '草稿'
          : '待审核',
      fields,
    ),
  );
  if (page === 'accounts') {
    const account = getRow(s, id);
    account.fields.role = '单位管理员';
    account.fields.scope = '本单位申请与席位管理';
    s.rows.push(
      makeRow('seats', 'SEAT-' + unit, values.name, unit, '未开通', {
        approved: '0',
        opened: '0',
        owner: '单位管理员',
        scope: '本单位在岗人员',
      }),
      makeRow('quotas', 'QUOTA-' + unit, values.name, unit, '未分配', {
        quota: '0',
        threshold: '80',
        period: '2026-09',
        increase: '0',
        requestStatus: '无申请',
        owner: '用量运营岗',
      }),
    );
  }
  s.audit.push({
    id: 'CREATE-' + s.seq,
    time: s.now,
    page,
    record: id,
    action: '登记新增',
    result: '成功',
    detail: values.name,
    actor: '市级运营管理员',
  });
  s.revision++;
  return s;
}
export function impact(s: State, r: Row) {
  const tasks = records(s, 'tasks').filter(
    (t) =>
      t.fields.system === r.id ||
      t.fields.connector === r.id ||
      t.fields.agent === r.id ||
      t.fields.sandbox === r.id ||
      t.id === r.fields.task,
  );
  const caps = records(s, 'agents').filter((c) => c.fields.model === r.id);
  return { tasks, caps };
}
