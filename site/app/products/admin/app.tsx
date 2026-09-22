'use client';
import { useState, useRef, useEffect, type ReactNode } from 'react';
import {
  ShieldCheck,
  ChevronDown,
  LayoutDashboard,
  Building2,
  Boxes,
  Server,
  ChartNoAxesCombined,
  Settings,
  Search,
  Bell,
  HelpCircle,
  ArrowLeft,
  Plus,
  ChevronRight,
  RefreshCw,
  Pause,
  Play,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { GovernanceView } from './governance-view';
import { UnitRequest } from './unit-request';
import {
  roles,
  mayManage,
  scopeAdminState,
  submitUnitRequest,
  type AdminRole,
} from './governance';
import { groups, type PageId, pageName, pages } from './admin/catalog';
import {
  type Row,
  type State,
  type Filters,
  defaultFilters,
  units,
  allUnits,
  unitName,
  records,
  number,
  todos,
  TODAY,
  capPages,
  getRow,
  quotaStatus,
  quotaUsed,
} from './admin/data';
import {
  actions,
  beginOperation,
  settleOperation,
  type ActionSpec,
  createRecord,
  newFields,
  impact,
} from './admin/business';
import {
  Pick,
  Panel,
  Stat,
  Badge,
  Fields,
  FormFields,
  token,
} from './admin/ui';
import { RecordDetails, fieldLabel, type Navigate } from './admin/views';
import {
  createSafetyState,
  advanceSafety,
  UPDATE_INTERVAL_MS,
} from './admin/safety';
import { SafetyOverview, type OverviewFocus } from './admin/overview';
import { useAdminTools } from './admin/webmcp';
import './admin/admin.css';
import { SavingsAnalysis, initialSavingsView } from './admin/savings-view';
import { atomicTaskTypes } from '../../shared/routing-domain';
import {
  EvaluationCenter,
  TaskRoutingView,
  TokenDistribution,
} from './token-governance-view';
import { aiMemoryStories } from '../../shared/story-corpus';
import { RiskPolicyPanel } from './admin/risk-policy-panel';
const icons = [
  LayoutDashboard,
  Building2,
  Boxes,
  Server,
  ChartNoAxesCombined,
  ShieldCheck,
  Settings,
];
const columnKeys: Partial<Record<PageId, string[]>> = {
  systems: ['purpose', 'scope', 'expires'],
  applications: ['amount', 'purpose', 'date'],
  seats: ['approved', 'opened', 'scope'],
  tickets: ['category', 'owner', 'due'],
  agents: ['category', 'liveVersion', 'scope'],
  skills: ['provider', 'permissions', 'scope'],
  plugins: ['provider', 'permissions', 'scope'],
  connectors: ['system', 'connection', 'expires'],
  models: ['category', 'level', 'scope'],
  evaluations: ['kind', 'targetVersion', 'testSet'],
  tasks: ['userLabel', 'entry', 'duration'],
  sandboxes: ['task', 'network', 'resource'],
  spaces: ['quota', 'used', 'owner'],
  knowledge: ['source', 'items', 'lastSync'],
  experience: ['source', 'liveVersion', 'scope'],
  memory: ['quota', 'used', 'authorized'],
  quotas: ['quota', 'threshold', 'requestStatus'],
  alerts: ['level', 'owner', 'due'],
  rules: ['riskLevel', 'category', 'action', 'liveVersion'],
  audit: ['actor', 'result', 'time'],
  accounts: ['account', 'contact', 'role'],
  roles: ['menus', 'permissions', 'scope'],
};
const newPages: PageId[] = [
  'systems',
  'agents',
  'skills',
  'plugins',
  'connectors',
  'knowledge',
  'experience',
  'accounts',
];
type Form = {
  record?: string;
  revision?: number;
  page?: PageId;
  spec: ActionSpec;
  values: Record<string, string>;
};
type SummaryStat = {
  label: string;
  value: string | number;
  unit?: string;
  status?: string;
  note?: string;
};
function AiMemoryAuditSummary() {
  return (
    <Panel title="五条固定案例的记忆引用边界">
      <p className="record-note">
        本页只保留脱敏治理元数据；不展示个人记忆正文、任务正文或企业材料。
      </p>
      <div className="table-scroll">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>案例</TableHead>
              <TableHead>引用依据</TableHead>
              <TableHead>治理结论</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {aiMemoryStories.map((story) => (
              <TableRow key={story.id}>
                <TableCell>{story.name}</TableCell>
                <TableCell>{story.evidence.length}项固定合成依据</TableCell>
                <TableCell>撤权即停止调用；正式判断、共享和发布须人工确认；无回执不标系统成功。</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Panel>
  );
}
function directoryStats(
  page: PageId,
  rows: Row[],
  state: State,
): SummaryStat[] {
  const n = (status: string) => rows.filter((r) => r.status === status).length;
  const by = (statuses: string[]) =>
    statuses.map((status) => ({
      label: status,
      value: n(status),
      unit: '条',
      status,
    }));
  if (page === 'systems') return by(['已接入', '待审核', '待开通', '已暂停']);
  if (['accounts', 'roles', 'audit'].includes(page)) return [];
  if (page === 'seats')
    return [
      {
        label: '已批准席位',
        value: rows.reduce((a, r) => a + number(r, 'approved'), 0),
        unit: '个',
      },
      {
        label: '已开通席位',
        value: rows.reduce((a, r) => a + number(r, 'opened'), 0),
        unit: '个',
      },
      {
        label: '今日使用人数',
        value: new Set(
          records(state, 'tasks')
            .filter(
              (t) =>
                t.fields.date === TODAY && rows.some((r) => r.unit === t.unit),
            )
            .map((t) => t.fields.user),
        ).size,
        unit: '人',
      },
    ];
  if (page === 'quotas')
    return [
      {
        label: '本月单位额度',
        value: token(rows.reduce((a, r) => a + number(r, 'quota'), 0)),
      },
      {
        label: '已计量用量',
        value: token(rows.reduce((a, r) => a + quotaUsed(state, r), 0)),
      },
      {
        label: '需要处理',
        value: rows.filter(
          (r) => r.status !== '正常' || r.fields.requestStatus === '待审批',
        ).length,
        unit: '个单位',
      },
    ];
  if (capPages.includes(page))
    return [
      {
        label: '已上线',
        value: rows.filter((r) => r.fields.enabled === '是').length,
        unit: '个',
        status: '已上线',
      },
      ...by(['待审核', '待整改']),
    ];
  if (page === 'applications')
    return by(['待审批', '待补充', '待开通', '开通失败']);
  if (page === 'tickets') return by(['待分派', '处理中', '待反馈', '已关闭']);
  if (page === 'evaluations') return by(['评测中', '通过', '未通过', '待复测']);
  if (page === 'tasks') return by(['运行中', '完成', '失败', '暂停']);
  if (page === 'sandboxes') return by(['运行中', '异常', '已隔离', '闲置']);
  if (page === 'spaces')
    return [
      { label: '工作空间', value: rows.length, unit: '个' },
      {
        label: '服务异常',
        value: n('服务异常'),
        unit: '个',
        status: '服务异常',
      },
      {
        label: '已使用容量',
        value: rows.reduce((a, r) => a + number(r, 'used'), 0),
        unit: 'GB',
      },
    ];
  if (page === 'models') return by(['可用', '暂不可用']);
  if (page === 'knowledge') return by(['已发布', '待发布', '同步失败']);
  if (page === 'experience') return by(['已发布', '待审核', '草稿']);
  if (page === 'memory') return by(['已开通', '服务异常', '未开通']);
  if (page === 'alerts') return by(['待处理', '处理中', '待整改', '待复核']);
  if (page === 'rules') return by(['已生效', '草稿', '待发布']);
  return [];
}
let retained: ReturnType<typeof createSafetyState> | undefined;
let retainedUi: { page: PageId; selection?: string; role: AdminRole } = {
  page: 'overview',
  role: '市级运营管理员',
};
function retainUi(next: typeof retainedUi) {
  retainedUi = next;
}
export default function AdminProduct({ switcher }: { switcher: ReactNode }) {
  const [fullState, setState] = useState(() => retained ?? createSafetyState());
  const [role, setRole] = useState<AdminRole>(retainedUi.role);
  const state = scopeAdminState(fullState, role);
  const [savingsView, setSavingsView] = useState(initialSavingsView);
  const current = useRef(fullState);
  const [page, setPage] = useState<PageId>(retainedUi.page);
  const [expanded, setExpanded] = useState<string>(
    () =>
      groups.find((g) => g.pages.some((p) => p[0] === retainedUi.page))?.name ||
      '组织与服务',
  );
  const [selection, setSelection] = useState<string | undefined>(
    retainedUi.selection,
  );
  const [backStack, setBackStack] = useState<{ page: PageId; id?: string }[]>(
    [],
  );
  const [filters, setFilters] = useState<Partial<Record<PageId, Filters>>>({});
  const f = filters[page] ?? {
    ...defaultFilters(),
    ...(page === 'audit' ? { from: TODAY, to: '2026-09-25' } : {}),
  };
  const [form, setForm] = useState<Form | null>(null);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);
  const [drawer, setDrawer] = useState<'todos' | 'help' | 'search' | null>(
    null,
  );
  const [globalSearch, setGlobalSearch] = useState('');
  const [overviewFocus, setOverviewFocus] = useState<OverviewFocus | null>(
    null,
  );
  const [paused, setPaused] = useState(true);
  const [failNext, setFailNext] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [tablePage, setTablePage] = useState(1);
  useEffect(() => retainUi({ page, selection, role }), [page, selection, role]);
  const epoch = useRef(0);
  const save = (s: typeof state) => {
    retained = s;
    current.current = s;
    setState(s);
  };
  const go: Navigate = (target, id, patch) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setBackStack((prev) => [...prev, { page, id: selection }]);
    setPage(target);
    setSelection(id);
    setTablePage(1);
    setExpanded(groups.find((g) => g.pages.some((p) => p[0] === target))!.name);
    if (patch || target === 'usage')
      setFilters((prev) => ({
        ...prev,
        [target]: {
          ...(prev[target] ?? defaultFilters()),
          ...(target === 'usage' ? { usageView: 'distribution' as const } : {}),
          ...patch,
        },
      }));
    setDrawer(null);
    window.scrollTo({ top: 0 });
  };
  const back = () => {
    const last = backStack.at(-1);
    if (last) {
      setPage(last.page);
      setSelection(last.id);
      if (last.page === 'overview')
        setOverviewFocus((focus) => (focus ? { ...focus, open: true } : null));
      setExpanded(
        groups.find((g) => g.pages.some((p) => p[0] === last.page))!.name,
      );
      setBackStack(backStack.slice(0, -1));
    } else setSelection(undefined);
  };
  const patchFilter = (patch: Partial<Filters>) => {
    if (page === 'overview') setOverviewFocus(null);
    if (page === 'usage') setSavingsView(initialSavingsView());
    setFilters((prev) => ({ ...prev, [page]: { ...f, ...patch } }));
    setTablePage(1);
  };
  const found = state.rows.find((r) => r.id === selection);
  const selected =
    found?.page === 'quotas'
      ? { ...found, status: quotaStatus(state, found) }
      : found;
  const openAction = (r: Row, spec: ActionSpec) => {
    if (!mayManage(role, r.page)) {
      setNotice({ text: '当前岗位没有此操作权限。', error: true });
      return;
    }
    const values: Record<string, string> = {};
    for (const field of spec.fields ?? [])
      values[field.key] =
        field.key === 'note'
          ? ''
          : field.type === 'select'
            ? field.options?.includes(r.fields[field.key])
              ? r.fields[field.key]
              : (field.options?.[0] ?? '')
            : (r.fields[field.key] ?? '');
    setForm({ record: r.id, revision: r.revision, spec, values });
    setFormError('');
  };
  const submit = async () => {
    if (!form) return;
    const target =
      form.page || current.current.rows.find((r) => r.id === form.record)?.page;
    if (!target || !mayManage(role, target)) {
      setFormError('当前岗位没有此操作权限。');
      return;
    }
    setFormError('');
    try {
      if (form.page) {
        save(createRecord(current.current, form.page, form.values));
        setForm(null);
        setNotice({ text: '记录已登记，后续审核在当前目录处理' });
        return;
      }
      const started = beginOperation(
        current.current,
        form.record!,
        form.spec.key,
        form.values,
        form.revision,
      );
      const generation = epoch.current;
      const fail = failNext;
      setFailNext(false);
      save(started.state);
      setForm(null);
      await new Promise((resolve) => setTimeout(resolve, 450));
      if (generation !== epoch.current) return;
      if (started.operation.key === 'evaluate') {
        const progress = structuredClone(current.current);
        for (const r of progress.rows.filter(
          (e) => e.fields.execution === started.operation.id,
        ))
          r.fields.progress = '50';
        save(progress);
      }
      await new Promise((resolve) => setTimeout(resolve, 450));
      if (generation !== epoch.current) return;
      let updated;
      try {
        updated = settleOperation(current.current, started.operation, fail);
      } catch (e) {
        updated = settleOperation(current.current, started.operation, true);
        setNotice({
          text: String(e instanceof Error ? e.message : e),
          error: true,
        });
      }
      save(updated);
      const result = updated.audit.find((a) => a.id === started.operation.id)!;
      setNotice({
        text: form.spec.label + ' · ' + result.result,
        error: result.result !== '成功',
      });
    } catch (e) {
      setFormError(e instanceof Error ? e.message : String(e));
    }
  };
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      save(advanceSafety(current.current));
    }, UPDATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(null), 6500);
    return () => clearTimeout(timeout);
  }, [notice]);
  useAdminTools(state, go);
  const rawRows: Row[] =
    page === 'audit'
      ? [
          ...state.audit.map((a) => ({
            id: a.id,
            page: 'audit' as PageId,
            name: a.action,
            unit:
              a.unit ??
              state.rows.find((r) => r.id === a.record)?.unit ??
              'all',
            status: a.result,
            version: '1.0',
            revision: 0,
            fields: {
              actor: a.actor,
              result: a.result,
              time: a.time,
              kind: '管理操作',
              task: a.record,
              material: a.detail,
              date: a.time.slice(0, 10),
            },
            history: [],
          })),
          ...records(state, 'audit'),
        ]
      : records(state, page).map((r) =>
          r.page === 'quotas' ? { ...r, status: quotaStatus(state, r) } : r,
        );
  const rows = rawRows.filter(
    (r) =>
      (f.unit === 'all' || r.unit === f.unit || r.unit === 'all') &&
      (f.status === '全部状态' ||
        r.status === f.status ||
        (f.status === '已上线' && r.fields.enabled === '是')) &&
      (!f.search ||
        [r.id, r.name, unitName(r.unit, state), ...Object.values(r.fields)]
          .join(' ')
          .toLowerCase()
          .includes(f.search.toLowerCase())) &&
      (page !== 'rules' ||
        f.riskLevel === 'all' ||
        r.fields.riskLevel === f.riskLevel) &&
      (!['tasks', 'evaluations', 'audit'].includes(page) ||
        !r.fields.date ||
        (r.fields.date >= f.from && r.fields.date <= f.to)),
  );
  const summary = directoryStats(page, rows, state);
  const pageSize = 10;
  const countPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentTablePage = Math.min(tablePage, countPages);
  const shown = rows.slice(
    (currentTablePage - 1) * pageSize,
    currentTablePage * pageSize,
  );
  const datePage = ['tasks', 'usage', 'evaluations', 'audit'].includes(page);
  const activePage = pages.find((p) => p.id === page)!;
  const getDisplay = (r: Row, k: string) => {
    if (k === 'quota' && page === 'quotas') return token(number(r, k));
    if (k === 'level' && page === 'alerts') return r.fields.level;
    if (['quota', 'used'].includes(k) && ['spaces', 'memory'].includes(page))
      return r.fields[k] + ' GB';
    return r.fields[k] || '—';
  };
  return (
    <div
      className={
        'admin-shell ' + (page === 'overview' ? 'admin-overview-shell' : '')
      }
    >
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck />
          </div>
          <div>
            <b>智能体治理</b>
            <span>超级智能体管理平台</span>
          </div>
        </div>
        <div className="nav-caption">
          {role === '单位管理员' ? '单位服务中心' : '市级管理中心'}
        </div>
        <nav aria-label="功能目录">
          {groups.map((g, i) => {
            const Icon = icons[i];
            const active = g.pages.some((p) => p[0] === page);
            return (
              <div key={g.name} className="nav-group">
                <button
                  className={'group-button ' + (active ? 'active' : '')}
                  aria-expanded={i ? expanded === g.name : undefined}
                  aria-current={
                    i === 0 && page === 'overview' ? 'page' : undefined
                  }
                  onClick={() =>
                    i === 0
                      ? go('overview')
                      : setExpanded(expanded === g.name ? '' : g.name)
                  }
                >
                  <Icon size={19} />
                  <span>{g.name}</span>
                  {i > 0 && (
                    <ChevronDown
                      className={expanded === g.name ? 'rotated' : ''}
                      size={15}
                    />
                  )}
                </button>
                {i > 0 && expanded === g.name && (
                  <div className="subnav">
                    {g.pages.map((p) => (
                      <button
                        key={p[0]}
                        className={page === p[0] ? 'selected' : ''}
                        aria-current={page === p[0] ? 'page' : undefined}
                        onClick={() => go(p[0])}
                      >
                        {p[1]}
                        {p[0] === 'applications' && (
                          <small>
                            {
                              records(state, 'applications').filter(
                                (r) => r.status === '待审批',
                              ).length
                            }
                          </small>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <i />
          政务运行环境<span>市中台</span>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <span>
            市AIP中台 <span className="slash">/</span> {activePage.group}
            {page !== 'overview' && (
              <>
                <span className="slash">/</span>
                {activePage.name}
              </>
            )}
          </span>
          <div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="全局搜索"
              onClick={() => setDrawer('search')}
            >
              <Search size={18} />
            </Button>
            <Button
              variant="ghost"
              className="todo-top"
              aria-label="统一待办"
              onClick={() => setDrawer('todos')}
            >
              <Bell size={18} />
              <span>待办</span>
              <b>{todos(state).length}</b>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="帮助与数据说明"
              onClick={() => setDrawer('help')}
            >
              <HelpCircle size={18} />
            </Button>
            <select
              className="admin-role-select"
              aria-label="当前管理岗位"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as AdminRole);
                setSelection(undefined);
                setForm(null);
                setDrawer(null);
                setPage('overview');
                setFilters({});
              }}
            >
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            {switcher}
            <span className="header-divider" />
            <span className="avatar">运</span>
            <span className="account-label">
              {role}
              <small>
                {role === '单位管理员' ? '市政务服务管理局' : '按岗位授权'}
              </small>
            </span>
          </div>
        </header>
        <div
          className={
            'workspace ' + (page === 'overview' ? 'overview-workspace' : '')
          }
        >
          <div className="page-heading">
            <div>
              {selection && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="back-button"
                  onClick={back}
                >
                  <ArrowLeft size={15} />
                  返回
                </Button>
              )}
              <h1>{selected?.name ?? activePage.name}</h1>
              {page !== 'overview' && (
                <p>
                  {selected
                    ? selected.id + ' · ' + unitName(selected.unit, state)
                    : role === '单位管理员' && page === 'applications'
                      ? '提交本单位需求并跟踪审批与开通结果'
                      : role === '单位管理员' && page === 'tickets'
                        ? '提交使用问题并查看处理反馈'
                        : activePage.purpose}
                </p>
              )}
            </div>
            <div className="heading-actions">
              {page === 'overview' ? (
                <>
                  <span className="update-status">
                    <i />
                    {state.now.slice(11)} 更新
                  </span>
                  <span className="date-display">
                    2026年9月8日 · 固定运行样本
                  </span>
                </>
              ) : !selection &&
                mayManage(role, page) &&
                newPages.includes(page) ? (
                <Button
                  onClick={() => {
                    setForm({
                      page,
                      spec: {
                        key: 'create',
                        label:
                          page === 'accounts' ? '登记单位账号' : '登记新增',
                        description: '登记后进入市中台统一管理流程。',
                        fields: newFields(page, state),
                      },
                      values: {
                        unit: units[0].name,
                        scope: '全市单位',
                        provider: '市中台统一建设',
                      },
                    });
                    setFormError('');
                  }}
                >
                  <Plus size={16} />
                  登记新增
                </Button>
              ) : null}
            </div>
          </div>
          {page === 'intake' ? (
            <GovernanceView
              key={page}
              page={page}
              role={role}
              onAudit={(event) =>
                save({
                  ...current.current,
                  audit: [event, ...current.current.audit],
                })
              }
            />
          ) : (
            <>
              {role === '单位管理员' &&
                !selection &&
                (page === 'applications' || page === 'tickets') && (
                  <UnitRequest
                    key={page}
                    page={page}
                    onSubmit={(amount, purpose) =>
                      save(
                        submitUnitRequest(
                          current.current,
                          role,
                          page,
                          amount,
                          purpose,
                        ),
                      )
                    }
                  />
                )}
              {!selection && !['routing', 'evaluations'].includes(page) && (
                <div
                  className={
                    'filters ' + (page === 'overview' ? 'overview-filter' : '')
                  }
                >
                  <Pick
                    label="所属单位筛选"
                    value={f.unit}
                    onChange={(v) => patchFilter({ unit: v })}
                    options={[
                      {
                        value: 'all',
                        label:
                          role === '单位管理员' ? '本单位范围' : '全市单位',
                      },
                      ...allUnits(state)
                        .filter((u) => role !== '单位管理员' || u.id === 'u1')
                        .map((u) => ({
                          value: u.id,
                          label: u.name,
                        })),
                    ]}
                  />
                  {page === 'overview' && (
                    <Pick
                      label="首页统计期间"
                      value={f.from === TODAY ? '今日' : '近7日'}
                      options={['今日', '近7日']}
                      onChange={(v) =>
                        patchFilter({
                          from: v === '今日' ? TODAY : '2026-09-02',
                          to: TODAY,
                        })
                      }
                    />
                  )}
                  {page !== 'overview' && (
                    <>
                      <div className="search-field">
                        <Search size={16} />
                        <Input
                          aria-label="搜索当前目录"
                          placeholder={
                            page === 'usage'
                              ? '搜索调用或任务编号'
                              : '搜索名称、编号、责任人…'
                          }
                          value={f.search}
                          onChange={(e) =>
                            patchFilter({ search: e.target.value })
                          }
                        />
                      </div>
                      {page !== 'usage' && (
                        <Pick
                          label="状态筛选"
                          value={f.status}
                          onChange={(v) => patchFilter({ status: v })}
                          options={[
                            '全部状态',
                            ...new Set(rawRows.map((r) => r.status)),
                          ]}
                        />
                      )}
                      {page === 'rules' && (
                        <Pick
                          label="控制等级"
                          value={f.riskLevel}
                          onChange={(v) => patchFilter({ riskLevel: v })}
                          options={[
                            { value: 'all', label: '全部等级' },
                            '低',
                            '中',
                            '高',
                            '红线',
                          ]}
                        />
                      )}
                    </>
                  )}
                  {datePage && (
                    <>
                      <Pick
                        label="统计周期"
                        value={
                          f.from === TODAY
                            ? '今日'
                            : f.from === '2026-09-02'
                              ? '近7日'
                              : f.from === '2026-09-01'
                                ? '本月'
                                : '自定义'
                        }
                        onChange={(v) => {
                          if (v !== '自定义')
                            patchFilter({
                              from:
                                v === '今日'
                                  ? TODAY
                                  : v === '近7日'
                                    ? '2026-09-02'
                                    : '2026-09-01',
                              to: TODAY,
                            });
                        }}
                        options={['今日', '近7日', '本月', '自定义']}
                      />
                      <Input
                        aria-label="开始日期"
                        type="date"
                        value={f.from}
                        onChange={(e) => patchFilter({ from: e.target.value })}
                      />
                      <span>至</span>
                      <Input
                        aria-label="结束日期"
                        type="date"
                        value={f.to}
                        onChange={(e) => patchFilter({ to: e.target.value })}
                      />
                    </>
                  )}
                  {page !== 'overview' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          [page]: {
                            ...defaultFilters(),
                            ...(page === 'usage'
                              ? { usageView: f.usageView }
                              : {}),
                          },
                        }));
                        setTablePage(1);
                        if (page === 'usage')
                          setSavingsView(initialSavingsView());
                      }}
                    >
                      <RefreshCw size={14} />
                      重置筛选
                    </Button>
                  )}
                </div>
              )}
              {page === 'usage' && !selection && (
                <div className="filters secondary-filters">
                  <Pick
                    label="智能体筛选"
                    value={f.agent}
                    onChange={(v) => patchFilter({ agent: v })}
                    options={[
                      { value: 'all', label: '全部智能体' },
                      ...records(state, 'agents').map((r) => ({
                        value: r.id,
                        label: r.name,
                      })),
                    ]}
                  />
                  <Pick
                    label="模型筛选"
                    value={f.model}
                    onChange={(v) => patchFilter({ model: v })}
                    options={[
                      { value: 'all', label: '全部模型' },
                      ...records(state, 'models').map((r) => ({
                        value: r.id,
                        label: r.name,
                      })),
                    ]}
                  />
                  <Pick
                    label="任务入口"
                    value={f.entry}
                    onChange={(v) => patchFilter({ entry: v })}
                    options={[
                      { value: 'all', label: '全部入口' },
                      '超级智能体',
                      '专业智能体',
                    ]}
                  />
                  <Pick
                    label="原子任务"
                    value={f.taskType}
                    onChange={(v) => patchFilter({ taskType: v })}
                    options={[
                      { value: 'all', label: '全部任务类型' },
                      ...atomicTaskTypes,
                    ]}
                  />
                  <Pick
                    label="业务场景"
                    value={f.businessScenario}
                    onChange={(v) => patchFilter({ businessScenario: v })}
                    options={[
                      { value: 'all', label: '全部业务场景' },
                      '材料处理',
                      '政策检索',
                      '表格处理',
                      '会议整理',
                    ]}
                  />
                  <Pick
                    label="路由等级"
                    value={f.routeLevel}
                    onChange={(v) => patchFilter({ routeLevel: v })}
                    options={[
                      { value: 'all', label: '全部等级' },
                      'L1',
                      'L2',
                      'L3',
                    ]}
                  />
                </div>
              )}
              {selection && selected ? (
                <>
                  <div className="action-toolbar">
                    <Badge>
                      {selected.pending ? '执行中' : selected.status}
                    </Badge>
                    {selected.pending ? (
                      <span className="pending">
                        <LoaderCircle size={16} className="spin" />
                        正在等待执行结果
                      </span>
                    ) : (
                      (mayManage(role, page)
                        ? actions(state, selected)
                        : []
                      ).map((a) => (
                        <Button
                          key={a.key}
                          variant={a.danger ? 'outline' : 'default'}
                          className={a.danger ? 'danger-button' : ''}
                          onClick={() => openAction(selected, a)}
                        >
                          {a.label}
                        </Button>
                      ))
                    )}
                  </div>
                  <RecordDetails state={state} row={selected} go={go} />
                </>
              ) : selection && page === 'audit' ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setSelection(undefined)}
                  >
                    <ArrowLeft />
                    返回审计列表
                  </Button>
                  <Panel title="管理操作记录">
                    <Fields
                      items={Object.entries(
                        rawRows.find((r) => r.id === selection)?.fields ?? {},
                      ).map(([k, v]) => [fieldLabel(k), v])}
                    />
                  </Panel>
                  <AiMemoryAuditSummary />
                </>
              ) : page === 'overview' ? (
                <SafetyOverview
                  state={state}
                  filters={f}
                  go={go}
                  paused={paused}
                  focus={overviewFocus}
                  onFocus={setOverviewFocus}
                />
              ) : page === 'routing' ? (
                <TaskRoutingView role={role} go={go} />
              ) : page === 'evaluations' ? (
                <EvaluationCenter state={state} role={role} go={go} />
              ) : page === 'usage' ? (
                <>
                  <div className="savings-tabs" aria-label="用量视图">
                    <Button
                      variant="ghost"
                      aria-pressed={f.usageView === 'distribution'}
                      onClick={() => patchFilter({ usageView: 'distribution' })}
                    >
                      任务类型分布
                    </Button>
                    <Button
                      variant="ghost"
                      aria-pressed={f.usageView === 'savings'}
                      onClick={() => patchFilter({ usageView: 'savings' })}
                    >
                      路由效率
                    </Button>
                    <Button
                      variant="ghost"
                      aria-pressed={f.usageView === 'calls'}
                      onClick={() => patchFilter({ usageView: 'calls' })}
                    >
                      调用明细
                    </Button>
                  </div>
                  {f.usageView === 'savings' ? (
                    <SavingsAnalysis
                      state={state}
                      filters={f}
                      go={go}
                      view={savingsView}
                      setView={setSavingsView}
                      patchFilter={patchFilter}
                    />
                  ) : (
                    <TokenDistribution
                      state={state}
                      filters={f}
                      detail={f.usageView === 'calls'}
                      go={go}
                    />
                  )}
                </>
              ) : (
                <>
                  {summary.length > 0 && (
                    <div
                      className="metrics compact"
                      style={{
                        gridTemplateColumns: `repeat(${summary.length},minmax(0,1fr))`,
                      }}
                    >
                      {summary.map((item) => (
                        <Stat
                          key={item.label}
                          label={item.label}
                          value={item.value}
                          unit={item.unit}
                          note={item.note}
                          onClick={
                            item.status
                              ? () => patchFilter({ status: item.status! })
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  )}
                  {page === 'rules' && (
                    <RiskPolicyPanel
                      state={state}
                      selected={f.riskLevel}
                      onSelect={(riskLevel) => patchFilter({ riskLevel })}
                    />
                  )}
                  <Panel
                    title={pageName(page) + '列表'}
                    aside={<span>共 {rows.length} 条记录</span>}
                  >
                    <div className="table-scroll">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>
                              {page === 'roles'
                                ? '岗位名称'
                                : page === 'accounts'
                                  ? '单位名称'
                                  : '名称／编号'}
                            </TableHead>
                            <TableHead>所属单位</TableHead>
                            {(columnKeys[page] ?? []).map((k) => (
                              <TableHead key={k}>
                                {k === 'level' && page === 'alerts'
                                  ? '告警等级'
                                  : fieldLabel(k)}
                              </TableHead>
                            ))}
                            <TableHead>状态</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shown.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell>
                                <button
                                  className="record-link"
                                  onClick={() => go(page, r.id)}
                                >
                                  {r.name}
                                </button>
                                <small>
                                  {r.id}
                                  {capPages.includes(page) &&
                                    ' · v' + r.version}
                                </small>
                              </TableCell>
                              <TableCell>{unitName(r.unit, state)}</TableCell>
                              {(columnKeys[page] ?? []).map((k) => (
                                <TableCell key={k}>
                                  <span
                                    className="cell-value"
                                    title={getDisplay(r, k)}
                                  >
                                    {getDisplay(r, k)}
                                  </span>
                                  {page === 'quotas' && k === 'quota' && (
                                    <small>
                                      已用 {token(quotaUsed(state, r))}
                                    </small>
                                  )}
                                </TableCell>
                              ))}
                              <TableCell>
                                <Badge>{r.pending ? '执行中' : r.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => go(page, r.id)}
                                >
                                  查看
                                  <ChevronRight size={14} />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {!rows.length && (
                        <div className="empty-state">
                          <Search size={30} />
                          <strong>没有符合条件的记录</strong>
                          <span>调整筛选条件，或重置后查看全部。</span>
                          <Button
                            variant="outline"
                            onClick={() => patchFilter(defaultFilters())}
                          >
                            重置筛选
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="pagination">
                      <span>
                        第 {currentTablePage} / {countPages} 页 · 每页10条
                      </span>
                      <div>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={currentTablePage <= 1}
                          onClick={() => setTablePage(currentTablePage - 1)}
                        >
                          上一页
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={currentTablePage >= countPages}
                          onClick={() => setTablePage(currentTablePage + 1)}
                        >
                          下一页
                        </Button>
                      </div>
                    </div>
                  </Panel>
                </>
              )}
            </>
          )}
        </div>
      </main>
      {notice && (
        <output className={'notice ' + (notice.error ? 'error' : '')}>
          {notice.error ? (
            <AlertCircle size={19} />
          ) : (
            <CheckCircle2 size={19} />
          )}
          <span>{notice.text}</span>
          <button aria-label="关闭通知" onClick={() => setNotice(null)}>
            <X size={15} />
          </button>
        </output>
      )}
      <Dialog
        open={!!form}
        onOpenChange={(open) => {
          if (!open) setForm(null);
        }}
      >
        <DialogContent className="admin-dialog">
          <DialogHeader>
            <DialogTitle>{form?.spec.label}</DialogTitle>
            <DialogDescription>{form?.spec.description}</DialogDescription>
          </DialogHeader>
          {form && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              {form.record && (
                <div className="confirmation-object">
                  <b>{getRow(state, form.record).name}</b>
                  <span>
                    {form.record} ·{' '}
                    {unitName(getRow(state, form.record).unit, state)}
                  </span>
                  {[
                    'disable',
                    'stop',
                    'isolate',
                    'recycle',
                    'restrict',
                  ].includes(form.spec.key) && (
                    <span>
                      关联任务{' '}
                      {impact(state, getRow(state, form.record)).tasks.length}{' '}
                      项；当前状态 {getRow(state, form.record).status}。
                    </span>
                  )}
                </div>
              )}
              <FormFields
                fields={form.spec.fields ?? []}
                values={form.values}
                onChange={(k, v) =>
                  setForm({ ...form, values: { ...form.values, [k]: v } })
                }
              />
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForm(null)}
                >
                  取消
                </Button>
                <Button type="submit">确认{form.spec.label}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Sheet
        open={!!drawer}
        onOpenChange={(open) => {
          if (!open) setDrawer(null);
        }}
      >
        <SheetContent className="admin-sheet">
          <SheetHeader>
            <SheetTitle>
              {drawer === 'todos'
                ? '统一待办'
                : drawer === 'search'
                  ? '全局搜索'
                  : '帮助与数据说明'}
            </SheetTitle>
            <SheetDescription>
              {drawer === 'todos'
                ? '进入对应业务页面处理，状态与原记录同步。'
                : drawer === 'search'
                  ? '按名称或编号定位管理记录。'
                  : '管理范围、统计口径和辅助工具。'}
            </SheetDescription>
          </SheetHeader>
          <div className="sheet-body">
            {drawer === 'todos' ? (
              <div className="related-list">
                {todos(state).map((r) => (
                  <button key={r.id} onClick={() => go(r.page, r.id)}>
                    <div>
                      <strong>{r.name}</strong>
                      <small>
                        {pageName(r.page)} · {unitName(r.unit, state)}
                      </small>
                    </div>
                    <Badge>
                      {r.page === 'quotas'
                        ? r.fields.requestStatus === '待审批'
                          ? '增额待审批'
                          : quotaStatus(state, r)
                        : r.status}
                    </Badge>
                  </button>
                ))}
              </div>
            ) : drawer === 'search' ? (
              <>
                <Input
                  aria-label="搜索所有记录"
                  placeholder="输入名称、任务编号或单位…"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                />
                <div className="related-list">
                  {state.rows
                    .filter(
                      (r) =>
                        globalSearch &&
                        [r.name, r.id, unitName(r.unit, state)].some((v) =>
                          v.includes(globalSearch),
                        ),
                    )
                    .slice(0, 30)
                    .map((r) => (
                      <button key={r.id} onClick={() => go(r.page, r.id)}>
                        <div>
                          <strong>{r.name}</strong>
                          <small>
                            {pageName(r.page)} · {r.id}
                          </small>
                        </div>
                        <ChevronRight size={14} />
                      </button>
                    ))}
                </div>
              </>
            ) : (
              <>
                <Panel title="管理范围">
                  <p>
                    市AIP中台统一管理后台。单位子账号提交申请，中台完成审核、评测和管理。单位管理员端另行建设。
                  </p>
                </Panel>
                <Panel title="数据说明">
                  <p>
                    当前为本地原型，使用合成管理记录、预置评测结果与执行回执，未连接真实用户、模型服务或沙箱。统计日期为2026年9月8日。预置1440条历史任务，每10秒新增16至36条任务并逐条推进授权校验、执行和回执；此规模为交互验证设置，不代表实际业务量或平台容量。隐藏页面或暂停更新时停止流入。
                  </p>
                  <p>
                    刷新或重新打开将恢复初始状态；页面切换保留本轮操作。任务正文、个人文件与私有记忆不进入后台。
                  </p>
                </Panel>
                <Panel title="统计口径">
                  <p>
                    席位申请、已批准、已开通与实际使用分别核对。调用次数包含实际发起的模型请求与工具调用；执行前阻断单独计为安全操作。成功率按成功调用／已结束非安全中止调用计算，平均响应时间仅统计成功调用。
                  </p>
                  <p>
                    Token总量＝已计量输入＋输出，缓存输入不重复相加。风险等级结合数据、授权与动作判定。安全控制按操作去重，规则命中与告警分别统计；历史发生次数不会因告警关闭减少。
                  </p>
                </Panel>
                <Panel title="控制与隔离">
                  <p>
                    任务在独立沙箱内运行，工作成果保存在个人空间。异常、已隔离和已停止分别记录。
                  </p>
                  <p>
                    系统批准与当前可用分别核验；后续能力限制以成功执行回执为准。任务链路保留检查依据、规则版本和回执。
                  </p>
                </Panel>
                <Panel title="辅助验证">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={paused ? '继续更新' : '暂停更新'}
                    onClick={() => setPaused(!paused)}
                  >
                    {paused ? <Play size={14} /> : <Pause size={14} />}{' '}
                    {paused ? '继续更新' : '暂停更新'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setFailNext(!failNext)}
                  >
                    {failNext ? '取消下一次失败回执' : '下一次操作返回失败回执'}
                  </Button>
                  <p>用于验证失败、回执与重试；不会访问真实业务系统。</p>
                  <Button
                    variant="outline"
                    onClick={() => setResetConfirm(true)}
                  >
                    恢复初始状态
                  </Button>
                </Panel>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <Dialog open={resetConfirm} onOpenChange={setResetConfirm}>
        <DialogContent className="admin-dialog">
          <DialogHeader>
            <DialogTitle>恢复初始状态？</DialogTitle>
            <DialogDescription>
              清除本轮管理操作，返回初始总览。正在等待的执行回执将失效。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetConfirm(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                epoch.current++;
                save(createSafetyState());
                setOverviewFocus(null);
                setSavingsView(initialSavingsView());
                setPaused(false);
                setPage('overview');
                setSelection(undefined);
                setFilters({});
                setBackStack([]);
                setForm(null);
                setDrawer(null);
                setFailNext(false);
                setNotice(null);
                setResetConfirm(false);
                window.scrollTo({ top: 0 });
              }}
            >
              确认恢复
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
