'use client';
import { currentUser } from './current-user';

import { useState } from 'react';
import { useAppearance } from './appearance';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Bot,
  Check,
  ChevronRight,
  CircleHelp,
  Eye,
  Info,
  Keyboard,
  Languages,
  LockKeyhole,
  MoonStar,
  Palette,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  UserRound,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  DefaultModelSettings,
  type ModelMode,
  type RoutingConfig,
} from './model-routing';

type SettingsSection =
  | 'account'
  | 'model'
  | 'permission'
  | 'task'
  | 'notification'
  | 'appearance'
  | 'about';

type NavItem = {
  id: SettingsSection;
  label: string;
  description: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  {
    id: 'account',
    label: '账号与身份',
    description: '当前政务身份',
    icon: UserRound,
  },
  {
    id: 'model',
    label: '模型与调度',
    description: '默认模式与四级路由',
    icon: Bot,
  },
  {
    id: 'permission',
    label: '权限与执行',
    description: '文件、连接与确认',
    icon: ShieldCheck,
  },
  {
    id: 'task',
    label: '任务偏好',
    description: '成果与表达习惯',
    icon: SlidersHorizontal,
  },
  {
    id: 'notification',
    label: '通知',
    description: '只保留必要提醒',
    icon: Bell,
  },
  {
    id: 'appearance',
    label: '外观',
    description: '主题、字号与动效',
    icon: Palette,
  },
  {
    id: 'about',
    label: '帮助与关于',
    description: '版本、快捷键与说明',
    icon: CircleHelp,
  },
];

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 border-b border-[var(--ui-border)] pb-4">
      <h2 className="text-[length:var(--ui-font-body)] font-semibold text-[color:var(--ui-text)]">
        {title}
      </h2>
      <p className="mt-1 text-[length:var(--ui-font-meta)] leading-5 text-[color:var(--ui-muted)]">
        {description}
      </p>
    </div>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[64px] items-center gap-6 border-b border-[var(--ui-border)] py-3.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-text)]">
          {title}
        </p>
        {description ? (
          <p className="mt-1 text-[length:var(--ui-font-meta)] leading-4 text-[color:var(--ui-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function ChoiceGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex items-center rounded-[9px] bg-[var(--ui-canvas)] p-0.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`h-7 rounded-[7px] px-3 text-[length:var(--ui-font-meta)] transition ${value === option ? 'bg-[var(--ui-surface)] text-[color:var(--ui-text)] shadow-sm' : 'text-[color:var(--ui-muted)] hover:text-[color:var(--ui-text)]'}`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function LockedRule({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-canvas)] p-3.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[var(--ui-surface)] text-[color:var(--ui-brand)] shadow-sm">
        <LockKeyhole className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-text)]">
          {title}
          <span className="rounded-md bg-[var(--ui-brand-soft)] px-1.5 py-0.5 text-[length:var(--ui-font-meta)] font-normal text-[color:var(--ui-muted)]">
            组织策略
          </span>
        </span>
        <span className="mt-1 block text-[length:var(--ui-font-meta)] leading-4 text-[color:var(--ui-muted)]">
          {description}
        </span>
      </span>
      <Switch checked disabled aria-label={`${title}已由组织启用`} />
    </div>
  );
}

function AccountSection() {
  return (
    <>
      <SectionHeading
        title="账号与身份"
        description="所有读取、写入和留痕都以当前登录的政务身份为准。"
      />
      <div className="flex items-center gap-4 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-brand-soft)] p-5">
        <span className="grid size-12 place-items-center rounded-full bg-[var(--ui-brand)] text-[length:var(--ui-font-body)] font-semibold text-[color:var(--ui-on-brand)] shadow-[var(--ui-shadow)]">
          林
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[length:var(--ui-font-control)] font-semibold text-[color:var(--ui-text)]">
              林思远
            </p>
            <span className="flex items-center gap-1 rounded-full border border-[var(--ui-border)] bg-[var(--ui-canvas)] px-2 py-0.5 text-[length:var(--ui-font-meta)] text-[color:var(--ui-success)]">
              <Check className="size-2.5" />
              身份已验证
            </span>
          </div>
          <p className="mt-1 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
            {currentUser.organization} · {currentUser.role}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
            <ShieldCheck className="size-3" />
            当前身份范围由统一身份认证和来源系统共同决定
          </p>
        </div>
      </div>
      <div className="mt-5">
        <SettingRow
          title="工作身份"
          description="用户不能自行切换到未获授权的单位、处室或岗位。"
        >
          <span className="text-[length:var(--ui-font-meta)] text-[color:var(--ui-text)]">
            当前岗位身份
          </span>
        </SettingRow>
        <SettingRow
          title="登录与验证"
          description="登录状态异常时，连接器会暂停调用并提示重新验证。"
        >
          <span className="rounded-lg bg-[var(--ui-canvas)] px-2.5 py-1.5 text-[length:var(--ui-font-meta)] text-[color:var(--ui-success)]">
            状态正常
          </span>
        </SettingRow>
        <SettingRow
          title="个人工作空间"
          description="个人资料、任务偏好和有效记忆跟随当前账号。"
        >
          <span className="text-[length:var(--ui-font-meta)] text-[color:var(--ui-text)]">
            政务云个人空间
          </span>
        </SettingRow>
      </div>
    </>
  );
}

function ModelSection({
  mode,
  onModeChange,
  routing,
  onRoutingChange,
}: {
  mode: ModelMode;
  onModeChange: (mode: ModelMode) => void;
  routing: RoutingConfig;
  onRoutingChange: (routing: RoutingConfig) => void;
}) {
  return (
    <>
      <SectionHeading
        title="模型与调度"
        description="设置之后新建任务的默认模式。智能模式按步骤复杂度选择模型；固定模型则锁定所有生成步骤。"
      />
      <DefaultModelSettings
        mode={mode}
        onModeChange={onModeChange}
        routing={routing}
        onRoutingChange={onRoutingChange}
      />
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-canvas)] px-3.5 py-3 text-[length:var(--ui-font-meta)] leading-4 text-[color:var(--ui-muted)]">
        <Info className="mt-0.5 size-3.5 shrink-0 text-[color:var(--ui-brand)]" />
        这里是个人默认偏好，不是平台治理后台；可选范围、接入状态和安全边界仍由组织统一管理。
      </div>
    </>
  );
}

function PermissionSection({
  onOpenConnections,
}: {
  onOpenConnections: () => void;
}) {
  const { value: appearance, update: updateAppearance } = useAppearance();
  const [execution, setExecution] = useState<'本地优先' | '智能选择'>(
    '智能选择',
  );
  return (
    <>
      <SectionHeading
        title="权限与执行"
        description="管理个人可选的默认范围；组织安全策略和任务中的责任确认不可绕过。"
      />
      <div className="mb-5">
        <SettingRow
          title="在对话中显示完整执行过程"
          description="逐项展示操作、风险判断和授权结果；关闭后按每轮汇总。"
        >
          <Switch
            checked={appearance.showRoutineOperations}
            onCheckedChange={(value) =>
              updateAppearance({ showRoutineOperations: value })
            }
            aria-label="在对话中显示完整执行过程"
          />
        </SettingRow>
        <SettingRow
          title="任务执行位置"
          description="涉及本地文件时优先在当前政务终端处理；其他任务由系统按策略选择。"
        >
          <ChoiceGroup
            value={execution}
            options={['本地优先', '智能选择'] as const}
            onChange={setExecution}
          />
        </SettingRow>
        <SettingRow
          title="默认文件范围"
          description="新任务只读取用户主动添加的文件，不自动扫描个人目录。"
        >
          <span className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2.5 py-1.5 text-[length:var(--ui-font-meta)] text-[color:var(--ui-text)]">
            仅任务所选文件
          </span>
        </SettingRow>
        <SettingRow
          title="已连接身份"
          description="连接只继承来源系统中当前身份原有的权限。"
        >
          <Button
            variant="outline"
            onClick={onOpenConnections}
            className="h-8 px-3 text-[length:var(--ui-font-meta)]"
          >
            管理连接器
            <ChevronRight className="size-3" />
          </Button>
        </SettingRow>
      </div>
      <p className="mb-2.5 text-[length:var(--ui-font-meta)] font-semibold uppercase tracking-[0.08em] text-[color:var(--ui-muted)]">
        始终生效的安全规则
      </p>
      <div className="space-y-2.5">
        <LockedRule
          title="完整审计留痕"
          description="记录任务使用的身份、来源、能力、关键判断和外部操作回执。"
        />
        <LockedRule
          title="高风险动作确认"
          description="提交、发送、回写、销号等改变外部状态的动作必须由本人确认。"
        />
        <LockedRule
          title="扩大读取范围确认"
          description="任务首次访问新的目录、系统范围或敏感资料前单独说明影响。"
        />
      </div>
    </>
  );
}

function TaskSection() {
  const [autoOpen, setAutoOpen] = useState(true);
  const [citation, setCitation] = useState<'来源＋日期' | '简明脚注'>(
    '来源＋日期',
  );
  const [style, setStyle] = useState<'结论优先' | '平衡展开'>('结论优先');
  return (
    <>
      <SectionHeading
        title="任务偏好"
        description="设置默认工作习惯；具体任务仍可根据目标和项目单独调整。"
      />
      <SettingRow
        title="默认保存位置"
        description="成果保存到任务归属项目的工作区；项目归属仍在每个任务中确认。"
      >
        <span className="text-[length:var(--ui-font-meta)] text-[color:var(--ui-text)]">
          项目工作区
        </span>
      </SettingRow>
      <SettingRow
        title="完成后打开首要成果"
        description="任务完成时在内置浏览器中直接打开首要成果。"
      >
        <Switch
          checked={autoOpen}
          onCheckedChange={setAutoOpen}
          aria-label="完成后打开首要成果"
        />
      </SettingRow>
      <SettingRow
        title="引用格式"
        description="适用于研究、审查和正式材料中的来源标注。"
      >
        <ChoiceGroup
          value={citation}
          options={['来源＋日期', '简明脚注'] as const}
          onChange={setCitation}
        />
      </SettingRow>
      <SettingRow
        title="默认表达方式"
        description="影响内容组织顺序，不改变事实、依据或正式格式。"
      >
        <ChoiceGroup
          value={style}
          options={['结论优先', '平衡展开'] as const}
          onChange={setStyle}
        />
      </SettingRow>
      <SettingRow
        title="工作语言"
        description="默认使用简体中文，引用原文时保留来源语言。"
      >
        <span className="flex items-center gap-1.5 text-[length:var(--ui-font-meta)] text-[color:var(--ui-text)]">
          <Languages className="size-3.5 text-[color:var(--ui-muted)]" />
          简体中文
        </span>
      </SettingRow>
    </>
  );
}

function NotificationSection() {
  const [settings, setSettings] = useState({
    confirm: true,
    complete: true,
    failed: true,
    automation: true,
  });
  const toggle = (key: keyof typeof settings, value: boolean) =>
    setSettings((state) => ({ ...state, [key]: value }));
  return (
    <>
      <SectionHeading
        title="通知"
        description="只提醒需要你介入或已经产生明确结果的事项，不播报每个执行步骤。"
      />
      <SettingRow
        title="等待本人确认"
        description="任务需要扩大读取范围、外部写入或关键业务判断时。"
      >
        <Switch
          checked={settings.confirm}
          onCheckedChange={(value) => toggle('confirm', value)}
          aria-label="等待本人确认通知"
        />
      </SettingRow>
      <SettingRow
        title="任务完成"
        description="成果已形成并通过任务内质量检查时。"
      >
        <Switch
          checked={settings.complete}
          onCheckedChange={(value) => toggle('complete', value)}
          aria-label="任务完成通知"
        />
      </SettingRow>
      <SettingRow
        title="运行失败"
        description="任务无法继续且需要重试、补充材料或重新授权时。"
      >
        <Switch
          checked={settings.failed}
          onCheckedChange={(value) => toggle('failed', value)}
          aria-label="运行失败通知"
        />
      </SettingRow>
      <SettingRow
        title="自动化异常"
        description="自动化未按计划运行、来源失效或需要重新确认时。"
      >
        <Switch
          checked={settings.automation}
          onCheckedChange={(value) => toggle('automation', value)}
          aria-label="自动化异常通知"
        />
      </SettingRow>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-[var(--ui-canvas)] px-3.5 py-3 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
        <Bell className="size-3.5 text-[color:var(--ui-muted)]" />
        执行步骤与普通进度不会产生系统通知，可在任务概览中随时查看。
      </div>
    </>
  );
}

function AppearanceSection() {
  const { value, update } = useAppearance();
  return (
    <>
      <SectionHeading
        title="外观"
        description="选择适合当前环境的主题，所有工作页面同步切换。"
      />
      <fieldset className="fw-theme-options" aria-label="界面主题">
        {(
          [
            {
              id: 'light',
              title: '浅色',
              detail: '明亮清晰，轻盈专注',
              icon: Sun,
            },
            {
              id: 'dark',
              title: '深色',
              detail: '柔和层次，沉浸工作',
              icon: MoonStar,
            },
          ] as const
        ).map((t) => (
          <button
            type="button"
            key={t.id}
            className={value.theme === t.id ? 'selected' : ''}
            aria-pressed={value.theme === t.id}
            onClick={() => update({ theme: t.id })}
          >
            <div className={'fw-theme-swatch ' + t.id} aria-hidden="true">
              <i />
              <span />
              <span />
              <span />
            </div>
            <span className="fw-row">
              <t.icon size={16} />
              <strong>{t.title}</strong>
              {value.theme === t.id && <Check size={16} />}
            </span>
            <small>{t.detail}</small>
          </button>
        ))}
      </fieldset>
      <div className="mt-5">
        <SettingRow
          title="界面字号"
          description="同步调整正文、控件与辅助信息的可读性。"
        >
          <ChoiceGroup
            value={value.fontSize === 'large' ? '较大' : '标准'}
            options={['标准', '较大'] as const}
            onChange={(v) =>
              update({ fontSize: v === '较大' ? 'large' : 'standard' })
            }
          />
        </SettingRow>
        <SettingRow
          title="减少动态效果"
          description="降低页面过渡和状态动画，同时尊重系统的减少动态效果设置。"
        >
          <Switch
            checked={value.reducedMotion}
            onCheckedChange={(v) => update({ reducedMotion: v })}
            aria-label="减少动态效果"
          />
        </SettingRow>
      </div>
    </>
  );
}

function AboutSection({ onResetDemo }: { onResetDemo: () => void }) {
  const shortcuts = [
    ['⌘ K', '搜索任务、材料和能力'],
    ['⌘ N', '新建任务'],
    ['⌘ ↵', '发送当前输入'],
    ['Esc', '关闭当前浮层或菜单'],
  ];
  return (
    <>
      <SectionHeading
        title="帮助与关于"
        description="查看当前版本、使用边界和常用快捷方式。"
      />
      <div className="flex items-center gap-4 rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-canvas)] p-5">
        <span className="brand-mark grid size-11 place-items-center rounded-[14px]">
          <Sparkles className="size-5 text-[color:var(--ui-on-brand)]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[length:var(--ui-font-control)] font-semibold text-[color:var(--ui-text)]">
            深圳政务超级智能体
          </p>
          <p className="mt-1 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
            用户端交互原型 · 2026.09
          </p>
        </div>
        <span className="rounded-lg border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2.5 py-1.5 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
          仿真演示环境
        </span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4">
        <section className="rounded-xl border border-[var(--ui-border)] p-4">
          <p className="flex items-center gap-2 text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-text)]">
            <Keyboard className="size-3.5 text-[color:var(--ui-muted)]" />
            快捷键
          </p>
          <div className="mt-3 space-y-2.5">
            {shortcuts.map(([keys, action]) => (
              <div
                key={keys}
                className="flex items-center justify-between text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]"
              >
                <span>{action}</span>
                <kbd className="rounded-md border border-[var(--ui-border)] bg-[var(--ui-canvas)] px-1.5 py-0.5 font-sans text-[length:var(--ui-font-meta)] text-[color:var(--ui-text)]">
                  {keys}
                </kbd>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-xl border border-[var(--ui-border)] p-4">
          <p className="flex items-center gap-2 text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-text)]">
            <Eye className="size-3.5 text-[color:var(--ui-muted)]" />
            隐私与权限
          </p>
          <div className="mt-3 space-y-2 text-[length:var(--ui-font-meta)] leading-4 text-[color:var(--ui-muted)]">
            <p>资料权限随来源系统和当前身份，不因使用智能体扩大。</p>
            <p>
              任务中的外部写入、高风险动作和范围扩大保持本人可见并单独确认。
            </p>
            <p>当前原型使用演示数据，不连接真实业务后台。</p>
          </div>
        </section>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-[var(--ui-border)] pt-4">
        <div>
          <p className="text-[length:var(--ui-font-meta)] font-medium text-[color:var(--ui-text)]">
            恢复演示初始状态
          </p>
          <p className="mt-1 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
            清除本次会话中的临时筛选、草稿和状态修改，不删除磁盘文件。
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="outline"
                className="h-8 border-[var(--ui-border)] px-3 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)] hover:bg-[var(--ui-canvas)]"
              />
            }
          >
            <RotateCcw className="size-3.5" />
            恢复初始状态
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>恢复演示初始状态？</AlertDialogTitle>
              <AlertDialogDescription>
                本次会话中新增的自动化、批注草稿和临时偏好将复位。磁盘文件和来源系统数据不会受到影响。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={onResetDemo}
                className="bg-[var(--ui-danger)] text-[color:var(--ui-on-brand)] hover:bg-[var(--ui-danger)]"
              >
                确认恢复
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="mt-4 flex items-center gap-4 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
        <button type="button" className="hover:text-[color:var(--ui-brand)]">
          查看使用说明
        </button>
        <button type="button" className="hover:text-[color:var(--ui-brand)]">
          问题反馈
        </button>
        <button type="button" className="hover:text-[color:var(--ui-brand)]">
          隐私说明
        </button>
      </div>
    </>
  );
}

export function SettingsPage({
  onOpenConnections,
  onResetDemo,
  defaultModelMode,
  onDefaultModelModeChange,
  defaultRouting,
  onDefaultRoutingChange,
}: {
  onOpenConnections: () => void;
  onResetDemo: () => void;
  defaultModelMode: ModelMode;
  onDefaultModelModeChange: (mode: ModelMode) => void;
  defaultRouting: RoutingConfig;
  onDefaultRoutingChange: (routing: RoutingConfig) => void;
}) {
  const [section, setSection] = useState<SettingsSection>('account');
  return (
    <div className="fw-settings-page min-h-0 flex-1 overflow-y-auto bg-[var(--ui-center)]">
      <div className="mx-auto flex min-h-full max-w-[1120px] px-7 py-6">
        <div className="flex min-h-[660px] w-full overflow-hidden rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow)]">
          <nav
            aria-label="设置分类"
            data-settings-nav
            className="w-[220px] shrink-0 border-r border-[var(--ui-border)] bg-[var(--ui-surface)] p-3"
          >
            <p className="px-3 pb-3 pt-2 text-[length:var(--ui-font-meta)] font-semibold uppercase tracking-[0.12em] text-[color:var(--ui-muted)]">
              个人设置
            </p>
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    aria-current={section === item.id ? 'page' : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${section === item.id ? 'bg-[var(--ui-brand-soft)] text-[color:var(--ui-brand)]' : 'text-[color:var(--ui-muted)] hover:bg-[var(--ui-canvas)] hover:text-[color:var(--ui-text)]'}`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[length:var(--ui-font-meta)] font-medium">
                        {item.label}
                      </span>
                      <span
                        className={`mt-0.5 block truncate text-[length:var(--ui-font-meta)] ${section === item.id ? 'text-[color:var(--ui-muted)]' : 'text-[color:var(--ui-muted)]'}`}
                      >
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
          <section className="fw-settings-content min-w-0 flex-1 overflow-y-auto px-7 py-6">
            {section === 'account' ? <AccountSection /> : null}
            {section === 'model' ? (
              <ModelSection
                mode={defaultModelMode}
                onModeChange={onDefaultModelModeChange}
                routing={defaultRouting}
                onRoutingChange={onDefaultRoutingChange}
              />
            ) : null}
            {section === 'permission' ? (
              <PermissionSection onOpenConnections={onOpenConnections} />
            ) : null}
            {section === 'task' ? <TaskSection /> : null}
            {section === 'notification' ? <NotificationSection /> : null}
            {section === 'appearance' ? <AppearanceSection /> : null}
            {section === 'about' ? (
              <AboutSection onResetDemo={onResetDemo} />
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
