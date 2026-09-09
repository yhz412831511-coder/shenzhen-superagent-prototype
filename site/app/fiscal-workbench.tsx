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
  Zap,
  PlugZap,
  Pause,
  Play,
} from 'lucide-react';
import { useWorkspace } from './workspace-store';
import { useAppearance } from './appearance';
import {
  TaskComposer,
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
type Page =
  | 'home'
  | 'task'
  | 'memory'
  | 'agents'
  | 'skills'
  | 'extensions'
  | 'automations'
  | 'library';
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
  { id: 'home', title: '新任务', icon: SquarePen },
  { id: 'library', title: '资料库', icon: LibraryBig },
  { id: 'memory', title: 'AI 记忆', icon: BrainCircuit },
  { id: 'agents', title: '专业智能体', icon: Bot },
  { id: 'skills', title: 'Skills', icon: Zap },
  { id: 'extensions', title: '插件与连接器', icon: PlugZap },
  { id: 'automations', title: '自动化', icon: Workflow },
];
export function FiscalWorkbench() {
  const { state, dispatch } = useWorkspace();
  const { value: appearance, update: updateAppearance } = useAppearance();
  const settingsReturnFocus = useRef<HTMLElement | null>(null);
  const settingsClose = useRef<HTMLButtonElement | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
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
  const [expandedProjects, setExpandedProjects] = useState<string[]>(
    state.folders,
  );
  const projectFor = (id: string) =>
    state.folderTasks[id] || state.flows[id]?.folder || '';
  const ungroupedTasks = state.memory.tasks.filter((t) => !projectFor(t.id));
  const [draft, setDraft] = useState(''),
    [contexts, setContexts] = useState<SavedContext[]>([]),
    [commandMode, setCommandMode] = useState<TaskCommandMode>('standard'),
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
  const addContext = (ctx: SavedContext) => {
    if (page === 'task' && task)
      dispatch({
        type: 'memory',
        action: {
          type: 'task-settings',
          taskId: task.id,
          settings: {
            contexts: [
              ...(task.contexts || []).filter((c) => c.id !== ctx.id),
              ctx,
            ],
          },
        },
      });
    else {
      setContexts((old) => [...old.filter((x) => x.id !== ctx.id), ctx]);
      setPage('home');
    }
  };
  const addCatalogToTask = (id: string) => {
    const c = state.catalog.find((c) => c.id === id);
    if (c)
      addContext({
        id: c.id,
        kind: c.kind as SavedContext['kind'],
        label: c.name,
      });
  };
  const consult = (id: string, text: string) => {
    const taskId = 'consult-' + (state.memory.counter + 1);
    dispatch({ type: 'new-task', id: taskId, text, agentId: id });
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
      const agentId = contexts.find((x) => x.kind === '专业智能体')?.id;
      dispatch({
        type: 'new-task',
        id,
        text: value,
        agentId,
        refs,
        settings: contexts,
        permissionMode,
        commandMode,
      });
      dispatch({
        type: 'memory',
        action: {
          type: 'task-settings',
          taskId: id,
          settings: { commandMode, permissionMode },
        },
      });
      setTaskUi((old) => ({
        ...old,
        [id]: { tabs: [], model: defaultModel, routing: defaultRouting },
      }));
      setDraft('');
      setContexts([]);
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
      modelMode={page === 'task' ? ui.model : defaultModel}
      onModelModeChange={(mode) =>
        page === 'task' ? updateUi({ model: mode }) : setDefaultModel(mode)
      }
      routing={page === 'task' ? ui.routing : defaultRouting}
      onRoutingChange={(routing) =>
        page === 'task' ? updateUi({ routing }) : setDefaultRouting(routing)
      }
      placeholder={
        flow?.stage === 'findings'
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
  const filteredTasks = state.memory.tasks.filter(
    (t) =>
      !folder ||
      (state.folderTasks[t.id] || state.flows[t.id]?.folder) === folder,
  );
  const title =
    page === 'task'
      ? task?.title || '任务不可用'
      : page === 'home'
        ? '工作台'
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
            <nav>
              {nav.map((n) => (
                <button
                  key={n.id}
                  className={page === n.id ? 'active' : ''}
                  onClick={() => {
                    setSettingsOpen(false);
                    setMobileNav(false);
                    setPage(n.id);
                    setFolder('');
                    if (n.id === 'memory') setSelectedMemory(undefined);
                  }}
                >
                  <n.icon size={18} />
                  <span>{n.title}</span>
                  {n.id === 'automations' && (
                    <small>
                      {state.automations.length + state.memory.schedules.length}
                    </small>
                  )}
                </button>
              ))}
            </nav>
            <div className="fw-nav-heading">
              <span>项目</span>
              <button
                aria-label="新建项目文件夹"
                className="fw-icon"
                onClick={() => setFolderEditor(true)}
              >
                <FolderPlus size={15} />
              </button>
            </div>
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
                      <small>{children.length}</small>
                    </button>
                  </div>
                  {expanded && children.length > 0 && (
                    <section
                      className="fw-task-list fw-project-tasks"
                      aria-label={`${name}项目任务`}
                    >
                      {children.map((t) => (
                        <button
                          key={t.id}
                          className={
                            page === 'task' && t.id === activeId ? 'active' : ''
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
            {ungroupedTasks.length > 0 && (
              <>
                <div className="fw-nav-heading">
                  <span>任务历史</span>
                  <span>{ungroupedTasks.length}</span>
                </div>
                <div className="fw-task-list" aria-label="未归入项目的任务">
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
              <span className="fw-avatar">林</span>
              <span className="fw-account-info">
                <span className="fw-account-name">
                  <strong>{currentUser.name}</strong>
                  <small>{currentUser.role}</small>
                </span>
                <small
                  className="fw-account-role"
                  title={currentUser.organization}
                >
                  {currentUser.organization}
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
                  <p className="fw-home-kicker">你好，林思远</p>
                  <h1>{folder || '今天有什么工作需要处理？'}</h1>
                </header>
                {!folder && composer(true)}
                <section className="fw-recents">
                  <div className="fw-recents-header">
                    <h2>{folder ? '项目内的工作' : '最近的工作'}</h2>
                    <span className="fw-meta">{filteredTasks.length}项</span>
                  </div>
                  <div className="fw-recents-list">
                    {filteredTasks.map((t) => (
                      <button
                        className="fw-recent-task"
                        key={t.id}
                        onClick={() => openTask(t.id)}
                      >
                        <span className="fw-recent-icon" aria-hidden="true">
                          {state.flows[t.id]?.kind === 'payment' ? (
                            <Workflow size={16} />
                          ) : (
                            <FileText size={16} />
                          )}
                        </span>
                        <span className="fw-recent-copy">
                          <strong>{t.title}</strong>
                          <small>
                            {state.flows[t.id]?.source || '本人工作记录'}
                          </small>
                        </span>
                        <ChevronRight
                          className="fw-recent-chevron"
                          size={16}
                          aria-hidden="true"
                        />
                      </button>
                    ))}
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
          {page === 'library' && (
            <Library onOpenTask={openTask} onUse={addContext} />
          )}
          {['agents', 'skills', 'extensions'].includes(page) && (
            <CatalogPage
              key={page}
              kind={
                page === 'agents'
                  ? '专业智能体'
                  : page === 'skills'
                    ? 'Skill'
                    : '插件'
              }
              onConsult={consult}
              onMemory={openMemory}
              onUse={addCatalogToTask}
            />
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
                  setPage('extensions');
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
            aria-label="新建项目文件夹"
          >
            <h2>新建项目文件夹</h2>
            <label>
              文件夹名称
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
