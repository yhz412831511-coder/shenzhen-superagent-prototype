"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  Building2,
  Check,
  ChevronRight,
  CircleAlert,
  Cloud,
  Database,
  File,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  HardDrive,
  History,
  Landmark,
  LibraryBig,
  Link2,
  LockKeyhole,
  PencilLine,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export type TaskContext = {
  id: string;
  kind:
    | "资料"
    | "知识库"
    | "Memory"
    | "专业智能体"
    | "Skill"
    | "插件"
    | "连接器";
  label: string;
};

type AssetSpace = "本地资料" | "云空间资料";
type PersonalAsset = {
  id: string;
  space: AssetSpace;
  name: string;
  type: "文件夹" | "DOCX" | "XLSX" | "PDF";
  location: string;
  updated: string;
  size: string;
  state: "本机可用" | "已同步" | "仅在线" | "需重新连接";
  description: string;
  usedBy: string[];
  permission: string;
};

const personalAssets: PersonalAsset[] = [
  {
    id: "local-current-materials",
    space: "本地资料",
    name: "当前待办材料",
    type: "文件夹",
    location: "本机 · 文稿／当前待办材料",
    updated: "今天 09:02",
    size: "12个文件",
    state: "本机可用",
    description: "近期需要审查、综合和回填的个人工作材料。只在明确选择后进入任务。",
    usedBy: ["涉企行政检查拟办", "城市管理条例草案审查"],
    permission: "仅本机读取；任务外不上传",
  },
  {
    id: "local-annual-ledger",
    space: "本地资料",
    name: "2025年度工作台账.xlsx",
    type: "XLSX",
    location: "本机 · 文稿／年度总结",
    updated: "今天 08:41",
    size: "248 KB",
    state: "本机可用",
    description: "个人整理的年度工作事实台账，包含事项、来源和待核验标记。",
    usedBy: ["2025年度司法行政工作报告"],
    permission: "仅本机读取；写回原文件需确认",
  },
  {
    id: "local-opinion-summary",
    space: "本地资料",
    name: "部门意见汇总.docx",
    type: "DOCX",
    location: "本机 · 下载／条例审查",
    updated: "昨天 16:28",
    size: "96 KB",
    state: "本机可用",
    description: "从OA事项下载的工作副本，来源与正式版本仍以OA事项为准。",
    usedBy: ["城市管理条例草案审查"],
    permission: "可读取；不会自动成为项目共享文件",
  },
  {
    id: "local-reference-pack",
    space: "本地资料",
    name: "常用公文参考",
    type: "文件夹",
    location: "本机 · 文稿／参考资料",
    updated: "2026-08-29",
    size: "18个文件",
    state: "本机可用",
    description: "个人维护的参考样例与格式说明，不等同于组织正式知识库。",
    usedBy: ["3条历史任务"],
    permission: "仅本机读取",
  },
  {
    id: "cloud-oa-personal",
    space: "云空间资料",
    name: "OA个人材料空间",
    type: "文件夹",
    location: "深圳OA协同 · 我的材料",
    updated: "今天 09:18",
    size: "最近同步 24项",
    state: "已同步",
    description: "当前OA身份可访问的个人材料索引；原件与权限仍由OA系统管理。",
    usedBy: ["涉企行政检查拟办"],
    permission: "按当前OA身份读取；外部写入单独确认",
  },
  {
    id: "cloud-gov-drive",
    space: "云空间资料",
    name: "政务云盘／我的文件",
    type: "文件夹",
    location: "政务云盘 · 林思远",
    updated: "昨天 18:10",
    size: "6个常用目录",
    state: "仅在线",
    description: "个人政务云盘目录，可按任务目标检索或选择具体文件。",
    usedBy: ["年度报告资料整理"],
    permission: "只读连接；保存新成果需再次确认位置",
  },
  {
    id: "cloud-collaboration",
    space: "云空间资料",
    name: "协作空间／综合处",
    type: "文件夹",
    location: "政务云盘 · 共享给我的空间",
    updated: "2026-08-31",
    size: "目录可发现",
    state: "需重新连接",
    description: "此前授权的协作目录，凭据已失效；重新连接前不会展示或读取正文。",
    usedBy: [],
    permission: "当前不可读取",
  },
];

type KnowledgeBaseItem = {
  id: string;
  name: string;
  level: "深圳统建" | "单位" | "处室" | "全市公开" | "专业专题";
  owner: string;
  scope: string;
  updated: string;
  state: "已接入" | "部分可用";
  capabilities: string[];
  description: string;
  identity: string;
};

const knowledgeBases: KnowledgeBaseItem[] = [
  {
    id: "lexiang",
    name: "乐享知识库",
    level: "深圳统建",
    owner: "深圳市统一知识服务",
    scope: "当前政务身份获准的统建知识范围",
    updated: "今天 08:30",
    state: "已接入",
    capabilities: ["语义检索", "来源定位", "权限过滤"],
    description: "承接深圳统建知识服务。SuperAgent只负责按任务调用与引用，不替代知识库内容建设。",
    identity: "林思远 · 综合处",
  },
  {
    id: "justice-bureau",
    name: "深圳市司法局知识库",
    level: "单位",
    owner: "深圳市司法局",
    scope: "本单位公开及当前岗位授权范围",
    updated: "今天 09:06",
    state: "已接入",
    capabilities: ["单位知识检索", "来源回溯", "版本提示"],
    description: "随当前单位身份接入的单位知识库。换用其他单位身份时，可见范围会相应变化。",
    identity: "单位身份匹配：深圳市司法局",
  },
  {
    id: "general-office",
    name: "综合处知识库",
    level: "处室",
    owner: "深圳市司法局综合处",
    scope: "综合处成员可用范围",
    updated: "昨天 17:40",
    state: "已接入",
    capabilities: ["处室经验检索", "材料范式", "任务引用"],
    description: "随处室身份接入的业务知识库，适合检索内部工作规范与已发布经验。",
    identity: "处室身份匹配：综合处",
  },
  {
    id: "city-public",
    name: "全市公开知识库",
    level: "全市公开",
    owner: "深圳市政务公开信息服务",
    scope: "全市公开信息",
    updated: "今天 07:55",
    state: "已接入",
    capabilities: ["公开信息检索", "原文链接", "跨来源聚合"],
    description: "聚合全市公开政务信息入口；任务仍需核对发布机关、时间与原文状态。",
    identity: "无需额外内部授权",
  },
  {
    id: "regulations",
    name: "法规条例库",
    level: "专业专题",
    owner: "法规数据服务",
    scope: "法律、行政法规、规章与规范性文件",
    updated: "今天 09:10",
    state: "部分可用",
    capabilities: ["法规检索", "效力状态", "条款定位"],
    description: "提供法规与条例检索能力。部分历史文本仍需回到发布机关原文核验有效状态。",
    identity: "当前身份可检索；部分全文受来源限制",
  },
];

function AssetIcon({ type }: { type: PersonalAsset["type"] }) {
  const Icon =
    type === "文件夹"
      ? Folder
      : type === "XLSX"
        ? FileSpreadsheet
        : type === "DOCX"
          ? FileText
          : File;
  return <Icon className="size-4" />;
}

function SurfaceTabs({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center border-b border-[#DDE3EC]">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`relative h-10 px-4 text-[11.5px] transition ${
            value === option
              ? "font-medium text-[#2857C5]"
              : "text-[#667085] hover:text-[#344054]"
          }`}
        >
          {option}
          {value === option ? (
            <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#4269D5]" />
          ) : null}
        </button>
      ))}
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-[#DCE3ED] bg-white px-3 focus-within:border-[#9BB6F4] focus-within:ring-2 focus-within:ring-[#DDE7FF]">
      <Search className="size-3.5 shrink-0 text-[#7B8798]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-[11px] text-[#344054] outline-none placeholder:text-[#A0A9B7]"
        placeholder={placeholder}
      />
    </label>
  );
}

export function LibraryPage({ onUse }: { onUse: (context: TaskContext) => void }) {
  const [section, setSection] = useState<"我的资料" | "接入知识库">("我的资料");
  const [space, setSpace] = useState<AssetSpace>("本地资料");
  const [query, setQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState(personalAssets[0].id);
  const [selectedBaseId, setSelectedBaseId] = useState(knowledgeBases[0].id);
  const [notice, setNotice] = useState("");

  const assets = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return personalAssets.filter(
      (item) =>
        item.space === space &&
        (!keyword || `${item.name}${item.location}${item.description}`.toLowerCase().includes(keyword)),
    );
  }, [query, space]);
  const bases = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return knowledgeBases.filter(
      (item) =>
        !keyword || `${item.name}${item.level}${item.owner}${item.scope}`.toLowerCase().includes(keyword),
    );
  }, [query]);
  const selectedAsset = assets.find((item) => item.id === selectedAssetId) ?? assets[0] ?? null;
  const selectedBase = bases.find((item) => item.id === selectedBaseId) ?? bases[0] ?? null;

  const switchSection = (next: string) => {
    setSection(next as "我的资料" | "接入知识库");
    setQuery("");
    setNotice("");
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#F5F7FB]">
      <div className="mx-auto flex h-full min-h-[660px] max-w-[1240px] flex-col px-7 pb-7 pt-6">
        <div className="mb-3 flex items-end justify-between gap-6">
          <p className="text-[13px] leading-5 text-[#667085]">
            管理自己的工作材料，或选择当前身份已经接入的知识库。
          </p>
          <span className="flex items-center gap-1.5 text-[9.5px] text-[#7A8798]">
            <ShieldCheck className="size-3.5 text-[#4E70CB]" /> 原件不搬家，权限随来源
          </span>
        </div>
        <SurfaceTabs value={section} options={["我的资料", "接入知识库"]} onChange={switchSection} />

        <div className="my-4 flex items-center gap-2">
          {section === "我的资料" ? (
            <div className="mr-1 flex rounded-[10px] bg-[#EAEDF2] p-0.5">
              {(["本地资料", "云空间资料"] as AssetSpace[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setSpace(option);
                    setQuery("");
                    const first = personalAssets.find((item) => item.space === option);
                    if (first) setSelectedAssetId(first.id);
                  }}
                  className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-[10px] transition ${
                    space === option
                      ? "bg-white text-[#344054] shadow-sm"
                      : "text-[#7A8798]"
                  }`}
                >
                  {option === "本地资料" ? <HardDrive className="size-3.5" /> : <Cloud className="size-3.5" />}
                  {option}
                </button>
              ))}
            </div>
          ) : null}
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder={section === "我的资料" ? "搜索名称、位置或用途" : "搜索已接入知识库"}
          />
          {section === "我的资料" ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setNotice(space === "本地资料" ? "已打开本地资料选择入口（演示）。" : "已打开云空间连接入口（演示）。")}
              className="h-9 shrink-0 border-[#DCE3ED] bg-white px-3 text-[10px] text-[#526070]"
            >
              {space === "本地资料" ? <Upload className="size-3.5" /> : <Link2 className="size-3.5" />}
              {space === "本地资料" ? "选择本地资料" : "连接云空间"}
            </Button>
          ) : null}
        </div>

        {notice ? (
          <div className="mb-3 flex items-center gap-2 rounded-[10px] border border-[#D6E3F8] bg-[#F5F8FF] px-3 py-2 text-[9.5px] text-[#52698F]">
            <Check className="size-3.5 text-[#3970DD]" /> {notice}
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.35fr)_minmax(360px,.95fr)] overflow-hidden rounded-2xl border border-[#DDE3EC] bg-white shadow-[0_16px_42px_rgba(28,42,68,.055)]">
          <div className="min-h-0 overflow-y-auto border-r border-[#E6EAF0]">
            <div className="flex h-10 items-center border-b border-[#EEF1F5] bg-[#FAFBFC] px-4 text-[9.5px] text-[#98A2B3]">
              {section === "我的资料" ? (
                <><FolderOpen className="mr-2 size-3.5 text-[#6078BD]" />{space} · 选择后才进入任务</>
              ) : (
                <><Database className="mr-2 size-3.5 text-[#6078BD]" />已接入的RAG知识库 · 不展示库内资料</>
              )}
            </div>

            {section === "我的资料"
              ? assets.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedAssetId(item.id)}
                    className={`relative w-full border-b border-[#EEF1F5] px-4 py-3.5 text-left transition last:border-b-0 ${selectedAsset?.id === item.id ? "bg-[#F5F8FF]" : "hover:bg-[#FAFBFD]"}`}
                  >
                    {selectedAsset?.id === item.id ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#4B70DA]" /> : null}
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[10px] bg-[#EEF3FF] text-[#4266C9]">
                        <AssetIcon type={item.type} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-[11.8px] font-medium text-[#253044]">{item.name}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[8.5px] ${item.state === "需重新连接" ? "bg-[#FFF3E7] text-[#A56323]" : "bg-[#ECF8F2] text-[#18845E]"}`}>{item.state}</span>
                        </span>
                        <span className="mt-1.5 block truncate text-[9.8px] text-[#667085]">{item.location}</span>
                        <span className="mt-2 flex items-center gap-2 text-[8.8px] text-[#98A2B3]">
                          <span>{item.type}</span><span>·</span><span>{item.size}</span><span>·</span><span>{item.updated}</span>
                        </span>
                      </span>
                      <ChevronRight className="mt-2 size-3.5 shrink-0 text-[#C0C7D2]" />
                    </div>
                  </button>
                ))
              : bases.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedBaseId(item.id)}
                    className={`relative w-full border-b border-[#EEF1F5] px-4 py-3.5 text-left transition last:border-b-0 ${selectedBase?.id === item.id ? "bg-[#F5F8FF]" : "hover:bg-[#FAFBFD]"}`}
                  >
                    {selectedBase?.id === item.id ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#655FD3]" /> : null}
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-[#EEF3FF] to-[#F3EEFF] text-[#5D62C8]">
                        <LibraryBig className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-[11.8px] font-medium text-[#253044]">{item.name}</span>
                          <span className="rounded-full bg-[#ECF8F2] px-2 py-0.5 text-[8.5px] text-[#18845E]">{item.state}</span>
                        </span>
                        <span className="mt-1.5 block text-[9.8px] text-[#667085]">{item.level} · {item.scope}</span>
                        <span className="mt-2 flex items-center gap-2 text-[8.8px] text-[#98A2B3]"><span>{item.owner}</span><span>·</span><span>同步 {item.updated}</span></span>
                      </span>
                      <ChevronRight className="mt-2 size-3.5 shrink-0 text-[#C0C7D2]" />
                    </div>
                  </button>
                ))}
          </div>

          <div className="min-h-0 overflow-y-auto bg-[#FCFDFE] p-5">
            {section === "我的资料" && selectedAsset ? (
              <>
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#EAF1FF] text-[#4568C7]"><AssetIcon type={selectedAsset.type} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold leading-5 text-[#253044]">{selectedAsset.name}</p>
                    <p className="mt-1 text-[9px] text-[#7A8798]">{selectedAsset.space} · {selectedAsset.state}</p>
                  </div>
                </div>
                {selectedAsset.state === "需重新连接" ? (
                  <div className="mt-4 flex gap-2 rounded-xl border border-[#ECDCB7] bg-[#FFF9EB] p-3 text-[9.5px] leading-4 text-[#87651E]"><CircleAlert className="mt-0.5 size-3.5 shrink-0" />重新连接前不会展示文件名或正文，也不能带入任务。</div>
                ) : null}
                <p className="mt-4 rounded-xl bg-[#F5F7FA] p-3 text-[10.5px] leading-5 text-[#475467]">{selectedAsset.description}</p>
                <dl className="mt-4 grid grid-cols-[76px_1fr] gap-x-3 gap-y-3 border-y border-[#EBEEF3] py-4 text-[9.8px]">
                  <dt className="text-[#98A2B3]">所在位置</dt><dd className="text-[#475467]">{selectedAsset.location}</dd>
                  <dt className="text-[#98A2B3]">修改时间</dt><dd className="text-[#475467]">{selectedAsset.updated}</dd>
                  <dt className="text-[#98A2B3]">规模</dt><dd className="text-[#475467]">{selectedAsset.size}</dd>
                  <dt className="text-[#98A2B3]">读取边界</dt><dd className="text-[#475467]">{selectedAsset.permission}</dd>
                </dl>
                <div className="mt-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#98A2B3]">最近用于</p>
                  <div className="mt-2 space-y-1.5">
                    {selectedAsset.usedBy.length ? selectedAsset.usedBy.map((task) => (
                      <div key={task} className="flex items-center gap-2 rounded-lg bg-[#F7F8FA] px-2.5 py-2 text-[9.5px] text-[#5C687A]"><History className="size-3.5 text-[#7788AD]" />{task}</div>
                    )) : <p className="text-[9.5px] text-[#98A2B3]">尚未用于任务</p>}
                  </div>
                </div>
                <div className="mt-4 flex gap-2 rounded-xl border border-[#DDE5F3] bg-[#F8FAFE] p-3 text-[9.5px] leading-4 text-[#64728A]"><LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-[#4E70CB]" />只建立当前任务引用，不自动上传、不加入项目，也不贡献给组织知识库。</div>
                <Button
                  type="button"
                  disabled={selectedAsset.state === "需重新连接"}
                  onClick={() => onUse({ id: selectedAsset.id, kind: "资料", label: selectedAsset.name })}
                  className="mt-5 h-9 w-full rounded-[10px] bg-[#245EDC] text-[11px] text-white hover:bg-[#1C50C5]"
                >
                  在新任务中使用 <ArrowRight className="size-3.5" />
                </Button>
              </>
            ) : null}

            {section === "接入知识库" && selectedBase ? (
              <>
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#EAF1FF] to-[#F0ECFF] text-[#5E62C7]"><Database className="size-[17px]" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold leading-5 text-[#253044]">{selectedBase.name}</p>
                    <p className="mt-1 text-[9px] text-[#7A8798]">{selectedBase.level} · {selectedBase.state}</p>
                  </div>
                </div>
                <p className="mt-4 rounded-xl bg-[#F5F7FA] p-3 text-[10.5px] leading-5 text-[#475467]">{selectedBase.description}</p>
                <dl className="mt-4 grid grid-cols-[76px_1fr] gap-x-3 gap-y-3 border-y border-[#EBEEF3] py-4 text-[9.8px]">
                  <dt className="text-[#98A2B3]">维护方</dt><dd className="text-[#475467]">{selectedBase.owner}</dd>
                  <dt className="text-[#98A2B3]">可用范围</dt><dd className="text-[#475467]">{selectedBase.scope}</dd>
                  <dt className="text-[#98A2B3]">身份关系</dt><dd className="text-[#475467]">{selectedBase.identity}</dd>
                  <dt className="text-[#98A2B3]">最近同步</dt><dd className="text-[#475467]">{selectedBase.updated}</dd>
                </dl>
                <div className="mt-4">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#98A2B3]">平台可调用能力</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{selectedBase.capabilities.map((item) => <span key={item} className="rounded-lg border border-[#DCE3F2] bg-white px-2 py-1 text-[9px] text-[#566786]">{item}</span>)}</div>
                </div>
                <div className="mt-4 flex gap-2 rounded-xl border border-[#DADFF2] bg-[#F7F7FD] p-3 text-[9.5px] leading-4 text-[#626A86]"><Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#655FD3]" />这里选择的是知识库范围。任务开始后，SuperAgent才会按目标检索具体内容并保留来源定位。</div>
                <Button
                  type="button"
                  onClick={() => onUse({ id: selectedBase.id, kind: "知识库", label: selectedBase.name })}
                  className="mt-5 h-9 w-full rounded-[10px] bg-[#535FC8] text-[11px] text-white hover:bg-[#444FB4]"
                >
                  使用该知识库新建任务 <ArrowRight className="size-3.5" />
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

type MemoryCategory = "办公偏好" | "办事经验" | "材料规则" | "智能体习惯" | "持续事项";
type PersonalMemory = {
  id: string;
  title: string;
  category: MemoryCategory;
  content: string;
  source: string;
  updated: string;
  lastUsed: string;
  effect: string;
  status: "生效中" | "已停用";
};

const seedPersonalMemories: PersonalMemory[] = [
  { id: "m-conclusion", title: "领导材料先给结论，再展开依据", category: "办公偏好", content: "形成汇报、审查意见或复盘时，先用简短段落给出结论和建议，再展开事实与依据。", source: "从3次材料任务中确认", updated: "今天 10:48", lastUsed: "今天 · 年度报告协同修订", effect: "调整表达顺序，不改变事实内容。", status: "生效中" },
  { id: "m-oa-confirm", title: "OA写入、发送和销号前必须由我确认", category: "办事经验", content: "可以自动打开事项并预填，但提交、发送、销号或改变业务状态前必须停下来由我本人确认。", source: "用户直接告诉AgentScope", updated: "昨天 17:26", lastUsed: "昨天 · 涉企行政检查拟办", effect: "任务自动推进到预填完成，最后一步暂停等待本人操作。", status: "生效中" },
  { id: "m-number", title: "没有可靠来源的精确数字不进入正式稿", category: "材料规则", content: "材料口径冲突或找不到可靠出处时，先标记待核验，不为了完整而补写精确数字。", source: "2025年度工作报告任务沉淀", updated: "今天 11:08", lastUsed: "今天 · 事实底账质量检查", effect: "数字进入母稿前先核对来源；冲突项会形成决策点。", status: "生效中" },
  { id: "m-plan", title: "复杂任务先展示计划，只报告关键变化", category: "智能体习惯", content: "AgentScope处理复杂任务时先给可扫读的待办计划；执行中只提示完成、阻断、重规划和需要我决定的事项。", source: "用户在任务中纠正AgentScope", updated: "今天 09:36", lastUsed: "今天 · 条例草案审查", effect: "减少过程噪音，同时保留任务可控性。", status: "生效中" },
  { id: "m-browser", title: "成果默认在内置浏览器打开并通过批注修改", category: "智能体习惯", content: "不要另开文件管理页。成果在任务右侧浏览器预览，我完成多条批注后一次生成新版本。", source: "用户连续体验后确认", updated: "昨天 18:02", lastUsed: "今天 · 多成果审阅", effect: "统一成果查看和修改路径，正式版本不被覆盖。", status: "生效中" },
  { id: "m-model", title: "默认智能路由，不要求我选择模型", category: "智能体习惯", content: "除非任务有明显需要或我主动指定，否则由AgentScope选择合适模型，不在开始前增加模式选择。", source: "用户直接告诉AgentScope", updated: "2026-08-31", lastUsed: "今天 · 新任务环境", effect: "降低开始任务的学习成本。", status: "生效中" },
  { id: "m-followup", title: "每周五整理下一周需要领导确认的事项", category: "持续事项", content: "每周五从已授权待办与项目中整理下一周需要领导确认的事项，先生成草稿，不自动外发。", source: "日常待办自动化", updated: "2026-08-29", lastUsed: "上周五 · 待办梳理", effect: "作为后续自动化和任务提醒的持续上下文。", status: "已停用" },
];

type OrgLevel = "处室" | "单位" | "全市";
type OrgExperience = {
  id: string;
  level: OrgLevel;
  title: string;
  category: MemoryCategory;
  content: string;
  owner: string;
  updated: string;
  appliesTo: string;
  effect: string;
};

const orgExperiences: OrgExperience[] = [
  { id: "o-review-order", level: "处室", title: "草案审查先核材料完整性，再进入实体内容", category: "办事经验", content: "先核对送审稿、起草说明、征求意见与采纳说明等材料是否齐备，再开展合法性、协调性和可操作性审查。", owner: "综合处", updated: "2026-08-28", appliesTo: "综合处法规材料经办", effect: "任务计划会先设置材料完整性门槛，避免在缺件状态下形成正式结论。" },
  { id: "o-version", level: "处室", title: "已归档成果后续修改必须创建工作副本", category: "材料规则", content: "已归档、已签发或已有回执的成果不得原位覆盖；后续批注形成新工作副本并保留原回执。", owner: "综合处", updated: "2026-08-18", appliesTo: "综合处正式成果", effect: "保护正式版本，同时允许在原任务中继续修订。" },
  { id: "o-ledger", level: "单位", title: "跨材料综合先建立事实底账", category: "材料规则", content: "对来自台账、总结、报表和上级要求的事实先记录来源、时间和口径，再派生母稿与简版材料。", owner: "深圳市司法局", updated: "2026-08-30", appliesTo: "单位综合材料任务", effect: "减少同一数字在不同成果中出现不一致。" },
  { id: "o-external", level: "单位", title: "外部系统动作区分预填与正式提交", category: "办事经验", content: "智能体可以准备内容和打开目标页面；正式提交、发送、销号等改变外部状态的动作由经办人确认。", owner: "深圳市司法局", updated: "2026-08-27", appliesTo: "涉及OA及业务系统的任务", effect: "既保留自动化效率，也保证责任边界清楚。" },
  { id: "o-source", level: "全市", title: "正式判断需保留来源、版本和定位", category: "材料规则", content: "引用法规政策或业务材料形成正式判断时，应记录来源系统、版本和实际使用位置；冲突不得静默合并。", owner: "深圳市统一AI办公规范", updated: "2026-08-22", appliesTo: "全市正式材料任务", effect: "关键结论可回溯，来源更新时能够识别影响。" },
];

const memoryCategories = ["全部", "办公偏好", "办事经验", "材料规则", "智能体习惯", "持续事项"] as const;

export function MemoryPage({ onUse }: { onUse: (context: TaskContext) => void }) {
  const [section, setSection] = useState<"我的记忆" | "组织经验">("我的记忆");
  const [status, setStatus] = useState<"生效中" | "已停用">("生效中");
  const [orgLevel, setOrgLevel] = useState<OrgLevel>("处室");
  const [category, setCategory] = useState<(typeof memoryCategories)[number]>("全部");
  const [query, setQuery] = useState("");
  const [memories, setMemories] = useState(seedPersonalMemories);
  const [selectedMemoryId, setSelectedMemoryId] = useState(seedPersonalMemories[0].id);
  const [selectedOrgId, setSelectedOrgId] = useState(orgExperiences[0].id);
  const [creating, setCreating] = useState(false);
  const [newMemory, setNewMemory] = useState("");
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const [contributing, setContributing] = useState(false);
  const [contributeTarget, setContributeTarget] = useState("综合处");
  const [acquired, setAcquired] = useState<string[]>([]);
  const [notice, setNotice] = useState("");

  const filteredMemories = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return memories.filter((item) => item.status === status && (category === "全部" || item.category === category) && (!keyword || `${item.title}${item.content}${item.source}`.toLowerCase().includes(keyword)));
  }, [category, memories, query, status]);
  const filteredOrg = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return orgExperiences.filter((item) => item.level === orgLevel && (category === "全部" || item.category === category) && (!keyword || `${item.title}${item.content}${item.owner}`.toLowerCase().includes(keyword)));
  }, [category, orgLevel, query]);
  const selectedMemory = filteredMemories.find((item) => item.id === selectedMemoryId) ?? filteredMemories[0] ?? null;
  const selectedOrg = filteredOrg.find((item) => item.id === selectedOrgId) ?? filteredOrg[0] ?? null;

  const addMemory = () => {
    if (!newMemory.trim()) return;
    const id = `memory-${Date.now()}`;
    const item: PersonalMemory = {
      id,
      title: newMemory.trim().length > 26 ? `${newMemory.trim().slice(0, 26)}…` : newMemory.trim(),
      category: "办公偏好",
      content: newMemory.trim(),
      source: "用户主动告诉AgentScope",
      updated: "刚刚",
      lastUsed: "尚未用于任务",
      effect: "后续匹配到相关任务时建议使用；仍可随时纠正或停用。",
      status: "生效中",
    };
    setMemories((items) => [item, ...items]);
    setSelectedMemoryId(id);
    setStatus("生效中");
    setCreating(false);
    setNewMemory("");
    setNotice("新记忆已沉淀到个人范围。 ");
  };

  const saveEdit = () => {
    if (!selectedMemory || !editDraft.trim()) return;
    setMemories((items) => items.map((item) => item.id === selectedMemory.id ? { ...item, content: editDraft.trim(), updated: "刚刚" } : item));
    setEditing(false);
    setNotice("已纠正，旧内容仍保留在历史版本中。 ");
  };

  const toggleMemory = () => {
    if (!selectedMemory) return;
    const next = selectedMemory.status === "生效中" ? "已停用" : "生效中";
    setMemories((items) => items.map((item) => item.id === selectedMemory.id ? { ...item, status: next } : item));
    setStatus(next);
    setNotice(next === "生效中" ? "已重新启用。" : "已停用，后续任务不再自动调用。 ");
  };

  const acquireOrgExperience = () => {
    if (!selectedOrg || acquired.includes(selectedOrg.id)) return;
    const personal: PersonalMemory = {
      id: `from-${selectedOrg.id}`,
      title: selectedOrg.title,
      category: selectedOrg.category,
      content: selectedOrg.content,
      source: `从${selectedOrg.owner}获取`,
      updated: "刚刚",
      lastUsed: "尚未用于任务",
      effect: selectedOrg.effect,
      status: "生效中",
    };
    setMemories((items) => [personal, ...items]);
    setAcquired((items) => [...items, selectedOrg.id]);
    setNotice("已获取到“我的记忆”，你可以单独停用或纠正个人副本。 ");
  };

  const switchSection = (next: string) => {
    setSection(next as "我的记忆" | "组织经验");
    setCategory("全部");
    setQuery("");
    setCreating(false);
    setEditing(false);
    setContributing(false);
    setNotice("");
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#F5F7FB]">
      <div className="mx-auto flex h-full min-h-[660px] max-w-[1240px] flex-col px-7 pb-7 pt-6">
        <div className="mb-3 flex items-end justify-between gap-6">
          <div>
            <p className="text-[13px] leading-5 text-[#667085]">看清AgentScope正在使用哪些经验，并决定记住、纠正、贡献或获取什么。</p>
          </div>
          {section === "我的记忆" ? (
            <Button type="button" onClick={() => { setCreating(true); setNotice(""); }} className="h-9 rounded-[10px] bg-[#535FC8] px-3 text-[10px] text-white hover:bg-[#444FB4]"><Plus className="size-3.5" /> 新增／沉淀记忆</Button>
          ) : (
            <span className="flex items-center gap-1.5 text-[9.5px] text-[#7A8798]"><Building2 className="size-3.5 text-[#655FD3]" /> 已发布经验，可获取为个人副本</span>
          )}
        </div>
        <SurfaceTabs value={section} options={["我的记忆", "组织经验"]} onChange={switchSection} />

        <div className="my-4 flex items-center gap-2">
          <div className="mr-1 flex rounded-[10px] bg-[#EAEDF2] p-0.5">
            {section === "我的记忆"
              ? (["生效中", "已停用"] as const).map((option) => (
                  <button key={option} type="button" onClick={() => { setStatus(option); setCreating(false); }} className={`h-8 rounded-lg px-3 text-[10px] transition ${status === option ? "bg-white text-[#344054] shadow-sm" : "text-[#7A8798]"}`}>{option}</button>
                ))
              : (["处室", "单位", "全市"] as OrgLevel[]).map((option) => (
                  <button key={option} type="button" onClick={() => { setOrgLevel(option); const first = orgExperiences.find((item) => item.level === option); if (first) setSelectedOrgId(first.id); }} className={`h-8 rounded-lg px-3 text-[10px] transition ${orgLevel === option ? "bg-white text-[#344054] shadow-sm" : "text-[#7A8798]"}`}>{option}</button>
                ))}
          </div>
          <SearchBox value={query} onChange={setQuery} placeholder={section === "我的记忆" ? "搜索我的记忆、来源或习惯" : "搜索组织发布的经验"} />
        </div>
        <div className="mb-4 flex flex-wrap gap-1">
          {memoryCategories.map((option) => (
            <button key={option} type="button" onClick={() => setCategory(option)} className={`rounded-lg px-2.5 py-1.5 text-[10px] transition ${category === option ? "bg-[#ECEBFF] text-[#5854B7]" : "text-[#7A8798] hover:bg-white"}`}>{option}</button>
          ))}
          {section === "我的记忆" ? <span className="ml-auto self-center text-[9.5px] text-[#98A2B3]">{memories.filter((item) => item.status === "生效中").length} 条当前有效</span> : null}
        </div>

        {notice ? <div className="mb-3 flex items-center gap-2 rounded-[10px] border border-[#CFE8DC] bg-[#F1FAF5] px-3 py-2 text-[9.5px] text-[#237253]"><Check className="size-3.5" />{notice}</div> : null}

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.22fr)_minmax(390px,1fr)] overflow-hidden rounded-2xl border border-[#DDE3EC] bg-white shadow-[0_16px_42px_rgba(28,42,68,.055)]">
          <div className="min-h-0 overflow-y-auto border-r border-[#E6EAF0]">
            <div className="flex h-10 items-center border-b border-[#EEF1F5] bg-[#FAFBFC] px-4 text-[9.5px] text-[#98A2B3]">
              {section === "我的记忆" ? <><UserRound className="mr-2 size-3.5 text-[#655FD3]" />AgentScope在后续任务中可建议调用</> : <><Landmark className="mr-2 size-3.5 text-[#655FD3]" />来自当前处室、单位和全市的已发布经验</>}
            </div>
            {section === "我的记忆"
              ? filteredMemories.map((item) => (
                  <button key={item.id} type="button" onClick={() => { setSelectedMemoryId(item.id); setCreating(false); setEditing(false); setContributing(false); }} className={`relative w-full border-b border-[#EEF1F5] px-4 py-3.5 text-left transition last:border-b-0 ${selectedMemory?.id === item.id && !creating ? "bg-[#F7F6FF]" : "hover:bg-[#FAFBFD]"}`}>
                    {selectedMemory?.id === item.id && !creating ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#655FD3]" /> : null}
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[10px] bg-[#F0EEFF] text-[#625FD0]"><BrainCircuit className="size-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-2"><span className="min-w-0 flex-1 text-[11.5px] font-medium leading-5 text-[#344054]">{item.title}</span><span className="mt-0.5 shrink-0 rounded-full bg-[#ECF8F2] px-2 py-0.5 text-[8.5px] text-[#18845E]">{item.status}</span></span>
                        <span className="mt-1.5 line-clamp-2 block text-[9.8px] leading-4 text-[#667085]">{item.content}</span>
                        <span className="mt-2 flex items-center gap-2 text-[8.8px] text-[#98A2B3]"><span className="rounded bg-[#F2F1FA] px-1.5 py-0.5 text-[#66609E]">{item.category}</span><span className="min-w-0 flex-1 truncate">{item.source}</span><span className="shrink-0">{item.updated}</span></span>
                      </span>
                      <ChevronRight className="mt-2 size-3.5 shrink-0 text-[#C0C7D2]" />
                    </div>
                  </button>
                ))
              : filteredOrg.map((item) => (
                  <button key={item.id} type="button" onClick={() => setSelectedOrgId(item.id)} className={`relative w-full border-b border-[#EEF1F5] px-4 py-3.5 text-left transition last:border-b-0 ${selectedOrg?.id === item.id ? "bg-[#F7F6FF]" : "hover:bg-[#FAFBFD]"}`}>
                    {selectedOrg?.id === item.id ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[#655FD3]" /> : null}
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[10px] bg-[#F0EEFF] text-[#625FD0]">{item.level === "处室" ? <Building2 className="size-4" /> : <Landmark className="size-4" />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-2"><span className="min-w-0 flex-1 text-[11.5px] font-medium leading-5 text-[#344054]">{item.title}</span>{acquired.includes(item.id) ? <span className="mt-0.5 shrink-0 rounded-full bg-[#ECF8F2] px-2 py-0.5 text-[8.5px] text-[#18845E]">已获取</span> : null}</span>
                        <span className="mt-1.5 line-clamp-2 block text-[9.8px] leading-4 text-[#667085]">{item.content}</span>
                        <span className="mt-2 flex items-center gap-2 text-[8.8px] text-[#98A2B3]"><span className="rounded bg-[#F2F1FA] px-1.5 py-0.5 text-[#66609E]">{item.category}</span><span>{item.owner}</span><span>·</span><span>{item.updated}</span></span>
                      </span>
                      <ChevronRight className="mt-2 size-3.5 shrink-0 text-[#C0C7D2]" />
                    </div>
                  </button>
                ))}
          </div>

          <div className="min-h-0 overflow-y-auto bg-[#FCFDFE] p-5">
            {section === "我的记忆" && creating ? (
              <>
                <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ECEFFF] to-[#F3EDFF] text-[#615FCC]"><Plus className="size-[17px]" /></span><div><p className="text-[13px] font-semibold text-[#253044]">告诉AgentScope要记住什么</p><p className="mt-1 text-[9px] text-[#7A8798]">可以直接新增，也可以从任务结束时的沉淀建议进入这里</p></div></div>
                <textarea value={newMemory} onChange={(event) => setNewMemory(event.target.value)} rows={6} className="mt-4 w-full resize-none rounded-xl border border-[#C9D3EA] bg-white p-3 text-[10.5px] leading-5 text-[#344054] outline-none ring-2 ring-[#EDF0FA]" placeholder="例如：以后形成领导汇报时，先给一页结论摘要；涉及精确数字必须标注来源。" />
                <div className="mt-3 rounded-xl border border-[#DEE4F3] bg-[#F8F9FD] p-3">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#98A2B3]">沉淀预览</p>
                  <div className="mt-2 grid grid-cols-[72px_1fr] gap-y-2 text-[9.5px]"><span className="text-[#98A2B3]">范围</span><span className="text-[#475467]">我的记忆</span><span className="text-[#98A2B3]">建议类型</span><span className="text-[#475467]">办公偏好</span><span className="text-[#98A2B3]">生效方式</span><span className="text-[#475467]">后续相关任务建议调用，可随时纠正或停用</span></div>
                </div>
                <div className="mt-4 flex gap-2 rounded-xl border border-[#DADFF2] bg-[#F7F7FD] p-3 text-[9.5px] leading-4 text-[#626A86]"><LockKeyhole className="mt-0.5 size-3.5 shrink-0" />默认只进入个人范围，不自动贡献给处室、单位或全市。</div>
                <div className="mt-5 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setCreating(false)} className="h-9 text-[10px] text-[#667085]">取消</Button><Button type="button" disabled={!newMemory.trim()} onClick={addMemory} className="h-9 bg-[#535FC8] px-4 text-[10px] text-white hover:bg-[#444FB4]">确认沉淀</Button></div>
              </>
            ) : null}

            {section === "我的记忆" && !creating && selectedMemory ? (
              <>
                <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ECEFFF] to-[#F3EDFF] text-[#615FCC]"><Sparkles className="size-[17px]" /></span><div className="min-w-0 flex-1"><p className="text-[13px] font-semibold leading-5 text-[#253044]">{selectedMemory.title}</p><p className="mt-1 text-[9px] text-[#7A8798]">{selectedMemory.category} · {selectedMemory.status}</p></div></div>
                <div className="mt-4"><p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#98A2B3]">记忆内容</p>{editing ? <><textarea value={editDraft} onChange={(event) => setEditDraft(event.target.value)} rows={5} className="mt-2 w-full resize-none rounded-xl border border-[#B8C9ED] bg-white p-3 text-[10.5px] leading-5 text-[#344054] outline-none ring-2 ring-[#E6ECFF]" /><div className="mt-2 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setEditing(false)} className="h-8 text-[10px]">取消</Button><Button type="button" onClick={saveEdit} className="h-8 bg-[#535FC8] text-[10px] text-white">保存纠正</Button></div></> : <p className="mt-2 rounded-xl bg-[#F5F6FA] p-3.5 text-[10.5px] leading-5 text-[#475467]">{selectedMemory.content}</p>}</div>
                <dl className="mt-4 grid grid-cols-[76px_1fr] gap-x-3 gap-y-3 border-y border-[#EBEEF3] py-4 text-[9.8px]"><dt className="text-[#98A2B3]">形成来源</dt><dd className="text-[#475467]">{selectedMemory.source}</dd><dt className="text-[#98A2B3]">最近使用</dt><dd className="text-[#475467]">{selectedMemory.lastUsed}</dd><dt className="text-[#98A2B3]">更新时间</dt><dd className="text-[#475467]">{selectedMemory.updated}</dd></dl>
                <div className="mt-4"><p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#98A2B3]">它如何影响AgentScope</p><div className="mt-2 flex gap-2 rounded-xl border border-[#DEE4F3] bg-[#F8F9FD] p-3 text-[9.8px] leading-4 text-[#58667B]"><BrainCircuit className="mt-0.5 size-3.5 shrink-0 text-[#625FD0]" />{selectedMemory.effect}</div></div>

                {contributing ? (
                  <div className="mt-4 rounded-xl border border-[#CFD8EF] bg-white p-3.5 shadow-sm">
                    <div className="flex items-center gap-2"><Upload className="size-3.5 text-[#5A63C5]" /><p className="text-[10.5px] font-medium text-[#344054]">贡献为组织经验</p></div>
                    <p className="mt-2 text-[9.5px] leading-4 text-[#7A8798]">只提交经验内容和必要来源说明，不共享原任务对话、附件或个人云空间路径。</p>
                    <div className="mt-3 flex gap-1.5">{["综合处", "深圳市司法局"].map((target) => <button key={target} type="button" onClick={() => setContributeTarget(target)} className={`rounded-lg border px-2.5 py-1.5 text-[9.5px] ${contributeTarget === target ? "border-[#AEBBDF] bg-[#F3F5FC] text-[#5059AB]" : "border-[#E1E5EC] text-[#7A8798]"}`}>{target}</button>)}</div>
                    <div className="mt-3 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setContributing(false)} className="h-8 text-[10px]">取消</Button><Button type="button" onClick={() => { setContributing(false); setNotice(`已向${contributeTarget}提交经验贡献；组织发布前不影响其他人。`); }} className="h-8 bg-[#535FC8] text-[10px] text-white">确认贡献</Button></div>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button type="button" disabled={selectedMemory.status === "已停用"} onClick={() => onUse({ id: selectedMemory.id, kind: "Memory", label: selectedMemory.title })} className="h-9 flex-1 bg-[#535FC8] text-[10px] text-white hover:bg-[#444FB4]">用于新任务 <ArrowRight className="size-3.5" /></Button>
                  <Button type="button" variant="outline" onClick={() => { setEditDraft(selectedMemory.content); setEditing(true); setContributing(false); }} className="h-9 border-[#DCE3ED] bg-white px-3 text-[10px] text-[#526070]"><PencilLine className="size-3.5" />纠正</Button>
                  <Button type="button" variant="outline" onClick={() => { setContributing(true); setEditing(false); }} className="h-9 border-[#DCE3ED] bg-white px-3 text-[10px] text-[#526070]"><Upload className="size-3.5" />贡献</Button>
                  <Button type="button" variant="ghost" onClick={toggleMemory} className="h-9 px-2.5 text-[10px] text-[#667085]">{selectedMemory.status === "生效中" ? "停用" : "启用"}</Button>
                </div>
              </>
            ) : null}

            {section === "组织经验" && selectedOrg ? (
              <>
                <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#ECEFFF] to-[#F3EDFF] text-[#615FCC]"><BookOpenCheck className="size-[17px]" /></span><div className="min-w-0 flex-1"><p className="text-[13px] font-semibold leading-5 text-[#253044]">{selectedOrg.title}</p><p className="mt-1 text-[9px] text-[#7A8798]">{selectedOrg.level}经验 · {selectedOrg.owner}</p></div></div>
                <p className="mt-4 rounded-xl bg-[#F5F6FA] p-3.5 text-[10.5px] leading-5 text-[#475467]">{selectedOrg.content}</p>
                <dl className="mt-4 grid grid-cols-[76px_1fr] gap-x-3 gap-y-3 border-y border-[#EBEEF3] py-4 text-[9.8px]"><dt className="text-[#98A2B3]">维护范围</dt><dd className="text-[#475467]">{selectedOrg.owner}</dd><dt className="text-[#98A2B3]">适用岗位</dt><dd className="text-[#475467]">{selectedOrg.appliesTo}</dd><dt className="text-[#98A2B3]">更新时间</dt><dd className="text-[#475467]">{selectedOrg.updated}</dd></dl>
                <div className="mt-4"><p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#98A2B3]">获取后如何影响任务</p><div className="mt-2 flex gap-2 rounded-xl border border-[#DEE4F3] bg-[#F8F9FD] p-3 text-[9.8px] leading-4 text-[#58667B]"><BrainCircuit className="mt-0.5 size-3.5 shrink-0 text-[#625FD0]" />{selectedOrg.effect}</div></div>
                <div className="mt-4 flex gap-2 rounded-xl border border-[#DADFF2] bg-[#F7F7FD] p-3 text-[9.5px] leading-4 text-[#626A86]"><Link2 className="mt-0.5 size-3.5 shrink-0" />获取后形成个人可控副本；你可以单独停用或纠正，不会修改组织发布内容。</div>
                <Button type="button" disabled={acquired.includes(selectedOrg.id)} onClick={acquireOrgExperience} className="mt-5 h-9 w-full rounded-[10px] bg-[#535FC8] text-[10.5px] text-white hover:bg-[#444FB4]">{acquired.includes(selectedOrg.id) ? <><Check className="size-3.5" />已获取到我的记忆</> : <><Plus className="size-3.5" />获取到我的记忆</>}</Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
