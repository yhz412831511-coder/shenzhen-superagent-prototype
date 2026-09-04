"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, CalendarClock, Check, ChevronRight, CircleAlert,
  Clock3, FileClock, FolderOpen, History, ListFilter, LockKeyhole, Play,
  Plus, Search, ShieldCheck, Sparkles, Workflow,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type TaskKey = "daily" | "tracking";
type AutomationStatus = "已启用" | "已暂停";
type AutomationItem = {
  id: string; name: string; goal: string; project: "日常待办" | "重点任务跟踪";
  schedule: string; sources: string[]; automaticActions: string[];
  confirmationActions: string[]; permissions: string; notifications: string;
  status: AutomationStatus; lastRun: string; nextRun: string; runTask?: TaskKey;
};
type Draft = Pick<AutomationItem, "name" | "goal" | "project" | "schedule">;

const initialAutomations: AutomationItem[] = [
  {
    id: "daily-digest", name: "每日待办梳理", project: "日常待办", schedule: "工作日 08:30",
    goal: "汇总当前身份可见的待办、通知与项目任务，形成当日优先清单和未发送回复草稿。",
    sources: ["OA系统", "深政易", "项目任务"],
    automaticActions: ["读取已授权待办与通知", "按事项和来源归并去重", "生成优先清单与回复草稿"],
    confirmationActions: ["批量处理低风险事项", "发送回复或回写来源状态"],
    permissions: "只读当前身份已授权范围；写入和发送保持任务内确认。",
    notifications: "需要确认、运行失败或任务完成时通知",
    status: "已启用", lastRun: "今天 08:30 · 已完成", nextRun: "明天 08:30", runTask: "daily",
  },
  {
    id: "key-task-tracking", name: "重点任务跟踪", project: "重点任务跟踪", schedule: "工作日 09:00",
    goal: "跟踪正式督办事项和用户主动录入的线下任务，识别临期、停滞与来源状态冲突。",
    sources: ["督查督办系统", "OA系统", "项目资料"],
    automaticActions: ["读取事项状态与最新纪要", "识别临期、停滞和来源冲突", "生成跟踪清单与催办草稿"],
    confirmationActions: ["确认冲突事项采用的状态", "确认接收单位、期限和发送渠道"],
    permissions: "不跟踪人员、不做个人排名；不自动改变责任人、期限或事项状态。",
    notifications: "发现冲突、运行失败或任务完成时通知",
    status: "已启用", lastRun: "今天 09:00 · 3项关注", nextRun: "明天 09:00", runTask: "tracking",
  },
];

function StatusBadge({ status }: { status: AutomationStatus }) {
  return <span className={`rounded-full px-2 py-1 text-[9px] ${status === "已启用" ? "bg-[#EAF8F1] text-[#18845E]" : "bg-[#F1F3F6] text-[#7A8798]"}`}>{status}</span>;
}

function BackButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="mb-4 flex items-center gap-1.5 rounded-lg px-1 py-1 text-[10px] text-[#667085] hover:text-[#2857C5]"><ArrowLeft className="size-3.5" />返回自动化</button>;
}

export function AutomationPage({ onOpenTask }: { onOpenTask: (key: TaskKey) => void }) {
  const [automations, setAutomations] = useState(initialAutomations);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"全部" | AutomationStatus>("全部");
  const [mode, setMode] = useState<"list" | "detail" | "create">("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notice, setNotice] = useState("");
  const [testRun, setTestRun] = useState(false);

  const results = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return automations.filter((item) => (filter === "全部" || item.status === filter) && (!keyword || `${item.name}${item.goal}${item.project}${item.sources.join("")}`.toLowerCase().includes(keyword)));
  }, [automations, filter, query]);
  const selected = automations.find((item) => item.id === selectedId);

  const setStatus = (item: AutomationItem, enabled: boolean) => {
    const status: AutomationStatus = enabled ? "已启用" : "已暂停";
    setAutomations((items) => items.map((candidate) => candidate.id === item.id ? { ...candidate, status } : candidate));
    setNotice(enabled ? `“${item.name}”已启用，将按下一次计划运行。` : `“${item.name}”已暂停，历史任务仍然保留。`);
  };
  const runNow = (item: AutomationItem) => {
    setAutomations((items) => items.map((candidate) => candidate.id === item.id ? { ...candidate, lastRun: "刚刚 · 已生成普通任务" } : candidate));
    setNotice(`“${item.name}”已生成一次运行任务；不会改变后续计划。`);
  };
  const openCreate = () => { setMode("create"); setPrompt(""); setDraft(null); setNotice(""); setTestRun(false); };
  const generateDraft = () => {
    const clean = prompt.trim(); if (!clean) return;
    const tracking = clean.includes("重点") || clean.includes("跟踪");
    setDraft({ name: tracking ? "重点事项定期跟踪" : "每周事项整理", goal: clean, project: tracking ? "重点任务跟踪" : "日常待办", schedule: clean.includes("每周五") ? "每周五 16:30" : "工作日 08:30" });
    setNotice("已根据描述形成草稿。启用前请确认项目、时间、来源和需要人工确认的动作。");
  };
  const enableDraft = () => {
    if (!draft) return;
    const next: AutomationItem = {
      id: `automation-${Date.now()}`, ...draft, sources: ["OA系统", "项目任务", "当前身份可见通知"],
      automaticActions: ["读取已授权来源", "归并并识别关注项", "生成任务清单和工作草稿"],
      confirmationActions: ["发送消息", "提交或回写外部系统"],
      permissions: "只读当前身份已授权范围；改变外部状态的动作均需确认。",
      notifications: "需要确认、运行失败或任务完成时通知", status: "已启用",
      lastRun: testRun ? "刚刚 · 测试任务已完成" : "尚未运行", nextRun: draft.schedule,
    };
    setAutomations((items) => [next, ...items]); setSelectedId(next.id); setMode("detail");
    setNotice(`“${next.name}”已启用；测试记录和后续运行都作为普通任务保留。`);
  };

  if (mode === "create") return <div className="min-h-0 flex-1 overflow-y-auto bg-[#F5F7FB]"><div className="mx-auto max-w-[960px] px-7 pb-10 pt-5"><BackButton onClick={() => setMode("list")} /><div className="overflow-hidden rounded-2xl border border-[#DDE3EC] bg-white shadow-[0_18px_50px_rgba(28,42,68,.06)]"><div className="border-b border-[#E8ECF2] bg-[linear-gradient(110deg,#FBFCFF,#F5F8FF)] px-6 py-5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-[13px] bg-[#EAF1FF] text-[#4266C9]"><Sparkles className="size-4" /></span><div><h2 className="text-[16px] font-semibold text-[#253044]">新建自动化</h2><p className="mt-1 text-[10px] text-[#7A8798]">先描述希望系统定期替你完成什么</p></div></div></div><div className="p-6">
    {!draft ? <><Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="例如：每周五下午整理下周需要领导确认的事项，只生成清单和提醒草稿，不要自动发送。" className="min-h-[132px] resize-none rounded-xl border-[#D9E1EC] bg-[#FBFCFE] p-4 text-[13px] leading-6 shadow-none focus-visible:ring-[#B8CAF5]" /><div className="mt-3 flex flex-wrap gap-2">{["每周五整理下周待确认事项", "每天汇总临期项目并生成提醒草稿", "每月形成工作进展简报"].map((item) => <button key={item} type="button" onClick={() => setPrompt(item)} className="rounded-lg border border-[#DFE5EE] bg-white px-2.5 py-1.5 text-[9.5px] text-[#657286] hover:border-[#B9C9EA] hover:text-[#3159B7]">{item}</button>)}</div><div className="mt-5 flex justify-end"><Button onClick={generateDraft} disabled={!prompt.trim()} className="h-9 bg-[#245EDC] px-4 text-[10.5px] text-white hover:bg-[#1C50C5]">生成自动化草稿 <ArrowRight className="size-3.5" /></Button></div></> : <>
      {notice ? <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#D7E3F7] bg-[#F3F7FF] px-3 py-2.5 text-[9.8px] leading-4 text-[#4B6193]"><ShieldCheck className="mt-0.5 size-3.5 shrink-0" />{notice}</div> : null}
      <div className="grid grid-cols-2 gap-4"><label htmlFor="automation-name" className="space-y-1.5 text-[9px] text-[#7A8798]"><span>名称</span><input id="automation-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="h-9 w-full rounded-lg border border-[#DDE3EC] px-3 text-[11px] text-[#344054] outline-none focus:border-[#9BB6F4]" /></label><label htmlFor="automation-project" className="space-y-1.5 text-[9px] text-[#7A8798]"><span>归属项目</span><select id="automation-project" value={draft.project} onChange={(event) => setDraft({ ...draft, project: event.target.value as Draft["project"] })} className="h-9 w-full rounded-lg border border-[#DDE3EC] bg-white px-3 text-[11px] text-[#344054] outline-none focus:border-[#9BB6F4]"><option>日常待办</option><option>重点任务跟踪</option></select></label><div className="col-span-2 space-y-1.5 text-[9px] text-[#7A8798]"><label htmlFor="automation-goal">任务目标</label><Textarea id="automation-goal" value={draft.goal} onChange={(event) => setDraft({ ...draft, goal: event.target.value })} className="min-h-[84px] resize-none rounded-lg border-[#DDE3EC] p-3 text-[11px] leading-5 shadow-none" /></div><label htmlFor="automation-schedule" className="space-y-1.5 text-[9px] text-[#7A8798]"><span>运行计划</span><input id="automation-schedule" value={draft.schedule} onChange={(event) => setDraft({ ...draft, schedule: event.target.value })} className="h-9 w-full rounded-lg border border-[#DDE3EC] px-3 text-[11px] text-[#344054] outline-none focus:border-[#9BB6F4]" /></label><div className="space-y-1.5 text-[9px] text-[#7A8798]"><span>通知</span><div className="flex h-9 items-center rounded-lg border border-[#DDE3EC] px-3 text-[10px] text-[#58667B]">仅在需确认、完成或失败时</div></div></div>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#EBEEF3] pt-4"><div className="rounded-xl bg-[#F7F9FC] p-3"><p className="text-[9px] font-semibold text-[#7A8798]">自动完成</p><div className="mt-2 space-y-1.5 text-[9.5px] text-[#58667B]"><p>读取已授权的OA、项目任务和通知</p><p>归并信息并生成普通任务与工作草稿</p></div></div><div className="rounded-xl border border-[#E7DFC9] bg-[#FFF9EF] p-3"><p className="text-[9px] font-semibold text-[#8B6B2F]">需要你确认</p><div className="mt-2 space-y-1.5 text-[9.5px] text-[#735F37]"><p>发送消息、提交或回写外部系统</p><p>来源冲突和责任边界不清的事项</p></div></div></div>
      {testRun ? <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#CFE8DC] bg-[#F1FAF5] px-3 py-2.5 text-[9.8px] text-[#237253]"><Check className="size-3.5" />测试任务已完成，计划尚未启用；测试记录将随任务保留。</div> : null}
      <div className="mt-5 flex items-center justify-between"><Button variant="outline" onClick={() => setDraft(null)} className="h-9 px-3 text-[10px]">重新描述</Button><div className="flex gap-2"><Button variant="outline" onClick={() => setTestRun(true)} className="h-9 px-3 text-[10px]"><Play className="size-3.5" />测试运行</Button><Button onClick={enableDraft} className="h-9 bg-[#245EDC] px-4 text-[10px] text-white hover:bg-[#1C50C5]">确认并启用</Button></div></div>
    </>}
  </div></div></div></div>;

  if (mode === "detail" && selected) return <div className="min-h-0 flex-1 overflow-y-auto bg-[#F5F7FB]"><div className="mx-auto max-w-[980px] px-7 pb-10 pt-5"><BackButton onClick={() => { setMode("list"); setNotice(""); }} /><div className="overflow-hidden rounded-2xl border border-[#DDE3EC] bg-white shadow-[0_18px_50px_rgba(28,42,68,.06)]"><div className="flex items-center gap-4 border-b border-[#E8ECF2] bg-[linear-gradient(110deg,#FBFCFF,#F5F8FF)] px-6 py-5"><span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#EAF1FF] text-[#4266C9]"><Workflow className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="text-[16px] font-semibold text-[#253044]">{selected.name}</h2><StatusBadge status={selected.status} /></div><p className="mt-1.5 text-[9.5px] text-[#7A8798]">{selected.project} · {selected.schedule} · 每次运行生成普通任务</p></div><div className="flex items-center gap-3 text-[9.5px] text-[#667085]"><span>{selected.status === "已启用" ? "启用" : "暂停"}</span><Switch checked={selected.status === "已启用"} onCheckedChange={(checked) => setStatus(selected, checked)} /></div></div><div className="p-6">
    {notice ? <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#CFE8DC] bg-[#F1FAF5] px-3 py-2.5 text-[9.8px] text-[#237253]"><span className="flex items-center gap-2"><Check className="size-3.5" />{notice}</span>{selected.runTask ? <button type="button" onClick={() => onOpenTask(selected.runTask!)} className="font-medium text-[#245EDC] hover:underline">查看运行任务</button> : null}</div> : null}
    <p className="rounded-xl bg-[#F6F8FB] p-3 text-[10.5px] leading-5 text-[#475467]">{selected.goal}</p><div className="mt-4 grid grid-cols-4 gap-2">{[[FolderOpen, "项目", selected.project], [CalendarClock, "计划", selected.schedule], [History, "上次运行", selected.lastRun], [Clock3, "下次运行", selected.status === "已启用" ? selected.nextRun : "已暂停"]].map(([Icon, label, value]) => { const CardIcon = Icon as typeof Clock3; return <div key={label as string} className="rounded-xl border border-[#E3E8F0] bg-white p-3"><CardIcon className="size-3.5 text-[#5470BF]" /><p className="mt-2 text-[8.5px] text-[#98A2B3]">{label as string}</p><p className="mt-1 text-[9.5px] leading-4 text-[#475467]">{value as string}</p></div>; })}</div>
    <div className="mt-5 grid grid-cols-2 gap-4"><section className="rounded-xl border border-[#E0E6EF] p-4"><p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#98A2B3]">自动完成</p><div className="mt-3 space-y-2">{selected.automaticActions.map((item) => <div key={item} className="flex gap-2 text-[9.8px] leading-4 text-[#58667B]"><Check className="mt-0.5 size-3 shrink-0 text-[#258B67]" />{item}</div>)}</div></section><section className="rounded-xl border border-[#E7DFC9] bg-[#FFFCF6] p-4"><p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#9A7A3E]">需要你确认</p><div className="mt-3 space-y-2">{selected.confirmationActions.map((item) => <div key={item} className="flex gap-2 text-[9.8px] leading-4 text-[#735F37]"><CircleAlert className="mt-0.5 size-3 shrink-0" />{item}</div>)}</div></section></div>
    <section className="mt-5 border-t border-[#EBEEF3] pt-4"><div className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-3 text-[9.8px]"><span className="text-[#98A2B3]">信息来源</span><span className="flex flex-wrap gap-1.5">{selected.sources.map((item) => <span key={item} className="rounded-lg border border-[#DCE3F2] px-2 py-1 text-[#566786]">{item}</span>)}</span><span className="text-[#98A2B3]">权限边界</span><span className="text-[#58667B]">{selected.permissions}</span><span className="text-[#98A2B3]">通知条件</span><span className="text-[#58667B]">{selected.notifications}</span></div></section>
    <div className="mt-5 flex items-center justify-between border-t border-[#EBEEF3] pt-4"><p className="flex items-center gap-1.5 text-[9px] text-[#8A96A8]"><LockKeyhole className="size-3" />修改只影响未来运行，历史任务不会改变</p><Button onClick={() => runNow(selected)} className="h-9 bg-[#245EDC] px-4 text-[10px] text-white hover:bg-[#1C50C5]"><Play className="size-3.5" />立即运行</Button></div>
  </div></div></div></div>;

  return <div className="min-h-0 flex-1 overflow-y-auto bg-[#F5F7FB]"><div className="mx-auto flex h-full min-h-[660px] max-w-[1120px] flex-col px-7 pb-7 pt-6"><div className="mb-4 flex items-end justify-between gap-6"><div><p className="text-[13px] leading-5 text-[#667085]">按计划或来源变化自动创建任务；运行结果仍回到对应项目和普通任务历史。</p><p className="mt-1 flex items-center gap-1.5 text-[9px] text-[#8A96A8]"><ShieldCheck className="size-3.5 text-[#4E70CB]" />不自动提交 · 不改变来源状态</p></div><Button onClick={openCreate} className="h-9 bg-[#245EDC] px-4 text-[10px] text-white hover:bg-[#1C50C5]"><Plus className="size-3.5" />新建自动化</Button></div>
    <div className="mb-4 flex items-center gap-2"><label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-[#DCE3ED] bg-white px-3 focus-within:border-[#9BB6F4] focus-within:ring-2 focus-within:ring-[#DDE7FF]"><Search className="size-3.5 shrink-0 text-[#7B8798]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索自动化、项目或信息来源" className="min-w-0 flex-1 bg-transparent text-[11px] text-[#344054] outline-none placeholder:text-[#A0A9B7]" /></label><div className="flex h-9 items-center gap-1 rounded-[10px] bg-[#EAEDF2] p-0.5"><ListFilter className="ml-2 size-3 text-[#7A8798]" />{(["全部", "已启用", "已暂停"] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`h-8 rounded-lg px-3 text-[9.5px] transition ${filter === item ? "bg-white text-[#344054] shadow-sm" : "text-[#7A8798] hover:text-[#475467]"}`}>{item}</button>)}</div></div>
    <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-[#DDE3EC] bg-white shadow-[0_16px_42px_rgba(28,42,68,.055)]"><div className="flex h-10 items-center justify-between border-b border-[#EEF1F5] bg-[#FAFBFC] px-4 text-[9.5px] text-[#7A8798]"><span className="flex items-center"><FileClock className="mr-2 size-3.5 text-[#5472C5]" />我的自动化</span><span className="text-[#98A2B3]">{results.length} 项</span></div><div className="h-[calc(100%-2.5rem)] overflow-y-auto">{results.map((item) => <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setMode("detail"); setNotice(""); }} className="group flex min-h-[88px] w-full items-center gap-4 border-b border-[#EEF1F5] px-5 py-3.5 text-left transition last:border-b-0 hover:bg-[#F8FAFD]"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#EEF3FF] text-[#4266C9]"><Workflow className="size-[17px]" /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="text-[12px] font-medium text-[#253044]">{item.name}</span><StatusBadge status={item.status} /></span><span className="mt-1 line-clamp-1 block text-[9.8px] text-[#667085]">{item.goal}</span><span className="mt-2 flex flex-wrap items-center gap-x-2 text-[8.8px] text-[#98A2B3]"><span>{item.project}</span><span>·</span><span>{item.schedule}</span><span>·</span><span>{item.sources.join("、")}</span></span></span><span className="w-[130px] shrink-0 text-[8.8px] leading-4 text-[#8A96A8]"><span className="block">上次：{item.lastRun}</span><span className="block">下次：{item.status === "已启用" ? item.nextRun : "已暂停"}</span></span><ChevronRight className="size-3.5 shrink-0 text-[#C0C7D2] transition group-hover:translate-x-0.5 group-hover:text-[#6D82B6]" /></button>)}{!results.length ? <div className="grid h-52 place-items-center text-center"><div><Clock3 className="mx-auto size-5 text-[#B8C1CF]" /><p className="mt-2 text-[10px] text-[#7A8798]">没有符合当前条件的自动化</p></div></div> : null}</div></div>
  </div></div>;
}
