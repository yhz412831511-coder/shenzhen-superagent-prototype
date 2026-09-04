"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  Database,
  FileText,
  FolderOpen,
  Globe2,
  LibraryBig,
  Mic,
  MicOff,
  PlugZap,
  Plus,
  Route,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ModelSelector,
  type ModelMode,
  type RoutingConfig,
} from "./model-routing";
import type { TaskContext } from "./knowledge-memory-pages";

export type TaskCommandMode = "standard" | "plan" | "goal" | "browser";
export type TaskPermissionMode = "standard" | "confirm" | "full";

const commandOptions: Array<{
  value: Exclude<TaskCommandMode, "standard">;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: "plan",
    label: "Plan",
    description: "先形成计划，确认后执行",
    icon: Route,
  },
  {
    value: "goal",
    label: "Goal",
    description: "围绕目标持续推进到完成",
    icon: Target,
  },
  {
    value: "browser",
    label: "Browser",
    description: "在任务内浏览、核验与操作网页",
    icon: Globe2,
  },
];

const permissionOptions: Array<{
  value: TaskPermissionMode;
  label: string;
  description: string;
}> = [
  {
    value: "standard",
    label: "标准访问",
    description: "使用所选内容与已绑定项目，扩大范围时确认",
  },
  {
    value: "confirm",
    label: "逐项确认",
    description: "每次新增读取范围或调用能力都询问",
  },
  {
    value: "full",
    label: "完全访问",
    description: "在当前身份与组织策略范围内自动读写和调用能力",
  },
];

const contextGroups: Array<{
  label: string;
  icon: LucideIcon;
  items: TaskContext[];
}> = [
  {
    label: "专业智能体",
    icon: Bot,
    items: [
      { id: "agent-public-info", kind: "专业智能体", label: "政务信息公开助手" },
      { id: "agent-deep-research", kind: "专业智能体", label: "深度研究助手" },
      { id: "agent-work-report", kind: "专业智能体", label: "工作报告助手" },
    ],
  },
  {
    label: "技能",
    icon: Zap,
    items: [
      { id: "skill-deep-research", kind: "Skill", label: "深度检索与来源核验" },
      { id: "skill-doc-quality", kind: "Skill", label: "成果质量复核" },
      { id: "skill-file-compare", kind: "Skill", label: "多文件归并与差异比对" },
      { id: "skill-data-analysis", kind: "Skill", label: "数据分析与图表表达" },
    ],
  },
  {
    label: "插件能力",
    icon: PlugZap,
    items: [
      { id: "plugin-wps-doc", kind: "插件", label: "WPS文档 · 生成与预览" },
      { id: "plugin-browser", kind: "插件", label: "奇安信浏览器 · 受控浏览" },
      { id: "plugin-computer-use", kind: "插件", label: "Computer Use · 操作当前界面" },
      { id: "plugin-ai-memory", kind: "插件", label: "AI Memory · 检索有效记忆" },
    ],
  },
  {
    label: "连接器",
    icon: Database,
    items: [
      { id: "connector-oa", kind: "连接器", label: "深圳OA · 当前经办身份" },
      { id: "connector-yuezhengyi", kind: "连接器", label: "粤政易 · 当前身份" },
      { id: "connector-shenzhengi", kind: "连接器", label: "深政易 · 当前身份" },
    ],
  },
];

function contextIcon(kind: TaskContext["kind"]) {
  if (kind === "资料") return LibraryBig;
  if (kind === "知识库") return Database;
  if (kind === "专业智能体") return Bot;
  if (kind === "Skill") return Zap;
  if (kind === "插件" || kind === "连接器") return PlugZap;
  return BrainCircuit;
}

function contextTone(kind: TaskContext["kind"]) {
  if (kind === "资料") return "border-[#CEDBF6] bg-[#F3F7FF] text-[#3F5FAD]";
  if (kind === "知识库" || kind === "连接器") {
    return "border-[#D5DCF2] bg-[#F5F7FD] text-[#535FAE]";
  }
  if (kind === "专业智能体") {
    return "border-[#CDDDF8] bg-[#F0F5FF] text-[#365FB7]";
  }
  if (kind === "插件") {
    return "border-[#D5E3E5] bg-[#F2F8F8] text-[#39727A]";
  }
  return "border-[#DCD8F4] bg-[#F7F5FF] text-[#625EA8]";
}

function contextPrefix(kind: TaskContext["kind"]) {
  if (kind === "专业智能体") return "@ 专业智能体";
  if (kind === "Skill") return "/ Skill";
  return kind;
}

function formatDuration(seconds: number) {
  return `00:${String(seconds).padStart(2, "0")}`;
}

function VoiceInputButton({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!listening) return;
    const timer = window.setInterval(() => {
      setSeconds((value) => Math.min(value + 1, 45));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [listening]);

  const toggle = () => {
    if (listening) {
      setListening(false);
      setSeconds(0);
      onTranscript("请综合本周重点任务形成领导汇报提纲，并标注需要我确认的事项。");
      return;
    }
    setSeconds(0);
    setListening(true);
  };

  return (
    <div className="flex items-center gap-1.5">
      {listening ? (
        <span className="flex h-7 items-center gap-1.5 rounded-full bg-[#FFF1F0] px-2.5 text-[9px] font-medium text-[#C33B35]">
          <span className="size-1.5 animate-pulse rounded-full bg-[#D94841]" />
          正在听 {formatDuration(seconds)}
        </span>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={toggle}
        aria-label={listening ? "停止语音输入" : "语音输入"}
        aria-pressed={listening}
        className={
          listening
            ? "bg-[#FFF1F0] text-[#C33B35] hover:bg-[#FFE7E5]"
            : "text-[#667085] hover:bg-[#F2F5FA]"
        }
      >
        {listening ? <MicOff /> : <Mic />}
      </Button>
    </div>
  );
}

export function TaskComposer({
  value,
  onChange,
  onSubmit,
  contexts,
  onAddContext,
  onRemoveContext,
  commandMode,
  onCommandModeChange,
  permissionMode,
  onPermissionModeChange,
  modelMode,
  onModelModeChange,
  routing,
  onRoutingChange,
  placeholder,
  variant = "compact",
  onBrowserCommand,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  contexts: TaskContext[];
  onAddContext: (context: TaskContext) => void;
  onRemoveContext: (id: string) => void;
  commandMode: TaskCommandMode;
  onCommandModeChange: (mode: TaskCommandMode) => void;
  permissionMode: TaskPermissionMode;
  onPermissionModeChange: (mode: TaskPermissionMode) => void;
  modelMode: ModelMode;
  onModelModeChange: (mode: ModelMode) => void;
  routing: RoutingConfig;
  onRoutingChange: (routing: RoutingConfig) => void;
  placeholder: string;
  variant?: "large" | "compact";
  onBrowserCommand?: () => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeCommand = commandOptions.find((item) => item.value === commandMode);
  const permission = permissionOptions.find((item) => item.value === permissionMode)!;
  const hasContextRow = Boolean(activeCommand || contexts.length);

  const addContext = (context: TaskContext) => {
    onAddContext(context);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const selectCommand = (mode: Exclude<TaskCommandMode, "standard">) => {
    onCommandModeChange(mode);
    if (mode === "browser") onBrowserCommand?.();
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const appendTranscript = (text: string) => {
    onChange(value.trim() ? `${value.trim()}\n${text}` : text);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <section
      className={
        variant === "large"
          ? "composer-shell overflow-visible"
          : "w-full overflow-visible rounded-xl border border-[#D8DEE9] bg-white shadow-[0_6px_20px_rgba(16,24,40,.06)]"
      }
      aria-label={variant === "large" ? "创建新任务" : "继续任务"}
    >
      {hasContextRow ? (
        <div className="flex flex-wrap gap-1.5 border-b border-[#EEF1F5] px-3 py-2">
          {activeCommand ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9D7F7] bg-[#EDF3FF] px-2 py-1 text-[9.5px] font-medium text-[#3159BE]">
              <activeCommand.icon className="size-3" />
              {activeCommand.label}
              <span className="hidden font-normal text-[#7180A3] sm:inline">
                · {activeCommand.description}
              </span>
              <button
                type="button"
                onClick={() => onCommandModeChange("standard")}
                aria-label={`退出${activeCommand.label}命令`}
                className="ml-0.5 grid size-4 place-items-center rounded hover:bg-black/5"
              >
                ×
              </button>
            </span>
          ) : null}
          {contexts.map((context) => {
            const Icon = contextIcon(context.kind);
            return (
              <span
                key={`${context.kind}-${context.id}`}
                className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-[9.5px] ${contextTone(context.kind)}`}
              >
                <Icon className="size-3 shrink-0" />
                <span className="shrink-0 font-medium">{contextPrefix(context.kind)}</span>
                <span className="max-w-[280px] truncate text-[#667085]">{context.label}</span>
                <button
                  type="button"
                  onClick={() => onRemoveContext(context.id)}
                  aria-label={`移除${context.label}`}
                  className="ml-0.5 grid size-4 place-items-center rounded text-[#8D98A8] hover:bg-black/5 hover:text-[#4B5565]"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      ) : null}
      <textarea
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
          }
        }}
        rows={variant === "large" ? 5 : 1}
        className={
          variant === "large"
            ? "h-[118px] w-full resize-none border-0 bg-transparent px-5 pb-2 pt-4 text-[14px] leading-6 text-[#182230] outline-none placeholder:text-[#98A2B3]"
            : "max-h-28 min-h-11 w-full resize-none border-0 bg-transparent px-4 pb-1 pt-3 text-[11.5px] leading-5 text-[#182230] outline-none placeholder:text-[#98A2B3]"
        }
        placeholder={placeholder}
      />
      <div className="flex min-w-0 flex-wrap items-center gap-1.5 border-t border-[#EEF1F5] px-2.5 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="添加材料、能力或命令"
                className="rounded-lg bg-[#F2F4F7] text-[#344054] hover:bg-[#E9EDF3]"
              />
            }
          >
            <Plus />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="top"
            sideOffset={8}
            className="w-[250px] rounded-xl border border-[#DFE4EC] p-1.5 shadow-[0_18px_50px_rgba(16,24,40,.18)]"
          >
            <DropdownMenuItem
              onClick={() =>
                addContext({ id: "upload-weekly", kind: "资料", label: "本周重点工作汇总.docx" })
              }
              className="h-9 px-2 text-[10.5px]"
            >
              <Upload className="text-[#65748A]" />
              上传附件
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="h-9 px-2 text-[10.5px]">
                <FolderOpen className="text-[#65748A]" />
                当前项目的文件
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56 rounded-xl p-1.5">
                {["任务材料清单.xlsx", "部门意见汇总.docx", "工作底稿／参考材料"].map((label, index) => (
                  <DropdownMenuItem
                    key={label}
                    onClick={() => addContext({ id: `project-file-${index}`, kind: "资料", label })}
                    className="min-h-9 px-2 text-[10px]"
                  >
                    <FileText />
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="h-9 px-2 text-[10.5px]">
                <LibraryBig className="text-[#65748A]" />
                我的产物
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56 rounded-xl p-1.5">
                {["上一版工作报告.docx", "问题清单.xlsx", "汇报提纲.pptx"].map((label, index) => (
                  <DropdownMenuItem
                    key={label}
                    onClick={() => addContext({ id: `artifact-${index}`, kind: "资料", label })}
                    className="min-h-9 px-2 text-[10px]"
                  >
                    <FileText />
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="h-9 px-2 text-[10.5px]">
                <Sparkles className="text-[#506DD0]" />
                命令
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-[250px] rounded-xl p-1.5">
                {commandOptions.map((item) => (
                  <DropdownMenuItem
                    key={item.value}
                    onClick={() => selectCommand(item.value)}
                    className="min-h-12 items-start px-2 py-2"
                  >
                    <item.icon className="mt-0.5 text-[#5269BE]" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10.5px] font-medium text-[#344054]">{item.label}</span>
                      <span className="mt-0.5 block text-[8.5px] text-[#98A2B3]">{item.description}</span>
                    </span>
                    {commandMode === item.value ? <Check className="mt-1 text-[#1F5EFF]" /> : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {contextGroups.map((group) => (
              <DropdownMenuSub key={group.label}>
                <DropdownMenuSubTrigger className="h-9 px-2 text-[10.5px]">
                  <group.icon className="text-[#65748A]" />
                  {group.label}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-[250px] rounded-xl p-1.5">
                  {group.items.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => addContext(item)}
                      className="min-h-9 px-2 text-[10px]"
                    >
                      <group.icon />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {contexts.some((context) => context.id === item.id) ? (
                        <Check className="text-[#1F5EFF]" />
                      ) : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2 text-[10px] font-normal text-[#526176] hover:bg-[#F2F5FA]"
              />
            }
          >
            <ShieldCheck className="size-3.5 text-[#3970DD]" />
            {permission.label}
            <ChevronDown className="size-3 text-[#98A2B3]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="top"
            sideOffset={8}
            className="w-[292px] rounded-xl border border-[#DFE4EC] p-1.5 shadow-[0_18px_50px_rgba(16,24,40,.18)]"
          >
            <p className="px-2 py-2 text-[9px] font-medium uppercase tracking-[0.08em] text-[#98A2B3]">
              本任务权限
            </p>
            {permissionOptions.map((item) => (
              <DropdownMenuItem
                key={item.value}
                onClick={() => onPermissionModeChange(item.value)}
                className="min-h-12 items-start px-2 py-2"
              >
                <ShieldCheck className="mt-0.5 text-[#5269BE]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10.5px] font-medium text-[#344054]">{item.label}</span>
                  <span className="mt-0.5 block text-[8.5px] leading-4 text-[#98A2B3]">{item.description}</span>
                </span>
                {permissionMode === item.value ? <Check className="mt-1 text-[#1F5EFF]" /> : null}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <p className="px-2 py-2 text-[8.5px] leading-4 text-[#7A8798]">
              不扩大来源系统原有权限；完全访问下，对外发送、正式提交和删除仍单独确认。
            </p>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="min-w-0 flex-1" />
        <ModelSelector
          value={modelMode}
          onChange={onModelModeChange}
          routing={routing}
          onRoutingChange={onRoutingChange}
        />
        <VoiceInputButton onTranscript={appendTranscript} />
        <Button
          type="button"
          size={variant === "large" ? "icon-lg" : "icon"}
          onClick={onSubmit}
          disabled={!value.trim()}
          aria-label={variant === "large" ? "开始任务" : "发送"}
          className="ml-0.5 rounded-xl bg-[#1F5EFF] text-white shadow-[0_7px_18px_rgba(31,94,255,.18)] hover:bg-[#174ED6]"
        >
          <Send className="size-4" />
        </Button>
      </div>
    </section>
  );
}
