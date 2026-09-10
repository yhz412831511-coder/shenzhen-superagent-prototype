'use client';

import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { useWorkspace } from './workspace-store';
import { current, eligible, refFor } from './memory-domain';
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
  UsersRound,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ModelSelector,
  type ModelMode,
  type RoutingConfig,
} from './model-routing';
import type { TaskContext } from './knowledge-memory-pages';

export type TaskCommandMode = 'standard' | 'plan' | 'goal' | 'browser';
export type TaskPermissionMode = 'standard' | 'confirm' | 'full';
export type TaskCollaborationMode = 'standard' | 'brainstorm';

const commandOptions: Array<{
  value: Exclude<TaskCommandMode, 'standard'>;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: 'plan',
    label: 'Plan',
    description: '先形成计划，确认后执行',
    icon: Route,
  },
  {
    value: 'goal',
    label: 'Goal',
    description: '围绕目标持续推进到完成',
    icon: Target,
  },
  {
    value: 'browser',
    label: 'Browser',
    description: '在任务内浏览、核验与操作网页',
    icon: Globe2,
  },
];

const permissionOptions: Array<{
  value: TaskPermissionMode;
  label: string;
  description: string;
}> = [
  {
    value: 'standard',
    label: '标准访问',
    description: '使用所选内容与已绑定项目，扩大范围时确认',
  },
  {
    value: 'confirm',
    label: '逐项确认',
    description: '每次新增读取范围或调用能力都询问',
  },
  {
    value: 'full',
    label: '完全访问',
    description: '在当前身份与组织策略范围内自动读写和调用能力',
  },
];

function contextIcon(kind: TaskContext['kind']) {
  if (kind === '资料') return LibraryBig;
  if (kind === '知识库') return Database;
  if (kind === '专业智能体') return Bot;
  if (kind === 'Skill') return Zap;
  if (kind === '插件' || kind === '连接器') return PlugZap;
  return BrainCircuit;
}

function contextTone(kind: TaskContext['kind']) {
  if (kind === '资料')
    return 'border-[var(--ui-border)] bg-[var(--ui-canvas)] text-[color:var(--ui-brand)]';
  if (kind === '知识库' || kind === '连接器') {
    return 'border-[var(--ui-border)] bg-[var(--ui-canvas)] text-[color:var(--ui-muted)]';
  }
  if (kind === '专业智能体') {
    return 'border-[var(--ui-border)] bg-[var(--ui-canvas)] text-[color:var(--ui-brand)]';
  }
  if (kind === '插件') {
    return 'border-[var(--ui-border)] bg-[var(--ui-canvas)] text-[color:var(--ui-text)]';
  }
  return 'border-[var(--ui-border)] bg-[var(--ui-canvas)] text-[color:var(--ui-muted)]';
}

function contextPrefix(kind: TaskContext['kind']) {
  if (kind === '专业智能体') return '@ 专业智能体';
  if (kind === 'Skill') return '/ Skill';
  return kind;
}

function formatDuration(seconds: number) {
  return `00:${String(seconds).padStart(2, '0')}`;
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
      onTranscript(
        '请综合本周重点任务形成领导汇报提纲，并标注需要我确认的事项。',
      );
      return;
    }
    setSeconds(0);
    setListening(true);
  };

  return (
    <div className="flex items-center gap-1.5">
      {listening ? (
        <span className="flex h-7 items-center gap-1.5 rounded-full bg-[var(--ui-canvas)] px-2.5 text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-danger)]">
          <span className="size-1.5 animate-pulse rounded-full bg-[var(--ui-danger)]" />
          正在听 {formatDuration(seconds)}
        </span>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={toggle}
        aria-label={listening ? '停止语音输入' : '语音输入'}
        aria-pressed={listening}
        className={`task-composer__voice ${
          listening
            ? 'bg-[var(--ui-canvas)] text-[color:var(--ui-danger)] hover:bg-[var(--ui-danger-soft)]'
            : 'text-[color:var(--ui-muted)]'
        }`}
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
  collaborationMode,
  onCollaborationModeChange,
  lockedCollaborationMode = false,
  modelMode,
  onModelModeChange,
  routing,
  onRoutingChange,
  placeholder,
  variant = 'compact',
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
  collaborationMode: TaskCollaborationMode;
  onCollaborationModeChange: (mode: TaskCollaborationMode) => void;
  lockedCollaborationMode?: boolean;
  modelMode: ModelMode;
  onModelModeChange: (mode: ModelMode) => void;
  routing: RoutingConfig;
  onRoutingChange: (routing: RoutingConfig) => void;
  placeholder: string;
  variant?: 'large' | 'compact';
  onBrowserCommand?: () => void;
}) {
  const { state } = useWorkspace();
  const [contextExpanded, setContextExpanded] = useState(false);
  const contextGroups = [
    ...['专业智能体', 'Skill', '插件', '连接器', '知识库'].map((kind) => ({
      label: kind,
      icon: contextIcon(kind as TaskContext['kind']),
      items: state.catalog
        .filter(
          (c) =>
            c.kind === kind &&
            c.owned &&
            c.enabled &&
            (!c.system ||
              (state.auth[c.system].enabled &&
                state.auth[c.system].expires > state.memory.now)),
        )
        .map((c) => ({
          id: c.id,
          kind: c.kind as TaskContext['kind'],
          label: c.name,
        })),
    })),
    {
      label: '记忆',
      icon: BrainCircuit,
      items: state.memory.memories
        .filter(
          (m) =>
            eligible(m, state.memory.now) &&
            current(m).payload.kind !== 'working',
        )
        .map((m) => ({
          id: m.id,
          kind: 'Memory' as const,
          label: current(m).title,
          memoryRef: refFor(m),
        })),
    },
    {
      label: '工作成果',
      icon: FileText,
      items: Object.values(state.artifacts).map((a) => ({
        id: a.id,
        kind: '资料' as const,
        label: a.name,
      })),
    },
  ];
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const composing = useRef(false);
  const activeCommand = commandOptions.find(
    (item) => item.value === commandMode,
  );
  const permission = permissionOptions.find(
    (item) => item.value === permissionMode,
  )!;
  const hasContextRow = Boolean(activeCommand || contexts.length || collaborationMode === 'brainstorm');
  const collapsedContextLimit = activeCommand ? 1 : 2;
  const visibleContexts = contextExpanded
    ? contexts
    : contexts.slice(0, collapsedContextLimit);
  const hiddenContextCount = Math.max(
    0,
    contexts.length - visibleContexts.length,
  );

  const addContext = (context: TaskContext) => {
    onAddContext(context);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const selectCommand = (mode: Exclude<TaskCommandMode, 'standard'>) => {
    onCommandModeChange(mode);
    if (mode === 'browser') onBrowserCommand?.();
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const appendTranscript = (text: string) => {
    onChange(value.trim() ? `${value.trim()}\n${text}` : text);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <section
      className="task-composer"
      data-variant={variant}
      aria-label={variant === 'large' ? '创建新任务' : '继续任务'}
    >
      {hasContextRow ? (
        <div
          className="task-composer__context-row"
          data-expanded={contextExpanded || undefined}
        >
          {activeCommand ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-brand-soft)] px-2 py-1 text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-brand)]">
              <activeCommand.icon className="size-3" />
              {activeCommand.label}
              <span className="hidden font-normal text-[color:var(--ui-muted)] sm:inline">
                · {activeCommand.description}
              </span>
              <button
                type="button"
                onClick={() => onCommandModeChange('standard')}
                aria-label={`退出${activeCommand.label}命令`}
                className="ml-0.5 grid size-4 place-items-center rounded hover:bg-black/5"
              >
                ×
              </button>
            </span>
          ) : null}
          {collaborationMode === 'brainstorm' ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--ui-border)] bg-[var(--ui-brand-soft)] px-2 py-1 text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-brand)]">
              <UsersRound className="size-3" />脑暴协作
              {!lockedCollaborationMode ? <button type="button" onClick={() => onCollaborationModeChange('standard')} aria-label="退出脑暴协作模式" className="ml-0.5 grid size-4 place-items-center rounded hover:bg-black/5">×</button> : null}
            </span>
          ) : null}
          {visibleContexts.map((context) => {
            const Icon = contextIcon(context.kind);
            return (
              <span
                key={`${context.kind}-${context.id}`}
                className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-[length:var(--ui-font-meta)] ${contextTone(context.kind)}`}
              >
                <Icon className="size-3 shrink-0" />
                <span className="shrink-0 font-medium">
                  {contextPrefix(context.kind)}
                </span>
                <span className="max-w-[280px] truncate text-[color:var(--ui-muted)]">
                  {context.label}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveContext(context.id)}
                  aria-label={`移除${context.label}`}
                  className="ml-0.5 grid size-4 place-items-center rounded text-[color:var(--ui-muted)] hover:bg-black/5 hover:text-[color:var(--ui-text)]"
                >
                  ×
                </button>
              </span>
            );
          })}
          {hiddenContextCount > 0 ? (
            <button
              type="button"
              className="inline-flex items-center rounded-lg px-2 py-1 text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-brand)] hover:bg-[var(--ui-hover)]"
              onClick={() => setContextExpanded(true)}
            >
              另有 {hiddenContextCount} 项
            </button>
          ) : contextExpanded && contexts.length > collapsedContextLimit ? (
            <button
              type="button"
              className="inline-flex items-center rounded-lg px-2 py-1 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)] hover:bg-[var(--ui-hover)]"
              onClick={() => setContextExpanded(false)}
            >
              收起
            </button>
          ) : null}
        </div>
      ) : null}
      <textarea
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onCompositionStart={() => {
          composing.current = true;
        }}
        onCompositionEnd={() => {
          window.requestAnimationFrame(() => {
            composing.current = false;
          });
        }}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.nativeEvent.isComposing &&
            !composing.current
          ) {
            event.preventDefault();
            onSubmit();
          }
        }}
        rows={variant === 'large' ? 5 : 1}
        className="task-composer__input"
        placeholder={placeholder}
      />
      <div className="task-composer__toolbar">
        <div className="task-composer__toolbar-left">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="添加材料、能力或命令"
                  className="task-composer__add"
                />
              }
            >
              <Plus />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side="top"
              sideOffset={8}
              className="w-[250px] rounded-xl border border-[var(--ui-border)] p-1.5 shadow-[var(--ui-shadow)]"
            >
              <DropdownMenuItem
                onClick={() =>
                  addContext({
                    id: 'upload-weekly',
                    kind: '资料',
                    label: '本周重点工作汇总.docx',
                  })
                }
                className="h-9 px-2 text-[length:var(--ui-font-meta)]"
              >
                <Upload className="text-[color:var(--ui-muted)]" />
                上传附件
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="h-9 px-2 text-[length:var(--ui-font-meta)]">
                  <FolderOpen className="text-[color:var(--ui-muted)]" />
                  当前项目的文件
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56 rounded-xl p-1.5">
                  {[
                    '任务材料清单.xlsx',
                    '部门意见汇总.docx',
                    '工作底稿／参考材料',
                  ].map((label, index) => (
                    <DropdownMenuItem
                      key={label}
                      onClick={() =>
                        addContext({
                          id: `project-file-${index}`,
                          kind: '资料',
                          label,
                        })
                      }
                      className="min-h-9 px-2 text-[length:var(--ui-font-meta)]"
                    >
                      <FileText />
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="h-9 px-2 text-[length:var(--ui-font-meta)]">
                  <LibraryBig className="text-[color:var(--ui-muted)]" />
                  我的产物
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-56 rounded-xl p-1.5">
                  {[
                    '上一版工作报告.docx',
                    '问题清单.xlsx',
                    '汇报提纲.pptx',
                  ].map((label, index) => (
                    <DropdownMenuItem
                      key={label}
                      onClick={() =>
                        addContext({
                          id: `artifact-${index}`,
                          kind: '资料',
                          label,
                        })
                      }
                      className="min-h-9 px-2 text-[length:var(--ui-font-meta)]"
                    >
                      <FileText />
                      {label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="h-9 px-2 text-[length:var(--ui-font-meta)]">
                  <Sparkles className="text-[color:var(--ui-brand)]" />
                  命令
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-[250px] rounded-xl p-1.5">
                  {commandOptions.map((item) => (
                    <DropdownMenuItem
                      key={item.value}
                      onClick={() => selectCommand(item.value)}
                      className="min-h-12 items-start px-2 py-2"
                    >
                      <item.icon className="mt-0.5 text-[color:var(--ui-brand)]" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-text)]">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
                          {item.description}
                        </span>
                      </span>
                      {commandMode === item.value ? (
                        <Check className="mt-1 text-[color:var(--ui-brand)]" />
                      ) : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {contextGroups.map((group) => (
                <DropdownMenuSub key={group.label}>
                  <DropdownMenuSubTrigger className="h-9 px-2 text-[length:var(--ui-font-meta)]">
                    <group.icon className="text-[color:var(--ui-muted)]" />
                    {group.label}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-[250px] rounded-xl p-1.5">
                    {group.items.map((item) => (
                      <DropdownMenuItem
                        key={item.id}
                        onClick={() => addContext(item)}
                        className="min-h-9 px-2 text-[length:var(--ui-font-meta)]"
                      >
                        <group.icon />
                        <span className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>
                        {contexts.some((context) => context.id === item.id) ? (
                          <Check className="text-[color:var(--ui-brand)]" />
                        ) : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="sm" className="task-composer__text-control" disabled={lockedCollaborationMode} />}>
              <UsersRound className="size-3.5 text-[color:var(--ui-brand)]" />
              {collaborationMode === 'brainstorm' ? '脑暴协作' : '单人任务'}
              {!lockedCollaborationMode ? <ChevronDown className="size-3 text-[color:var(--ui-muted)]" /> : null}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" sideOffset={8} className="w-[286px] rounded-xl border border-[var(--ui-border)] p-1.5 shadow-[var(--ui-shadow)]">
              <p className="px-2 py-2 text-[length:var(--ui-font-meta)] font-medium uppercase tracking-[0.08em] text-[color:var(--ui-muted)]">协作方式</p>
              <DropdownMenuItem onClick={() => onCollaborationModeChange('standard')} className="min-h-12 items-start px-2 py-2"><FileText className="mt-0.5"/><span className="min-w-0 flex-1"><span className="block font-medium">单人任务</span><span className="block text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">由超级智能体直接处理当前工作</span></span>{collaborationMode === 'standard' ? <Check/> : null}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCollaborationModeChange('brainstorm')} className="min-h-12 items-start px-2 py-2"><UsersRound className="mt-0.5 text-[color:var(--ui-brand)]"/><span className="min-w-0 flex-1"><span className="block font-medium">脑暴协作</span><span className="block text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">多岗位贡献、询证与用户裁决</span></span>{collaborationMode === 'brainstorm' ? <Check/> : null}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="task-composer__text-control"
                />
              }
            >
              <ShieldCheck className="size-3.5 text-[color:var(--ui-brand)]" />
              {permission.label}
              <ChevronDown className="size-3 text-[color:var(--ui-muted)]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side="top"
              sideOffset={8}
              className="w-[292px] rounded-xl border border-[var(--ui-border)] p-1.5 shadow-[var(--ui-shadow)]"
            >
              <p className="px-2 py-2 text-[length:var(--ui-font-meta)] font-medium uppercase tracking-[0.08em] text-[color:var(--ui-muted)]">
                本任务权限
              </p>
              {permissionOptions.map((item) => (
                <DropdownMenuItem
                  key={item.value}
                  onClick={() => onPermissionModeChange(item.value)}
                  className="min-h-12 items-start px-2 py-2"
                >
                  <ShieldCheck className="mt-0.5 text-[color:var(--ui-brand)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-text)]">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[length:var(--ui-font-meta)] leading-4 text-[color:var(--ui-muted)]">
                      {item.description}
                    </span>
                  </span>
                  {permissionMode === item.value ? (
                    <Check className="mt-1 text-[color:var(--ui-brand)]" />
                  ) : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <p className="px-2 py-2 text-[length:var(--ui-font-meta)] leading-4 text-[color:var(--ui-muted)]">
                不扩大来源系统原有权限；完全访问下，对外发送、正式提交和删除仍单独确认。
              </p>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="task-composer__toolbar-right">
          <ModelSelector
            value={modelMode}
            onChange={onModelModeChange}
            routing={routing}
            onRoutingChange={onRoutingChange}
          />
          <VoiceInputButton onTranscript={appendTranscript} />
          <Button
            type="button"
            size={variant === 'large' ? 'icon-lg' : 'icon'}
            onClick={onSubmit}
            disabled={!value.trim()}
            aria-label={variant === 'large' ? '开始任务' : '发送'}
            className="task-composer__send"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
