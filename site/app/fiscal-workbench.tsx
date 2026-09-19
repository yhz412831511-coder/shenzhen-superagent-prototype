'use client';
import { TaskWorkspace } from './task-workspace';
import { currentUser } from './current-user';
import { useState, useEffect, useRef, type ComponentType } from 'react';
import {
  Sun,
  FileText,
  ArrowLeft,
  MoonStar,
  Bot,
  BrainCircuit,
  Check,
  ChevronRight,
  Folder,
  FolderPlus,
  LibraryBig,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Settings,
  ShieldCheck,
  SquarePen,
  Workflow,
  X,
  Pause,
  Play,
  ArrowRight,
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileSpreadsheet,
  Grid2X2,
  Presentation,
} from 'lucide-react';
import { useWorkspace } from './workspace-store';
import { useAppearance } from './appearance';
import {
  TaskComposer,
  type TaskCollaborationMode,
  type TaskCommandMode,
  type TaskPermissionMode,
} from './task-composer';
import { MemoryPage } from './memory-page';
import { SettingsPage } from './settings-page';
import { current, eligible, type SavedContext } from './memory-domain';
import {
  cloneRoutingConfig,
  defaultRoutingConfig,
  type ModelMode,
  type RoutingConfig,
} from './model-routing';
import {
  Automations,
  Btn,
  CatalogPage,
  Conversation,
  Library,
  Tag,
  type Target,
  type SystemViewState,
} from './fiscal-components';
import { conversationTurns } from './conversation-view';
import { BrainstormHeaderStatus } from './brainstorm-components';
import { ProfessionalIntelligencePage } from './professional-intelligence-page';
import { organizationCarrierIds } from './professional-intelligence-domain';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import './global-framework.css';
type Page =
  | 'home'
  | 'task'
  | 'memory'
  | 'capabilities'
  | 'automations'
  | 'knowledge';
type CapabilityTab = '智能体' | '技能' | '插件' | '连接器';
type Ui = {
  workspaceOpen?: boolean;
  tabs: Target[];
  active?: Target;
  model: ModelMode;
  routing: RoutingConfig;
  systemViews?: Record<string, SystemViewState>;
};
const nav: {
  id: Page;
  title: string;
  icon: ComponentType<{ size?: number }>;
}[] = [
  { id: 'home', title: '新对话', icon: SquarePen },
  { id: 'capabilities', title: '能力扩展', icon: Bot },
  { id: 'automations', title: '自动化', icon: Workflow },
  { id: 'knowledge', title: '我的知识', icon: LibraryBig },
];
export function FiscalWorkbench() {
  const { state, dispatch } = useWorkspace();
  const { value: appearance, update: updateAppearance } = useAppearance();
  const settingsReturnFocus = useRef<HTMLElement | null>(null);
  const settingsClose = useRef<HTMLButtonElement | null>(null);
  const projectSearchRef = useRef<HTMLInputElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  useEffect(() => {
    if (!settingsOpen) return;
    settingsReturnFocus.current = document.activeElement as HTMLElement;
    settingsClose.current?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('keydown', close);
      settingsReturnFocus.current?.focus();
    };
  }, [settingsOpen]);
  const [page, setPage] = useState<Page>('home'),
    [activeId, setActiveId] = useState(''),
    [selectedMemory, setSelectedMemory] = useState<string>(),
    [sidebar, setSidebar] = useState(true),
    [mobileNav, setMobileNav] = useState(false),
    [monitor, setMonitor] = useState(false),
    [search, setSearch] = useState(false),
    [q, setQ] = useState(''),
    [folder, setFolder] = useState(''),
    [folderEditor, setFolderEditor] = useState(false),
    [folderName, setFolderName] = useState('');
  const [sceneReplacement, setSceneReplacement] = useState<{
    current: SavedContext;
    next: SavedContext;
  }>();
  const [capabilityTab, setCapabilityTab] = useState<CapabilityTab>('智能体');
  const [ownedOnly, setOwnedOnly] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<string[]>(
    state.folders,
  );
  const projectFor = (id: string) =>
    state.folderTasks[id] || state.flows[id]?.folder || '';
  const ungroupedTasks = state.memory.tasks.filter((t) => !projectFor(t.id));
  const [draft, setDraft] = useState(''),
    [contexts, setContexts] = useState<SavedContext[]>([]),
    [commandMode, setCommandMode] = useState<TaskCommandMode>('standard'),
    [collaborationMode, setCollaborationMode] =
      useState<TaskCollaborationMode>('standard'),
    [permissionMode, setPermissionMode] =
      useState<TaskPermissionMode>('standard');
  const [defaultModel, setDefaultModel] = useState<ModelMode>({
      type: 'smart',
    }),
    [defaultRouting, setDefaultRouting] = useState(
      cloneRoutingConfig(defaultRoutingConfig),
    ),
    [taskUi, setTaskUi] = useState<Record<string, Ui>>({});
  const task = state.memory.tasks.find((t) => t.id === activeId),
    flow = state.flows[activeId],
    brainstormFlow = state.brainstorm.flows[activeId],
    ui = taskUi[activeId] || {
      tabs: [],
      model: defaultModel,
      routing: defaultRouting,
    };
  const updateUi = (changes: Partial<Ui>) =>
    setTaskUi((old) => ({ ...old, [activeId]: { ...ui, ...changes } }));
  const openTask = (id: string) => {
    setMonitor(taskUi[id]?.workspaceOpen || false);
    const project = projectFor(id);
    if (project) setProjectsOpen(true);
    if (project)
      setExpandedProjects((old) =>
        old.includes(project) ? old : [...old, project],
      );
    setSettingsOpen(false);
    setMobileNav(false);
    setActiveId(id);
    setPage('task');
    setFolder('');
    setSearch(false);
  };
  const openMemory = (id: string) => {
    setSelectedMemory(id);
    setPage('memory');
  };
  const openTarget = (t: Target, id = activeId) => {
    setActiveId(id);
    setPage('task');
    setMonitor(true);
    setTaskUi((old) => {
      const u = old[id] || {
        tabs: [],
        model: defaultModel,
        routing: defaultRouting,
      };
      return {
        ...old,
        [id]: {
          ...u,
          workspaceOpen: true,
          tabs: u.tabs.some((x) => x.id === t.id && x.kind === t.kind)
            ? u.tabs
            : [...u.tabs, t],
          active: t,
        },
      };
    });
  };
  const commitContext = (ctx: SavedContext) => {
    if (page === 'task' && task)
      dispatch({
        type: 'memory',
        action: {
          type: 'task-settings',
          taskId: task.id,
          settings: {
            contexts: [
              ...(task.contexts || []).filter(
                (c) =>
                  c.id !== ctx.id &&
                  !(
                    ctx.kind === '场景工作智能体' && c.kind === '场景工作智能体'
                  ),
              ),
              ctx,
            ],
          },
        },
      });
    else {
      setContexts((old) => [
        ...old.filter(
          (x) =>
            x.id !== ctx.id &&
            !(ctx.kind === '场景工作智能体' && x.kind === '场景工作智能体'),
        ),
        ctx,
      ]);
      setPage('home');
    }
  };
  const addContext = (ctx: SavedContext) => {
    const available = page === 'task' && task ? task.contexts || [] : contexts;
    const currentScene = available.find(
      (item) => item.kind === '场景工作智能体' && item.id !== ctx.id,
    );
    if (ctx.kind === '场景工作智能体' && currentScene) {
      setSceneReplacement({ current: currentScene, next: ctx });
      return;
    }
    commitContext(ctx);
  };
  const addCatalogToTask = (id: string) => {
    const c = state.catalog.find((c) => c.id === id);
    if (c)
      addContext({
        id: c.id,
        kind: organizationCarrierIds.has(c.id)
          ? '组织智能载体'
          : c.kind === '场景工作智能体'
            ? '场景工作智能体'
            : (c.kind as SavedContext['kind']),
        label: c.name,
      });
  };
  const prepareCapability = (id: string, text = '') => {
    const entry = state.catalog.find((item) => item.id === id);
    if (!entry?.owned || !entry.enabled) return;
    setFolder('');
    setDraft(text);
    setContexts([
      {
        id: entry.id,
        label: entry.name,
        kind: organizationCarrierIds.has(entry.id)
          ? '组织智能载体'
          : (entry.kind as SavedContext['kind']),
      },
    ]);
    setActiveId('');
    setCollaborationMode('standard');
    setPage('home');
  };
  const consult = (id: string, text: string) => {
    const taskId = 'consult-' + (state.memory.counter + 1);
    dispatch({
      type: 'new-task',
      id: taskId,
      text,
      agentId: id,
      sceneAgentId: organizationCarrierIds.has(id) ? undefined : id,
      roleAgentIds: organizationCarrierIds.has(id) ? [id] : [],
    });
    openTask(taskId);
  };
  const activeContexts =
    page === 'task' && task ? task.contexts || [] : contexts;
  const send = () => {
    const value = page === 'task' && task ? task.draftText || '' : draft;
    if (!value.trim()) return;
    if (page === 'task' && task) {
      dispatch({ type: 'say', taskId: task.id, text: value });
      if (state.flows[task.id]?.stopped) return;
      dispatch({
        type: 'memory',
        action: {
          type: 'task-settings',
          taskId: task.id,
          settings: { draftText: '' },
        },
      });
    } else {
      const id = 'task-' + (state.memory.counter + 1);
      const refs = contexts.flatMap((x) => (x.memoryRef ? [x.memoryRef] : []));
      const sceneAgentId = contexts.find(
        (x) => x.kind === '场景工作智能体',
      )?.id;
      const roleAgentIds = contexts
        .filter((x) => x.kind === '组织智能载体')
        .map((x) => x.id);
      const agentId =
        sceneAgentId ||
        roleAgentIds[0] ||
        contexts.find((x) => x.kind === '专业智能体')?.id;
      dispatch({
        type: 'new-task',
        id,
        text: value,
        agentId: collaborationMode === 'brainstorm' ? undefined : agentId,
        sceneAgentId:
          collaborationMode === 'brainstorm' ? undefined : sceneAgentId,
        roleAgentIds:
          collaborationMode === 'brainstorm' ? undefined : roleAgentIds,
        refs,
        settings: contexts,
        permissionMode,
        commandMode,
        collaborationMode,
      });
      if (folder) dispatch({ type: 'folder', name: folder, taskId: id });
      dispatch({
        type: 'memory',
        action: {
          type: 'task-settings',
          taskId: id,
          settings: { commandMode, permissionMode, collaborationMode },
        },
      });
      setTaskUi((old) => ({
        ...old,
        [id]: { tabs: [], model: defaultModel, routing: defaultRouting },
      }));
      setDraft('');
      setContexts([]);
      setCollaborationMode('standard');
      openTask(id);
    }
  };
  const composer = (large = false) => (
    <TaskComposer
      variant={large ? 'large' : 'compact'}
      value={page === 'task' && task ? task.draftText || '' : draft}
      onChange={(text) =>
        page === 'task' && task
          ? dispatch({
              type: 'memory',
              action: {
                type: 'task-settings',
                taskId: task.id,
                settings: { draftText: text },
              },
            })
          : setDraft(text)
      }
      onSubmit={send}
      contexts={activeContexts}
      onAddContext={addContext}
      onRemoveContext={(id) =>
        page === 'task' && task
          ? dispatch({
              type: 'memory',
              action: {
                type: 'task-settings',
                taskId: task.id,
                settings: {
                  contexts: activeContexts.filter((x) => x.id !== id),
                },
              },
            })
          : setContexts((old) => old.filter((x) => x.id !== id))
      }
      commandMode={
        page === 'task' ? task?.commandMode || 'standard' : commandMode
      }
      onCommandModeChange={(mode) =>
        page === 'task' && task
          ? dispatch({
              type: 'memory',
              action: {
                type: 'task-settings',
                taskId: task.id,
                settings: { commandMode: mode },
              },
            })
          : setCommandMode(mode)
      }
      permissionMode={
        page === 'task' ? task?.permissionMode || 'standard' : permissionMode
      }
      onPermissionModeChange={(mode) =>
        page === 'task' && task
          ? dispatch({
              type: 'memory',
              action: {
                type: 'task-settings',
                taskId: task.id,
                settings: { permissionMode: mode },
              },
            })
          : setPermissionMode(mode)
      }
      collaborationMode={
        page === 'task'
          ? task?.collaborationMode || 'standard'
          : collaborationMode
      }
      onCollaborationModeChange={(mode) =>
        page === 'task' && task
          ? dispatch({
              type: 'memory',
              action: {
                type: 'task-settings',
                taskId: task.id,
                settings: { collaborationMode: mode },
              },
            })
          : setCollaborationMode(mode)
      }
      lockedCollaborationMode={page === 'task'}
      modelMode={page === 'task' ? ui.model : defaultModel}
      onModelModeChange={(mode) =>
        page === 'task' ? updateUi({ model: mode }) : setDefaultModel(mode)
      }
      routing={page === 'task' ? ui.routing : defaultRouting}
      onRoutingChange={(routing) =>
        page === 'task' ? updateUi({ routing }) : setDefaultRouting(routing)
      }
      placeholder={
        brainstormFlow
          ? '补充材料、口径或工作版本要求…'
          : flow?.stage === 'findings'
            ? '告诉我支付用途应该怎样核对…'
            : flow?.stage === 'manual'
              ? '完成手动提交后，在这里告诉我…'
              : '描述需要处理的工作，或补充材料与要求…'
      }
      onBrowserCommand={() => {
        if (flow) {
          const system = flow.kind === 'payment' ? 'payment' : 'pm';
          openTarget({ kind: 'system', id: system });
        } else
          dispatch({
            type: 'notice',
            text: '请从当前任务关联的系统或成果打开任务浏览器。',
          });
      }}
    />
  );
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearch((v) => !v);
      }
      if (e.key === 'Escape') {
        setSearch(false);
        setFolderEditor(false);
        setMobileNav(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const homeResults = [
    '运维服务费用估算明细',
    '财政支付审查汇总',
    '驳回意见',
  ].flatMap((name) =>
    Object.values(state.artifacts)
      .filter((artifact) => artifact.name === name)
      .slice(-1),
  );
  const title =
    page === 'task'
      ? task?.title || '任务不可用'
      : page === 'home'
        ? '新对话'
        : nav.find((n) => n.id === page)?.title || '工作台';

  const notification = state.notice || state.memory.notice;
  return (
    <div
      className={`fw-app fw-page-${page} ${sidebar ? '' : 'sidebar-closed'} ${mobileNav ? 'mobile-nav-open' : ''}`}
    >
      {mobileNav && sidebar && (
        <button
          className="fw-nav-scrim"
          aria-label="关闭导航遮罩"
          onClick={() => setMobileNav(false)}
        />
      )}
      {sidebar && (
        <aside className="fw-sidebar">
          <div className="fw-brand">
            <span className="fw-brand-mark">
              <ShieldCheck size={23} />
            </span>
            <div>
              <strong>深圳政务超级智能体</strong>
              <small>个人工作空间</small>
            </div>
            <button
              className="fw-icon"
              aria-label="收起导航"
              onClick={() => setSidebar(false)}
            >
              <PanelLeftClose size={17} />
            </button>
          </div>
          <div className="fw-nav-scroll">
            <button className="fw-nav-search" onClick={() => setSearch(true)}>
              <Search size={16} />
              <span>搜索任务与资料</span>
              <kbd>⌘ K</kbd>
            </button>
            <nav aria-label="功能页入口">
              {nav.map((n) => (
                <button
                  key={n.id}
                  className={page === n.id ? 'active' : ''}
                  onClick={() => {
                    setSettingsOpen(false);
                    setMobileNav(false);
                    setPage(n.id);
                    setFolder('');
                    if (n.id === 'home') {
                      setActiveId('');
                      setDraft('');
                      setContexts([]);
                    }
                    if (n.id === 'capabilities') {
                      setCapabilityTab('智能体');
                      setOwnedOnly(false);
                    }
                  }}
                >
                  <n.icon size={18} />
                  <span>{n.title}</span>
                </button>
              ))}
            </nav>
            <div className="fw-nav-heading fw-history-heading">
              <button
                className="fw-projects-heading"
                aria-expanded={projectsOpen}
                aria-controls="fw-project-list"
                onClick={() => setProjectsOpen(!projectsOpen)}
              >
                <ChevronRight size={14} />
                <span>项目</span>
              </button>
            </div>
            <div id="fw-project-list" hidden={!projectsOpen}>
              {state.folders.map((name) => {
                const children = state.memory.tasks.filter(
                  (t) => projectFor(t.id) === name,
                );
                const expanded = expandedProjects.includes(name);
                const active =
                  folder === name ||
                  (page === 'task' && projectFor(activeId) === name);
                return (
                  <div className="fw-project-group" key={name}>
                    <div className={`fw-project-row ${active ? 'active' : ''}`}>
                      <button
                        className="fw-icon fw-project-toggle"
                        aria-label={`${expanded ? '收起' : '展开'}项目${name}`}
                        aria-expanded={expanded}
                        onClick={() =>
                          setExpandedProjects((old) =>
                            expanded
                              ? old.filter((x) => x !== name)
                              : [...old, name],
                          )
                        }
                      >
                        <ChevronRight size={14} />
                      </button>
                      <button
                        className="fw-folder"
                        title={name}
                        onClick={() => {
                          setSettingsOpen(false);
                          setMobileNav(false);
                          setFolder(name);
                          setPage('home');
                        }}
                      >
                        <Folder size={15} />
                        <span>{name}</span>
                      </button>
                    </div>
                    {expanded && children.length > 0 && (
                      <section
                        className="fw-task-list fw-project-tasks"
                        aria-label={`${name}项目对话`}
                      >
                        {children.map((t) => (
                          <button
                            key={t.id}
                            className={
                              page === 'task' && t.id === activeId
                                ? 'active'
                                : ''
                            }
                            title={t.title}
                            onClick={() => openTask(t.id)}
                          >
                            <span className="fw-task-dot" />
                            <span>
                              {state.flows[t.id]?.kind === 'payment'
                                ? t.title.replace(/^财政支付审查 · /, '')
                                : t.title}
                            </span>
                          </button>
                        ))}
                      </section>
                    )}
                  </div>
                );
              })}
            </div>
            {ungroupedTasks.length > 0 && (
              <>
                <div className="fw-nav-heading">
                  <span>最近对话</span>
                </div>
                <div className="fw-task-list" aria-label="最近对话">
                  {ungroupedTasks.map((t) => (
                    <button
                      key={t.id}
                      className={
                        page === 'task' && t.id === activeId ? 'active' : ''
                      }
                      title={t.title}
                      onClick={() => openTask(t.id)}
                    >
                      <span className="fw-task-dot" />
                      <span>{t.title}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <footer>
            <button
              className="fw-account-button"
              aria-label="打开账户与设置"
              title="账户与设置"
              onClick={() => {
                setMobileNav(false);
                setSettingsOpen(true);
              }}
            >
              <span className="fw-avatar">{currentUser.name.slice(0, 1)}</span>
              <span className="fw-account-info">
                <span className="fw-account-name">
                  <strong>{currentUser.name}</strong>
                  <small>{currentUser.role}</small>
                </span>
                <small
                  className="fw-account-role"
                  title={`${currentUser.organization} · ${currentUser.department}`}
                >
                  {currentUser.organization} · {currentUser.department}
                </small>
              </span>
              <Settings size={16} />
            </button>
          </footer>
        </aside>
      )}
      <div className="fw-main">
        <div
          className="fw-view"
          inert={settingsOpen}
          aria-hidden={settingsOpen || undefined}
        >
          <header className="fw-topbar">
            <button
              className="fw-icon fw-mobile-nav"
              aria-label="切换导航"
              onClick={() => {
                setSidebar(true);
                setMobileNav(!mobileNav);
              }}
            >
              <PanelLeftOpen size={18} />
            </button>
            {!sidebar && (
              <button
                className="fw-icon"
                aria-label="展开导航"
                onClick={() => setSidebar(true)}
              >
                <PanelLeftOpen size={18} />
              </button>
            )}
            <span className="fw-top-title">
              {title}
              {page === 'task' && (
                <small className="fw-assistant-context">超级智能体</small>
              )}
            </span>
            <button
              className="fw-icon fw-theme-toggle"
              aria-label={
                appearance.theme === 'light' ? '切换深色主题' : '切换浅色主题'
              }
              title={
                appearance.theme === 'light' ? '切换深色主题' : '切换浅色主题'
              }
              onClick={() =>
                updateAppearance({
                  theme: appearance.theme === 'light' ? 'dark' : 'light',
                })
              }
            >
              {appearance.theme === 'light' ? (
                <MoonStar size={17} />
              ) : (
                <Sun size={17} />
              )}
            </button>
            {page === 'task' && flow && (
              <>
                {!flow.historical && flow.stage !== 'complete' && (
                  <Tag>{flow.status}</Tag>
                )}
                <button
                  className="fw-top-action"
                  onClick={() => {
                    const attention = flow.operations.findLast(
                      (op) =>
                        op.risk === '高' ||
                        op.status !== '成功' ||
                        (op.risk !== '无' &&
                          (!op.checks.length ||
                            op.checks.some((check) => !check.passed))),
                    );
                    const latestGroup = task
                      ? conversationTurns(task, flow.operations)
                          .flatMap((turn) =>
                            turn.segments.flatMap((segment) =>
                              segment.kind === 'operation-group'
                                ? [segment.group]
                                : [],
                            ),
                          )
                          .at(-1)
                      : undefined;
                    if (attention)
                      openTarget({ kind: 'operation', id: attention.id });
                    else if (latestGroup)
                      openTarget({
                        kind: 'operation-group',
                        id: latestGroup.id,
                      });
                    else
                      dispatch({
                        type: 'notice',
                        text: '尚未发起系统操作。风险提示和鉴权结果会随操作记录。',
                      });
                  }}
                >
                  <ShieldCheck size={16} />
                  安全与授权
                </button>
                {!flow.historical && (
                  <button
                    className="fw-icon"
                    aria-label={flow.stopped ? '恢复任务' : '暂停任务'}
                    onClick={() =>
                      dispatch({
                        type: 'stop',
                        taskId: task!.id,
                        stopped: !flow.stopped,
                      })
                    }
                  >
                    {flow.stopped ? <Play size={16} /> : <Pause size={16} />}
                  </button>
                )}
              </>
            )}
            {page === 'task' && brainstormFlow && (
              <>
                <BrainstormHeaderStatus flow={brainstormFlow} />
                {brainstormFlow.phaseStatus !== 'completed' ? (
                  <button
                    className="fw-icon"
                    aria-label={
                      brainstormFlow.stopped ? '恢复任务' : '暂停任务'
                    }
                    onClick={() =>
                      dispatch({
                        type: 'stop',
                        taskId: task!.id,
                        stopped: !brainstormFlow.stopped,
                      })
                    }
                  >
                    {brainstormFlow.stopped ? (
                      <Play size={16} />
                    ) : (
                      <Pause size={16} />
                    )}
                  </button>
                ) : null}
              </>
            )}
            {page === 'task' && (
              <button
                className="fw-icon"
                aria-label={monitor ? '收起工作区' : '打开工作区'}
                onClick={() => {
                  setMonitor(!monitor);
                  updateUi({ workspaceOpen: !monitor });
                }}
              >
                {monitor ? (
                  <PanelRightClose size={18} />
                ) : (
                  <PanelRightOpen size={18} />
                )}
              </button>
            )}
          </header>
          {page === 'task' && task ? (
            <>
              <div className="fw-task-body">
                <section className="fw-task-center">
                  <Conversation
                    key={task.id}
                    task={task}
                    onOpen={openTarget}
                    onMemory={openMemory}
                  />
                  <div className="fw-composer-area">{composer()}</div>
                </section>
                <TaskWorkspace
                  key={task.id}
                  taskId={task.id}
                  request={ui.active}
                  visible={monitor}
                  onClose={() => {
                    setMonitor(false);
                    updateUi({ workspaceOpen: false });
                  }}
                  onMemory={openMemory}
                  onConsult={consult}
                  onUse={addCatalogToTask}
                />
              </div>
            </>
          ) : null}
          {page === 'task' && !task && (
            <div className="fw-empty">
              <h2>该预置任务已移除或当前不可用</h2>
              <Btn onClick={() => setPage('home')}>返回首页</Btn>
            </div>
          )}
          {page === 'home' && (
            <div className="fw-home">
              <div className="fw-home-inner">
                <header className="fw-home-intro">
                  <p className="fw-home-kicker">你好，{currentUser.name}</p>
                  <h1>今天有什么工作需要处理？</h1>
                </header>
                <div className="fw-new-conversation-project">
                  <DropdownMenu
                    onOpenChange={(open) => {
                      if (open) {
                        window.requestAnimationFrame(() =>
                          projectSearchRef.current?.focus(),
                        );
                      } else {
                        setProjectSearch('');
                      }
                    }}
                  >
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          className="fw-project-context-trigger"
                          aria-label={`选择所属项目，当前${folder || '不在项目中工作'}`}
                        />
                      }
                    >
                      <Folder size={15} aria-hidden="true" />
                      <span>{folder || '不在项目中工作'}</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      side="top"
                      sideOffset={8}
                      className="fw-project-menu"
                    >
                      <search className="fw-project-search">
                        <Search size={15} aria-hidden="true" />
                        <input
                          ref={projectSearchRef}
                          value={projectSearch}
                          onChange={(event) =>
                            setProjectSearch(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key !== 'Escape') event.stopPropagation();
                          }}
                          placeholder="搜索项目"
                          aria-label="搜索项目"
                        />
                      </search>
                      <DropdownMenuSeparator />
                      <div className="fw-project-menu-list">
                        {state.folders
                          .filter((name) =>
                            name
                              .toLowerCase()
                              .includes(projectSearch.trim().toLowerCase()),
                          )
                          .map((name) => (
                            <DropdownMenuItem
                              key={name}
                              onClick={() => setFolder(name)}
                              className="fw-project-menu-item"
                            >
                              <Folder size={16} />
                              <span>{name}</span>
                              {folder === name ? (
                                <Check
                                  className="fw-project-menu-check"
                                  size={16}
                                />
                              ) : null}
                            </DropdownMenuItem>
                          ))}
                        {state.folders.every(
                          (name) =>
                            !name
                              .toLowerCase()
                              .includes(projectSearch.trim().toLowerCase()),
                        ) ? (
                          <p className="fw-project-menu-empty">没有匹配项目</p>
                        ) : null}
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setFolderEditor(true)}
                        className="fw-project-menu-item"
                      >
                        <FolderPlus size={16} />
                        <span>新建项目</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setFolder('')}
                        className="fw-project-menu-item"
                      >
                        <X size={16} />
                        <span>不在项目中工作</span>
                        {!folder ? (
                          <Check className="fw-project-menu-check" size={16} />
                        ) : null}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {composer(true)}
                <nav className="fw-home-shortcuts" aria-label="常用工作入口">
                  {[
                    { label: '办文', icon: FileText, tone: 'blue' },
                    { label: '办会', icon: CalendarDays, tone: 'green' },
                    { label: '办事', icon: ClipboardCheck, tone: 'orange' },
                    { label: '分析', icon: BarChart3, tone: 'purple' },
                    { label: '更多', icon: Grid2X2, tone: 'neutral' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.label}
                      className="fw-home-shortcut"
                      data-tone={item.tone}
                    >
                      <item.icon size={18} aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
                <section className="fw-home-section fw-home-continuations">
                  <div className="fw-home-section-header">
                    <h2>继续上次工作</h2>
                  </div>
                  <div className="fw-home-continuation-grid">
                    {[
                      {
                        taskId: 'maintenance-history',
                        title: '财政资金穿透式监管系统运维项目申报',
                        summary: '已完成申报并开启审核反馈追踪',
                        status: '等待平台反馈',
                        source: '项管平台 · 运维申报',
                        icon: Workflow,
                        tone: 'blue',
                      },
                      {
                        taskId: 'payment-history',
                        title: '财政支付审查 · 2026-09-03',
                        summary: '两笔审查意见已写入智慧财政草稿箱',
                        status: '待手动提交',
                        source: '智慧财政 · 自动化任务',
                        icon: FileCheck2,
                        tone: 'green',
                      },
                      {
                        title: '党组会准备工作',
                        summary: '议题材料已汇集，待核对上会顺序与汇报口径',
                        status: '材料核对',
                        source: 'OA · 会议筹备',
                        icon: Presentation,
                        tone: 'orange',
                      },
                    ].map((item) => (
                      <button
                        type="button"
                        className="fw-home-continuation"
                        data-tone={item.tone}
                        key={item.title}
                        onClick={
                          item.taskId ? () => openTask(item.taskId) : undefined
                        }
                      >
                        <span className="fw-home-continuation-top">
                          <span className="fw-home-continuation-icon">
                            <item.icon size={18} aria-hidden="true" />
                          </span>
                          <span className="fw-home-status">{item.status}</span>
                        </span>
                        <strong>{item.title}</strong>
                        <span className="fw-home-continuation-summary">
                          {item.summary}
                        </span>
                        <span className="fw-home-continuation-footer">
                          <span>{item.source}</span>
                          <ArrowRight size={14} aria-hidden="true" />
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
                <section className="fw-home-section fw-home-results">
                  <div className="fw-home-section-header">
                    <h2>最近成果</h2>
                    <span className="fw-meta">
                      已形成 {homeResults.length} 项
                    </span>
                  </div>
                  <div className="fw-home-results-list">
                    {homeResults.map((artifact, index) => {
                      const ResultIcon =
                        index === 0
                          ? FileSpreadsheet
                          : index === 1
                            ? FileText
                            : FileCheck2;
                      return (
                        <button
                          type="button"
                          className="fw-home-result"
                          data-tone={['green', 'blue', 'orange'][index]}
                          key={artifact.id}
                          onClick={() =>
                            openTarget(
                              { kind: 'artifact', id: artifact.id },
                              artifact.taskId,
                            )
                          }
                        >
                          <span className="fw-home-result-icon">
                            <ResultIcon size={18} aria-hidden="true" />
                          </span>
                          <span className="fw-home-result-copy">
                            <strong>{artifact.name}</strong>
                            <small>
                              v{artifact.version} · {artifact.source}
                            </small>
                          </span>
                          <span className="fw-home-result-time">
                            <Clock3 size={13} aria-hidden="true" />
                            {new Intl.DateTimeFormat('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                            }).format(new Date(artifact.createdAt))}
                          </span>
                          <ChevronRight size={15} aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>
          )}
          {page === 'memory' && (
            <div className="fw-legacy-page">
              <MemoryPage
                onUse={addContext}
                onOpenTask={openTask}
                selectedId={selectedMemory}
                onSelect={setSelectedMemory}
                onReminders={() => setPage('automations')}
                onBack={() => setSelectedMemory(undefined)}
              />
            </div>
          )}
          {page === 'knowledge' && (
            <Library onOpenTask={openTask} onUse={addContext} />
          )}
          {page === 'capabilities' && (
            <section className="fw-capabilities" aria-label="能力扩展">
              <header className="fw-capability-header">
                <h1>能力扩展</h1>
                <nav className="fw-framework-tabs" aria-label="能力类型">
                  {(['智能体', '技能', '插件', '连接器'] as const).map(
                    (tab) => (
                      <button
                        key={tab}
                        aria-current={
                          capabilityTab === tab ? 'page' : undefined
                        }
                        onClick={() => {
                          setCapabilityTab(tab);
                          setOwnedOnly(false);
                        }}
                      >
                        {tab}
                      </button>
                    ),
                  )}
                </nav>
                <fieldset className="fw-capability-scope">
                  <legend className="fw-visually-hidden">能力获取范围</legend>
                  <button
                    aria-pressed={!ownedOnly}
                    onClick={() => setOwnedOnly(false)}
                  >
                    全部
                  </button>
                  <button
                    aria-pressed={ownedOnly}
                    onClick={() => setOwnedOnly(true)}
                  >
                    已获取
                  </button>
                </fieldset>
              </header>
              {capabilityTab === '智能体' ? (
                <ProfessionalIntelligencePage
                  ownedOnly={ownedOnly}
                  onConsult={prepareCapability}
                  onUse={prepareCapability}
                />
              ) : (
                <CatalogPage
                  key={capabilityTab}
                  kind={capabilityTab === '技能' ? 'Skill' : capabilityTab}
                  ownedOnly={ownedOnly}
                  standaloneKind
                  onConsult={prepareCapability}
                  onMemory={openMemory}
                  onUse={prepareCapability}
                />
              )}
            </section>
          )}
          {page === 'automations' && <Automations onTask={openTask} />}
        </div>
        {settingsOpen && (
          <section className="fw-settings-overlay" aria-label="个人设置">
            <header className="fw-settings-header">
              <Btn onClick={() => setSettingsOpen(false)}>
                <ArrowLeft size={16} />
                返回原界面
              </Btn>
              <strong>设置</strong>
              <button
                ref={settingsClose}
                className="fw-icon"
                aria-label="关闭设置"
                onClick={() => setSettingsOpen(false)}
              >
                <X size={18} />
              </button>
            </header>
            <div className="fw-legacy-page">
              <SettingsPage
                onOpenConnections={() => {
                  setSettingsOpen(false);
                  setCapabilityTab('连接器');
                  setOwnedOnly(false);
                  setPage('capabilities');
                }}
                onResetDemo={() => window.location.reload()}
                defaultModelMode={defaultModel}
                onDefaultModelModeChange={setDefaultModel}
                defaultRouting={defaultRouting}
                onDefaultRoutingChange={setDefaultRouting}
              />
            </div>
          </section>
        )}
      </div>
      {notification && (
        <output className="fw-toast">
          <span>{notification}</span>
          <button
            className="fw-icon"
            aria-label="关闭提示"
            onClick={() => {
              dispatch({ type: 'notice', text: '' });
              dispatch({
                type: 'memory',
                action: { type: 'notice', text: '' },
              });
            }}
          >
            <X size={15} />
          </button>
        </output>
      )}
      {folderEditor && (
        <div className="fw-modal-backdrop">
          <dialog
            open
            className="fw-modal"
            aria-modal="true"
            aria-label="新建项目"
          >
            <h2>新建项目</h2>
            <label>
              项目名称
              <input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
              />
            </label>
            {task && <p>当前任务“{task.title}”将归入此文件夹。</p>}
            <div className="fw-actions">
              <Btn onClick={() => setFolderEditor(false)}>取消</Btn>
              <Btn
                primary
                disabled={!folderName.trim()}
                onClick={() => {
                  dispatch({
                    type: 'folder',
                    name: folderName,
                    taskId: page === 'task' ? activeId : undefined,
                  });
                  setFolderEditor(false);
                  setFolderName('');
                }}
              >
                创建
              </Btn>
            </div>
          </dialog>
        </div>
      )}
      {sceneReplacement && (
        <div className="pi-dialog-backdrop">
          <dialog
            open
            className="pi-dialog pi-replace-dialog"
            aria-labelledby="pi-replace-title"
          >
            <header>
              <div>
                <span>更换主场景</span>
                <h2 id="pi-replace-title">确认替换场景工作智能体</h2>
              </div>
              <button
                type="button"
                aria-label="关闭替换确认"
                onClick={() => setSceneReplacement(undefined)}
              >
                <X size={17} />
              </button>
            </header>
            <div className="pi-replace-copy">
              <p>当前任务已选择“{sceneReplacement.current.label}”。</p>
              <p>
                替换为“{sceneReplacement.next.label}
                ”后，组织智能载体和其他任务上下文保持不变。
              </p>
            </div>
            <footer>
              <button
                type="button"
                onClick={() => setSceneReplacement(undefined)}
              >
                取消
              </button>
              <button
                className="pi-primary"
                type="button"
                onClick={() => {
                  commitContext(sceneReplacement.next);
                  setSceneReplacement(undefined);
                }}
              >
                确认替换
              </button>
            </footer>
          </dialog>
        </div>
      )}
      {search && (
        <div className="fw-modal-backdrop">
          <dialog
            open
            className="fw-modal wide"
            aria-modal="true"
            aria-label="全局搜索"
          >
            <div className="fw-row">
              <label className="fw-search">
                <Search size={18} />
                <input
                  autoFocus
                  placeholder="搜索任务、资料、记忆和能力"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </label>
              <button
                className="fw-icon"
                aria-label="关闭搜索"
                onClick={() => setSearch(false)}
              >
                <X size={18} />
              </button>
            </div>
            <h3>任务</h3>
            {state.memory.tasks
              .filter((t) => t.title.includes(q))
              .map((t) => (
                <button
                  className="fw-detail-link"
                  key={t.id}
                  onClick={() => openTask(t.id)}
                >
                  <FileText size={16} />
                  {t.title}
                </button>
              ))}
            <h3>资料与成果</h3>
            {Object.values(state.artifacts)
              .filter((a) => a.name.includes(q))
              .map((a) => (
                <button
                  className="fw-detail-link"
                  key={a.id}
                  onClick={() => {
                    openTarget({ kind: 'artifact', id: a.id }, a.taskId);
                    setSearch(false);
                  }}
                >
                  {a.name} · v{a.version}
                </button>
              ))}
            <h3>记忆</h3>
            {state.memory.memories
              .filter(
                (m) =>
                  eligible(m, state.memory.now) && current(m).title.includes(q),
              )
              .map((m) => (
                <button
                  className="fw-detail-link"
                  key={m.id}
                  onClick={() => {
                    openMemory(m.id);
                    setSearch(false);
                  }}
                >
                  <BrainCircuit size={16} />
                  {current(m).title}
                </button>
              ))}
            <h3>可用能力</h3>
            {state.catalog
              .filter((c) => c.enabled && c.owned && c.name.includes(q))
              .map((c) => (
                <button
                  key={c.id}
                  className="fw-detail-link"
                  onClick={() => {
                    addCatalogToTask(c.id);
                    setSearch(false);
                  }}
                >
                  <Bot size={16} />
                  {c.name}
                  <small>{c.kind} · 加入任务</small>
                </button>
              ))}
          </dialog>
        </div>
      )}
    </div>
  );
}
