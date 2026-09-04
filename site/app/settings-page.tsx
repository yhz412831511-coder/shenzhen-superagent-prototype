"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
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
} from "lucide-react";

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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DefaultModelSettings,
  type ModelMode,
  type RoutingConfig,
} from "./model-routing";

type SettingsSection =
  | "account"
  | "model"
  | "permission"
  | "task"
  | "notification"
  | "appearance"
  | "about";

type NavItem = {
  id: SettingsSection;
  label: string;
  description: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { id: "account", label: "账号与身份", description: "当前政务身份", icon: UserRound },
  { id: "model", label: "模型与调度", description: "默认模式与四级路由", icon: Bot },
  { id: "permission", label: "权限与执行", description: "文件、连接与确认", icon: ShieldCheck },
  { id: "task", label: "任务偏好", description: "成果与表达习惯", icon: SlidersHorizontal },
  { id: "notification", label: "通知", description: "只保留必要提醒", icon: Bell },
  { id: "appearance", label: "外观", description: "主题、字号与动效", icon: Palette },
  { id: "about", label: "帮助与关于", description: "版本、快捷键与说明", icon: CircleHelp },
];

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5 border-b border-[#E8ECF2] pb-4">
      <h2 className="text-[16px] font-semibold text-[#253044]">{title}</h2>
      <p className="mt-1 text-[10px] leading-5 text-[#7A8798]">{description}</p>
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
    <div className="flex min-h-[64px] items-center gap-6 border-b border-[#EEF1F5] py-3.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-[#344054]">{title}</p>
        {description ? <p className="mt-1 text-[9px] leading-4 text-[#8A96A8]">{description}</p> : null}
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
    <div className="flex items-center rounded-[9px] bg-[#EEF1F5] p-0.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`h-7 rounded-[7px] px-3 text-[9.5px] transition ${value === option ? "bg-white text-[#344054] shadow-sm" : "text-[#7A8798] hover:text-[#475467]"}`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function LockedRule({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#E1E7EF] bg-[#F8FAFC] p-3.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-white text-[#4F6EBE] shadow-sm">
        <LockKeyhole className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[10.5px] font-medium text-[#344054]">
          {title}
          <span className="rounded-md bg-[#EAF0FC] px-1.5 py-0.5 text-[8px] font-normal text-[#5870AB]">组织策略</span>
        </span>
        <span className="mt-1 block text-[9px] leading-4 text-[#7A8798]">{description}</span>
      </span>
      <Switch checked disabled aria-label={`${title}已由组织启用`} />
    </div>
  );
}

function AccountSection() {
  return (
    <>
      <SectionHeading title="账号与身份" description="所有读取、写入和留痕都以当前登录的政务身份为准。" />
      <div className="flex items-center gap-4 rounded-2xl border border-[#DDE5F1] bg-[linear-gradient(120deg,#F9FBFF,#F3F7FF)] p-5">
        <span className="grid size-12 place-items-center rounded-full bg-[#2457B8] text-[15px] font-semibold text-white shadow-[0_8px_22px_rgba(36,87,184,.2)]">林</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold text-[#253044]">林思远</p>
            <span className="flex items-center gap-1 rounded-full border border-[#BFE4D4] bg-[#EFF9F4] px-2 py-0.5 text-[8.5px] text-[#24805F]"><Check className="size-2.5" />身份已验证</span>
          </div>
          <p className="mt-1 text-[10px] text-[#667085]">深圳市司法局 · 综合处 · 材料经办岗</p>
          <p className="mt-2 flex items-center gap-1.5 text-[8.8px] text-[#8A96A8]"><ShieldCheck className="size-3" />当前身份范围由统一身份认证和来源系统共同决定</p>
        </div>
      </div>
      <div className="mt-5">
        <SettingRow title="工作身份" description="用户不能自行切换到未获授权的单位、处室或岗位。"><span className="text-[10px] text-[#475467]">当前岗位身份</span></SettingRow>
        <SettingRow title="登录与验证" description="登录状态异常时，连接器会暂停调用并提示重新验证。"><span className="rounded-lg bg-[#F0F7F4] px-2.5 py-1.5 text-[9px] text-[#28765A]">状态正常</span></SettingRow>
        <SettingRow title="个人工作空间" description="个人资料、任务偏好和有效记忆跟随当前账号。"><span className="text-[10px] text-[#475467]">政务云个人空间</span></SettingRow>
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
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#DDE5F1] bg-[#F8FAFD] px-3.5 py-3 text-[9px] leading-4 text-[#667085]"><Info className="mt-0.5 size-3.5 shrink-0 text-[#5572BC]" />这里是个人默认偏好，不是平台治理后台；可选范围、接入状态和安全边界仍由组织统一管理。</div>
    </>
  );
}

function PermissionSection({ onOpenConnections }: { onOpenConnections: () => void }) {
  const [execution, setExecution] = useState<"本地优先" | "智能选择">("智能选择");
  return (
    <>
      <SectionHeading title="权限与执行" description="管理个人可选的默认范围；组织安全策略和任务中的责任确认不可绕过。" />
      <div className="mb-5">
        <SettingRow title="任务执行位置" description="涉及本地文件时优先在当前政务终端处理；其他任务由系统按策略选择。"><ChoiceGroup value={execution} options={["本地优先", "智能选择"] as const} onChange={setExecution} /></SettingRow>
        <SettingRow title="默认文件范围" description="新任务只读取用户主动添加的文件，不自动扫描个人目录。"><span className="rounded-lg border border-[#DCE3ED] bg-white px-2.5 py-1.5 text-[9.5px] text-[#475467]">仅任务所选文件</span></SettingRow>
        <SettingRow title="已连接身份" description="连接只继承来源系统中当前身份原有的权限。"><Button variant="outline" onClick={onOpenConnections} className="h-8 px-3 text-[9.5px]">管理连接器<ChevronRight className="size-3" /></Button></SettingRow>
      </div>
      <p className="mb-2.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">始终生效的安全规则</p>
      <div className="space-y-2.5">
        <LockedRule title="完整审计留痕" description="记录任务使用的身份、来源、能力、关键判断和外部操作回执。" />
        <LockedRule title="高风险动作确认" description="提交、发送、回写、销号等改变外部状态的动作必须由本人确认。" />
        <LockedRule title="扩大读取范围确认" description="任务首次访问新的目录、系统范围或敏感资料前单独说明影响。" />
      </div>
    </>
  );
}

function TaskSection() {
  const [autoOpen, setAutoOpen] = useState(true);
  const [citation, setCitation] = useState<"来源＋日期" | "简明脚注">("来源＋日期");
  const [style, setStyle] = useState<"结论优先" | "平衡展开">("结论优先");
  return (
    <>
      <SectionHeading title="任务偏好" description="设置默认工作习惯；具体任务仍可根据目标和项目单独调整。" />
      <SettingRow title="默认保存位置" description="成果保存到任务归属项目的工作区；项目归属仍在每个任务中确认。"><span className="text-[10px] text-[#475467]">项目工作区</span></SettingRow>
      <SettingRow title="完成后打开首要成果" description="任务完成时在内置浏览器中直接打开首要成果。"><Switch checked={autoOpen} onCheckedChange={setAutoOpen} aria-label="完成后打开首要成果" /></SettingRow>
      <SettingRow title="引用格式" description="适用于研究、审查和正式材料中的来源标注。"><ChoiceGroup value={citation} options={["来源＋日期", "简明脚注"] as const} onChange={setCitation} /></SettingRow>
      <SettingRow title="默认表达方式" description="影响内容组织顺序，不改变事实、依据或正式格式。"><ChoiceGroup value={style} options={["结论优先", "平衡展开"] as const} onChange={setStyle} /></SettingRow>
      <SettingRow title="工作语言" description="默认使用简体中文，引用原文时保留来源语言。"><span className="flex items-center gap-1.5 text-[10px] text-[#475467]"><Languages className="size-3.5 text-[#5E76B8]" />简体中文</span></SettingRow>
    </>
  );
}

function NotificationSection() {
  const [settings, setSettings] = useState({ confirm: true, complete: true, failed: true, automation: true });
  const toggle = (key: keyof typeof settings, value: boolean) => setSettings((state) => ({ ...state, [key]: value }));
  return (
    <>
      <SectionHeading title="通知" description="只提醒需要你介入或已经产生明确结果的事项，不播报每个执行步骤。" />
      <SettingRow title="等待本人确认" description="任务需要扩大读取范围、外部写入或关键业务判断时。"><Switch checked={settings.confirm} onCheckedChange={(value) => toggle("confirm", value)} aria-label="等待本人确认通知" /></SettingRow>
      <SettingRow title="任务完成" description="成果已形成并通过任务内质量检查时。"><Switch checked={settings.complete} onCheckedChange={(value) => toggle("complete", value)} aria-label="任务完成通知" /></SettingRow>
      <SettingRow title="运行失败" description="任务无法继续且需要重试、补充材料或重新授权时。"><Switch checked={settings.failed} onCheckedChange={(value) => toggle("failed", value)} aria-label="运行失败通知" /></SettingRow>
      <SettingRow title="自动化异常" description="自动化未按计划运行、来源失效或需要重新确认时。"><Switch checked={settings.automation} onCheckedChange={(value) => toggle("automation", value)} aria-label="自动化异常通知" /></SettingRow>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#F7F9FC] px-3.5 py-3 text-[9px] text-[#7A8798]"><Bell className="size-3.5 text-[#5E76B8]" />执行步骤与普通进度不会产生系统通知，可在任务概览中随时查看。</div>
    </>
  );
}

function AppearanceSection() {
  const [fontSize, setFontSize] = useState<"标准" | "较大">("标准");
  const [reducedMotion, setReducedMotion] = useState(false);
  return (
    <>
      <SectionHeading title="外观" description="本轮原型固定使用浅色政务主题，并保留最必要的可读性选项。" />
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="flex items-center gap-3 rounded-xl border border-[#9FB7EB] bg-[#F4F7FF] p-4 text-left"><span className="grid size-9 place-items-center rounded-xl bg-white text-[#3865CA] shadow-sm"><Sun className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-[10.5px] font-medium text-[#344054]">浅色主题</span><span className="mt-1 block text-[8.8px] text-[#7A8798]">当前演示主题</span></span><Check className="size-3.5 text-[#3865CA]" /></button>
        <button type="button" disabled className="flex items-center gap-3 rounded-xl border border-[#E1E6EE] bg-[#FAFBFC] p-4 text-left opacity-55"><span className="grid size-9 place-items-center rounded-xl bg-[#F1F3F6] text-[#7A8798]"><MoonStar className="size-4" /></span><span><span className="block text-[10.5px] font-medium text-[#344054]">跟随系统</span><span className="mt-1 block text-[8.8px] text-[#7A8798]">正式版本开放</span></span></button>
      </div>
      <div className="mt-5">
        <SettingRow title="界面字号" description="增大任务正文、标签和操作控件的显示尺寸。"><ChoiceGroup value={fontSize} options={["标准", "较大"] as const} onChange={setFontSize} /></SettingRow>
        <SettingRow title="减少动态效果" description="降低运行状态呼吸、面板切换和内容更新动画。"><Switch checked={reducedMotion} onCheckedChange={setReducedMotion} aria-label="减少动态效果" /></SettingRow>
      </div>
    </>
  );
}

function AboutSection({ onResetDemo }: { onResetDemo: () => void }) {
  const shortcuts = [["⌘ K", "搜索任务、材料和能力"], ["⌘ N", "新建任务"], ["⌘ ↵", "发送当前输入"], ["Esc", "关闭当前浮层或菜单"]];
  return (
    <>
      <SectionHeading title="帮助与关于" description="查看当前版本、使用边界和常用快捷方式。" />
      <div className="flex items-center gap-4 rounded-2xl border border-[#DDE5F1] bg-[#F8FAFD] p-5"><span className="brand-mark grid size-11 place-items-center rounded-[14px]"><Sparkles className="size-5 text-white" /></span><div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-[#253044]">深圳政务超级智能体</p><p className="mt-1 text-[9.5px] text-[#7A8798]">用户端交互原型 · 2026.09</p></div><span className="rounded-lg border border-[#DCE3ED] bg-white px-2.5 py-1.5 text-[9px] text-[#667085]">仿真演示环境</span></div>
      <div className="mt-5 grid grid-cols-2 gap-4">
        <section className="rounded-xl border border-[#E1E6EE] p-4"><p className="flex items-center gap-2 text-[10.5px] font-medium text-[#344054]"><Keyboard className="size-3.5 text-[#5E76B8]" />快捷键</p><div className="mt-3 space-y-2.5">{shortcuts.map(([keys, action]) => <div key={keys} className="flex items-center justify-between text-[9px] text-[#667085]"><span>{action}</span><kbd className="rounded-md border border-[#DCE2EA] bg-[#F7F8FA] px-1.5 py-0.5 font-sans text-[8px] text-[#596579]">{keys}</kbd></div>)}</div></section>
        <section className="rounded-xl border border-[#E1E6EE] p-4"><p className="flex items-center gap-2 text-[10.5px] font-medium text-[#344054]"><Eye className="size-3.5 text-[#5E76B8]" />隐私与权限</p><div className="mt-3 space-y-2 text-[9px] leading-4 text-[#667085]"><p>资料权限随来源系统和当前身份，不因使用智能体扩大。</p><p>任务中的外部写入、高风险动作和范围扩大保持本人可见并单独确认。</p><p>当前原型使用演示数据，不连接真实业务后台。</p></div></section>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-[#E8ECF2] pt-4"><div><p className="text-[10.5px] font-medium text-[#344054]">恢复演示初始状态</p><p className="mt-1 text-[9px] text-[#8A96A8]">清除本次会话中的临时筛选、草稿和状态修改，不删除磁盘文件。</p></div><AlertDialog><AlertDialogTrigger render={<Button variant="outline" className="h-8 border-[#E2C8C5] px-3 text-[9.5px] text-[#A74D48] hover:bg-[#FFF6F5]" />}><RotateCcw className="size-3.5" />恢复初始状态</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>恢复演示初始状态？</AlertDialogTitle><AlertDialogDescription>本次会话中新增的自动化、批注草稿和临时偏好将复位。磁盘文件和来源系统数据不会受到影响。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={onResetDemo} className="bg-[#B34F49] text-white hover:bg-[#9D443F]">确认恢复</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>
      <div className="mt-4 flex items-center gap-4 text-[9px] text-[#7A8798]"><button type="button" className="hover:text-[#315FC7]">查看使用说明</button><button type="button" className="hover:text-[#315FC7]">问题反馈</button><button type="button" className="hover:text-[#315FC7]">隐私说明</button></div>
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
  const [section, setSection] = useState<SettingsSection>("account");
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#F5F7FB]">
      <div className="mx-auto flex min-h-full max-w-[1120px] px-7 py-6">
        <div className="flex min-h-[660px] w-full overflow-hidden rounded-2xl border border-[#DDE3EC] bg-white shadow-[0_16px_44px_rgba(28,42,68,.055)]">
          <nav aria-label="设置分类" className="w-[220px] shrink-0 border-r border-[#E7EBF1] bg-[#FAFBFD] p-3">
            <p className="px-3 pb-3 pt-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#98A2B3]">个人设置</p>
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return <button key={item.id} type="button" onClick={() => setSection(item.id)} aria-current={section === item.id ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${section === item.id ? "bg-[#EDF3FF] text-[#315FC7]" : "text-[#667085] hover:bg-[#F1F4F8] hover:text-[#344054]"}`}><Icon className="size-4 shrink-0" /><span className="min-w-0 flex-1"><span className="block text-[10.5px] font-medium">{item.label}</span><span className={`mt-0.5 block truncate text-[8.3px] ${section === item.id ? "text-[#6D83B9]" : "text-[#98A2B3]"}`}>{item.description}</span></span></button>;
              })}
            </div>
          </nav>
          <section className="min-w-0 flex-1 overflow-y-auto px-7 py-6">
            {section === "account" ? <AccountSection /> : null}
            {section === "model" ? (
              <ModelSection
                mode={defaultModelMode}
                onModeChange={onDefaultModelModeChange}
                routing={defaultRouting}
                onRoutingChange={onDefaultRoutingChange}
              />
            ) : null}
            {section === "permission" ? <PermissionSection onOpenConnections={onOpenConnections} /> : null}
            {section === "task" ? <TaskSection /> : null}
            {section === "notification" ? <NotificationSection /> : null}
            {section === "appearance" ? <AppearanceSection /> : null}
            {section === "about" ? <AboutSection onResetDemo={onResetDemo} /> : null}
          </section>
        </div>
      </div>
    </div>
  );
}
