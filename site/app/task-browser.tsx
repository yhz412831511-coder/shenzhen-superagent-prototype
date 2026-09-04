"use client";

import { useEffect, useRef } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  FileText,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  Plus,
  RotateCw,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ArtifactPreview,
  type ArtifactAnnotation,
} from "./artifact-previews";
import { AnnualBrowserPage } from "./annual-browser-pages";
import type { DemoTask } from "./demo-data";
import { LegalBrowserPage } from "./legal-browser-pages";

export type ManualBrowserTab = {
  id: string;
  kind: "blank" | "artifact" | "web";
  title: string;
  address: string;
  loadedAddress: string;
  artifactIndex: number | null;
  scrollTop: number;
  pageIndex: number;
  selectedTarget: string | null;
  annotationDraft: string;
  annotations: ArtifactAnnotation[];
};

export type ManualBrowserState = {
  tabs: ManualBrowserTab[];
  activeTabId: string;
  nextTabNumber: number;
};

export type SubmittedArtifactAnnotation = ArtifactAnnotation & {
  artifactIndex: number;
  artifactName: string;
};

export type BrowserRevisionStatus = "idle" | "modifying" | "ready";

export function createInitialManualBrowserState(): ManualBrowserState {
  return {
    tabs: [
      {
        id: "tab-1",
        kind: "blank",
        title: "新标签页",
        address: "",
        loadedAddress: "",
        artifactIndex: null,
        scrollTop: 0,
        pageIndex: 0,
        selectedTarget: null,
        annotationDraft: "",
        annotations: [],
      },
    ],
    activeTabId: "tab-1",
    nextTabNumber: 2,
  };
}

export function openArtifactInManualBrowser(
  state: ManualBrowserState,
  taskId: string,
  artifactIndex: number,
  artifactName: string,
): ManualBrowserState {
  const id = `artifact-${artifactIndex}`;
  const address = `http://127.0.0.1:3000/preview/${taskId}/artifact/${artifactIndex}`;
  const existing = state.tabs.find((tab) => tab.id === id);

  if (existing) {
    return {
      ...state,
      activeTabId: id,
      tabs: state.tabs.map((tab) =>
        tab.id === id
          ? { ...tab, title: artifactName, address, loadedAddress: address }
          : tab,
      ),
    };
  }

  const artifactTab: ManualBrowserTab = {
    id,
    kind: "artifact",
    title: artifactName,
    address,
    loadedAddress: address,
    artifactIndex,
    scrollTop: 0,
    pageIndex: 0,
    selectedTarget: null,
    annotationDraft: "",
    annotations: [],
  };
  const disposableBlank =
    state.tabs.length === 1 &&
    state.tabs[0]?.kind === "blank" &&
    !state.tabs[0].loadedAddress;

  return {
    ...state,
    activeTabId: id,
    tabs: disposableBlank ? [artifactTab] : [...state.tabs, artifactTab],
  };
}

export function openWebInManualBrowser(
  state: ManualBrowserState,
  resource: { id: string; title: string; address: string },
): ManualBrowserState {
  const existing = state.tabs.find((tab) => tab.id === resource.id);
  if (existing) {
    return {
      ...state,
      activeTabId: resource.id,
      tabs: state.tabs.map((tab) =>
        tab.id === resource.id
          ? {
              ...tab,
              title: resource.title,
              address: resource.address,
              loadedAddress: resource.address,
              scrollTop: 0,
            }
          : tab,
      ),
    };
  }

  const tab: ManualBrowserTab = {
    id: resource.id,
    kind: "web",
    title: resource.title,
    address: resource.address,
    loadedAddress: resource.address,
    artifactIndex: null,
    scrollTop: 0,
    pageIndex: 0,
    selectedTarget: null,
    annotationDraft: "",
    annotations: [],
  };
  const disposableBlank =
    state.tabs.length === 1 &&
    state.tabs[0]?.kind === "blank" &&
    !state.tabs[0].loadedAddress;

  return {
    ...state,
    activeTabId: resource.id,
    tabs: disposableBlank ? [tab] : [...state.tabs, tab],
  };
}

function resolveZone(address: string) {
  if (
    address.includes("127.0.0.1") ||
    address.includes("localhost") ||
    address.startsWith("file:")
  ) {
    return "本地预览";
  }
  if (
    address.includes("oa.") ||
    address.includes("/oa-demo/") ||
    address.includes("meeting.demo.sz.gov.cn")
  ) {
    return "政务外网";
  }
  return "互联网";
}

function normalizeAddress(value: string) {
  const next = value.trim();
  if (!next) return "";
  if (/^[a-z]+:\/\//i.test(next)) return next;
  return "https://" + next;
}

export function ManualTaskBrowserWorkspace({
  task,
  state,
  revisionStatus,
  onChange,
  onSubmitAnnotations,
  onClose,
}: {
  task: DemoTask;
  state: ManualBrowserState;
  revisionStatus: BrowserRevisionStatus;
  onChange: (state: ManualBrowserState) => void;
  onSubmitAnnotations: (annotations: SubmittedArtifactAnnotation[]) => void;
  onClose: () => void;
}) {
  const activeTab =
    state.tabs.find((tab) => tab.id === state.activeTabId) ?? state.tabs[0];
  const addressRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const zone = activeTab?.loadedAddress
    ? resolveZone(activeTab.loadedAddress)
    : "独立任务身份";
  const artifact =
    activeTab?.artifactIndex == null
      ? null
      : task.artifacts[activeTab.artifactIndex] ?? null;
  const legalBrowserPage =
    task.id === "legal" && activeTab?.loadedAddress
      ? <LegalBrowserPage address={activeTab.loadedAddress} />
      : null;
  const annualBrowserPage =
    task.id === "annual" && activeTab?.loadedAddress
      ? <AnnualBrowserPage address={activeTab.loadedAddress} />
      : null;
  const pendingAnnotations = state.tabs.flatMap((tab) =>
    tab.artifactIndex == null
      ? []
      : (tab.annotations ?? []).map((annotation) => ({
          ...annotation,
          artifactIndex: tab.artifactIndex as number,
          artifactName: task.artifacts[tab.artifactIndex as number]?.name ?? tab.title,
        })),
  );

  useEffect(() => {
    addressRef.current?.focus();
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = activeTab?.scrollTop ?? 0;
    }
  }, [activeTab?.scrollTop, state.activeTabId, task.id]);

  if (!activeTab) return null;

  const updateActiveTab = (patch: Partial<ManualBrowserTab>) => {
    onChange({
      ...state,
      tabs: state.tabs.map((tab) =>
        tab.id === activeTab.id ? { ...tab, ...patch } : tab,
      ),
    });
  };

  const navigate = () => {
    const address = normalizeAddress(activeTab.address);
    if (!address) return;
    let title = address;
    try {
      title = new URL(address).hostname;
    } catch {
      // normalizeAddress already produces an absolute URL; keep the address as fallback.
    }
    updateActiveTab({
      kind: "web",
      title,
      address,
      loadedAddress: address,
      artifactIndex: null,
      scrollTop: 0,
      pageIndex: 0,
      selectedTarget: null,
      annotationDraft: "",
      annotations: [],
    });
  };

  const newTab = () => {
    const id = `tab-${state.nextTabNumber}`;
    onChange({
      tabs: [
        ...state.tabs,
        {
          id,
          kind: "blank",
          title: "新标签页",
          address: "",
          loadedAddress: "",
          artifactIndex: null,
          scrollTop: 0,
          pageIndex: 0,
          selectedTarget: null,
          annotationDraft: "",
          annotations: [],
        },
      ],
      activeTabId: id,
      nextTabNumber: state.nextTabNumber + 1,
    });
    window.requestAnimationFrame(() => addressRef.current?.focus());
  };

  const closeTab = (id: string) => {
    const closingIndex = state.tabs.findIndex((tab) => tab.id === id);
    const remaining = state.tabs.filter((tab) => tab.id !== id);
    if (remaining.length === 0) {
      const next = createInitialManualBrowserState();
      next.tabs[0].id = `tab-${state.nextTabNumber}`;
      next.activeTabId = next.tabs[0].id;
      next.nextTabNumber = state.nextTabNumber + 1;
      onChange(next);
      return;
    }
    const fallback = remaining[Math.min(closingIndex, remaining.length - 1)];
    onChange({
      ...state,
      tabs: remaining,
      activeTabId: state.activeTabId === id ? fallback.id : state.activeTabId,
    });
  };

  const submitAnnotations = () => {
    if (pendingAnnotations.length === 0) return;
    onChange({
      ...state,
      tabs: state.tabs.map((tab) => ({
        ...tab,
        annotations: [],
        selectedTarget: null,
        annotationDraft: "",
      })),
    });
    onSubmitAnnotations(pendingAnnotations);
  };
  const createsWorkingCopy =
    (task.id === "legal" || task.id === "annual") &&
    revisionStatus === "idle" &&
    task.versions.some((version) => version.active && version.locked);

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-l border-[#DCE3EE] bg-[#E9EDF3]">
        <div className="shrink-0 border-b border-[#CDD5E1] bg-[#F1F4F8]">
          <div className="flex h-9 items-end gap-1 border-b border-[#D7DEE8] px-2 pt-1.5">
            <div className="flex min-w-0 flex-1 items-end gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {state.tabs.map((tab) => {
                const selected = tab.id === activeTab.id;
                return (
                  <div
                    key={tab.id}
                    className={`group flex h-8 min-w-[112px] max-w-[180px] flex-none items-center gap-1.5 rounded-t-lg border border-b-0 px-2.5 text-[9px] transition-colors ${
                      selected
                        ? "border-[#D3DAE5] bg-white text-[#344054]"
                        : "border-transparent bg-[#E8EDF4] text-[#7A8699] hover:bg-[#E2E8F1]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onChange({ ...state, activeTabId: tab.id })
                      }
                      className="flex min-w-0 flex-1 items-center gap-1.5"
                      aria-pressed={selected}
                    >
                      {tab.kind === "artifact" ? (
                        <FileText className="size-3 shrink-0 text-[#5571C8]" />
                      ) : (
                        <Globe2 className="size-3 shrink-0 text-[#5571C8]" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-left">
                        {tab.title}
                      </span>
                    </button>
                    {(tab.annotations?.length ?? 0) > 0 ? (
                      <span
                        className="grid size-4 shrink-0 place-items-center rounded-full bg-[#E7EEFF] text-[7px] font-semibold text-[#3159BE]"
                        aria-label={`${tab.annotations.length}条批注草稿`}
                      >
                        {tab.annotations.length}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      aria-label={`关闭${tab.title}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        closeTab(tab.id);
                      }}
                      className={`grid size-4 shrink-0 place-items-center rounded hover:bg-[#DCE3ED] ${
                        selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <X className="size-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={newTab}
              aria-label="新建浏览器标签"
              className="mb-1 text-[#667085]"
            >
              <Plus />
            </Button>
            <div className="flex-1" />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              aria-label="返回任务"
              className="mb-1 text-[#667085]"
            >
              <ArrowLeft />
            </Button>
          </div>

          <form
            className="flex h-11 items-center gap-1.5 px-2.5"
            onSubmit={(event) => {
              event.preventDefault();
              navigate();
            }}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="后退"
              className="text-[#A4ADBA]"
            >
              <ArrowLeft />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="刷新"
              className="text-[#667085]"
            >
              <RotateCw />
            </Button>
            <div className="ml-0.5 flex h-7 min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#CBD3DF] bg-white px-2.5 shadow-[inset_0_1px_2px_rgba(16,24,40,.035)]">
              <LockKeyhole className="size-3 shrink-0 text-[#667085]" />
              <input
                ref={addressRef}
                value={activeTab.address}
                onChange={(event) =>
                  updateActiveTab({ address: event.target.value })
                }
                aria-label="浏览器地址"
                placeholder="输入网址或粘贴地址"
                className="min-w-0 flex-1 border-0 bg-transparent text-[9px] text-[#475467] outline-none placeholder:text-[#98A2B3]"
              />
            </div>
            <Button
              type="submit"
              size="xs"
              disabled={!activeTab.address.trim()}
              className="bg-[#1F5EFF] text-[8px] text-white hover:bg-[#174ED6]"
            >
              打开
            </Button>
          </form>
        </div>

        <div
          ref={contentRef}
          onScroll={(event) => {
            const scrollTop = event.currentTarget.scrollTop;
            if (Math.abs(scrollTop - activeTab.scrollTop) > 1) {
              updateActiveTab({ scrollTop });
            }
          }}
          className="grid min-h-0 flex-1 place-items-center overflow-y-auto bg-[#E9EDF3] p-4"
        >
          {artifact ? (
            <ArtifactPreview
              task={task}
              artifact={artifact}
              artifactIndex={activeTab.artifactIndex ?? 0}
              pageIndex={activeTab.pageIndex ?? 0}
              selectedTarget={activeTab.selectedTarget ?? null}
              annotationDraft={activeTab.annotationDraft ?? ""}
              annotations={activeTab.annotations ?? []}
              onPageChange={(pageIndex) =>
                updateActiveTab({ pageIndex, selectedTarget: null })
              }
              onSelectTarget={(selectedTarget) =>
                updateActiveTab({ selectedTarget, annotationDraft: "" })
              }
              onDraftChange={(annotationDraft) =>
                updateActiveTab({ annotationDraft })
              }
              onAddAnnotation={(label) => {
                const comment = activeTab.annotationDraft.trim();
                if (!comment || !activeTab.selectedTarget) return;
                updateActiveTab({
                  annotations: [
                    ...(activeTab.annotations ?? []),
                    {
                      target: activeTab.selectedTarget,
                      label,
                      comment,
                    },
                  ],
                  selectedTarget: null,
                  annotationDraft: "",
                });
              }}
              onClearSelection={() =>
                updateActiveTab({ selectedTarget: null, annotationDraft: "" })
              }
            />
          ) : legalBrowserPage ? (
            legalBrowserPage
          ) : annualBrowserPage ? (
            annualBrowserPage
          ) : activeTab.loadedAddress ? (
            <div className="w-full max-w-[720px] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-[0_12px_32px_rgba(16,24,40,.07)]">
              <div className="flex h-11 items-center gap-2 border-b border-[#E5E9F0] bg-[#FAFBFD] px-4">
                <span className="size-2 rounded-full bg-[#25A273]" />
                <p className="min-w-0 flex-1 truncate text-[9px] text-[#667085]">
                  {activeTab.loadedAddress}
                </p>
                <span className="text-[8px] text-[#98A2B3]">演示页面</span>
              </div>
              <div className="px-4 py-10 text-center">
                <Globe2 className="mx-auto size-8 text-[#5E78CF]" />
                <h2 className="mt-4 text-[16px] font-semibold text-[#26344C]">
                  页面已在任务浏览器中打开
                </h2>
                <p className="mx-auto mt-2 max-w-[460px] text-[10px] leading-5 text-[#667085]">
                  原型已验证主动输入地址、任务内标签和运行域识别。真实站点内容将在正式受控浏览器连接中加载。
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-[#D6DEEA] bg-white text-[#5E78CF] shadow-[0_8px_22px_rgba(16,24,40,.05)]">
                <Globe2 className="size-5" />
              </span>
              <h2 className="mt-4 text-[15px] font-semibold text-[#2A374E]">
                在当前任务中打开网页
              </h2>
              <p className="mt-2 text-[9.5px] text-[#7A8699]">
                输入地址后，页面、标签和浏览状态会绑定到当前任务。
              </p>
            </div>
          )}
        </div>

        <div className={`flex shrink-0 items-center border-t border-[#D2D9E3] bg-[#F8FAFC] px-3 text-[7.5px] text-[#8B96A7] ${pendingAnnotations.length > 0 ? "min-h-9 py-1" : "h-6"}`}>
          <span className="size-1.5 rounded-full bg-[#25A273]" />
          <span className="ml-1.5 truncate">{zone}</span>
          {pendingAnnotations.length > 0 ? (
            <div className="ml-auto flex items-center gap-1.5">
              <span className="max-w-[145px] text-right text-[#6075B8]">
                {createsWorkingCopy
                  ? `${pendingAnnotations.length}条批注 · 将创建工作草稿，原OA归档版不变`
                  : `${pendingAnnotations.length}条批注草稿`}
              </span>
              <Button
                type="button"
                size="xs"
                onClick={submitAnnotations}
                className="h-6 shrink-0 bg-[#1F5EFF] px-2 text-[7.5px] text-white hover:bg-[#174ED6]"
              >
                {createsWorkingCopy ? "提交修改并创建草稿" : "提交修改"}
              </Button>
            </div>
          ) : revisionStatus === "modifying" ? (
            <span className="ml-auto flex items-center gap-1 text-[#6075B8]">
              <LoaderCircle className="size-3 animate-spin" />
              {task.id === "legal"
                ? "正在创建后续修订草稿"
                : task.id === "annual"
                  ? "正在生成协同修订草稿"
                  : "正在生成修订稿"}
            </span>
          ) : revisionStatus === "ready" ? (
            <span className="ml-auto flex items-center gap-1 text-[#20845E]">
              <CheckCircle2 className="size-3" />
              {task.id === "legal"
                ? "后续修订草稿v2已生成"
                : task.id === "annual"
                  ? "协同修订稿v2已生成"
                  : "修订稿v2已生成"}
            </span>
          ) : (
            <span className="ml-auto flex items-center gap-1">
              <ChevronDown className="size-3" /> 终端未启动
            </span>
          )}
        </div>
    </section>
  );
}
