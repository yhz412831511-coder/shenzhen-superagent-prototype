"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleStop,
  Clock3,
  Copy,
  Database,
  ExternalLink,
  FileCheck2,
  FileClock,
  FileSearch,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Globe2,
  History,
  GitCompare,
  ListChecks,
  LibraryBig,
  LockKeyhole,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  PlugZap,
  Plus,
  RotateCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  SquarePen,
  SquareTerminal,
  Workflow,
  Zap,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  demoTasks,
  type DemoTask,
  type TaskKey,
  type TaskSurface,
  type TimelineItem,
} from "./demo-data";
import {
  initialInspectionReviewState,
  InspectionReviewWorkspace,
  type InspectionReviewState,
} from "./inspection-review";
import {
  createInitialManualBrowserState,
  ManualTaskBrowserWorkspace,
  openArtifactInManualBrowser,
  openWebInManualBrowser,
  type ManualBrowserState,
  type SubmittedArtifactAnnotation,
} from "./task-browser";
import {
  legalBrowserResources,
  legalResourceForSource,
} from "./legal-browser-pages";
import {
  annualBrowserResources,
  annualResourceForSource,
} from "./annual-browser-pages";
import {
  LibraryPage,
  MemoryPage,
  type TaskContext,
} from "./knowledge-memory-pages";
import {
  AgentsPage,
  ExtensionsPage,
  SkillsPage,
} from "./ability-ecosystem-pages";
import { AutomationPage } from "./automation-page";
import { SettingsPage } from "./settings-page";
import {
  cloneRoutingConfig,
  defaultRoutingConfig,
  type ModelMode,
  type RoutingConfig,
} from "./model-routing";
import {
  TaskComposer,
  type TaskCommandMode,
  type TaskPermissionMode,
} from "./task-composer";

type ViewMode =
  | "new"
  | "draft"
  | "history"
  | "library"
  | "memory"
  | "agents"
  | "skills"
  | "extensions"
  | "automation"
  | "settings";
type WorkspaceView =
  "monitor" | "artifact" | "evidence" | "version" | "browser" | "terminal";
type TaskBrowserSession = {
  open: boolean;
  kind: "manual" | "inspection";
};

type GenericRevisionState = {
  revision: 1 | 2;
  modifying: boolean;
  annotations: SubmittedArtifactAnnotation[];
};

const initialTaskBrowserSessions: Record<TaskKey, TaskBrowserSession> = {
  legal: { open: false, kind: "manual" },
  inspection: { open: false, kind: "manual" },
  annual: { open: false, kind: "manual" },
  daily: { open: false, kind: "manual" },
  tracking: { open: false, kind: "manual" },
};

const initialManualBrowserStates: Record<TaskKey, ManualBrowserState> = {
  legal: createInitialManualBrowserState(),
  inspection: createInitialManualBrowserState(),
  annual: createInitialManualBrowserState(),
  daily: createInitialManualBrowserState(),
  tracking: createInitialManualBrowserState(),
};

const initialGenericRevisionStates: Record<TaskKey, GenericRevisionState> = {
  legal: { revision: 1, modifying: false, annotations: [] },
  inspection: { revision: 1, modifying: false, annotations: [] },
  annual: { revision: 1, modifying: false, annotations: [] },
  daily: { revision: 1, modifying: false, annotations: [] },
  tracking: { revision: 1, modifying: false, annotations: [] },
};

const initialTaskModelModes: Record<TaskKey, ModelMode> = {
  legal: { type: "smart" },
  inspection: { type: "smart" },
  annual: { type: "smart" },
  daily: { type: "smart" },
  tracking: { type: "smart" },
};

const initialTaskRoutingConfigs: Record<TaskKey, RoutingConfig> = {
  legal: cloneRoutingConfig(defaultRoutingConfig),
  inspection: cloneRoutingConfig(defaultRoutingConfig),
  annual: cloneRoutingConfig(defaultRoutingConfig),
  daily: cloneRoutingConfig(defaultRoutingConfig),
  tracking: cloneRoutingConfig(defaultRoutingConfig),
};

const independentTaskKeys: TaskKey[] = ["legal", "inspection", "annual"];

const capabilityItems: {
  label: string;
  icon: LucideIcon;
  suffix?: string;
  accent?: boolean;
  view?: Extract<
    ViewMode,
    "library" | "memory" | "agents" | "skills" | "extensions" | "automation"
  >;
}[] = [
  { label: "专业智能体", icon: Bot, suffix: "10", accent: true, view: "agents" },
  { label: "技能", icon: Zap, suffix: "12", view: "skills" },
  { label: "插件与连接器", icon: PlugZap, suffix: "11", view: "extensions" },
  { label: "自动化", icon: Workflow, suffix: "2", view: "automation" },
  { label: "资料库", icon: LibraryBig, view: "library" },
  { label: "AI Memory", icon: BrainCircuit, suffix: "3", view: "memory" },
];

const taskExamples = [
  "审查一份制度文件并形成修改建议",
  "综合多份材料形成领导汇报",
  "梳理今天的待办并标记风险事项",
];

function CompactNavButton({
  icon: Icon,
  label,
  collapsed,
  suffix,
  active = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  suffix?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const button = (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      aria-label={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={`h-8 w-full justify-start gap-2.5 rounded-lg px-2.5 text-[12.5px] font-normal transition-colors ${
        active
          ? "bg-white/10 text-white hover:bg-white/12 hover:text-white"
          : "text-[#A9B5C8] hover:bg-white/[.065] hover:text-white"
      } ${collapsed ? "justify-center px-0" : ""}`}
    >
      <Icon className="size-[15px] shrink-0" strokeWidth={1.8} />
      {!collapsed ? (
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      ) : null}
      {!collapsed && suffix ? (
        <span className="rounded-md bg-white/[.07] px-1.5 py-0.5 text-[9.5px] text-[#8391A6]">
          {suffix}
        </span>
      ) : null}
    </Button>
  );

  if (!collapsed) return button;
  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function SidebarTask({
  task,
  active,
  collapsed,
  onOpen,
}: {
  task: DemoTask;
  active: boolean;
  collapsed: boolean;
  onOpen: () => void;
}) {
  const row = (
    <Button
      type="button"
      variant="ghost"
      onClick={onOpen}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? task.title : undefined}
      className={`group h-auto min-h-9 w-full justify-start gap-2 rounded-lg px-2.5 py-1.5 text-left font-normal ${
        active
          ? "bg-[#244D9B]/45 text-white hover:bg-[#244D9B]/50 hover:text-white"
          : "text-[#A9B5C8] hover:bg-white/[.065] hover:text-white"
      } ${collapsed ? "justify-center px-0" : ""}`}
    >
      <FileText className="size-3.5 shrink-0" strokeWidth={1.7} />
      {!collapsed ? (
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11.5px] leading-4">
            {task.shortTitle}
          </span>
          <span className="mt-0.5 block truncate text-[9.5px] text-[#75839A]">
            {task.updatedAt}
          </span>
        </span>
      ) : null}
      {!collapsed && active ? (
        <span className="size-1.5 rounded-full bg-[#70A0FF] shadow-[0_0_8px_#70A0FF]" />
      ) : null}
    </Button>
  );

  if (!collapsed) return row;
  return (
    <Tooltip>
      <TooltipTrigger render={row} />
      <TooltipContent side="right" className="max-w-72">
        {task.title}
      </TooltipContent>
    </Tooltip>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-1 flex h-6 items-center px-2.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#5F6F86]">
      {children}
    </div>
  );
}

function AppSidebar({
  collapsed,
  activeTask,
  activeView,
  onNewTask,
  onOpenTask,
  onOpenCapability,
  onOpenSettings,
  onOpenSearch,
}: {
  collapsed: boolean;
  activeTask: TaskKey | null;
  activeView: ViewMode;
  onNewTask: () => void;
  onOpenTask: (key: TaskKey) => void;
  onOpenCapability: (
    view: Extract<
      ViewMode,
      "library" | "memory" | "agents" | "skills" | "extensions" | "automation"
    >,
  ) => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
}) {
  const [projectsOpen, setProjectsOpen] = useState<Record<string, boolean>>({
    daily: true,
    tracking: true,
  });

  return (
    <aside
      className={`sidebar-surface flex shrink-0 flex-col border-r border-white/[.07] transition-[width] duration-200 ${
        collapsed ? "w-[68px]" : "w-[276px] max-[1180px]:w-[236px]"
      }`}
    >
      <div
        className={`flex h-14 shrink-0 items-center border-b border-white/[.06] ${collapsed ? "justify-center px-2" : "px-3.5"}`}
      >
        <button
          type="button"
          onClick={onNewTask}
          className="flex min-w-0 items-center gap-2.5 text-left"
          aria-label="深圳政务超级智能体"
        >
          <span className="brand-mark grid size-8 shrink-0 place-items-center rounded-[10px]">
            <Sparkles className="size-3.5 text-white" />
          </span>
          {!collapsed ? (
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold tracking-[-0.01em] text-white">
                深圳政务超级智能体
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[9.5px] text-[#6F8099]">
                <span className="size-1 rounded-full bg-[#53D5B0] shadow-[0_0_6px_#53D5B0]" />
                政务域安全运行
              </span>
            </span>
          ) : null}
        </button>
      </div>

      <div
        className={`shrink-0 space-y-1 px-2.5 py-2.5 ${collapsed ? "px-2" : ""}`}
      >
        <Button
          type="button"
          onClick={onNewTask}
          className={`h-9 w-full rounded-[9px] border border-[#4B7DE7]/45 bg-[#245BC7] text-white shadow-[0_6px_18px_rgba(18,75,188,.24)] hover:bg-[#2B66D9] ${
            collapsed ? "px-0" : "justify-start px-3"
          }`}
          aria-label="新任务"
        >
          <SquarePen className="size-4" />
          {!collapsed ? <span>新任务</span> : null}
        </Button>
        <CompactNavButton
          icon={Search}
          label="搜索任务、材料和能力"
          collapsed={collapsed}
          suffix="⌘ K"
          onClick={onOpenSearch}
        />
      </div>

      <div
        className={`min-h-0 flex-1 overflow-y-auto pb-3 ${collapsed ? "px-2" : "px-2.5"}`}
      >
        <section className="mb-3">
          {!collapsed ? <SectionLabel>工作能力</SectionLabel> : null}
          <div className="space-y-0.5">
            {capabilityItems.map((item) => (
              <CompactNavButton
                key={item.label}
                {...item}
                collapsed={collapsed}
                active={Boolean(item.view && activeView === item.view)}
                onClick={
                  item.view ? () => onOpenCapability(item.view!) : undefined
                }
              />
            ))}
          </div>
        </section>

        {!collapsed ? (
          <div className="mx-2.5 mb-3 h-px bg-white/[.06]" />
        ) : null}

        <section className="mb-3">
          {!collapsed ? (
            <div className="mb-1 flex h-6 items-center justify-between px-2.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#5F6F86]">
              <span>项目</span>
              <FolderPlus className="size-3.5" />
            </div>
          ) : null}

          {collapsed ? (
            <CompactNavButton icon={FolderOpen} label="项目" collapsed />
          ) : (
            <div className="space-y-1">
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setProjectsOpen((state) => ({
                      ...state,
                      daily: !state.daily,
                    }))
                  }
                  className="h-8 w-full justify-start gap-2 rounded-lg px-2.5 text-[12px] font-normal text-[#CBD3DF] hover:bg-white/[.055] hover:text-white"
                >
                  {projectsOpen.daily ? (
                    <ChevronDown className="size-3" />
                  ) : (
                    <ChevronRight className="size-3" />
                  )}
                  <Folder className="size-3.5 text-[#7298E9]" />
                  <span className="min-w-0 flex-1 truncate text-left">
                    日常待办
                  </span>
                  <span className="text-[9.5px] text-[#66768D]">12</span>
                </Button>
                {projectsOpen.daily ? (
                  <div className="ml-[22px] border-l border-white/[.08] pl-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onOpenTask("daily")}
                      className={`h-7 w-full justify-start truncate rounded-md px-2 text-[10.5px] font-normal hover:text-white ${activeTask === "daily" ? "bg-white/[.09] text-white" : "text-[#7F8DA2] hover:bg-white/[.05]"}`}
                    >
                      <Clock3 className="size-3" /> 9月2日待办梳理
                    </Button>
                  </div>
                ) : null}
              </div>

              <div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setProjectsOpen((state) => ({
                      ...state,
                      tracking: !state.tracking,
                    }))
                  }
                  className="h-8 w-full justify-start gap-2 rounded-lg px-2.5 text-[12px] font-normal text-[#CBD3DF] hover:bg-white/[.055] hover:text-white"
                >
                  {projectsOpen.tracking ? (
                    <ChevronDown className="size-3" />
                  ) : (
                    <ChevronRight className="size-3" />
                  )}
                  <Folder className="size-3.5 text-[#8B84E8]" />
                  <span className="min-w-0 flex-1 truncate text-left">
                    重点任务跟踪
                  </span>
                  <span className="text-[9.5px] text-[#66768D]">8</span>
                </Button>
                {projectsOpen.tracking ? (
                  <div className="ml-[22px] border-l border-white/[.08] pl-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onOpenTask("tracking")}
                      className={`h-7 w-full justify-start truncate rounded-md px-2 text-[10.5px] font-normal hover:text-white ${activeTask === "tracking" ? "bg-white/[.09] text-white" : "text-[#7F8DA2] hover:bg-white/[.05]"}`}
                    >
                      <Clock3 className="size-3" /> 9月2日重点跟踪
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </section>

        {!collapsed ? (
          <div className="mx-2.5 mb-3 h-px bg-white/[.06]" />
        ) : null}

        <section>
          {!collapsed ? <SectionLabel>独立任务</SectionLabel> : null}
          <div className="space-y-0.5">
            {independentTaskKeys.map((key) => (
              <SidebarTask
                key={key}
                task={demoTasks[key]}
                active={activeTask === key}
                collapsed={collapsed}
                onOpen={() => onOpenTask(key)}
              />
            ))}
          </div>
        </section>
      </div>

      <div
        className={`shrink-0 border-t border-white/[.07] p-2.5 ${collapsed ? "px-2" : ""}`}
      >
        <button
          type="button"
          onClick={onOpenSettings}
          className={`flex min-h-12 w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition ${
            activeView === "settings"
              ? "border-[#4975D6]/45 bg-[#244D9B]/40"
              : "border-transparent hover:bg-white/[.055]"
          } ${collapsed ? "justify-center px-0" : ""}`}
          aria-label={collapsed ? "林思远，综合处" : undefined}
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#244D9B] text-[10px] font-semibold text-[#CFE0FF]">
            林
          </span>
          {!collapsed ? (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-medium text-[#D7DFEA]">
                林思远 · 综合处
              </span>
              <span className="block truncate text-[9px] text-[#66768D]">
                材料经办岗
              </span>
            </span>
          ) : null}
          {!collapsed ? (
            <Settings className="size-3.5 text-[#718098]" />
          ) : null}
        </button>
      </div>
    </aside>
  );
}

function GlobalSearchDialog({
  open,
  onOpenChange,
  onNewTask,
  onOpenTask,
  onOpenCapability,
  onOpenSettings,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewTask: () => void;
  onOpenTask: (key: TaskKey) => void;
  onOpenCapability: (
    view: Extract<
      ViewMode,
      "library" | "memory" | "agents" | "skills" | "extensions" | "automation"
    >,
  ) => void;
  onOpenSettings: () => void;
}) {
  const choose = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="搜索任务、材料和能力"
      description="输入名称或关键词，快速打开工作对象"
      className="top-[16%] w-[620px] max-w-[calc(100vw-2rem)] translate-y-0 rounded-2xl bg-white shadow-[0_26px_80px_rgba(17,31,54,.22)] sm:max-w-[620px]"
      showCloseButton
    >
      <Command className="rounded-2xl! bg-white p-0">
        <div className="border-b border-[#E6EAF0] px-3 py-2.5">
          <CommandInput
            placeholder="搜索任务、材料、专业智能体、技能或连接器…"
            className="h-9 text-[12px]"
          />
        </div>
        <CommandList className="max-h-[430px] px-2 py-2">
          <CommandEmpty className="py-10 text-[10.5px] text-[#7A8798]">
            没有找到匹配内容，可以直接新建任务并描述目标。
          </CommandEmpty>
          <CommandGroup
            heading="快速操作"
            className="text-[#344054] **:[[cmdk-group-heading]]:text-[8.5px] **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-[.1em]"
          >
            <CommandItem
              value="新任务 创建任务 开始工作"
              onSelect={() => choose(onNewTask)}
              className="h-10 text-[10.5px]"
            >
              <SquarePen className="text-[#4169CE]" />
              <span>新建任务</span>
              <CommandShortcut>⌘ N</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator className="my-1" />
          <CommandGroup
            heading="最近任务"
            className="text-[#344054] **:[[cmdk-group-heading]]:text-[8.5px] **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-[.1em]"
          >
            {(Object.keys(demoTasks) as TaskKey[]).map((key) => {
              const item = demoTasks[key];
              return (
                <CommandItem
                  key={key}
                  value={`${item.title} ${item.shortTitle} ${item.agent} ${item.skills.join(" ")}`}
                  onSelect={() => choose(() => onOpenTask(key))}
                  className="min-h-11 text-[10.5px]"
                >
                  <FileText className="text-[#6177B3]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-[#344054]">
                      {item.shortTitle}
                    </span>
                    <span className="mt-0.5 block truncate text-[8.5px] text-[#98A2B3]">
                      {item.updatedAt} · {item.status}
                    </span>
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator className="my-1" />
          <CommandGroup
            heading="工作能力与资料"
            className="text-[#344054] **:[[cmdk-group-heading]]:text-[8.5px] **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-[.1em]"
          >
            {[
              ["agents", Bot, "专业智能体", "完整工作、单位共建、智能体商店"],
              ["skills", Zap, "技能", "业务经验、执行方法、Skill商店"],
              ["extensions", PlugZap, "插件与连接器", "WPS、浏览器、OA、粤政易、深政易"],
              ["automation", Workflow, "自动化", "定时任务、周期运行、任务历史"],
              ["library", LibraryBig, "资料库", "我的资料、本地资料、云空间、接入知识库"],
              ["memory", BrainCircuit, "AI Memory", "个人记忆、办公偏好、组织经验"],
            ].map(([target, Icon, label, keywords]) => {
              const ItemIcon = Icon as LucideIcon;
              return (
                <CommandItem
                  key={String(target)}
                  value={`${String(label)} ${String(keywords)}`}
                  onSelect={() =>
                    choose(() =>
                      onOpenCapability(
                        target as Extract<
                          ViewMode,
                          "library" | "memory" | "agents" | "skills" | "extensions" | "automation"
                        >,
                      ),
                    )
                  }
                  className="h-10 text-[10.5px]"
                >
                  <ItemIcon className="text-[#6177B3]" />
                  <span>{String(label)}</span>
                  <span className="ml-auto text-[8px] text-[#98A2B3]">
                    {String(keywords).split("、")[0]}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
          <CommandSeparator className="my-1" />
          <CommandGroup
            heading="个人环境"
            className="text-[#344054] **:[[cmdk-group-heading]]:text-[8.5px] **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-[.1em]"
          >
            <CommandItem
              value="设置 账号 身份 模型 调度 权限 通知 外观"
              onSelect={() => choose(onOpenSettings)}
              className="h-10 text-[10.5px]"
            >
              <Settings className="text-[#6177B3]" />
              <span>个人设置</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
        <div className="flex items-center gap-4 border-t border-[#E6EAF0] bg-[#FAFBFD] px-4 py-2 text-[8px] text-[#98A2B3]">
          <span>↑↓ 选择</span>
          <span>↵ 打开</span>
          <span>Esc 关闭</span>
          <span className="ml-auto">只搜索当前身份可见内容</span>
        </div>
      </Command>
    </CommandDialog>
  );
}

function TopBar({
  collapsed,
  onToggle,
  title,
  subtitle,
  status,
  dockAvailable,
  dockOpen,
  onToggleDock,
}: {
  collapsed: boolean;
  onToggle: () => void;
  title: string;
  subtitle: string;
  status?: string;
  dockAvailable: boolean;
  dockOpen: boolean;
  onToggleDock: () => void;
}) {
  return (
    <header className="flex h-[58px] shrink-0 items-center border-b border-[#E6EAF0] bg-white/95 px-3 backdrop-blur">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onToggle}
        aria-label={collapsed ? "展开侧栏" : "收起侧栏"}
        className="text-[#667085]"
      >
        {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
      </Button>
      <div className="ml-2 min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-[13px] font-semibold text-[#182230]">
            {title}
          </h1>
          {status ? (
            <Badge
              className={
                status === "已完成"
                  ? "shrink-0 border border-[#D7EBDD] bg-[#EFF9F3] text-[8.5px] font-medium text-[#17875D] hover:bg-[#EFF9F3]"
                  : "shrink-0 border border-[#D9E3F8] bg-[#F2F5FF] text-[8.5px] font-medium text-[#2959C7] hover:bg-[#F2F5FF]"
              }
            >
              {status}
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 truncate text-[9px] text-[#98A2B3]">{subtitle}</p>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-[#D9E3F8] bg-[#F5F8FF] px-2.5 py-1 text-[9px] text-[#4567AA] xl:flex">
          <LockKeyhole className="size-3 text-[#3970DD]" />
          政务外网
        </span>
        {dockAvailable ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleDock}
            aria-label={dockOpen ? "收起右侧工作区" : "展开右侧工作区"}
            className={
              dockOpen
                ? "bg-[#EAF0FF] text-[#3159BE] hover:bg-[#E1E9FC]"
                : "text-[#667085]"
            }
          >
            {dockOpen ? <PanelRightClose /> : <PanelRightOpen />}
          </Button>
        ) : null}
      </div>
    </header>
  );
}

function ContextIcon({ kind, className }: { kind: TaskContext["kind"]; className: string }) {
  const Icon =
    kind === "资料"
      ? LibraryBig
      : kind === "知识库"
        ? Database
        : kind === "专业智能体"
          ? Bot
          : kind === "Skill"
            ? Zap
            : kind === "插件" || kind === "连接器"
              ? PlugZap
              : BrainCircuit;
  return <Icon className={className} />;
}

function contextTone(kind: TaskContext["kind"]) {
  if (kind === "资料") return "border-[#CEDBF6] bg-[#F3F7FF] text-[#3F5FAD]";
  if (kind === "知识库" || kind === "连接器") return "border-[#D5DCF2] bg-[#F5F7FD] text-[#535FAE]";
  if (kind === "专业智能体") return "border-[#CDDDF8] bg-[#F0F5FF] text-[#365FB7]";
  if (kind === "插件") return "border-[#D5E3E5] bg-[#F2F8F8] text-[#39727A]";
  return "border-[#DCD8F4] bg-[#F7F5FF] text-[#625EA8]";
}

function contextPrefix(kind: TaskContext["kind"]) {
  if (kind === "专业智能体") return "@ 专业智能体";
  if (kind === "Skill") return "/ Skill";
  return kind;
}

function EnvironmentPanel() {
  return (
    <aside className="environment-panel self-start overflow-hidden rounded-2xl border border-[#DCE3EF] bg-white shadow-[0_18px_48px_rgba(28,42,68,.07)]">
      <div className="flex items-center justify-between border-b border-[#E8ECF2] px-4 py-3">
        <div>
          <p className="text-[12px] font-semibold text-[#182230]">
            当前工作环境
          </p>
          <p className="mt-0.5 text-[9.5px] text-[#98A2B3]">
            开始任务前可随时调整
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-[#EAF7F1] px-2 py-1 text-[9px] font-medium text-[#17875D]">
          <span className="size-1.5 rounded-full bg-[#26A474]" />
          就绪
        </span>
      </div>
      <div className="space-y-4 p-4">
        <div>
          <p className="mb-2 text-[9.5px] font-medium uppercase tracking-[0.1em] text-[#98A2B3]">
            身份与空间
          </p>
          <div className="flex items-center gap-3 rounded-xl bg-[#F7F9FC] p-3">
            <span className="grid size-8 place-items-center rounded-[10px] bg-[#EAF0FF] text-[11px] font-semibold text-[#2959C7]">
              林
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-medium text-[#344054]">
                林思远 · 综合处
              </p>
              <p className="mt-0.5 text-[9.5px] text-[#98A2B3]">
                未选择项目 · 独立任务
              </p>
            </div>
            <ChevronRight className="size-3.5 text-[#98A2B3]" />
          </div>
        </div>
        <div>
          <p className="mb-2 text-[9.5px] font-medium uppercase tracking-[0.1em] text-[#98A2B3]">
            默认启用
          </p>
          <div className="space-y-1.5">
            {[
              [Bot, "政务材料智能体", "v1.3"],
              [Zap, "公文质量检查 Skill", "已启用"],
              [BrainCircuit, "个人 Memory", "3条可用"],
            ].map(([Icon, label, meta]) => {
              const ItemIcon = Icon as LucideIcon;
              return (
                <div
                  key={String(label)}
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[10.5px] text-[#475467]"
                >
                  <ItemIcon className="size-3.5 text-[#5C70CF]" />
                  <span className="flex-1">{String(label)}</span>
                  <span className="text-[9.5px] text-[#98A2B3]">
                    {String(meta)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[9.5px] font-medium uppercase tracking-[0.1em] text-[#98A2B3]">
            可访问范围
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[#E5EAF2] p-3">
              <Database className="size-4 text-[#3970DD]" />
              <p className="mt-2 text-[11px] font-medium text-[#344054]">
                组织资料库
              </p>
              <p className="mt-1 text-[9.5px] text-[#98A2B3]">按权限检索</p>
            </div>
            <div className="rounded-xl border border-[#E5EAF2] p-3">
              <Network className="size-4 text-[#6C64D9]" />
              <p className="mt-2 text-[11px] font-medium text-[#344054]">
                6个连接器
              </p>
              <p className="mt-1 text-[9.5px] text-[#98A2B3]">写入需确认</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 rounded-xl border border-[#DBE5FA] bg-[#F5F8FF] p-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#3970DD]" />
          <p className="text-[9.8px] leading-4 text-[#52698F]">
            默认只读。扩大范围、正式写入、外发和Memory沉淀将单独请求确认。
          </p>
        </div>
      </div>
    </aside>
  );
}

function NewTaskView({
  value,
  onChange,
  onSubmit,
  contexts,
  onRemoveContext,
  onAddContext,
  commandMode,
  onCommandModeChange,
  permissionMode,
  onPermissionModeChange,
  modelMode,
  onModelModeChange,
  routing,
  onRoutingChange,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  contexts: TaskContext[];
  onRemoveContext: (id: string) => void;
  onAddContext: (context: TaskContext) => void;
  commandMode: TaskCommandMode;
  onCommandModeChange: (mode: TaskCommandMode) => void;
  permissionMode: TaskPermissionMode;
  onPermissionModeChange: (mode: TaskPermissionMode) => void;
  modelMode: ModelMode;
  onModelModeChange: (mode: ModelMode) => void;
  routing: RoutingConfig;
  onRoutingChange: (routing: RoutingConfig) => void;
}) {
  return (
    <div className="workbench-grid min-h-0 flex-1 overflow-y-auto">
      <div className="grid w-full max-w-[1180px] grid-cols-1 gap-7 px-5 pb-16 pt-10 md:px-8 md:pt-14 min-[1420px]:grid-cols-[minmax(0,760px)_300px] min-[1420px]:px-10 min-[1420px]:pt-16">
        <div>
          <div className="mb-7">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D9E3F8] bg-white/80 px-3 py-1.5 text-[10px] font-medium text-[#4968A8] shadow-sm">
              <Sparkles className="size-3.5 text-[#586FD8]" /> 统一任务工作台
            </span>
            <h1 className="text-left text-[31px] font-semibold tracking-[-0.04em] text-[#172033]">
              今天想完成什么工作？
            </h1>
            <p className="mt-2 max-w-[640px] text-left text-[13.5px] leading-6 text-[#667085]">
              直接说明目标。系统会组织材料、制定计划、调用专业能力，并在关键动作前向你确认。
            </p>
          </div>
          <TaskComposer
            value={value}
            onChange={onChange}
            onSubmit={onSubmit}
            contexts={contexts}
            onRemoveContext={onRemoveContext}
            onAddContext={onAddContext}
            commandMode={commandMode}
            onCommandModeChange={onCommandModeChange}
            permissionMode={permissionMode}
            onPermissionModeChange={onPermissionModeChange}
            modelMode={modelMode}
            onModelModeChange={onModelModeChange}
            routing={routing}
            onRoutingChange={onRoutingChange}
            placeholder="描述工作目标、材料范围、交付形式和不能改变的事实…"
            variant="large"
          />
          <div className="mt-5">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.1em] text-[#98A2B3]">
              快速开始
            </p>
            <div className="space-y-1">
              {taskExamples.map((example) => (
                <Button
                  key={example}
                  type="button"
                  variant="ghost"
                  onClick={() => onChange(example)}
                  className="group h-8 w-full justify-start px-1 text-[11.5px] font-normal text-[#667085] hover:bg-transparent hover:text-[#1F5EFF]"
                >
                  <ChevronRight className="size-3.5 text-[#B4BCCA] group-hover:text-[#5C7CE2]" />{" "}
                  {example}
                </Button>
              ))}
            </div>
          </div>
          <div className="mt-8 flex items-center gap-5 border-t border-[#E4E9F1] pt-4 text-[9.5px] text-[#98A2B3]">
            <span className="flex items-center gap-1.5">
              <LockKeyhole className="size-3" /> 政务域内运行
            </span>
            <span className="flex items-center gap-1.5">
              <History className="size-3" /> 过程可追溯
            </span>
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="size-3" /> 正式版本受保护
            </span>
          </div>
        </div>
        <div className="hidden min-[1420px]:block">
          <EnvironmentPanel />
        </div>
      </div>
    </div>
  );
}

function TimelineCard({
  item,
  onOpenArtifact,
  onOpenSource,
  onOpenReceipt,
}: {
  item: TimelineItem;
  onOpenArtifact?: (file?: string) => void;
  onOpenSource?: (source: string) => void;
  onOpenReceipt?: () => void;
}) {
  if (item.type === "stage") {
    return (
      <div className="my-8 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#E4E7EC]" />
        <span className="flex items-center gap-2 text-[9.5px] font-medium uppercase tracking-[0.12em] text-[#98A2B3]">
          <span className="size-1.5 rounded-full bg-[#657BE3]" />
          {item.label}
          <span className="font-normal tracking-normal">{item.time}</span>
        </span>
        <span className="h-px flex-1 bg-[#E4E7EC]" />
      </div>
    );
  }

  if (item.type === "user") {
    return (
      <div className="mb-6 flex justify-end gap-3 pl-16">
        <div className="max-w-[620px] rounded-xl rounded-tr-sm border border-[#D9E2F1] bg-[#F1F5FB] px-4 py-3">
          <p className="text-[12.5px] leading-6 text-[#344054]">{item.text}</p>
          <p className="mt-2 text-right text-[9px] text-[#98A2B3]">
            {item.time}
          </p>
        </div>
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#E7ECF5] text-[9px] font-semibold text-[#526176]">
          你
        </span>
      </div>
    );
  }

  const tone =
    item.type === "quality" ||
    (item.type === "evidence" && item.tone === "warning")
      ? "warning"
      : item.type === "completion" || item.type === "receipt"
        ? "success"
        : "normal";
  const Icon =
    item.type === "plan"
      ? Workflow
      : item.type === "evidence"
        ? FileSearch
        : item.type === "confirmation"
          ? ShieldCheck
          : item.type === "quality"
            ? FileClock
            : item.type === "artifacts"
              ? FileCheck2
              : item.type === "receipt"
                ? ExternalLink
                : item.type === "completion"
                  ? CheckCircle2
                  : Sparkles;

  return (
    <div className="mb-6 flex gap-3">
      <span
        className={`timeline-icon mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${tone}`}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 max-w-[710px] flex-1">
        {item.type === "assistant" ? (
          <div className="px-1">
            <p className="text-[12.5px] font-semibold text-[#25324A]">
              {item.title ?? "超级智能体"}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-6 text-[#475467]">
              {item.text}
            </p>
            {item.bullets ? (
              <ul className="mt-3 space-y-1.5">
                {item.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex gap-2 text-[11px] leading-5 text-[#667085]"
                  >
                    <Check className="mt-1 size-3 shrink-0 text-[#5B75DB]" />
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-2 text-[9px] text-[#98A2B3]">{item.time}</p>
          </div>
        ) : (
          <section className={`event-card ${tone}`}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[12px] font-semibold text-[#25324A]">
                {item.title}
              </h3>
              <span className="text-[9px] text-[#98A2B3]">{item.time}</span>
            </div>
            {item.type === "plan" ? (
              <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                {item.steps.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-center gap-2 rounded-lg bg-[#F7F9FC] px-2.5 py-2 text-[10.5px] text-[#475467]"
                  >
                    <span className="grid size-4 shrink-0 place-items-center rounded-full border border-[#C8D4EC] text-[8.5px] text-[#5670B1]">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            ) : null}
            {item.type === "evidence" ? (
              <>
                <p className="mt-2 text-[11.5px] leading-5 text-[#475467]">
                  {item.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.sources.map((source) =>
                    onOpenSource ? (
                      <button
                        key={source}
                        type="button"
                        onClick={() => onOpenSource(source)}
                        className="flex items-center gap-1 rounded-md border border-[#DCE4F2] bg-white px-2 py-1 text-left text-[9.5px] text-[#52698F] transition hover:border-[#AFC1EA] hover:bg-[#F7F9FE] hover:text-[#2959C7]"
                      >
                        {source}
                        <ExternalLink className="size-2.5 shrink-0" />
                      </button>
                    ) : (
                      <span
                        key={source}
                        className="rounded-md border border-[#E0E6F0] bg-white px-2 py-1 text-[9.5px] text-[#61708A]"
                      >
                        {source}
                      </span>
                    ),
                  )}
                </div>
              </>
            ) : null}
            {item.type === "confirmation" ? (
              <>
                <p className="mt-2 text-[11.5px] leading-5 text-[#475467]">
                  {item.summary}
                </p>
                <p className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-[#17875D]">
                  <CheckCircle2 className="size-3.5" />
                  {item.result}
                </p>
              </>
            ) : null}
            {item.type === "quality" ? (
              <>
                <p className="mt-2 text-[11px] leading-5 text-[#7A4D05]">
                  <strong>发现：</strong>
                  {item.issue}
                </p>
                <p className="mt-2 text-[11px] leading-5 text-[#36624F]">
                  <strong>处理：</strong>
                  {item.resolution}
                </p>
              </>
            ) : null}
            {item.type === "artifacts" ? (
              <div className="mt-3 space-y-1.5">
                {item.files.map((file) => (
                  <button
                    key={file}
                    type="button"
                    onClick={() => onOpenArtifact?.(file)}
                    className="flex w-full items-center gap-2 rounded-lg border border-[#E3E8F0] bg-white px-3 py-2 text-left text-[10.5px] text-[#475467] transition hover:border-[#B9CAF1] hover:text-[#2959C7]"
                  >
                    <FileText className="size-3.5 text-[#607CDD]" />
                    <span className="flex-1 truncate">{file}</span>
                    <ChevronRight className="size-3" />
                  </button>
                ))}
              </div>
            ) : null}
            {item.type === "receipt" ? (
              <>
                <div className="mt-3 space-y-1.5">
                  {item.details.map((detail) => (
                    <p
                      key={detail}
                      className="text-[10.5px] leading-5 text-[#526176]"
                    >
                      {detail}
                    </p>
                  ))}
                </div>
                {onOpenReceipt ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onOpenReceipt}
                    className="mt-3 border-[#D7E0EE] text-[9px] text-[#475467]"
                  >
                    <ExternalLink />
                    {item.title.includes("会议") ? "查看会议服务" : "查看OA归档"}
                  </Button>
                ) : null}
              </>
            ) : null}
            {item.type === "completion" ? (
              <>
                <p className="mt-2 text-[11.5px] leading-5 text-[#475467]">
                  {item.summary}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {item.highlights.map((highlight) => (
                    <li
                      key={highlight}
                      className="flex gap-2 text-[10.5px] leading-5 text-[#526176]"
                    >
                      <CheckCircle2 className="mt-1 size-3 shrink-0 text-[#17875D]" />
                      {highlight}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onOpenArtifact?.()}
                    className="bg-[#1F5EFF] text-white hover:bg-[#174ED6]"
                  >
                    <FileCheck2 />
                    打开最终成果
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-[#D9E1ED] text-[#475467]"
                  >
                    查看任务计划
                  </Button>
                </div>
              </>
            ) : null}
          </section>
        )}
      </div>
    </div>
  );
}

function TaskMonitor({
  task,
  onOpenArtifact,
}: {
  task: DemoTask;
  onOpenArtifact: (index: number) => void;
  onOpenEvidence: (index: number) => void;
  onOpenVersion: (index: number) => void;
}) {
  const completed = task.run.steps.filter(
    (step) => step.state === "done" || step.state === "resolved",
  ).length;
  const capabilityCalls = task.run.calls.filter(
    (call) => call.kind !== "Memory",
  );
  const capabilityKind = (kind: (typeof capabilityCalls)[number]["kind"]) =>
    kind === "连接器" ? "MCP" : kind === "资料库" ? "知识源" : kind;

  return (
    <Accordion
      multiple
      defaultValue={["todos", "artifacts"]}
      className="bg-white"
    >
      <AccordionItem value="todos" className="border-b border-[#E6E9EE] px-4">
        <AccordionTrigger className="h-12 rounded-none py-0 text-[11px] font-semibold text-[#344054] hover:no-underline">
          <span className="flex min-w-0 flex-1 items-center">
            <span>待办</span>
            <span className="ml-2 text-[8.5px] font-normal text-[#98A2B3]">
              {completed}/{task.run.steps.length}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <ol className="space-y-2.5">
            {task.run.steps.map((step) => {
              const done = step.state === "done" || step.state === "resolved";
              return (
                <li key={step.title} className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${done ? "border-[#BFE7D4] bg-[#EAF8F1] text-[#20A06B]" : step.state === "running" ? "border-[#B8CAF5] bg-[#EDF2FF] text-[#3C67CC]" : "border-[#D7DCE4] bg-white text-[#98A2B3]"}`}
                  >
                    {done ? (
                      <Check className="size-2.5" strokeWidth={2.5} />
                    ) : (
                      <span className="size-1.5 rounded-full bg-current" />
                    )}
                  </span>
                  <span
                    className={`min-w-0 flex-1 text-[10px] leading-[1.55] ${done ? "text-[#8A929F] line-through decoration-[#C3C9D2]" : "text-[#475467]"}`}
                  >
                    {step.title}
                  </span>
                </li>
              );
            })}
          </ol>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        value="artifacts"
        className="border-b border-[#E6E9EE] px-4"
      >
        <AccordionTrigger className="h-12 rounded-none py-0 text-[11px] font-semibold text-[#344054] hover:no-underline">
          <span className="flex min-w-0 flex-1 items-center">
            <span>任务产物</span>
            <span className="ml-2 text-[8.5px] font-normal text-[#98A2B3]">
              {task.artifacts.length}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <p className="mb-2.5 text-[8px] text-[#98A2B3]">当前任务工作区</p>
          <div className="space-y-1">
            {task.artifacts.map((item, index) => (
              <button
                key={item.name}
                type="button"
                onClick={() => onOpenArtifact(index)}
                className="flex w-full items-center gap-2 rounded-md px-1 py-1.5 text-left transition hover:bg-[#F5F7FA]"
              >
                <FileText className="size-3.5 shrink-0 text-[#5573D1]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[9.5px] text-[#475467]">
                    {item.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[7.5px] text-[#A0A7B2]">
                    {item.meta}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem
        value="capabilities"
        className="border-b border-[#E6E9EE] px-4"
      >
        <AccordionTrigger className="h-12 rounded-none py-0 text-[11px] font-semibold text-[#344054] hover:no-underline">
          <span className="flex min-w-0 flex-1 items-center">
            <span>能力调用</span>
            <span className="ml-2 text-[8.5px] font-normal text-[#98A2B3]">
              {capabilityCalls.length}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <div className="space-y-1">
            {capabilityCalls.map((call) => (
              <div
                key={`${call.kind}-${call.name}`}
                className="flex items-center gap-2 rounded-md px-1 py-1.5"
              >
                <span className="w-10 shrink-0 rounded bg-[#F1F3F9] py-1 text-center text-[7px] font-medium text-[#6E69A8]">
                  {capabilityKind(call.kind)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[9px] text-[#5A6575]">
                    {call.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[7.5px] text-[#A0A7B2]">
                    {call.detail}
                  </span>
                </span>
                <span className="shrink-0 text-[7.5px] text-[#20A06B]">
                  {call.state}
                </span>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="memory" className="px-4">
        <AccordionTrigger className="h-12 rounded-none py-0 text-[11px] font-semibold text-[#344054] hover:no-underline">
          <span className="flex min-w-0 flex-1 items-center">
            <span>记忆与进化</span>
            <span className="ml-2 text-[8.5px] font-normal text-[#98A2B3]">
              {task.memories.length}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          {task.memories.length > 0 ? (
            <div className="space-y-2">
              {task.memories.map((item) => (
                <div key={`${item.action}-${item.name}`} className="flex items-start gap-2 py-1">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-[#F0EEFA] text-[#6E63A6]">
                    <BrainCircuit className="size-3" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="min-w-0 flex-1 truncate text-[9px] font-medium text-[#5A6575]">
                        {item.name}
                      </span>
                      <span className="shrink-0 text-[7.5px] text-[#6F63A7]">
                        {item.action}·{item.kind}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[7.5px] text-[#98A2B3]">
                      {item.detail}
                    </span>
                    <span className="mt-1 block text-[7.5px] text-[#20A06B]">
                      {item.state}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-1 text-[8.5px] text-[#98A2B3]">
              <BrainCircuit className="size-3.5 text-[#9A93B8]" />
              本任务未调用或产生记忆项
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function ArtifactViewer({ task, index }: { task: DemoTask; index: number }) {
  const [mode, setMode] = useState<"preview" | "sources" | "versions">(
    "preview",
  );
  const artifact = task.artifacts[index] ?? task.artifacts[0];
  return (
    <div className="flex min-h-full flex-col p-3">
      <div className="mb-3 flex rounded-lg bg-[#EEF1F6] p-0.5">
        {(
          [
            ["preview", "预览"],
            ["sources", "依据"],
            ["versions", "版本"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`h-7 flex-1 rounded-md text-[9px] transition ${mode === key ? "bg-white font-medium text-[#3159BE] shadow-[0_1px_4px_rgba(16,24,40,.1)]" : "text-[#667085]"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "preview" ? (
        <div className="flex-1 overflow-hidden rounded-xl border border-[#DFE5EE] bg-white shadow-[0_8px_22px_rgba(16,24,40,.05)]">
          <div className="flex items-center justify-between border-b border-[#E7EBF1] px-3 py-2.5">
            <span className="text-[9px] text-[#667085]">{artifact.meta}</span>
            <Badge className="border border-[#D9E6DF] bg-[#F4FBF7] text-[8px] font-medium text-[#17875D] hover:bg-[#F4FBF7]">
              {artifact.state}
            </Badge>
          </div>
          <div className="document-preview m-3 min-h-[400px] rounded-md border border-[#E9ECF1] bg-white p-5">
            <div className="mx-auto max-w-[260px] text-center">
              <p className="text-[13px] font-semibold text-[#202939]">
                {artifact.name}
              </p>
              <p className="mt-2 text-[8px] text-[#98A2B3]">
                {task.shortTitle}
              </p>
            </div>
            <div className="mt-7 space-y-2.5">
              {[92, 100, 84, 96, 74, 88, 64].map((width, lineIndex) => (
                <div
                  key={lineIndex}
                  className="h-1.5 rounded-full bg-[#E7EAF0]"
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>
            <div className="mt-6 rounded-lg border-l-2 border-[#6680DE] bg-[#F5F7FD] p-3">
              <p className="text-[8px] font-medium text-[#5069B8]">
                已关联关键判断
              </p>
              <p className="mt-2 text-[8.5px] leading-4 text-[#667085]">
                {task.run.steps[task.run.steps.length - 1]?.output}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      {mode === "sources" ? (
        <div className="space-y-2">
          {task.evidence.map((item) => (
            <div
              key={item.name}
              className="rounded-lg border border-[#E2E7EF] bg-white p-3"
            >
              <div className="flex items-center gap-2">
                <FileSearch className="size-3.5 text-[#6378C8]" />
                <p className="flex-1 text-[9.5px] font-medium text-[#475467]">
                  {item.name}
                </p>
                <span className="text-[8px] text-[#17875D]">{item.state}</span>
              </div>
              <p className="mt-1.5 text-[8px] text-[#98A2B3]">{item.meta}</p>
            </div>
          ))}
        </div>
      ) : null}
      {mode === "versions" ? <VersionList task={task} selected={0} /> : null}
      <div className="sticky bottom-0 mt-3 grid grid-cols-2 gap-2 border-t border-[#E2E7EF] bg-[#F8FAFD] pt-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-[#D8DFEA] text-[9px] text-[#475467]"
        >
          <FileSearch />
          标注修改
        </Button>
        <Button
          type="button"
          size="sm"
          className="bg-[#1F5EFF] text-[9px] text-white hover:bg-[#174ED6]"
        >
          <Send />
          带入对话
        </Button>
      </div>
    </div>
  );
}

function EvidenceViewer({ task, index }: { task: DemoTask; index: number }) {
  const evidence = task.evidence[index] ?? task.evidence[0];
  const isWarning =
    evidence.state.includes("冲突") ||
    evidence.state.includes("不一致") ||
    evidence.state.includes("待");
  return (
    <div className="space-y-3 p-3">
      <section
        className={`rounded-xl border p-3.5 ${isWarning ? "border-[#EBD5A9] bg-[#FFFDF7]" : "border-[#D9E4F4] bg-white"}`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`grid size-8 shrink-0 place-items-center rounded-lg ${isWarning ? "bg-[#FFF1D5] text-[#B06C00]" : "bg-[#EEF3FF] text-[#5670C3]"}`}
          >
            <FileSearch className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold text-[#344054]">
              {evidence.name}
            </p>
            <p className="mt-1 text-[8.5px] text-[#98A2B3]">{evidence.meta}</p>
            <p
              className={`mt-2 text-[9px] font-medium ${isWarning ? "text-[#A96700]" : "text-[#17875D]"}`}
            >
              {evidence.state}
            </p>
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-[#DFE5EE] bg-white p-3.5">
        <p className="text-[9px] font-semibold text-[#344054]">
          支撑的任务判断
        </p>
        <p className="mt-2 text-[9.5px] leading-5 text-[#526176]">
          {task.run.steps[task.run.steps.length - 1]?.output}
        </p>
        <div className="mt-3 rounded-lg bg-[#F5F7FB] p-2.5 text-[8.5px] leading-4 text-[#667085]">
          来源已保留版本、读取身份与命中位置；冲突项不会静默覆盖，会归入对应待办步骤并保留处理状态。
        </div>
      </section>
      <section className="rounded-xl border border-[#DFE5EE] bg-white p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[9px] font-semibold text-[#344054]">关联成果</p>
          <span className="text-[8px] text-[#98A2B3]">
            {Math.min(task.artifacts.length, 3)}项
          </span>
        </div>
        {task.artifacts.slice(0, 3).map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-2 border-t border-[#EEF1F5] py-2 first:border-0"
          >
            <FileText className="size-3.5 text-[#6378C8]" />
            <span className="min-w-0 flex-1 truncate text-[9px] text-[#475467]">
              {item.name}
            </span>
            <span className="text-[7.8px] text-[#98A2B3]">{item.state}</span>
          </div>
        ))}
      </section>
      <Button
        type="button"
        variant="outline"
        className="w-full border-[#D8DFEA] text-[9px] text-[#475467]"
      >
        <ExternalLink />
        打开来源原文
      </Button>
    </div>
  );
}

function VersionList({ task, selected }: { task: DemoTask; selected: number }) {
  return (
    <div className="space-y-2">
      {task.versions.map((version, index) => (
        <div
          key={version.name}
          className={`relative rounded-xl border p-3 ${index === selected ? "border-[#AFC3F4] bg-white shadow-[0_5px_16px_rgba(36,72,138,.07)]" : "border-[#E2E7EF] bg-white"}`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full text-[8px] ${index === selected ? "bg-[#EAF0FF] text-[#2959C7]" : "bg-[#F0F2F5] text-[#7A8699]"}`}
            >
              {task.versions.length - index}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[9.5px] font-medium text-[#344054]">
                {version.name}
              </p>
              <p className="mt-1 text-[8px] text-[#98A2B3]">{version.meta}</p>
            </div>
            {version.locked ? (
              <LockKeyhole className="size-3.5 text-[#667085]" />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function VersionViewer({ task, index }: { task: DemoTask; index: number }) {
  return (
    <div className="space-y-3 p-3">
      <section className="rounded-xl border border-[#D9E3F2] bg-white p-3.5">
        <div className="flex items-center gap-2">
          <GitCompare className="size-4 text-[#586FC3]" />
          <div>
            <p className="text-[10px] font-semibold text-[#344054]">
              版本演进清晰可回退
            </p>
            <p className="mt-1 text-[8.5px] text-[#98A2B3]">
              当前选中：{task.versions[index]?.name}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 w-full border-[#D8DFEA] text-[9px] text-[#475467]"
        >
          <GitCompare />
          与上一版对比
        </Button>
      </section>
      <VersionList task={task} selected={index} />
      <p className="px-1 text-[8px] leading-4 text-[#98A2B3]">
        正式版本只读保护。继续对话会形成新的后续草稿，不覆盖已归档结果。
      </p>
    </div>
  );
}

type BrowserSurface = Extract<TaskSurface, { type: "browser" }>;
type TerminalSurface = Extract<TaskSurface, { type: "terminal" }>;

function BrowserViewer({
  task,
  surface,
}: {
  task: DemoTask;
  surface?: BrowserSurface;
}) {
  const [address, setAddress] = useState(surface?.url ?? "");
  const [allowed, setAllowed] = useState(Boolean(surface));
  const [takeover, setTakeover] = useState(false);
  const zone = surface?.zone ?? "互联网";

  return (
    <div className="flex min-h-full flex-col bg-[#EEF1F5]">
      <div className="border-b border-[#DCE2EA] bg-[#F7F8FA] p-2">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="后退"
            className="text-[#7A8699]"
          >
            <ArrowLeft />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="前进"
            className="text-[#A8B0BC]"
          >
            <ArrowRight />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="刷新"
            className="text-[#7A8699]"
          >
            <RotateCw />
          </Button>
          <div className="ml-0.5 flex h-7 min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#D7DDE6] bg-white px-2 shadow-[inset_0_1px_2px_rgba(16,24,40,.03)]">
            <LockKeyhole className="size-3 shrink-0 text-[#667085]" />
            <input
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                setAllowed(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && address.trim()) setAllowed(false);
              }}
              aria-label="浏览器地址"
              placeholder="输入网址或搜索内容"
              className="min-w-0 flex-1 border-0 bg-transparent text-[8.5px] text-[#475467] outline-none placeholder:text-[#A3ACBA]"
            />
          </div>
          <span
            className={`rounded-md px-1.5 py-1 text-[7.5px] font-medium ${zone === "政务外网" ? "bg-[#E7F4EE] text-[#177251]" : zone === "本地预览" ? "bg-[#EEEAFE] text-[#6657B7]" : "bg-[#E8EFFD] text-[#3D61AF]"}`}
          >
            {zone}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {!allowed ? (
          <div className="grid min-h-[410px] place-items-center rounded-xl border border-[#DCE2EA] bg-white p-6 text-center">
            <div>
              <span className="mx-auto grid size-11 place-items-center rounded-xl bg-[#EEF3FF] text-[#4F69BE]">
                <Globe2 className="size-5" />
              </span>
              <p className="mt-3 text-[11px] font-semibold text-[#344054]">
                {address.trim()
                  ? "允许本任务访问此站点"
                  : "当前任务的内置浏览器"}
              </p>
              <p className="mx-auto mt-2 max-w-[260px] text-[8.8px] leading-4 text-[#7A8699]">
                {address.trim()
                  ? "允许后可读取当前页面。网页内容始终按不可信上下文处理，提交、删除和权限变更仍需单独确认。"
                  : "输入网址开始浏览。浏览器使用独立任务身份，不自动继承个人浏览器标签和登录状态。"}
              </p>
              {address.trim() ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setAllowed(true)}
                  className="mt-4 bg-[#1F5EFF] text-[9px] text-white hover:bg-[#174ED6]"
                >
                  <ShieldCheck />
                  允许本任务读取
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <article className="min-h-[430px] overflow-hidden rounded-xl border border-[#D8DEE7] bg-white shadow-[0_8px_24px_rgba(16,24,40,.055)]">
            <div className="border-b border-[#E6E9EE] bg-[#FBFBFC] px-4 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-[#C83B34] text-[8px] font-semibold text-white">
                    法
                  </span>
                  <div>
                    <p className="text-[9.5px] font-semibold text-[#344054]">
                      国家法律法规数据库
                    </p>
                    <p className="mt-0.5 text-[7.5px] text-[#98A2B3]">
                      权威法律文本检索与查阅
                    </p>
                  </div>
                </div>
                <span className="rounded-md bg-[#F0F2F5] px-2 py-1 text-[7.5px] text-[#667085]">
                  {surface?.status ?? "等待浏览"}
                </span>
              </div>
            </div>
            <div className="px-5 py-5">
              <p className="text-[8px] text-[#98A2B3]">当前位置：首页 / 法律</p>
              <h2 className="mt-4 text-center text-[14px] font-semibold text-[#273247]">
                {surface?.pageTitle ?? "输入网址后开始浏览"}
              </h2>
              <p className="mt-2 text-center text-[8px] text-[#98A2B3]">
                {surface?.pageMeta ?? task.shortTitle}
              </p>
              {surface?.excerpts.map((excerpt, index) => (
                <div
                  key={excerpt}
                  className={`mt-4 rounded-lg border p-3 text-[9px] leading-5 ${index === 0 ? "border-[#CAD8F3] bg-[#F4F7FE] text-[#3E557E]" : "border-[#E6E9EE] text-[#5E6878]"}`}
                >
                  <span className="mr-2 text-[7.5px] font-semibold text-[#6079C7]">
                    命中 {index + 1}
                  </span>
                  {excerpt}
                </div>
              ))}
            </div>
          </article>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-[#DCE2EA] bg-white px-3 py-2.5">
        <span
          className={`size-1.5 rounded-full ${takeover ? "bg-[#6E66D5]" : "bg-[#25A273]"}`}
        />
        <span className="min-w-0 flex-1 truncate text-[8px] text-[#667085]">
          {takeover
            ? "你正在接管浏览 · 敏感动作仍需确认"
            : `${surface?.permission ?? "尚未授权站点"} · ${surface?.action ?? "等待用户打开页面"}`}
        </span>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => setTakeover((value) => !value)}
          className="border-[#D6DDE8] text-[8px] text-[#475467]"
        >
          {takeover ? "交还智能体" : "接管浏览"}
        </Button>
      </div>
    </div>
  );
}

function TerminalViewer({
  task,
  surface,
}: {
  task: DemoTask;
  surface?: TerminalSurface;
}) {
  const [takeover, setTakeover] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [rerun, setRerun] = useState(false);
  const directory = surface?.directory ?? `/任务工作区/${task.shortTitle}`;

  return (
    <div className="flex min-h-full flex-col bg-[#0D1421] text-[#D9E1EE]">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/[.08] bg-[#121C2A] px-3">
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-[#EF6B63]" />
          <span className="size-2 rounded-full bg-[#EAB34F]" />
          <span className="size-2 rounded-full bg-[#4DBD7A]" />
        </div>
        <span className="ml-2 min-w-0 flex-1 truncate font-mono text-[8px] text-[#7F8DA2]">
          {directory}
        </span>
        <span className="flex items-center gap-1 text-[7.5px] text-[#68D7A8]">
          <span className="size-1.5 rounded-full bg-[#43C68F]" />
          {surface?.status ?? "未启动"}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 font-mono text-[8.8px] leading-[1.9]">
        {!cleared && surface ? (
          <>
            <p className="text-[#7F8DA2]"># 智能体执行 · 当前任务沙箱</p>
            <p className="mt-1 text-[#D7E4F5]">
              <span className="text-[#60D7B1]">➜</span> {surface.command}
            </p>
            <div className="mt-3 space-y-1">
              {surface.lines.map((line) => (
                <p
                  key={line.text}
                  className={
                    line.tone === "warning"
                      ? "text-[#F1BE63]"
                      : line.tone === "success"
                        ? "text-[#67D7A7]"
                        : line.tone === "muted"
                          ? "text-[#8090A6]"
                          : "text-[#CFD7E4]"
                  }
                >
                  {line.text}
                </p>
              ))}
              {rerun ? (
                <>
                  <p className="mt-3 text-[#8090A6]">重新运行增量检查…</p>
                  <p className="text-[#67D7A7]">无新增冲突 · 46/46通过</p>
                </>
              ) : null}
            </div>
            <div className="mt-5 rounded-lg border border-[#324154] bg-[#121E2D] p-3 font-sans">
              <p className="text-[8px] font-semibold text-[#8FA2BC]">
                可读结果
              </p>
              <p className="mt-1 text-[9px] leading-4 text-[#D5DEEA]">
                {surface.summary}
              </p>
            </div>
          </>
        ) : (
          <div className="grid min-h-[360px] place-items-center text-center font-sans">
            <div>
              <SquareTerminal className="mx-auto size-6 text-[#56657A]" />
              <p className="mt-3 text-[10px] font-medium text-[#B8C3D2]">
                {cleared ? "终端显示已清空" : "本任务尚未调用终端"}
              </p>
              <p className="mt-1 text-[8px] text-[#6F7D91]">{directory}</p>
            </div>
          </div>
        )}
        {takeover ? (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[#60D7B1]">➜</span>
            <input
              aria-label="终端命令输入"
              placeholder="输入命令…"
              className="min-w-0 flex-1 border-0 bg-transparent font-mono text-[9px] text-white outline-none placeholder:text-[#506075]"
            />
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 border-t border-white/[.08] bg-[#101927] px-3 py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="停止任务"
          className="text-[#8492A6] hover:bg-white/[.06] hover:text-white"
        >
          <CircleStop />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="复制终端输出"
          className="text-[#8492A6] hover:bg-white/[.06] hover:text-white"
        >
          <Copy />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => setCleared(true)}
          className="text-[8px] text-[#8492A6] hover:bg-white/[.06] hover:text-white"
        >
          清空显示
        </Button>
        <div className="flex-1" />
        {surface ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => {
              setCleared(false);
              setRerun(true);
            }}
            className="text-[8px] text-[#8FA5D9] hover:bg-white/[.06] hover:text-white"
          >
            <RotateCw />
            重新运行
          </Button>
        ) : null}
        <Button
          type="button"
          size="xs"
          onClick={() => setTakeover((value) => !value)}
          className={`text-[8px] ${takeover ? "bg-[#635BD2] text-white hover:bg-[#726AE1]" : "bg-[#23324A] text-[#D5DEEA] hover:bg-[#2B3D59]"}`}
        >
          {takeover ? "退出接管" : "接管输入"}
        </Button>
      </div>
    </div>
  );
}

function RightWorkspace({
  task,
  onOpenArtifact,
  onOpenBrowser,
}: {
  task: DemoTask;
  onOpenArtifact: (index: number) => void;
  onOpenBrowser: () => void;
}) {
  const [view, setView] = useState<WorkspaceView>("monitor");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const open = (next: WorkspaceView, index: number) => {
    setSelectedIndex(index);
    setView(next);
  };
  const selectedSurface = task.run.surfaces[selectedIndex];
  const browserSurface =
    selectedSurface?.type === "browser" ? selectedSurface : undefined;
  const terminalSurface =
    selectedSurface?.type === "terminal" ? selectedSurface : undefined;
  const header =
    view === "monitor"
      ? {
          title: "任务监控",
          meta: `${task.run.steps.length}/${task.run.steps.length}步骤 · ${task.run.duration}`,
        }
      : view === "artifact"
        ? {
            title: task.artifacts[selectedIndex]?.name ?? "成果",
            meta: task.artifacts[selectedIndex]?.meta ?? "",
          }
        : view === "evidence"
          ? {
              title: task.evidence[selectedIndex]?.name ?? "依据",
              meta: task.evidence[selectedIndex]?.meta ?? "",
            }
          : view === "version"
            ? {
                title: "版本记录",
                meta: task.versions[selectedIndex]?.name ?? "",
              }
            : view === "browser"
              ? {
                  title: browserSurface?.title ?? "内置浏览器",
                  meta: browserSurface?.action ?? "独立任务身份 · 等待打开页面",
                }
              : {
                  title: terminalSurface?.title ?? "任务终端",
                  meta:
                    terminalSurface?.directory ??
                    `/任务工作区/${task.shortTitle}`,
                };

  return (
    <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden border-l border-[#E2E7EF] bg-[#F8FAFD]">
      <div className="flex h-12 shrink-0 items-center border-b border-[#E2E7EF] bg-white px-2.5">
        {view !== "monitor" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setView("monitor")}
            aria-label="返回任务监控"
            className="mr-1 text-[#667085]"
          >
            <ArrowLeft />
          </Button>
        ) : (
          <ListChecks className="ml-1 mr-2 size-3.5 text-[#5D6C82]" />
        )}
        <p className="min-w-0 flex-1 truncate text-[10.5px] font-semibold text-[#344054]">
          {view === "monitor" ? "任务概览" : header.title}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="切换右侧工作区"
                className="text-[#667085]"
              />
            }
          >
            <Plus />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => setView("monitor")}>
              <ListChecks />
              任务概览
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenArtifact(0)}>
              <FileText />
              文件
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenBrowser}>
              <Globe2 />
              浏览器
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <SquareTerminal />
              终端（按需）
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {view === "monitor" ? (
          <TaskMonitor
            key={`${task.id}-${task.run.steps.length}-${task.externalState}`}
            task={task}
            onOpenArtifact={onOpenArtifact}
            onOpenEvidence={(index) => open("evidence", index)}
            onOpenVersion={(index) => open("version", index)}
          />
        ) : null}
        {view === "artifact" ? (
          <ArtifactViewer
            key={`${task.id}-${selectedIndex}`}
            task={task}
            index={selectedIndex}
          />
        ) : null}
        {view === "evidence" ? (
          <EvidenceViewer task={task} index={selectedIndex} />
        ) : null}
        {view === "version" ? (
          <VersionViewer task={task} index={selectedIndex} />
        ) : null}
        {view === "browser" ? (
          <BrowserViewer task={task} surface={browserSurface} />
        ) : null}
        {view === "terminal" ? (
          <TerminalViewer task={task} surface={terminalSurface} />
        ) : null}
      </div>
    </aside>
  );
}

function TaskWorkspaceFrame({
  layoutId,
  monitorOpen,
  monitorWidth,
  onMonitorWidthChange,
  monitor,
  children,
}: {
  layoutId: string;
  monitorOpen: boolean;
  monitorWidth: number;
  onMonitorWidthChange: (width: number) => void;
  monitor: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <ResizablePanelGroup
      key={`${layoutId}-${monitorOpen ? "monitor-open" : "monitor-closed"}`}
      orientation="horizontal"
      className="min-h-0 flex-1 overflow-hidden"
    >
      <ResizablePanel
        id={layoutId + "-main"}
        minSize="360px"
        className="min-h-0"
      >
        <div className="flex h-full min-h-0 min-w-0 overflow-hidden">
          {children}
        </div>
      </ResizablePanel>
      {monitorOpen ? (
        <>
          <ResizableHandle
            id={layoutId + "-monitor-handle"}
            withHandle
            className="w-1 bg-[#E2E7EF] transition-colors hover:bg-[#9EB3E8] focus-visible:bg-[#7F9CE3]"
          />
          <ResizablePanel
            id={layoutId + "-monitor"}
            defaultSize={String(Math.round(monitorWidth)) + "px"}
            minSize="200px"
            maxSize="25vw"
            onResize={({ inPixels }) => {
              if (Math.abs(inPixels - monitorWidth) > 1) {
                onMonitorWidthChange(inPixels);
              }
            }}
            className="min-h-0"
          >
            {monitor}
          </ResizablePanel>
        </>
      ) : null}
    </ResizablePanelGroup>
  );
}

function buildInspectionRuntimeTask(
  task: DemoTask,
  state: InspectionReviewState,
): DemoTask {
  if (task.id !== "inspection" || state.submittedAnnotations.length === 0) {
    return task;
  }

  const revisionReady = state.version === 2;
  const oaDone = state.oaSubmitted;
  const continuationStep: DemoTask["run"]["steps"][number] = {
    title: "按成果批注修订并更新OA",
    summary: "只修改用户批注的两处表述，生成新版本后由用户在OA页面确认更新。",
    meta: oaDone
      ? "今天 19:21—19:26 · 5分钟"
      : state.modifying
        ? "今天 19:21起 · 正在处理"
        : "今天 19:21—19:24 · 3分钟",
    state: state.modifying ? "running" : "done",
    output: oaDone
      ? "修订稿v2已由林思远在OA页面确认更新；等待领导审阅。"
      : revisionReady
        ? "修订稿v2已生成，两处批注已落稿；待用户写回OA。"
        : "已接收两条批注，正在生成修订稿v2。",
  };

  const continuationTimeline: TimelineItem[] = [
    { type: "stage", label: "继续处理", time: "今天 19:21" },
    {
      type: "user",
      text: "请处理2条成果批注：明确由市司法行政部门牵头；补充问题清单、责任单位、完成时限和闭环销号要求。未批注部分不要调整。",
      time: "今天 19:21",
    },
  ];

  if (revisionReady) {
    continuationTimeline.push(
      {
        type: "assistant",
        title: "已按批注完成精准修订",
        text: "修订稿v2只改动两处：明确牵头部门，并补充问题清单与整改闭环。原统计口径、不扩大为专项行动等约束保持不变。",
        time: "今天 19:24",
      },
      {
        type: "artifacts",
        title: "新版本已归入任务",
        files: ["拟办意见（修订稿v2）.docx"],
        time: "今天 19:24",
      },
    );
  }

  if (oaDone) {
    continuationTimeline.push(
      {
        type: "receipt",
        title: "OA演示连接回执",
        details: [
          "动作：仅更新当前事项拟办正文，不上传内部核验表",
          "身份：林思远（综合处经办岗）本人确认",
          "结果：成功，回执 SZ-OA-DEMO-20260902-1926",
        ],
        time: "今天 19:26",
      },
      {
        type: "completion",
        title: "本轮修订已完成",
        summary:
          "修订稿v2已更新至OA原拟办栏，任务状态回到“等待领导审阅”，全程保留批注、版本与写回回执。",
        highlights: [
          "2条批注全部落稿",
          "未批注内容保持不变",
          "OA最终提交由用户本人完成",
        ],
        time: "今天 19:26",
      },
    );
  }

  const versions = revisionReady
    ? [
        {
          name: "修订稿 v2",
          meta: oaDone
            ? "今天 19:26 · 已更新OA并等待领导审阅"
            : "今天 19:24 · 待写回OA",
          active: true,
          locked: oaDone,
        },
        ...task.versions.map((version) => ({ ...version, active: false })),
      ]
    : task.versions;

  return {
    ...task,
    status: state.modifying ? "处理中" : "已完成",
    externalState: oaDone
      ? "OA待领导审阅"
      : revisionReady
        ? "修订稿v2待写回OA"
        : "正在按批注修订",
    updatedAt: oaDone ? "今天 19:26" : revisionReady ? "今天 19:24" : "刚刚",
    artifacts: task.artifacts.map((artifact, index) =>
      index === 0 && revisionReady
        ? {
            ...artifact,
            meta: "DOCX · 修订稿v2",
            state: oaDone ? "OA待审" : "待写回",
          }
        : artifact,
    ),
    versions,
    run: {
      ...task.run,
      phase: oaDone
        ? "本轮修订完成 · 等待领导审阅"
        : revisionReady
          ? "修订稿v2已生成 · 待写回OA"
          : "正在执行本轮修订",
      duration: oaDone ? "1小时23分" : task.run.duration,
      steps: [...task.run.steps, continuationStep],
      interventions: [
        ...task.run.interventions,
        ...(revisionReady
          ? [
              {
                stepIndex: task.run.steps.length,
                title: "批注修订已生成新版本",
                meta: "2条批注均已落稿 · 19:24",
                state: "已完成",
                tone: "success" as const,
              },
            ]
          : []),
        ...(oaDone
          ? [
              {
                stepIndex: task.run.steps.length,
                title: "用户在OA页面确认更新",
                meta: "林思远本人提交 · 19:26",
                state: "已确认",
                tone: "success" as const,
              },
            ]
          : []),
      ],
    },
    timeline: [...task.timeline, ...continuationTimeline],
  };
}

function buildLegalContinuationTask(
  task: DemoTask,
  state: GenericRevisionState,
): DemoTask {
  if (task.id !== "legal" || state.annotations.length === 0) return task;

  const annotationCount = state.annotations.length;
  const annotatedIndexes = [
    ...new Set(state.annotations.map((annotation) => annotation.artifactIndex)),
  ];
  const artifactNames = annotatedIndexes
    .map((index) => task.artifacts[index]?.name)
    .filter((name): name is string => Boolean(name));
  const scopeLabel = artifactNames.join("、");
  const revisionReady = state.revision === 2 && !state.modifying;
  const continuationStep: DemoTask["run"]["steps"][number] = {
    title: "基于OA归档版创建后续修订草稿",
    summary: `处理${scopeLabel}上的${annotationCount}条定位批注，不改变OA归档版。`,
    meta: state.modifying ? "刚刚 · 正在创建工作副本" : "刚刚 · 已完成",
    state: state.modifying ? "running" : "done",
    output: state.modifying
      ? "已锁定原OA归档版，正在复制为后续修订草稿并处理批注。"
      : `后续修订草稿v2已生成；${annotationCount}条批注已落稿，原OA归档版和回执保持不变。`,
  };
  const continuationTimeline: TimelineItem[] = [
    { type: "stage", label: "归档后继续修改", time: "刚刚" },
    {
      type: "user",
      text: `请按我在${scopeLabel}上的${annotationCount}条批注创建后续修订草稿。原OA归档版保持不变，未批注内容不要调整。`,
      time: "刚刚",
    },
    {
      type: "assistant",
      title: state.modifying ? "正在创建工作副本" : "后续修订草稿v2已生成",
      text: state.modifying
        ? "原OA归档版已保持锁定。我正在创建新的工作草稿，并把定位批注同步到关联成果。"
        : `已处理${annotationCount}条批注。新的工作草稿可以继续审阅；原OA归档版、归档时间和外部回执均未改变。`,
      time: "刚刚",
    },
  ];

  if (revisionReady) {
    continuationTimeline.push({
      type: "artifacts",
      title: "后续修订草稿已归入当前任务",
      files: artifactNames.map((name) => `${name}（后续修订草稿v2）`),
      time: "刚刚",
    });
  }

  return {
    ...task,
    status: state.modifying ? "处理中" : "待确认",
    externalState: state.modifying
      ? "OA归档版保持不变 · 正在创建工作草稿"
      : "OA归档版保持不变 · 工作草稿v2待审阅",
    updatedAt: "刚刚",
    artifacts: task.artifacts.map((artifact, index) =>
      revisionReady && annotatedIndexes.includes(index)
        ? {
            ...artifact,
            meta: `${artifact.meta.split("·")[0]?.trim()} · 后续修订草稿v2`,
            state: "工作副本",
          }
        : artifact,
    ),
    versions: revisionReady
      ? [
          {
            name: "后续修订草稿 v2",
            meta: `刚刚 · ${annotationCount}条批注已落稿 · 未写回OA`,
            active: true,
          },
          ...task.versions.map((version) => ({ ...version, active: false })),
        ]
      : task.versions,
    run: {
      ...task.run,
      phase: state.modifying ? "正在创建后续修订草稿" : "工作草稿v2待审阅",
      steps: [...task.run.steps, continuationStep],
      interventions: [
        ...task.run.interventions,
        ...(revisionReady
          ? [
              {
                stepIndex: task.run.steps.length,
                title: "归档版已保护并创建工作副本",
                meta: `${annotationCount}条批注已落稿 · 刚刚`,
                state: "已完成",
                tone: "success" as const,
              },
            ]
          : []),
      ],
    },
    timeline: [...task.timeline, ...continuationTimeline],
  };
}

function buildAnnualContinuationTask(
  task: DemoTask,
  state: GenericRevisionState,
): DemoTask {
  if (task.id !== "annual" || state.annotations.length === 0) return task;

  const annotationCount = state.annotations.length;
  const annotatedIndexes = [
    ...new Set(state.annotations.map((annotation) => annotation.artifactIndex)),
  ];
  const touchesMaster = annotatedIndexes.includes(0);
  const affectedIndexes = touchesMaster
    ? task.artifacts.map((_, index) => index)
    : annotatedIndexes;
  const annotatedNames = annotatedIndexes
    .map((index) => task.artifacts[index]?.name)
    .filter((name): name is string => Boolean(name));
  const affectedNames = affectedIndexes
    .map((index) => task.artifacts[index]?.name)
    .filter((name): name is string => Boolean(name));
  const revisionReady = state.revision === 2 && !state.modifying;
  const continuationStep: DemoTask["run"]["steps"][number] = {
    title: "分析影响并生成协同修订稿",
    summary: touchesMaster
      ? `处理母稿上的${annotationCount}条批注，并同步检查三项派生成果。`
      : `处理${annotatedNames.join("、")}上的${annotationCount}条定位批注。`,
    meta: state.modifying ? "刚刚 · 正在分析影响" : "刚刚 · 已完成",
    state: state.modifying ? "running" : "done",
    output: state.modifying
      ? "原会议服务版保持锁定，正在根据事实节点计算受影响成果。"
      : `协同修订稿v2已生成；${affectedNames.join("、")}已完成更新与关联复检。`,
  };
  const continuationTimeline: TimelineItem[] = [
    { type: "stage", label: "会议版后续修订", time: "刚刚" },
    {
      type: "user",
      text: `请按我在${annotatedNames.join("、")}上的${annotationCount}条批注修改。原会议服务版保持不变，并同步检查所有受影响的派生成果。`,
      time: "刚刚",
    },
    {
      type: "assistant",
      title: state.modifying ? "正在计算成果影响范围" : "协同修订稿v2已生成",
      text: state.modifying
        ? touchesMaster
          ? "批注命中母报告，已通过事实节点定位领导汇报提纲、讲话参考和备答要点中的关联内容。"
          : "已锁定批注位置，正在检查该成果是否反向影响母稿事实节点。"
        : `已处理${annotationCount}条批注并更新${affectedNames.length}项受影响成果。原会议服务版、提交时间和接收回执均未改变。`,
      time: "刚刚",
    },
  ];

  if (revisionReady) {
    continuationTimeline.push(
      {
        type: "quality",
        title: "派生成果关联复检通过",
        issue: touchesMaster
          ? "母稿事实节点发生变化，需要检查三个派生成果的引用。"
          : "批注成果可能与母稿事实节点产生反向不一致。",
        resolution: `已检查${affectedNames.join("、")}，当前协同修订稿中的事实和表述保持一致。`,
        time: "刚刚",
      },
      {
        type: "artifacts",
        title: "协同修订稿已归入当前任务",
        files: affectedNames.map((name) => `${name}（协同修订稿v2）`),
        time: "刚刚",
      },
    );
  }

  return {
    ...task,
    status: state.modifying ? "处理中" : "待确认",
    externalState: state.modifying
      ? "会议服务版保持不变 · 正在生成协同草稿"
      : "会议服务版保持不变 · 协同修订稿v2待审阅",
    updatedAt: "刚刚",
    artifacts: task.artifacts.map((artifact, index) =>
      revisionReady && affectedIndexes.includes(index)
        ? {
            ...artifact,
            meta: `${artifact.meta.split("·")[0]?.trim()} · 协同修订稿v2`,
            state: "工作副本",
          }
        : artifact,
    ),
    versions: revisionReady
      ? [
          {
            name: "协同修订稿 v2",
            meta: `刚刚 · ${annotationCount}条批注 · ${affectedNames.length}项成果已复检 · 未重新提交`,
            active: true,
          },
          ...task.versions.map((version) => ({ ...version, active: false })),
        ]
      : task.versions,
    run: {
      ...task.run,
      phase: state.modifying ? "正在生成协同修订草稿" : "协同修订稿v2待审阅",
      steps: [...task.run.steps, continuationStep],
      interventions: [
        ...task.run.interventions,
        ...(revisionReady
          ? [
              {
                stepIndex: task.run.steps.length,
                title: "母稿与派生成果已联动复检",
                meta: `${affectedNames.length}项成果 · 刚刚`,
                state: "已完成",
                tone: "success" as const,
              },
            ]
          : []),
      ],
    },
    timeline: [...task.timeline, ...continuationTimeline],
  };
}

function buildGenericRevisionTask(
  task: DemoTask,
  state: GenericRevisionState,
): DemoTask {
  if (task.id === "legal") return buildLegalContinuationTask(task, state);
  if (task.id === "annual") return buildAnnualContinuationTask(task, state);
  if (state.annotations.length === 0) return task;

  const annotatedIndexes = [
    ...new Set(state.annotations.map((annotation) => annotation.artifactIndex)),
  ];
  const artifactNames = annotatedIndexes
    .map((index) => task.artifacts[index]?.name)
    .filter((name): name is string => Boolean(name));
  const annotationCount = state.annotations.length;
  const revisionReady = state.revision === 2 && !state.modifying;
  const scopeLabel = artifactNames.join("、");
  const revisionFiles = annotatedIndexes.map((index) => {
    const artifact = task.artifacts[index];
    const format = artifact?.meta.split("·")[0]?.trim().toLowerCase() ?? "file";
    return `${artifact?.name ?? "任务成果"}（修订稿v2）.${format}`;
  });
  const continuationStep: DemoTask["run"]["steps"][number] = {
    title: "按成果批注生成修订版",
    summary: `汇总处理${annotationCount}条批注，只修改明确定位的内容。`,
    meta: state.modifying ? "刚刚 · 正在处理" : "刚刚 · 已完成",
    state: state.modifying ? "running" : "done",
    output: state.modifying
      ? `已锁定${scopeLabel}上的${annotationCount}条批注，正在生成修订稿v2。`
      : `${annotationCount}条批注已全部落稿，原成果标签已刷新为修订稿v2。`,
  };
  const continuationTimeline: TimelineItem[] = [
    { type: "stage", label: "继续完善成果", time: "刚刚" },
    {
      type: "user",
      text: `请按我在${scopeLabel}上的${annotationCount}条批注统一修改，未批注内容不要调整。`,
      time: "刚刚",
    },
    {
      type: "assistant",
      title: state.modifying ? "正在按批注生成修订稿" : "已完成本轮精准修订",
      text: state.modifying
        ? `已接收${annotationCount}条带定位的批注，正在逐项修改并检查相关内容是否需要同步。`
        : `已处理${annotationCount}条批注，未批注内容保持不变。修订稿v2已刷新到原成果标签，可继续审阅。`,
      time: "刚刚",
    },
  ];

  if (revisionReady) {
    continuationTimeline.push({
      type: "artifacts",
      title: "修订稿v2已归入当前任务",
      files: revisionFiles,
      time: "刚刚",
    });
  }

  return {
    ...task,
    status: state.modifying ? "处理中" : "已完成",
    externalState: state.modifying ? "正在生成修订稿v2" : "修订稿v2待确认",
    updatedAt: "刚刚",
    artifacts: task.artifacts.map((artifact, index) =>
      annotatedIndexes.includes(index) && revisionReady
        ? {
            ...artifact,
            meta: `${artifact.meta.split("·")[0]?.trim()} · 修订稿v2`,
            state: "新版本",
          }
        : artifact,
    ),
    versions: revisionReady
      ? [
          {
            name: "成果修订稿 v2",
            meta: `刚刚 · ${annotationCount}条批注已落稿`,
            active: true,
          },
          ...task.versions.map((version) => ({ ...version, active: false })),
        ]
      : task.versions,
    run: {
      ...task.run,
      phase: state.modifying ? "正在执行本轮修订" : "修订稿v2待确认",
      steps: [...task.run.steps, continuationStep],
      interventions: [
        ...task.run.interventions,
        ...(revisionReady
          ? [
              {
                stepIndex: task.run.steps.length,
                title: "成果批注已形成新版本",
                meta: `${annotationCount}条批注均已落稿 · 刚刚`,
                state: "已完成",
                tone: "success" as const,
              },
            ]
          : []),
      ],
    },
    timeline: [...task.timeline, ...continuationTimeline],
  };
}

function HistoryWorkspace({
  task,
  browserSession,
  manualBrowserState,
  monitorOpen,
  monitorWidth,
  inspectionReviewState,
  genericRevisionState,
  onManualBrowserChange,
  onSubmitAnnotations,
  onMonitorWidthChange,
  onInspectionReviewChange,
  onOpenArtifact,
  onOpenReference,
  onOpenReceipt,
  onOpenManualBrowser,
  onCloseBrowser,
  modelMode,
  onModelModeChange,
  routing,
  onRoutingChange,
}: {
  task: DemoTask;
  browserSession: TaskBrowserSession;
  manualBrowserState: ManualBrowserState;
  monitorOpen: boolean;
  monitorWidth: number;
  inspectionReviewState: InspectionReviewState;
  genericRevisionState: GenericRevisionState;
  onManualBrowserChange: (state: ManualBrowserState) => void;
  onSubmitAnnotations: (annotations: SubmittedArtifactAnnotation[]) => void;
  onMonitorWidthChange: (width: number) => void;
  onInspectionReviewChange: (state: InspectionReviewState) => void;
  onOpenArtifact: (index: number) => void;
  onOpenReference: (source: string) => void;
  onOpenReceipt: () => void;
  onOpenManualBrowser: () => void;
  onCloseBrowser: () => void;
  modelMode: ModelMode;
  onModelModeChange: (mode: ModelMode) => void;
  routing: RoutingConfig;
  onRoutingChange: (routing: RoutingConfig) => void;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const renderedTask = task;
  const [continuation, setContinuation] = useState("");
  const [composerContexts, setComposerContexts] = useState<TaskContext[]>([]);
  const [commandMode, setCommandMode] = useState<TaskCommandMode>("standard");
  const [permissionMode, setPermissionMode] =
    useState<TaskPermissionMode>("standard");
  const [followups, setFollowups] = useState<
    Array<{ text: string; mode: TaskCommandMode }>
  >([]);

  const addComposerContext = (context: TaskContext) => {
    setComposerContexts((items) =>
      items.some((item) => item.id === context.id) ? items : [...items, context],
    );
  };

  const submitContinuation = () => {
    const text = continuation.trim();
    if (!text) return;
    setFollowups((items) => [...items, { text, mode: commandMode }]);
    setContinuation("");
  };

  useEffect(() => {
    const node = timelineRef.current;
    if (!node) return;
    const scrollToLatest = () => {
      node.scrollTop = node.scrollHeight;
    };
    scrollToLatest();
    const frame = window.requestAnimationFrame(scrollToLatest);
    const timer = window.setTimeout(scrollToLatest, 120);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [
    task.id,
    browserSession.open,
    inspectionReviewState.version,
    inspectionReviewState.oaSubmitted,
    genericRevisionState.revision,
    genericRevisionState.modifying,
  ]);

  const browserPanel =
    task.id === "inspection" && browserSession.kind === "inspection" ? (
      <InspectionReviewWorkspace
        state={inspectionReviewState}
        onChange={onInspectionReviewChange}
        onClose={onCloseBrowser}
      />
    ) : (
      <ManualTaskBrowserWorkspace
        task={renderedTask}
        state={manualBrowserState}
        revisionStatus={
          genericRevisionState.annotations.length === 0
            ? "idle"
            : genericRevisionState.modifying
              ? "modifying"
              : "ready"
        }
        onChange={onManualBrowserChange}
        onSubmitAnnotations={onSubmitAnnotations}
        onClose={onCloseBrowser}
      />
    );
  const rightPanel = browserSession.open ? (
    browserPanel
  ) : (
    <RightWorkspace
      task={renderedTask}
      onOpenArtifact={onOpenArtifact}
      onOpenBrowser={onOpenManualBrowser}
    />
  );

  return (
    <TaskWorkspaceFrame
      layoutId={renderedTask.id}
      monitorOpen={browserSession.open || monitorOpen}
      monitorWidth={monitorWidth}
      onMonitorWidthChange={onMonitorWidthChange}
      monitor={rightPanel}
    >
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <div
          ref={timelineRef}
          className="min-h-0 flex-1 overflow-y-auto bg-[#FCFDFE] scroll-smooth"
        >
          <div className="w-full max-w-[780px] px-7 pb-12 pt-7">
            <div className="mb-7 flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-[#DCE4F4] bg-white px-2.5 py-1.5 text-[9.5px] text-[#52698F]">
                {renderedTask.sourceCount}项来源
              </span>
              <span className="rounded-lg border border-[#DCE4F4] bg-white px-2.5 py-1.5 text-[9.5px] text-[#52698F]">
                {renderedTask.artifactCount}项成果
              </span>
              {renderedTask.skills.slice(0, 2).map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg border border-[#E2DFF5] bg-[#F8F6FF] px-2.5 py-1.5 text-[9.5px] text-[#695FA4]"
                >
                  / {skill}
                </span>
              ))}
            </div>
            {renderedTask.timeline.map((item, index) => (
              <TimelineCard
                key={`${item.type}-${item.time}-${index}`}
                item={item}
                onOpenArtifact={(file) => {
                  const artifactIndex = file
                    ? renderedTask.artifacts.findIndex((artifact) =>
                        file.startsWith(artifact.name),
                      )
                    : 0;
                  onOpenArtifact(artifactIndex >= 0 ? artifactIndex : 0);
                }}
                onOpenSource={
                  renderedTask.id === "legal" || renderedTask.id === "annual"
                    ? onOpenReference
                    : undefined
                }
                onOpenReceipt={
                  renderedTask.id === "legal" || renderedTask.id === "annual"
                    ? onOpenReceipt
                    : undefined
                }
              />
            ))}
            {followups.map((followup, index) => (
              <div key={`${followup.mode}-${index}`}>
                <TimelineCard
                  item={{ type: "user", text: followup.text, time: "刚刚" }}
                />
                <TimelineCard
                  item={{
                    type: "assistant",
                    title:
                      followup.mode === "plan"
                        ? "Plan · 先规划"
                        : followup.mode === "goal"
                          ? "Goal · 持续推进"
                          : followup.mode === "browser"
                            ? "Browser · 任务内浏览"
                            : "已收到补充要求",
                    text:
                      followup.mode === "plan"
                        ? "我会先读取已授权上下文并形成可审阅计划，在你确认前不执行写入或外发动作。"
                        : followup.mode === "goal"
                          ? "我会围绕该目标持续推进、维护待办和阶段状态，只在边界不清或高风险动作前停下来确认。"
                          : followup.mode === "browser"
                            ? "已把网页访问限定在当前任务浏览器中；页面内容按不可信上下文处理，提交与写入仍需你确认。"
                            : "我会在当前任务中继续处理，新增成果、依据与版本会同步进入任务概览。",
                    time: "刚刚",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="shrink-0 border-t border-[#E5E9F0] bg-white px-5 py-3">
          <div className="max-w-[760px]">
            <TaskComposer
              value={continuation}
              onChange={setContinuation}
              onSubmit={submitContinuation}
              contexts={composerContexts}
              onAddContext={addComposerContext}
              onRemoveContext={(id) =>
                setComposerContexts((items) => items.filter((item) => item.id !== id))
              }
              commandMode={commandMode}
              onCommandModeChange={setCommandMode}
              permissionMode={permissionMode}
              onPermissionModeChange={setPermissionMode}
              modelMode={modelMode}
              onModelModeChange={onModelModeChange}
              routing={routing}
              onRoutingChange={onRoutingChange}
              placeholder="继续完善这项工作，将生成新的后续草稿…"
              onBrowserCommand={onOpenManualBrowser}
            />
          </div>
        </div>
      </section>
    </TaskWorkspaceFrame>
  );
}

function DraftTaskMonitor() {
  const steps = [
    { label: "识别目标与交付要求", meta: "已完成 · 刚刚", state: "done" },
    {
      label: "确认材料与读取范围",
      meta: "等待你添加材料或授权",
      state: "waiting",
    },
    { label: "调用专业能力并执行", meta: "尚未开始", state: "pending" },
    { label: "质量检查与交付", meta: "尚未开始", state: "pending" },
  ];

  return (
    <aside className="flex min-w-0 flex-col border-l border-[#E2E7EF] bg-[#F8FAFD]">
      <div className="flex h-12 shrink-0 items-center border-b border-[#E2E7EF] bg-white px-2.5">
        <ListChecks className="ml-1 mr-2 size-3.5 text-[#5D6C82]" />
        <p className="min-w-0 flex-1 truncate text-[10.5px] font-semibold text-[#344054]">
          任务概览
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Accordion
          multiple
          defaultValue={["todos"]}
          className="bg-white"
        >
          <AccordionItem value="todos" className="border-b border-[#E6E9EE] px-4">
            <AccordionTrigger className="h-12 rounded-none py-0 text-[11px] font-semibold text-[#344054] hover:no-underline">
              <span className="flex min-w-0 flex-1 items-center">
                <span>待办</span>
                <span className="ml-2 text-[8.5px] font-normal text-[#98A2B3]">1/4</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <ol className="space-y-2.5">
                {steps.map((step) => (
                  <li
                    key={step.label}
                    className="flex items-start gap-2.5"
                  >
                    <span
                      className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${step.state === "done" ? "border-[#BFE7D4] bg-[#EAF8F1] text-[#20A06B]" : step.state === "waiting" ? "border-[#E8C981] bg-[#FFF8EA] text-[#C27A14]" : "border-[#D7DCE4] bg-white text-[#98A2B3]"}`}
                    >
                      {step.state === "done" ? (
                        <Check className="size-2.5" strokeWidth={2.5} />
                      ) : (
                        <span className="size-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <span
                      className={`min-w-0 flex-1 text-[10px] leading-[1.55] ${step.state === "done" ? "text-[#8A929F] line-through decoration-[#C3C9D2]" : "text-[#475467]"}`}
                    >
                      {step.label}
                    </span>
                  </li>
                ))}
              </ol>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="artifacts" className="border-b border-[#E6E9EE] px-4">
            <AccordionTrigger className="h-12 rounded-none py-0 text-[11px] font-semibold text-[#344054] hover:no-underline">
              <span className="flex min-w-0 flex-1 items-center">
                <span>任务产物</span>
                <span className="ml-2 text-[8.5px] font-normal text-[#98A2B3]">0</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-[9px] text-[#98A2B3]">
              执行后将在此直接列出产物文件。
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="capabilities" className="border-b border-[#E6E9EE] px-4">
            <AccordionTrigger className="h-12 rounded-none py-0 text-[11px] font-semibold text-[#344054] hover:no-underline">
              <span className="flex min-w-0 flex-1 items-center">
                <span>能力调用</span>
                <span className="ml-2 text-[8.5px] font-normal text-[#98A2B3]">0</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-[8.5px] text-[#98A2B3]">
              执行后只显示本任务实际调用的能力。
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="memory" className="px-4">
            <AccordionTrigger className="h-12 rounded-none py-0 text-[11px] font-semibold text-[#344054] hover:no-underline">
              <span className="flex min-w-0 flex-1 items-center">
                <span>记忆与进化</span>
                <span className="ml-2 text-[8.5px] font-normal text-[#98A2B3]">0</span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="flex items-center gap-2 py-1 text-[8.5px] text-[#98A2B3]">
                <BrainCircuit className="size-3.5 text-[#9A93B8]" />
                本任务未调用或产生记忆项
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </aside>
  );
}

function DraftWorkspace({
  prompt,
  contexts,
  onAddContext,
  onRemoveContext,
  commandMode,
  onCommandModeChange,
  permissionMode,
  onPermissionModeChange,
  monitorOpen,
  monitorWidth,
  onMonitorWidthChange,
  modelMode,
  onModelModeChange,
  routing,
  onRoutingChange,
}: {
  prompt: string;
  contexts: TaskContext[];
  onAddContext: (context: TaskContext) => void;
  onRemoveContext: (id: string) => void;
  commandMode: TaskCommandMode;
  onCommandModeChange: (mode: TaskCommandMode) => void;
  permissionMode: TaskPermissionMode;
  onPermissionModeChange: (mode: TaskPermissionMode) => void;
  monitorOpen: boolean;
  monitorWidth: number;
  onMonitorWidthChange: (width: number) => void;
  modelMode: ModelMode;
  onModelModeChange: (mode: ModelMode) => void;
  routing: RoutingConfig;
  onRoutingChange: (routing: RoutingConfig) => void;
}) {
  const [continuation, setContinuation] = useState("");
  const [followups, setFollowups] = useState<
    Array<{ text: string; mode: TaskCommandMode }>
  >([]);
  const submitContinuation = () => {
    const text = continuation.trim();
    if (!text) return;
    setFollowups((items) => [...items, { text, mode: commandMode }]);
    setContinuation("");
  };

  return (
    <TaskWorkspaceFrame
      layoutId="draft"
      monitorOpen={monitorOpen}
      monitorWidth={monitorWidth}
      onMonitorWidthChange={onMonitorWidthChange}
      monitor={<DraftTaskMonitor />}
    >
      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#FCFDFE]">
          <div className="w-full max-w-[760px] px-7 py-8">
            <TimelineCard item={{ type: "user", text: prompt, time: "刚刚" }} />
            {contexts.length ? (
              <div className="mb-5 ml-[58px] flex flex-wrap items-center gap-1.5 text-[9.5px] text-[#7A8798]">
                <span>本任务已带入</span>
                {contexts.map((context) => (
                  <span
                    key={`${context.kind}-${context.id}`}
                    className={`inline-flex max-w-[420px] items-center gap-1.5 rounded-lg border px-2 py-1 ${contextTone(context.kind)}`}
                  >
                    <ContextIcon kind={context.kind} className="size-3" />
                    <span className="truncate">
                      {contextPrefix(context.kind)} · {context.label}
                    </span>
                  </span>
                ))}
                <span>· 仅限本任务</span>
              </div>
            ) : null}
            <TimelineCard
              item={{
                type: "assistant",
                title:
                  commandMode === "plan"
                    ? "Plan · 已进入先规划模式"
                    : commandMode === "goal"
                      ? "Goal · 已建立持续目标"
                      : commandMode === "browser"
                        ? "Browser · 已建立浏览任务"
                        : "已理解任务目标",
                text:
                  commandMode === "plan"
                    ? "我会先在当前权限内梳理范围、风险与执行步骤，计划经你确认后才开始实施。"
                    : commandMode === "goal"
                      ? "我会围绕目标持续维护计划、状态和成果，只在边界不清或高风险动作前向你确认。"
                      : commandMode === "browser"
                        ? "任务内浏览器将在任务建立后打开；网页内容按不可信上下文处理，写入和提交仍需确认。"
                        : "我会先确认交付要求、材料范围和权限边界，再组织执行计划。当前没有读取任何文件或业务系统。",
                bullets: [
                  "保留用户提供的事实和约束",
                  "先展示计划，再执行高风险动作",
                  "结果、依据和版本将进入右侧工作区",
                ],
                time: "刚刚",
              }}
            />
            <TimelineCard
              item={{
                type: "plan",
                title: "建议执行计划",
                steps: [
                  "确认交付形式",
                  "选择材料与范围",
                  "调用专业能力",
                  "形成并检查成果",
                ],
                time: "刚刚",
              }}
            />
            <TimelineCard
              item={{
                type: "confirmation",
                title: "等待材料或读取授权",
                summary:
                  "请添加本次任务要使用的文件，或从项目、资料库和已授权连接器中选择。系统会先列出读取范围。",
                result: "尚未授权，不会自动读取",
                time: "当前",
              }}
            />
            {followups.map((followup, index) => (
              <div key={`${followup.mode}-${index}`}>
                <TimelineCard item={{ type: "user", text: followup.text, time: "刚刚" }} />
                <TimelineCard
                  item={{
                    type: "assistant",
                    title:
                      followup.mode === "plan"
                        ? "已补充到执行计划"
                        : followup.mode === "goal"
                          ? "已更新持续目标"
                          : followup.mode === "browser"
                            ? "已更新浏览目标"
                            : "已更新任务要求",
                    text: "本轮补充已并入当前任务，不会新建另一条会话；权限、模型与已选能力继续按本任务状态生效。",
                    time: "刚刚",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="shrink-0 border-t border-[#E5E9F0] bg-white px-5 py-3">
          <div className="max-w-[740px]">
            <TaskComposer
              value={continuation}
              onChange={setContinuation}
              onSubmit={submitContinuation}
              contexts={contexts}
              onAddContext={onAddContext}
              onRemoveContext={onRemoveContext}
              commandMode={commandMode}
              onCommandModeChange={onCommandModeChange}
              permissionMode={permissionMode}
              onPermissionModeChange={onPermissionModeChange}
              modelMode={modelMode}
              onModelModeChange={onModelModeChange}
              routing={routing}
              onRoutingChange={onRoutingChange}
              placeholder="补充要求，或添加本次任务材料…"
            />
          </div>
        </div>
      </section>
    </TaskWorkspaceFrame>
  );
}

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("new");
  const [activeTask, setActiveTask] = useState<TaskKey | null>(null);
  const [composer, setComposer] = useState("");
  const [taskContexts, setTaskContexts] = useState<TaskContext[]>([]);
  const [newTaskCommandMode, setNewTaskCommandMode] =
    useState<TaskCommandMode>("standard");
  const [newTaskPermissionMode, setNewTaskPermissionMode] =
    useState<TaskPermissionMode>("standard");
  const [draftPrompt, setDraftPrompt] = useState("");
  const [draftCommandMode, setDraftCommandMode] =
    useState<TaskCommandMode>("standard");
  const [draftPermissionMode, setDraftPermissionMode] =
    useState<TaskPermissionMode>("standard");
  const [defaultModelMode, setDefaultModelMode] = useState<ModelMode>({
    type: "smart",
  });
  const [defaultRouting, setDefaultRouting] = useState<RoutingConfig>(() =>
    cloneRoutingConfig(defaultRoutingConfig),
  );
  const [newTaskModelMode, setNewTaskModelMode] = useState<ModelMode>({
    type: "smart",
  });
  const [newTaskRouting, setNewTaskRouting] = useState<RoutingConfig>(() =>
    cloneRoutingConfig(defaultRoutingConfig),
  );
  const [draftModelMode, setDraftModelMode] = useState<ModelMode>({
    type: "smart",
  });
  const [draftRouting, setDraftRouting] = useState<RoutingConfig>(() =>
    cloneRoutingConfig(defaultRoutingConfig),
  );
  const [taskModelModes, setTaskModelModes] = useState<
    Record<TaskKey, ModelMode>
  >(initialTaskModelModes);
  const [taskRoutingConfigs, setTaskRoutingConfigs] = useState<
    Record<TaskKey, RoutingConfig>
  >(initialTaskRoutingConfigs);
  const [monitorOpen, setMonitorOpen] = useState(false);
  const [monitorWidth, setMonitorWidth] = useState(300);
  const [browserSessions, setBrowserSessions] = useState<
    Record<TaskKey, TaskBrowserSession>
  >(initialTaskBrowserSessions);
  const [manualBrowserStates, setManualBrowserStates] = useState<
    Record<TaskKey, ManualBrowserState>
  >(initialManualBrowserStates);
  const [genericRevisionStates, setGenericRevisionStates] = useState<
    Record<TaskKey, GenericRevisionState>
  >(initialGenericRevisionStates);
  const [inspectionReviewState, setInspectionReviewState] =
    useState<InspectionReviewState>(initialInspectionReviewState);

  const baseTask = useMemo(
    () => (activeTask ? demoTasks[activeTask] : null),
    [activeTask],
  );
  const task = useMemo(
    () =>
      baseTask
        ? buildGenericRevisionTask(
            buildInspectionRuntimeTask(baseTask, inspectionReviewState),
            genericRevisionStates[baseTask.id],
          )
        : null,
    [baseTask, inspectionReviewState, genericRevisionStates],
  );

  const newTask = () => {
    setView("new");
    setActiveTask(null);
    setComposer("");
    setTaskContexts([]);
    setNewTaskCommandMode("standard");
    setNewTaskPermissionMode("standard");
    setMonitorOpen(false);
    setNewTaskModelMode(defaultModelMode);
    setNewTaskRouting(cloneRoutingConfig(defaultRouting));
  };

  const openCapability = (
    capabilityView: Extract<
      ViewMode,
      "library" | "memory" | "agents" | "skills" | "extensions" | "automation"
    >,
  ) => {
    setView(capabilityView);
    setActiveTask(null);
    setMonitorOpen(false);
  };

  const openSettings = () => {
    setView("settings");
    setActiveTask(null);
    setMonitorOpen(false);
  };

  const useTaskContext = (context: TaskContext) => {
    setTaskContexts((items) =>
      items.some((item) => item.id === context.id) ? items : [...items, context],
    );
    setView("new");
    setActiveTask(null);
    setComposer("");
    setMonitorOpen(false);
  };

  const startTask = () => {
    if (!composer.trim()) return;
    setDraftPrompt(composer.trim());
    setDraftCommandMode(newTaskCommandMode);
    setDraftPermissionMode(newTaskPermissionMode);
    setDraftModelMode(newTaskModelMode);
    setDraftRouting(cloneRoutingConfig(newTaskRouting));
    setComposer("");
    setActiveTask(null);
    setMonitorOpen(false);
    setView("draft");
  };

  const openTask = (key: TaskKey) => {
    setActiveTask(key);
    setView("history");
  };

  useEffect(() => {
    const compactViewport = window.matchMedia("(max-width: 1120px)");
    const collapseForCompactViewport = () => {
      if (compactViewport.matches) setSidebarCollapsed(true);
    };
    collapseForCompactViewport();
    compactViewport.addEventListener("change", collapseForCompactViewport);
    return () =>
      compactViewport.removeEventListener("change", collapseForCompactViewport);
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const commandKey = event.metaKey || event.ctrlKey;
      if (commandKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
        return;
      }
      if (commandKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        newTask();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  });

  const openManualBrowser = () => {
    if (!activeTask) return;
    setMonitorOpen(false);
    setBrowserSessions((sessions) => ({
      ...sessions,
      [activeTask]: { open: true, kind: "manual" },
    }));
  };

  const closeRightDock = () => {
    setMonitorOpen(false);
    if (activeTask) {
      setBrowserSessions((sessions) => ({
        ...sessions,
        [activeTask]: { ...sessions[activeTask], open: false },
      }));
    }
  };

  const showTaskSummary = () => {
    if (activeTask) {
      setBrowserSessions((sessions) => ({
        ...sessions,
        [activeTask]: { ...sessions[activeTask], open: false },
      }));
    }
    setMonitorOpen(true);
  };

  const openInspectionReview = () => {
    if (!activeTask) return;
    setMonitorOpen(false);
    setBrowserSessions((sessions) => ({
      ...sessions,
      [activeTask]: { open: true, kind: "inspection" },
    }));
  };

  const openTaskArtifact = (index: number) => {
    if (!activeTask) return;
    if (activeTask === "inspection" && index === 0) {
      openInspectionReview();
      return;
    }
    const selectedTask = demoTasks[activeTask];
    const selectedIndex = selectedTask.artifacts[index] ? index : 0;
    setManualBrowserStates((states) => ({
      ...states,
      [activeTask]: openArtifactInManualBrowser(
        states[activeTask],
        activeTask,
        selectedIndex,
        selectedTask.artifacts[selectedIndex].name,
      ),
    }));
    setMonitorOpen(false);
    setBrowserSessions((sessions) => ({
      ...sessions,
      [activeTask]: { open: true, kind: "manual" },
    }));
  };

  const openTaskBrowserResource = (resource: {
    id: string;
    title: string;
    address: string;
  }) => {
    if (!activeTask) return;
    setManualBrowserStates((states) => ({
      ...states,
      [activeTask]: openWebInManualBrowser(states[activeTask], resource),
    }));
    setMonitorOpen(false);
    setBrowserSessions((sessions) => ({
      ...sessions,
      [activeTask]: { open: true, kind: "manual" },
    }));
  };

  const openTaskReference = (source: string) => {
    const resource =
      activeTask === "legal"
        ? legalResourceForSource(source)
        : activeTask === "annual"
          ? annualResourceForSource(source)
          : null;
    if (resource) openTaskBrowserResource(resource);
  };

  const openTaskReceipt = () => {
    if (activeTask === "legal") {
      openTaskBrowserResource(legalBrowserResources.oa);
      return;
    }
    if (activeTask === "annual") {
      openTaskBrowserResource(annualBrowserResources.meeting);
    }
  };

  const submitGenericAnnotations = (
    annotations: SubmittedArtifactAnnotation[],
  ) => {
    if (!activeTask || annotations.length === 0) return;
    const taskKey = activeTask;
    setGenericRevisionStates((states) => ({
      ...states,
      [taskKey]: {
        revision: 1,
        modifying: true,
        annotations,
      },
    }));
    window.setTimeout(() => {
      setGenericRevisionStates((states) => ({
        ...states,
        [taskKey]: {
          ...states[taskKey],
          revision: 2,
          modifying: false,
        },
      }));
    }, 900);
  };

  const currentBrowserSession = activeTask ? browserSessions[activeTask] : null;
  const dockOpen = monitorOpen || Boolean(currentBrowserSession?.open);
  const toggleRightDock = () => {
    if (dockOpen) {
      closeRightDock();
      return;
    }
    showTaskSummary();
  };
  const topBarTitle =
    view === "history" && task
      ? task.title
      : view === "draft"
        ? draftPrompt.length > 34
          ? `${draftPrompt.slice(0, 34)}…`
          : draftPrompt
        : view === "library"
          ? "资料库"
          : view === "memory"
            ? "AI Memory"
            : view === "agents"
              ? "专业智能体"
              : view === "skills"
                ? "技能"
                : view === "extensions"
                  ? "插件与连接器"
                  : view === "automation"
                    ? "自动化"
                    : view === "settings"
                      ? "设置"
            : "新任务";
  const topBarSubtitle =
    view === "history" && task
      ? `${task.externalState} · ${task.updatedAt} · ${task.agent}`
      : view === "draft"
        ? "独立任务 · 刚刚创建 · 仿真任务"
        : view === "library"
          ? "我的资料 · 已接入知识库 · 权限随身份"
          : view === "memory"
            ? "有效记忆 · 新增沉淀 · 组织经验"
            : view === "agents"
              ? "组织发布 · 专业角色 · 质量标准"
              : view === "skills"
                ? "业务经验 · 执行方法 · 自动匹配"
                : view === "extensions"
                  ? "底层能力 · 系统连接 · 权限分离"
                  : view === "automation"
                    ? "定时运行 · 生成任务 · 必要确认"
                    : view === "settings"
                      ? "个人偏好 · 身份权限 · 使用边界"
            : "政务外网 · 深圳市政数局";
  const topBarStatus =
    view === "history" && task
      ? task.status
      : view === "draft"
        ? "规划中"
        : undefined;

  return (
    <TooltipProvider delay={250}>
      <GlobalSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onNewTask={newTask}
        onOpenTask={openTask}
        onOpenCapability={openCapability}
        onOpenSettings={openSettings}
      />
      <main className="flex h-screen min-h-[620px] overflow-hidden bg-[#F5F7FB] text-[#182230]">
        <AppSidebar
          collapsed={sidebarCollapsed}
          activeTask={activeTask}
          activeView={view}
          onNewTask={newTask}
          onOpenTask={openTask}
          onOpenCapability={openCapability}
          onOpenSettings={openSettings}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <section className="flex min-w-0 flex-1 flex-col">
          <TopBar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((value) => !value)}
            title={topBarTitle}
            subtitle={topBarSubtitle}
            status={topBarStatus}
            dockAvailable={view === "history" || view === "draft"}
            dockOpen={dockOpen}
            onToggleDock={toggleRightDock}
          />
          {view === "new" ? (
            <NewTaskView
              value={composer}
              onChange={setComposer}
              onSubmit={startTask}
              contexts={taskContexts}
              onAddContext={(context) =>
                setTaskContexts((items) =>
                  items.some((item) => item.id === context.id)
                    ? items
                    : [...items, context],
                )
              }
              onRemoveContext={(id) =>
                setTaskContexts((items) =>
                  items.filter((item) => item.id !== id),
                )
              }
              commandMode={newTaskCommandMode}
              onCommandModeChange={setNewTaskCommandMode}
              permissionMode={newTaskPermissionMode}
              onPermissionModeChange={setNewTaskPermissionMode}
              modelMode={newTaskModelMode}
              onModelModeChange={setNewTaskModelMode}
              routing={newTaskRouting}
              onRoutingChange={setNewTaskRouting}
            />
          ) : null}
          {view === "library" ? <LibraryPage onUse={useTaskContext} /> : null}
          {view === "memory" ? <MemoryPage onUse={useTaskContext} /> : null}
          {view === "agents" ? <AgentsPage key="co-build-ecosystem-v1" onUse={useTaskContext} /> : null}
          {view === "skills" ? <SkillsPage onUse={useTaskContext} /> : null}
          {view === "extensions" ? (
            <ExtensionsPage key="four-layer-taxonomy-v1" onUse={useTaskContext} />
          ) : null}
          {view === "automation" ? (
            <AutomationPage onOpenTask={openTask} />
          ) : null}
          {view === "settings" ? (
            <SettingsPage
              onOpenConnections={() => openCapability("extensions")}
              onResetDemo={() => window.location.reload()}
              defaultModelMode={defaultModelMode}
              onDefaultModelModeChange={(mode) => {
                setDefaultModelMode(mode);
                setNewTaskModelMode(mode);
              }}
              defaultRouting={defaultRouting}
              onDefaultRoutingChange={(routing) => {
                setDefaultRouting(routing);
                setNewTaskRouting(cloneRoutingConfig(routing));
              }}
            />
          ) : null}
          {view === "draft" ? (
            <DraftWorkspace
              prompt={draftPrompt}
              contexts={taskContexts}
              onAddContext={(context) =>
                setTaskContexts((items) =>
                  items.some((item) => item.id === context.id)
                    ? items
                    : [...items, context],
                )
              }
              onRemoveContext={(id) =>
                setTaskContexts((items) => items.filter((item) => item.id !== id))
              }
              commandMode={draftCommandMode}
              onCommandModeChange={setDraftCommandMode}
              permissionMode={draftPermissionMode}
              onPermissionModeChange={setDraftPermissionMode}
              monitorOpen={monitorOpen}
              monitorWidth={monitorWidth}
              onMonitorWidthChange={setMonitorWidth}
              modelMode={draftModelMode}
              onModelModeChange={setDraftModelMode}
              routing={draftRouting}
              onRoutingChange={setDraftRouting}
            />
          ) : null}
          {view === "history" && task ? (
            <HistoryWorkspace
              key={task.id}
              task={task}
              browserSession={
                currentBrowserSession ?? { open: false, kind: "manual" }
              }
              manualBrowserState={manualBrowserStates[task.id]}
              monitorOpen={monitorOpen}
              monitorWidth={monitorWidth}
              inspectionReviewState={inspectionReviewState}
              genericRevisionState={genericRevisionStates[task.id]}
              onManualBrowserChange={(state) =>
                setManualBrowserStates((states) => ({
                  ...states,
                  [task.id]: state,
                }))
              }
              onSubmitAnnotations={submitGenericAnnotations}
              onMonitorWidthChange={setMonitorWidth}
              onInspectionReviewChange={setInspectionReviewState}
              onOpenArtifact={openTaskArtifact}
              onOpenReference={openTaskReference}
              onOpenReceipt={openTaskReceipt}
              onOpenManualBrowser={openManualBrowser}
              onCloseBrowser={showTaskSummary}
              modelMode={taskModelModes[task.id]}
              onModelModeChange={(mode) =>
                setTaskModelModes((modes) => ({ ...modes, [task.id]: mode }))
              }
              routing={taskRoutingConfigs[task.id]}
              onRoutingChange={(routing) =>
                setTaskRoutingConfigs((configs) => ({
                  ...configs,
                  [task.id]: routing,
                }))
              }
            />
          ) : null}
        </section>
      </main>
    </TooltipProvider>
  );
}
