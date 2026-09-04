'use client';

import { useEffect, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  Globe2,
  LockKeyhole,
  MoreHorizontal,
  RotateCw,
  Send,
  ShieldCheck,
  Sparkles,
  SquarePen,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export type InspectionAnnotationTarget = 'lead' | 'closure';

export type InspectionAnnotation = {
  id: number;
  target: InspectionAnnotationTarget;
  quote: string;
  comment: string;
};

export type InspectionReviewState = {
  version: 1 | 2;
  activeTab: 'artifact' | 'oa';
  oaOpened: boolean;
  oaSubmitted: boolean;
  annotationMode: boolean;
  selectedTarget: InspectionAnnotationTarget | null;
  annotationText: string;
  annotations: InspectionAnnotation[];
  submittedAnnotations: InspectionAnnotation[];
  modifying: boolean;
  artifactAddress: string;
  oaAddress: string;
};

export const initialInspectionReviewState: InspectionReviewState = {
  version: 1,
  activeTab: 'artifact',
  oaOpened: false,
  oaSubmitted: false,
  annotationMode: false,
  selectedTarget: null,
  annotationText: '',
  annotations: [],
  submittedAnnotations: [],
  modifying: false,
  artifactAddress:
    'http://127.0.0.1:3000/preview/inspection/proposal-v1',
  oaAddress: 'https://oa.demo.sz.gov.cn/matter/PSJ-2026-0902-017',
};

const targets: Record<
  InspectionAnnotationTarget,
  { quote: string; suggestion: string; label: string }
> = {
  lead: {
    label: '牵头责任与时限',
    quote: '由市司法行政部门会同有关行业主管部门在5个工作日内复核4项异常',
    suggestion:
      '牵头责任再明确一些，改成由市司法行政部门牵头；时间仍保留5个工作日。',
  },
  closure: {
    label: '整改闭环要求',
    quote: '针对企业反映集中的事项开展精准纠偏',
    suggestion:
      '这里补一句：核实结果要形成问题清单和整改闭环，但不要扩大成专项行动。',
  },
};

function RailEvent({
  tone = 'normal',
  icon,
  title,
  children,
}: {
  tone?: 'normal' | 'success' | 'warning';
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  const toneClass =
    tone === 'success'
      ? 'border-[#CFE8DC] bg-[#F4FBF7] text-[#187456]'
      : tone === 'warning'
        ? 'border-[#EED9AD] bg-[#FFF9ED] text-[#936000]'
        : 'border-[#DCE5F6] bg-[#F7F9FE] text-[#4F67B0]';

  return (
    <div className={`rounded-xl border p-3 ${toneClass}`}>
      <div className="flex items-center gap-2 text-[10px] font-semibold">
        {icon}
        {title}
      </div>
      <div className="mt-2 text-[9.5px] leading-5 text-[#5C687A]">
        {children}
      </div>
    </div>
  );
}

export function CollaborationRail({ state }: { state: InspectionReviewState }) {
  return (
    <section className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-[#DCE3EE] bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#FCFDFE] px-4 py-4">
        <div className="space-y-3">
          <RailEvent
            tone="success"
            icon={<CheckCircle2 className="size-3.5" />}
            title="原任务已完成"
          >
            已形成398字拟办，28条登记归并为22次实际检查，4项异常保持待核实。OA稿v1正在等待领导审阅。
          </RailEvent>

          <div className="flex gap-2.5 py-1">
            <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[#EAF0FF] text-[8px] font-semibold text-[#3159BE]">
              AI
            </span>
            <div>
              <p className="text-[10.5px] font-medium text-[#344054]">
                已在内置浏览器打开拟办意见
              </p>
              <p className="mt-1 text-[9.5px] leading-5 text-[#667085]">
                你可以选中文本或圈选区域添加批注。批注只在汇总提交后进入任务。
              </p>
            </div>
          </div>

          {state.annotations.length > 0 ? (
            <RailEvent
              icon={<SquarePen className="size-3.5" />}
              title={`${state.annotations.length}条批注草稿`}
            >
              草稿仍绑定OA稿v{state.version}，尚未触发修改。可继续标注或在浏览器底部汇总提交。
            </RailEvent>
          ) : null}

          {state.submittedAnnotations.length > 0 ? (
            <div className="flex justify-end gap-2.5 py-1 pl-6">
              <div className="min-w-0 max-w-[86%] rounded-xl rounded-tr-sm border border-[#DEE5F0] bg-[#F4F7FB] px-3 py-2.5">
                <p className="text-[10px] font-medium text-[#344054]">
                  请处理{state.submittedAnnotations.length}条成果批注
                </p>
                <p className="mt-1 text-[9px] leading-4 text-[#667085]">
                  拟办意见OA稿v1 · 第1页。保持决策型拟办语气，未批注部分不要调整。
                </p>
              </div>
              <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[#EEF1F6] text-[9px] font-semibold text-[#526176]">
                你
              </span>
            </div>
          ) : null}

          {state.modifying ? (
            <RailEvent
              tone="warning"
              icon={<RotateCw className="size-3.5 animate-spin" />}
              title="正在生成修订稿v2"
            >
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <Check className="size-3 text-[#17875D]" /> 明确牵头责任
                </p>
                <p className="flex items-center gap-2">
                  <Clock3 className="size-3" /> 补充问题清单与整改闭环
                </p>
              </div>
            </RailEvent>
          ) : null}

          {state.version === 2 && !state.modifying ? (
            <RailEvent
              tone="success"
              icon={<FileCheck2 className="size-3.5" />}
              title="修订稿v2已生成"
            >
              浏览器已刷新为最新版。你可以继续批注，或打开深圳OA更新现有拟办草稿。
            </RailEvent>
          ) : null}

          {state.oaOpened && !state.oaSubmitted ? (
            <RailEvent
              tone="warning"
              icon={<ExternalLink className="size-3.5" />}
              title="等待你在OA页面确认"
            >
              智能体已准备v2正文；不上传内部核验表，不自动转办或催办。最终提交由你本人完成。
            </RailEvent>
          ) : null}

          {state.oaSubmitted ? (
            <RailEvent
              tone="success"
              icon={<ShieldCheck className="size-3.5" />}
              title="OA拟办稿已更新"
            >
              修订稿v2已写入，回执SZ-OA-DEMO-20260902-1926。当前状态：等待领导审阅。
            </RailEvent>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#E5E9F0] bg-white p-3">
        <div className="flex items-end gap-2 rounded-xl border border-[#D8DEE9] bg-white p-2 shadow-[0_5px_18px_rgba(16,24,40,.05)]">
          <textarea
            rows={1}
            placeholder="补充本轮修改要求…"
            className="min-h-8 flex-1 resize-none border-0 bg-transparent px-1 py-1.5 text-[10.5px] leading-5 outline-none placeholder:text-[#98A2B3]"
          />
          <Button
            type="button"
            size="icon-sm"
            aria-label="发送补充要求"
            className="rounded-lg bg-[#1F5EFF] text-white hover:bg-[#174ED6]"
          >
            <Send />
          </Button>
        </div>
      </div>
    </section>
  );
}

function BrowserChrome({
  state,
  onChange,
  onClose,
}: {
  state: InspectionReviewState;
  onChange: (state: InspectionReviewState) => void;
  onClose: () => void;
}) {
  const activeAddress =
    state.activeTab === 'artifact' ? state.artifactAddress : state.oaAddress;
  const zone = state.activeTab === 'artifact' ? '本地预览' : '政务外网';

  return (
    <div className="shrink-0 border-b border-[#CDD5E1] bg-[#F1F4F8]">
      <div className="flex h-9 items-end gap-1 border-b border-[#D7DEE8] px-2 pt-1.5">
        <Tabs
          value={state.activeTab}
          onValueChange={(value) =>
            onChange({
              ...state,
              activeTab: value as 'artifact' | 'oa',
              selectedTarget: null,
              annotationText: '',
            })
          }
          className="min-w-0 flex-1 gap-0"
        >
          <TabsList
            variant="line"
            className="h-8 max-w-full justify-start gap-1 overflow-hidden"
          >
            <TabsTrigger
              value="artifact"
              className="h-8 max-w-[220px] flex-none gap-2 rounded-t-lg border border-b-0 border-[#D3DAE5] bg-white px-3 text-[9.5px] data-active:shadow-none"
            >
              <FileText className="size-3.5 text-[#5571C8]" />
              <span className="truncate">
                拟办意见 · {state.version === 1 ? 'OA稿v1' : '修订稿v2'}
              </span>
              {state.annotations.length > 0 ? (
                <span className="size-1.5 rounded-full bg-[#D58B18]" />
              ) : null}
            </TabsTrigger>
            {state.oaOpened ? (
              <TabsTrigger
                value="oa"
                className="h-8 max-w-[210px] flex-none gap-2 rounded-t-lg border border-b-0 border-[#D3DAE5] bg-white px-3 text-[9.5px] data-active:shadow-none"
              >
                <Globe2 className="size-3.5 text-[#16845E]" />
                <span className="truncate">
                  深圳OA · {state.oaSubmitted ? '已更新' : '批示件办理'}
                </span>
              </TabsTrigger>
            ) : null}
          </TabsList>
        </Tabs>
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

      <div className="flex h-11 items-center gap-1.5 px-2.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="后退"
          className="text-[#667085]"
        >
          <ArrowLeft />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="前进"
          className="text-[#A4ADBA]"
        >
          <ArrowRight />
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
            value={activeAddress}
            onChange={(event) =>
              onChange({
                ...state,
                [state.activeTab === 'artifact'
                  ? 'artifactAddress'
                  : 'oaAddress']: event.target.value,
              })
            }
            aria-label="浏览器地址"
            className="min-w-0 flex-1 border-0 bg-transparent text-[9px] text-[#475467] outline-none"
          />
        </div>
        <span
          className={`rounded-md px-2 py-1 text-[8px] font-medium ${zone === '本地预览' ? 'bg-[#ECE9FE] text-[#6558B7]' : 'bg-[#E4F4ED] text-[#177251]'}`}
        >
          {zone}
        </span>
        {state.activeTab === 'oa' ? (
          <span className="rounded-md border border-[#D9DFE8] bg-white px-2 py-1 text-[8px] text-[#667085]">
            演示连接
          </span>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="浏览器更多操作"
          className="text-[#667085]"
        >
          <MoreHorizontal />
        </Button>
      </div>
    </div>
  );
}

function AnnotationPanel({
  state,
  onChange,
}: {
  state: InspectionReviewState;
  onChange: (state: InspectionReviewState) => void;
}) {
  const selected = state.selectedTarget
    ? targets[state.selectedTarget]
    : null;

  const saveAnnotation = () => {
    if (!state.selectedTarget || !state.annotationText.trim()) return;
    const target = targets[state.selectedTarget];
    const existing = state.annotations.find(
      (annotation) => annotation.target === state.selectedTarget,
    );
    const nextAnnotation: InspectionAnnotation = {
      id: existing?.id ?? state.annotations.length + 1,
      target: state.selectedTarget,
      quote: target.quote,
      comment: state.annotationText.trim(),
    };
    onChange({
      ...state,
      annotations: existing
        ? state.annotations.map((annotation) =>
            annotation.target === state.selectedTarget
              ? nextAnnotation
              : annotation,
          )
        : [...state.annotations, nextAnnotation],
      selectedTarget: null,
      annotationText: '',
    });
  };

  return (
    <aside className="absolute inset-y-0 right-0 z-20 w-full overflow-y-auto border-l border-[#D8DFE9] bg-white shadow-[-10px_0_28px_rgba(16,24,40,.12)]">
      <div className="flex h-10 items-center justify-between border-b border-[#E5E9F0] px-3">
        <div>
          <p className="text-[9.5px] font-semibold text-[#344054]">成果批注</p>
          <p className="mt-0.5 text-[7.8px] text-[#98A2B3]">
            {state.annotations.length}条草稿 · 尚未提交
          </p>
        </div>
        <SquarePen className="size-3.5 text-[#5B73C8]" />
      </div>

      <div className="space-y-2.5 p-3">
        {selected ? (
          <div className="rounded-xl border border-[#BCD0F5] bg-[#F7F9FF] p-3">
            <p className="text-[8px] font-semibold text-[#5970BE]">
              已定位 · {selected.label}
            </p>
            <p className="mt-2 line-clamp-3 text-[8.5px] leading-4 text-[#667085]">
              “{selected.quote}”
            </p>
            <Textarea
              value={state.annotationText}
              onChange={(event) =>
                onChange({ ...state, annotationText: event.target.value })
              }
              placeholder="说明希望怎样修改…"
              className="mt-2 min-h-24 resize-none border-[#CBD6EA] bg-white text-[9px] leading-4"
            />
            <button
              type="button"
              onClick={() =>
                onChange({ ...state, annotationText: selected.suggestion })
              }
              className="mt-2 text-left text-[8px] leading-4 text-[#5570BE] hover:text-[#2959C7]"
            >
              使用建议：{selected.suggestion}
            </button>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() =>
                  onChange({
                    ...state,
                    selectedTarget: null,
                    annotationText: '',
                  })
                }
                className="flex-1 border-[#D7DFEA] text-[8px] text-[#667085]"
              >
                取消
              </Button>
              <Button
                type="button"
                size="xs"
                onClick={saveAnnotation}
                disabled={!state.annotationText.trim()}
                className="flex-1 bg-[#1F5EFF] text-[8px] text-white hover:bg-[#174ED6]"
              >
                保存批注
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#CFD8E6] bg-[#FAFBFD] p-3 text-center">
            <SquarePen className="mx-auto size-4 text-[#8090B8]" />
            <p className="mt-2 text-[8.5px] leading-4 text-[#7A8699]">
              开启批注模式后，点击正文中的可标注内容。
            </p>
          </div>
        )}

        {state.annotations.map((annotation) => (
          <div
            key={annotation.id}
            className="rounded-xl border border-[#E0E6EF] bg-white p-3 shadow-[0_3px_10px_rgba(16,24,40,.035)]"
          >
            <div className="flex items-center gap-2">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#EAF0FF] text-[8px] font-semibold text-[#3159BE]">
                {annotation.id}
              </span>
              <p className="truncate text-[8.5px] font-medium text-[#475467]">
                {targets[annotation.target].label}
              </p>
            </div>
            <p className="mt-2 text-[8.5px] leading-4 text-[#5E6878]">
              {annotation.comment}
            </p>
            <div className="mt-2 flex gap-3 text-[7.8px]">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...state,
                    selectedTarget: annotation.target,
                    annotationText: annotation.comment,
                  })
                }
                className="text-[#5570BE]"
              >
                修改
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...state,
                    annotations: state.annotations.filter(
                      (item) => item.id !== annotation.id,
                    ),
                  })
                }
                className="text-[#9A6670]"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function ProposalDocument({
  state,
  onChange,
}: {
  state: InspectionReviewState;
  onChange: (state: InspectionReviewState) => void;
}) {
  const chooseTarget = (target: InspectionAnnotationTarget) => {
    if (!state.annotationMode || state.modifying) return;
    const existing = state.annotations.find(
      (annotation) => annotation.target === target,
    );
    onChange({
      ...state,
      selectedTarget: target,
      annotationText: existing?.comment ?? '',
    });
  };

  const targetClass = (target: InspectionAnnotationTarget) => {
    const annotation = state.annotations.find(
      (item) => item.target === target,
    );
    const selected = state.selectedTarget === target;
    if (selected)
      return 'rounded bg-[#DDE8FF] px-0.5 text-[#274FAD] ring-1 ring-[#82A4EF]';
    if (annotation)
      return 'rounded bg-[#EAF0FF] px-0.5 text-[#3159BE] underline decoration-[#6C89DC] decoration-2 underline-offset-2';
    if (state.annotationMode && !state.modifying)
      return 'cursor-pointer rounded px-0.5 transition hover:bg-[#EAF0FF] hover:text-[#3159BE]';
    return '';
  };

  return (
    <div className="relative min-h-full bg-[#E9EDF3] px-5 py-6">
      {state.version === 2 && !state.modifying ? (
        <div className="mx-auto mb-3 flex max-w-[610px] items-center gap-2 rounded-lg border border-[#CBE5D8] bg-[#F3FBF6] px-3 py-2 text-[8.5px] text-[#197355] shadow-sm">
          <CheckCircle2 className="size-3.5" />
          修订稿v2已生成，可继续批注或写回OA。
        </div>
      ) : null}
      <article className="mx-auto min-h-[720px] max-w-[610px] border border-[#D8DEE8] bg-white px-12 py-12 shadow-[0_12px_34px_rgba(29,43,72,.09)]">
        <div className="border-b border-[#E7EAF0] pb-5 text-center">
          <p className="text-[9px] tracking-[0.22em] text-[#98A2B3]">
            拟办意见 · 演示预览
          </p>
          <h2 className="mt-3 text-[18px] font-semibold tracking-[0.04em] text-[#202939]">
            关于涉企行政检查有关问题的拟办意见
          </h2>
          <p className="mt-2 text-[9px] text-[#98A2B3]">
            {state.version === 1
              ? 'OA稿v1 · 已写入 · 等待领导审阅'
              : '修订稿v2 · 最新版本 · 待写回OA'}
          </p>
        </div>

        <div className="mt-8 text-[12px] leading-8 text-[#344054]">
          <p className="indent-8">
            经初步核查，投诉材料汇总的126条入企活动包含政策宣讲、服务走访、行政指导和案件调查等，不宜直接认定为126次行政检查。现有28条检查登记中，6条为同一联合检查的部门参与记录，按时间、对象和事项归并后，共形成22次实际检查事件。另发现疑似重复登记1项、疑似未扫码1项、迟录2项，现有材料尚不足以直接认定违规。
          </p>
          <p className="mt-4 indent-8">
            建议
            <button
              type="button"
              onClick={() => chooseTarget('lead')}
              className={`inline text-left ${targetClass('lead')}`}
            >
              {state.version === 1
                ? '由市司法行政部门会同有关行业主管部门在5个工作日内复核4项异常'
                : '由市司法行政部门牵头，会同有关行业主管部门在5个工作日内复核4项异常'}
            </button>
            ，逐项反馈依据；督促相关单位补正扫码和登记信息，完善联合检查关联规则；
            <button
              type="button"
              onClick={() => chooseTarget('closure')}
              className={`inline text-left ${targetClass('closure')}`}
            >
              针对企业反映集中的事项开展精准纠偏
            </button>
            {state.version === 2
              ? '，核实结果形成问题清单，逐项明确整改措施、责任单位和完成时限，实行闭环销号'
              : ''}
            ，不另行新建平台，不组织全市“一刀切”专项检查。核实完成前不作责任定性，不扩大通报范围。
          </p>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-2 border-t border-[#ECEFF4] pt-5">
          {[
            ['22次', '实际检查事件'],
            ['4项', '保持待核实'],
            ['不上传', '内部核验表'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-lg bg-[#F7F9FC] px-3 py-2.5">
              <p className="text-[11px] font-semibold text-[#344054]">{value}</p>
              <p className="mt-1 text-[8px] text-[#98A2B3]">{label}</p>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

function ArtifactTab({
  state,
  onChange,
}: {
  state: InspectionReviewState;
  onChange: (state: InspectionReviewState) => void;
}) {
  const showAnnotations = state.selectedTarget !== null;

  const submitAnnotations = () => {
    if (state.annotations.length === 0 || state.modifying) return;
    onChange({
      ...state,
      submittedAnnotations: state.annotations,
      annotations: [],
      selectedTarget: null,
      annotationText: '',
      annotationMode: false,
      modifying: true,
    });
  };

  const openOa = () => {
    if (state.version !== 2 || state.modifying) return;
    onChange({ ...state, oaOpened: true, activeTab: 'oa' });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-[#D9E0EA] bg-white px-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold text-[#344054]">
            关于涉企行政检查有关问题的拟办意见
          </p>
          <p className="mt-0.5 text-[8px] text-[#98A2B3]">
            {state.version === 1
              ? 'OA稿v1 · 只读留痕'
              : '修订稿v2 · 最新版本'}
          </p>
        </div>
        <Button
          type="button"
          variant={state.annotationMode ? 'default' : 'outline'}
          size="sm"
          onClick={() =>
            onChange({
              ...state,
              annotationMode: !state.annotationMode,
              selectedTarget: null,
              annotationText: '',
            })
          }
          disabled={state.modifying}
          className={
            state.annotationMode
              ? 'bg-[#1F5EFF] text-[9px] text-white hover:bg-[#174ED6]'
              : 'border-[#D7DFEA] text-[9px] text-[#475467]'
          }
        >
          <SquarePen />
          {state.annotationMode ? '退出批注' : '批注'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-[#D7DFEA] text-[9px] text-[#475467]"
        >
          <ExternalLink />
          导出
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={openOa}
          disabled={state.version !== 2 || state.modifying}
          className="bg-[#1F5EFF] text-[9px] text-white hover:bg-[#174ED6]"
        >
          <Globe2 />
          写回OA
        </Button>
      </div>

      <div className="relative flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto">
          <ProposalDocument state={state} onChange={onChange} />
        </div>
        {showAnnotations ? (
          <AnnotationPanel state={state} onChange={onChange} />
        ) : null}
      </div>

      {state.annotations.length > 0 ? (
        <div className="flex h-12 shrink-0 items-center gap-3 border-t border-[#CFD8E6] bg-white px-4 shadow-[0_-8px_20px_rgba(16,24,40,.05)]">
          <span className="grid size-6 place-items-center rounded-full bg-[#EAF0FF] text-[9px] font-semibold text-[#3159BE]">
            {state.annotations.length}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[9.5px] font-medium text-[#344054]">
              {state.annotations.length}条批注草稿
            </p>
            <p className="mt-0.5 text-[8px] text-[#98A2B3]">
              汇总提交后生成一个新版本
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange({
                ...state,
                annotations: [],
                selectedTarget: null,
                annotationText: '',
              })
            }
            className="text-[8.5px] text-[#7A8699]"
          >
            清除草稿
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={submitAnnotations}
            className="bg-[#1F5EFF] text-[9px] text-white hover:bg-[#174ED6]"
          >
            <Send />
            提交{state.annotations.length}条修改
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function OaTab({
  state,
  onChange,
}: {
  state: InspectionReviewState;
  onChange: (state: InspectionReviewState) => void;
}) {
  if (state.oaSubmitted) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#EEF2F6] p-5">
        <div className="mx-auto max-w-[720px] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-[0_12px_32px_rgba(16,24,40,.08)]">
          <div className="flex h-12 items-center gap-3 bg-[#173B68] px-5 text-white">
            <span className="grid size-7 place-items-center rounded-lg bg-white/10 text-[10px] font-semibold">
              深
            </span>
            <div>
              <p className="text-[11px] font-semibold">深圳市协同办公平台</p>
              <p className="mt-0.5 text-[8px] text-white/60">演示事项办理</p>
            </div>
          </div>
          <div className="p-8 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#EAF7F1] text-[#16825D]">
              <CheckCircle2 className="size-6" />
            </span>
            <h2 className="mt-4 text-[16px] font-semibold text-[#243147]">
              拟办稿已更新
            </h2>
            <p className="mt-2 text-[10px] text-[#667085]">
              修订稿v2已写入事项PSJ-2026-0902-017，等待领导审阅。
            </p>
            <div className="mx-auto mt-6 max-w-[480px] rounded-xl border border-[#DDE5EF] bg-[#F8FAFC] p-4 text-left">
              {[
                ['执行身份', '林思远 · 综合处经办岗'],
                ['更新时间', '2026-09-02 19:26'],
                ['回执编号', 'SZ-OA-DEMO-20260902-1926'],
                ['后续状态', '等待领导审阅'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex border-b border-[#E7EBF1] py-2 text-[9px] last:border-0"
                >
                  <span className="w-20 text-[#98A2B3]">{label}</span>
                  <span className="font-medium text-[#475467]">{value}</span>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange({ ...state, activeTab: 'artifact' })}
              className="mt-6 border-[#D5DEEA] text-[9px] text-[#475467]"
            >
              返回成果预览
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#EEF2F6] p-4">
      <div className="mx-auto max-w-[780px] overflow-hidden rounded-xl border border-[#D3DBE6] bg-white shadow-[0_10px_28px_rgba(16,24,40,.075)]">
        <div className="flex h-12 items-center gap-3 bg-[#173B68] px-5 text-white">
          <span className="grid size-7 place-items-center rounded-lg bg-white/10 text-[10px] font-semibold">
            深
          </span>
          <div>
            <p className="text-[11px] font-semibold">深圳市协同办公平台</p>
            <p className="mt-0.5 text-[8px] text-white/60">事项办理 · 演示连接</p>
          </div>
          <span className="ml-auto rounded-md bg-white/10 px-2 py-1 text-[8px] text-white/75">
            综合处拟办
          </span>
        </div>

        <div className="grid grid-cols-[150px_minmax(0,1fr)] border-b border-[#E1E6EE] bg-[#F8FAFC] text-[9px]">
          <div className="border-r border-[#E1E6EE] px-4 py-3 text-[#7A8699]">
            当前环节
          </div>
          <div className="px-4 py-3 font-medium text-[#344054]">
            综合处拟办 · 待更新草稿
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              ['事项名称', '涉企行政检查有关问题批示件'],
              ['事项编号', 'PSJ-2026-0902-017（演示）'],
              ['原拟办版本', 'OA稿v1 · 昨天17:26写入'],
              ['待写入版本', '修订稿v2 · 当前任务'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[#E0E6EF] p-3">
                <p className="text-[8px] text-[#98A2B3]">{label}</p>
                <p className="mt-1.5 text-[9.5px] font-medium text-[#344054]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[9px] font-semibold text-[#344054]">
                拟办意见
              </p>
              <span className="flex items-center gap-1 text-[8px] text-[#17875D]">
                <Sparkles className="size-3" /> 智能体已填入修订稿v2
              </span>
            </div>
            <div className="min-h-[190px] rounded-lg border border-[#C9D4E5] bg-white p-4 text-[10px] leading-6 text-[#475467] shadow-[inset_0_1px_2px_rgba(16,24,40,.03)]">
              经初步核查，投诉材料汇总的126条入企活动包含政策宣讲、服务走访、行政指导和案件调查等，不宜直接认定为126次行政检查。现有28条检查登记中，6条为同一联合检查的部门参与记录，按时间、对象和事项归并后，共形成22次实际检查事件。另发现疑似重复登记1项、疑似未扫码1项、迟录2项，现有材料尚不足以直接认定违规。建议由市司法行政部门牵头，会同有关行业主管部门在5个工作日内复核4项异常，逐项反馈依据；督促相关单位补正扫码和登记信息，完善联合检查关联规则；针对企业反映集中的事项开展精准纠偏，核实结果形成问题清单，逐项明确整改措施、责任单位和完成时限，实行闭环销号，不另行新建平台，不组织全市“一刀切”专项检查。核实完成前不作责任定性，不扩大通报范围。
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-[#E0E6EF] bg-[#FAFBFD] p-3">
              <p className="text-[8px] text-[#98A2B3]">附件</p>
              <p className="mt-1.5 text-[9px] font-medium text-[#475467]">
                本次不上传附件
              </p>
              <p className="mt-1 text-[8px] text-[#98A2B3]">
                两张内部核验表仅留在任务内
              </p>
            </div>
            <div className="rounded-lg border border-[#E0E6EF] bg-[#FAFBFD] p-3">
              <p className="text-[8px] text-[#98A2B3]">后续动作</p>
              <p className="mt-1.5 text-[9px] font-medium text-[#475467]">
                不自动转办 · 不自动催办
              </p>
              <p className="mt-1 text-[8px] text-[#98A2B3]">
                只更新当前事项拟办草稿
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-[#E7C987] bg-[#FFF9EA] p-3.5">
            <ShieldCheck className="size-5 shrink-0 text-[#A96B00]" />
            <div className="min-w-0 flex-1">
              <p className="text-[9.5px] font-semibold text-[#7D5408]">
                将替换OA中的现有拟办草稿
              </p>
              <p className="mt-1 text-[8.5px] leading-4 text-[#876A31]">
                林思远 · 综合处经办岗 · 仅更新拟办正文 · 不上传附件 · 不转办或催办
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => onChange({ ...state, oaSubmitted: true })}
              className="bg-[#1F5EFF] text-[9px] text-white hover:bg-[#174ED6]"
            >
              <ShieldCheck />
              确认更新拟办稿
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function InspectionReviewWorkspace({
  state,
  onChange,
  onClose,
}: {
  state: InspectionReviewState;
  onChange: (state: InspectionReviewState) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!state.modifying) return;
    const timer = window.setTimeout(() => {
      onChange({
        ...state,
        version: 2,
        modifying: false,
        artifactAddress:
          'http://127.0.0.1:3000/preview/inspection/proposal-v2',
      });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [state, onChange]);

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-l border-[#DCE3EE] bg-[#E9EDF3]">
      <BrowserChrome state={state} onChange={onChange} onClose={onClose} />
      {state.activeTab === 'artifact' ? (
        <ArtifactTab state={state} onChange={onChange} />
      ) : (
        <OaTab state={state} onChange={onChange} />
      )}
      <div className="flex h-6 shrink-0 items-center border-t border-[#D2D9E3] bg-[#F8FAFC] px-3 text-[7.5px] text-[#8B96A7]">
        <span className="size-1.5 rounded-full bg-[#25A273]" />
        <span className="ml-1.5">任务浏览器 · 独立演示身份</span>
        <span className="ml-auto flex items-center gap-1">
          <ChevronDown className="size-3" /> 终端未启动
        </span>
      </div>
    </section>
  );
}
