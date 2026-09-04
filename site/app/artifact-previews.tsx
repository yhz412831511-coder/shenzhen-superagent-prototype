"use client";

import {
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  MessageSquarePlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DemoTask } from "./demo-data";

export type ArtifactAnnotation = {
  target: string;
  label: string;
  comment: string;
};

type Artifact = DemoTask["artifacts"][number];

type ArtifactPreviewProps = {
  task: DemoTask;
  artifact: Artifact;
  artifactIndex: number;
  pageIndex: number;
  selectedTarget: string | null;
  annotationDraft: string;
  annotations: ArtifactAnnotation[];
  onPageChange: (page: number) => void;
  onSelectTarget: (target: string) => void;
  onDraftChange: (draft: string) => void;
  onAddAnnotation: (label: string) => void;
  onClearSelection: () => void;
};

function formatOf(artifact: Artifact) {
  return artifact.meta.split("·")[0]?.trim().toUpperCase() ?? "FILE";
}

function AnnotationComposer({
  label,
  draft,
  onDraftChange,
  onAdd,
  onCancel,
}: {
  label: string;
  draft: string;
  onDraftChange: (draft: string) => void;
  onAdd: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="sticky bottom-2 z-20 mx-2 mt-3 rounded-xl border border-[#C9D7F6] bg-white p-2.5 shadow-[0_10px_30px_rgba(35,65,125,.16)]">
      <p className="truncate text-[8px] font-medium text-[#4E66A7]">
        批注位置：{label}
      </p>
      <textarea
        rows={2}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        placeholder="说明需要修改的内容或判断…"
        className="mt-2 min-h-12 w-full resize-none rounded-lg border border-[#DDE4EF] bg-[#FAFBFD] px-2.5 py-2 text-[9px] leading-4 text-[#344054] outline-none placeholder:text-[#98A2B3] focus:border-[#9CB5F5]"
      />
      <div className="mt-2 flex items-center justify-end gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onCancel}
          className="h-7 text-[8px] text-[#667085]"
        >
          取消
        </Button>
        <Button
          type="button"
          size="xs"
          disabled={!draft.trim()}
          onClick={onAdd}
          className="h-7 bg-[#1F5EFF] text-[8px] text-white hover:bg-[#174ED6]"
        >
          保存批注
        </Button>
      </div>
    </div>
  );
}

function SelectableBlock({
  id,
  label,
  selected,
  children,
  onSelect,
}: {
  id: string;
  label: string;
  selected: boolean;
  children: React.ReactNode;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className={`group relative w-full rounded-md px-1.5 py-1 text-left transition-colors ${
        selected ? "bg-[#EAF0FF] ring-1 ring-[#7697EB]" : "hover:bg-[#F7F9FD]"
      }`}
    >
      {children}
      <button
        type="button"
        onClick={() => onSelect(id)}
        aria-label={`批注：${label}`}
        className={`absolute -right-1 top-1 grid size-6 place-items-center rounded-md border border-[#D7E0F3] bg-white text-[#5571C8] shadow-sm transition-opacity hover:bg-[#EEF3FF] ${
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <MessageSquarePlus className="size-3" />
      </button>
    </div>
  );
}

function getDocumentPages(task: DemoTask, artifactIndex: number) {
  if (task.id === "legal" && artifactIndex === 0) {
    return [
      {
        eyebrow: "OA归档版 v1 · 演示事项",
        title: "《深圳经济特区城市管理条例（草案送审稿）》审查意见",
        sections: [
          ["一、审查情况", "已核对送审稿、起草说明、部门意见采纳表和协调会议纪要，并定位与本任务直接相关的两项官方依据。内部附件均为演示材料。"],
          ["二、需协调事项", "两份演示材料对同一事项的处理状态不一致。经用户确认，该事项保留为“需协调”，不由智能体代替任何部门形成确定立场。"],
          ["三、程序边界", "数字化识别结果仅作为辅助线索。涉及行政处罚的事实认定、证据审核、告知和申辩等环节，仍应由法定主体依照法定程序完成。"],
        ],
      },
      {
        eyebrow: "关联成果说明 · 演示事项",
        title: "问题、依据与处理状态",
        sections: [
          ["LR-01｜材料状态", "部门意见采纳表与协调会议纪要保留各自定位，当前处理类型为“需协调”。"],
          ["LR-02｜数字化辅助", "相关表述已与法定职权、事实查明、电子证据审核和程序权利要求关联。"],
          ["LR-03｜材料完整性", "送审稿、说明、意见采纳情况和依据材料的对应关系已完成检查。"],
        ],
      },
    ];
  }

  if (task.id === "annual") {
    if (artifactIndex === 0) {
      return [
        {
          eyebrow: "会议服务版 v1 · 演示任务",
          title: "2025年度司法行政工作报告",
          sections: [
            ["一、材料与口径", "本报告基于4项任务内演示材料形成，另以两项官方公开材料核对职能范围和年度工作方向。官方材料不用于证明内部完成情况。"],
            ["二、年度工作概述", "相关工作按正式台账口径表述为“稳步推进”。报告不写未经核实的覆盖范围、完成比例、排名或首创结论。"],
            ["三、问题与下一步", "对需要跨部门协同、基层衔接和数字化程序边界等事项，按任务节点、责任关系和核验条件组织下一步安排。"],
          ],
        },
        {
          eyebrow: "事实节点关系 · 演示任务",
          title: "母稿事实与派生成果",
          sections: [
            ["FACT-01｜推进状态", "采用重点任务台账中的“稳步推进”，不采用汇总材料中的“全面覆盖”。"],
            ["SOURCE-01｜官方背景", "深圳市司法局年度工作计划与全省司法行政工作要点只作为方向性依据。"],
            ["LINK-01｜派生范围", "领导汇报提纲、讲话参考和备答要点均引用本母稿的事实节点；节点变化将触发联动复检。"],
          ],
        },
      ];
    }
    if (artifactIndex === 2) {
      return [
        {
          eyebrow: "由母报告派生 · 演示任务",
          title: "领导讲话参考",
          sections: [
            ["开篇判断", "坚持以可核验事实支撑工作判断，不以材料篇幅和夸大表述替代工作成效。"],
            ["重点说明", "相关工作统一表述为“稳步推进”，不写未被正式台账支持的覆盖范围和比例。"],
            ["后续要求", "围绕协同、责任、节点和核验条件推动任务闭环，重要表述继续回到母报告事实节点。"],
          ],
        },
      ];
    }
    if (artifactIndex === 3) {
      return [
        {
          eyebrow: "由事实底账派生 · 演示任务",
          title: "备答要点",
          sections: [
            ["问：为何不写覆盖比例？", "答：两份演示材料表述不一致，已按用户决定采用正式台账的保守口径，当前不写覆盖范围和比例。"],
            ["问：官方来源证明了什么？", "答：只用于核对职能范围、年度方向和表述边界，不替代内部完成数据。"],
            ["问：母稿修改后如何同步？", "答：系统根据事实节点定位PPT、讲话和备答中的受影响内容，生成新的协同修订草稿。"],
          ],
        },
      ];
    }
  }

  return [
    {
      eyebrow: `${artifactIndex + 1}号成果 · ${task.shortTitle}`,
      title: task.artifacts[artifactIndex]?.name ?? "任务成果",
      sections: task.run.steps.slice(-3).map((step) => [step.title, step.output]),
    },
  ];
}

function DocumentPreview(props: ArtifactPreviewProps) {
  const pages = getDocumentPages(props.task, props.artifactIndex);
  const pageIndex = Math.min(props.pageIndex, pages.length - 1);
  const page = pages[pageIndex];
  const selectedSection = page.sections.findIndex(
    (_, index) => props.selectedTarget === `doc-${pageIndex}-${index}`,
  );
  const selectedLabel =
    selectedSection >= 0 ? page.sections[selectedSection][0] : "";
  const archived = props.artifact.meta.includes("OA归档版");
  const locked = archived || props.artifact.state.includes("锁定");

  return (
    <div className="w-full min-w-0">
      <div className="bg-[#E9EDF3] px-3 py-4">
        {locked ? (
          <div className="mx-auto mb-2 flex max-w-[520px] items-center gap-2 rounded-lg border border-[#D7DEE8] bg-white px-3 py-2 text-[7.5px] text-[#667085]">
            <LockKeyhole className="size-3.5 text-[#647493]" />
            {archived
              ? "OA归档版只读；提交批注将创建新的工作草稿，原归档版保持不变。"
              : "会议服务版只读；提交批注将创建协同修订草稿，原提交版本保持不变。"}
          </div>
        ) : null}
        <article className="relative mx-auto min-h-[470px] w-full max-w-[520px] bg-white px-5 py-6 shadow-[0_8px_28px_rgba(16,24,40,.11)]">
          {pages.length > 1 ? (
            <div className="absolute right-2.5 top-2.5 flex items-center gap-0.5 rounded-lg border border-[#E0E5ED] bg-white/95 px-0.5 text-[7px] text-[#7A8699] shadow-sm">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={pageIndex === 0}
                onClick={() => props.onPageChange(pageIndex - 1)}
                aria-label="上一页"
              >
                <ChevronLeft />
              </Button>
              <span>{pageIndex + 1}/{pages.length}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                disabled={pageIndex >= pages.length - 1}
                onClick={() => props.onPageChange(pageIndex + 1)}
                aria-label="下一页"
              >
                <ChevronRight />
              </Button>
            </div>
          ) : null}
          <p className="text-center text-[7px] tracking-[.12em] text-[#8B96A7]">
            {page.eyebrow}
          </p>
          <h2 className="mx-auto mt-3 max-w-[420px] text-center text-[13px] font-semibold leading-5 text-[#202B3C]">
            {page.title}
          </h2>
          <div className="mt-6 space-y-3.5">
            {page.sections.map(([title, content], index) => (
              <SelectableBlock
                key={title}
                id={`doc-${pageIndex}-${index}`}
                label={title}
                selected={props.selectedTarget === `doc-${pageIndex}-${index}`}
                onSelect={props.onSelectTarget}
              >
                <h3 className="text-[9px] font-semibold text-[#344054]">
                  {title}
                </h3>
                <p className="mt-1.5 text-[8.5px] leading-[1.75] text-[#526176]">
                  {content}
                </p>
              </SelectableBlock>
            ))}
          </div>
          <p className="mt-8 text-center text-[7px] text-[#A0A9B7]">
            — {pageIndex + 1} —
          </p>
        </article>
        {selectedSection >= 0 ? (
          <AnnotationComposer
            label={selectedLabel}
            draft={props.annotationDraft}
            onDraftChange={props.onDraftChange}
            onAdd={() => props.onAddAnnotation(selectedLabel)}
            onCancel={props.onClearSelection}
          />
        ) : null}
        {props.annotations.length > 0 && selectedSection < 0 ? (
          <p className="mt-2 text-center text-[8px] text-[#6075B8]">
            {props.annotations.length}条批注草稿已保留，回到任务后可汇总提交
          </p>
        ) : null}
      </div>
    </div>
  );
}

function getSheetRows(task: DemoTask, artifactIndex: number) {
  if (task.id === "inspection" && artifactIndex === 1) {
    return [
      ["JC-001", "7月3日", "深科智造", "联合检查", "3条→1次"],
      ["JC-002", "7月8日", "湾区物流", "现场检查", "1次"],
      ["JC-003", "7月16日", "鹏城医械", "联合检查", "2条→1次"],
      ["JC-004", "8月2日", "前海数创", "行政指导", "不计检查"],
      ["JC-005", "8月12日", "南山智研", "现场检查", "1次"],
    ];
  }
  if (task.id === "inspection") {
    return [
      ["01", "疑似重复登记", "1项", "待责任单位复核", "待核实"],
      ["02", "疑似未扫码", "1项", "补充扫码记录", "待核实"],
      ["03", "迟录", "2项", "说明迟录原因", "待核实"],
    ];
  }
  if (task.id === "legal" && artifactIndex === 2) {
    return [
      ["LR-01", "职责分工", "需协调", "保留两处原始定位", "已归档"],
      ["LR-02", "数字化辅助", "建议修改", "补充人工审核和程序边界", "已归档"],
      ["LR-03", "送审材料", "技术性问题", "补齐依据映射", "已归档"],
    ];
  }
  if (task.id === "legal") {
    return [
      ["LR-01", "演示材料", "协调性", "两份材料状态不一致", "需协调"],
      ["LR-02", "数字化辅助", "程序性", "不得替代法定主体判断", "已纳入"],
      ["LR-03", "送审材料", "完整性", "来源与说明对应关系", "已核验"],
    ];
  }
  if (task.id === "tracking") {
    return [
      ["TK-01", "重点任务A", "两处来源冲突", "保留原状态，不自动催办", "待核实"],
      ["TK-02", "重点任务B", "台账与OA一致", "进入催办草稿", "待审阅"],
      ["TK-03", "重点任务C", "节点临近", "保留提醒", "跟踪中"],
    ];
  }
  return [
    ["01", "第十八条", "协调性", "部门职责存在冲突", "重大"],
    ["02", "第二十一条", "合法性", "兜底授权边界不清", "重大"],
    ["03", "第三十二条", "程序性", "AI识别缺少人工复核", "重大"],
    ["04", "第三十六条", "规范性", "术语前后不一致", "一般"],
    ["05", "第四十六条", "可执行性", "责任反馈期限不明", "一般"],
  ];
}

function SpreadsheetPreview(props: ArtifactPreviewProps) {
  const rows = getSheetRows(props.task, props.artifactIndex);
  const headers =
    props.task.id === "tracking"
      ? ["编号", "任务", "来源关系", "当前处理", "状态"]
      : ["序号", "对象/条款", "类型", "核心判断", "状态"];
  const selectedRow = rows.findIndex(
    (_, index) => props.selectedTarget === `row-${index}`,
  );
  const selectedLabel = selectedRow >= 0 ? `第${selectedRow + 2}行` : "";

  return (
    <div className="w-full min-w-0">
      <div className="bg-white">
        <div className="flex h-8 items-center border-b border-[#E3E8EF] bg-[#F8FAFC] px-2 text-[7.5px] text-[#7A8699]">
          <span className="w-8 border-r border-[#DDE3EC]">fx</span>
          <span className="ml-2 truncate">
            {selectedRow >= 0 ? rows[selectedRow].join(" · ") : props.artifact.meta}
          </span>
        </div>
        <Table className="min-w-[520px] table-fixed text-[7.5px]">
          <TableHeader>
            <TableRow className="bg-[#EFF4FA] hover:bg-[#EFF4FA]">
              {headers.map((header, index) => (
                <TableHead
                  key={header}
                  className={`h-8 border-r border-[#DCE3EC] px-2 text-[7.5px] font-semibold text-[#526176] ${
                    index === 0 ? "w-12" : "w-[118px]"
                  }`}
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow
                key={row.join("-")}
                onClick={() => props.onSelectTarget(`row-${rowIndex}`)}
                title="点击此行添加批注"
                className={`h-9 ${
                  props.selectedTarget === `row-${rowIndex}`
                    ? "bg-[#EAF0FF] hover:bg-[#EAF0FF]"
                    : "cursor-pointer hover:bg-[#F3F6FD]"
                }`}
              >
                {row.map((cell, cellIndex) => (
                  <TableCell
                    key={`${cell}-${cellIndex}`}
                    className="overflow-hidden border-r border-[#E3E8EF] px-2 py-1.5 text-[7.5px] text-[#526176]"
                    title={cell}
                  >
                    <span className="block truncate">{cell}</span>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex h-8 items-end gap-1 border-t border-[#DDE3EC] bg-[#F4F7FA] px-2">
          <span className="border-b-2 border-[#2E7D5B] px-3 py-1.5 text-[7.5px] font-medium text-[#2E7D5B]">
            核验结果
          </span>
          <span className="px-3 py-1.5 text-[7.5px] text-[#8B96A7]">
            来源映射
          </span>
        </div>
      </div>
      {selectedRow >= 0 ? (
        <AnnotationComposer
          label={selectedLabel}
          draft={props.annotationDraft}
          onDraftChange={props.onDraftChange}
          onAdd={() => props.onAddAnnotation(selectedLabel)}
          onCancel={props.onClearSelection}
        />
      ) : null}
    </div>
  );
}

const annualSlides = [
  ["2025年度司法行政工作报告", "母报告与三项配套成果同源生成"],
  ["年度工作总体判断", "坚持正式台账优先，不使用未经核实的覆盖比例"],
  ["需要持续关注的事项", "从协同、基层衔接和程序边界组织问题"],
  ["下一步工作安排", "任务、责任、节点和核验条件形成闭环"],
  ["事实底账与成果派生", "PPT、讲话和备答引用同一组母稿事实节点"],
  ["汇报结束", "请审议"],
];

function PresentationPreview(props: ArtifactPreviewProps) {
  const pageIndex = Math.min(props.pageIndex, annualSlides.length - 1);
  const slide = annualSlides[pageIndex];
  const selected = props.selectedTarget === `slide-${pageIndex}`;
  const label = `第${pageIndex + 1}页｜${slide[0]}`;

  return (
    <div className="w-full min-w-0">
      {props.task.id === "annual" && props.artifact.state.includes("锁定") ? (
        <div className="flex items-center gap-2 border-b border-[#D7DEE8] bg-white px-3 py-2 text-[7.5px] text-[#667085]">
          <LockKeyhole className="size-3.5 text-[#647493]" />
          会议服务版只读；提交批注将创建协同修订草稿，原提交版本保持不变。
        </div>
      ) : null}
      <div className="grid min-h-[440px] grid-cols-[54px_minmax(0,1fr)] bg-[#E8ECF2]">
        <div className="space-y-1.5 overflow-hidden border-r border-[#D8DEE8] bg-[#F4F6F9] p-1.5">
          {annualSlides.map((item, index) => (
            <button
              key={item[0]}
              type="button"
              onClick={() => props.onPageChange(index)}
              aria-label={`第${index + 1}页 ${item[0]}`}
              className={`relative aspect-video w-full overflow-hidden rounded-sm border bg-white text-left ${
                index === pageIndex
                  ? "border-[#5979D6] ring-1 ring-[#5979D6]"
                  : "border-[#D6DDE8]"
              }`}
            >
              <span className="absolute left-1 top-1 text-[5px] text-[#98A2B3]">
                {index + 1}
              </span>
              <span className="absolute inset-x-1 bottom-1 truncate text-[4.5px] text-[#526176]">
                {item[0]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex min-w-0 flex-col p-3">
          <button
            type="button"
            onClick={() => props.onSelectTarget(`slide-${pageIndex}`)}
            aria-label={`批注：${label}`}
            className={`relative mx-auto aspect-video w-full max-w-[520px] overflow-hidden rounded-sm bg-[#0E1D3A] p-5 text-left shadow-[0_10px_28px_rgba(16,24,40,.18)] ${
              selected ? "ring-2 ring-[#7697EB]" : ""
            }`}
          >
            <span className="absolute right-0 top-0 h-full w-[38%] bg-[radial-gradient(circle_at_70%_30%,rgba(75,126,255,.75),transparent_42%),linear-gradient(145deg,transparent_20%,rgba(59,92,180,.38))]" />
            <span className="relative block text-[6px] tracking-[.14em] text-[#8EA9EE]">
              深圳市司法行政工作会议
            </span>
            <strong className="relative mt-5 block max-w-[82%] text-[13px] leading-5 text-white">
              {slide[0]}
            </strong>
            <span className="relative mt-2 block max-w-[82%] text-[7.5px] leading-4 text-[#C8D3EF]">
              {slide[1]}
            </span>
            <span className="absolute bottom-3 left-5 text-[6px] text-[#8399C9]">
              {String(pageIndex + 1).padStart(2, "0")} / {annualSlides.length}
            </span>
          </button>
          <div className="mt-3 rounded-lg border border-[#D7DFEA] bg-white p-2.5">
            <p className="text-[7.5px] font-medium text-[#526176]">演讲者备注</p>
            <p className="mt-1 text-[7.5px] leading-4 text-[#7A8699]">
              本页结论与母报告对应段落保持同源，关键数字已回溯至事实底账。
            </p>
          </div>
          {selected ? (
            <AnnotationComposer
              label={label}
              draft={props.annotationDraft}
              onDraftChange={props.onDraftChange}
              onAdd={() => props.onAddAnnotation(label)}
              onCancel={props.onClearSelection}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GenericArtifactPreview(props: ArtifactPreviewProps) {
  return (
    <div className="w-full min-w-0">
      <div className="bg-[#E9EDF3] p-4">
        <div className="mx-auto min-h-[360px] max-w-[520px] rounded-lg border border-[#D7DEE8] bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,.08)]">
          <p className="text-[8px] font-medium text-[#6075B8]">
            {props.artifact.meta}
          </p>
          <h2 className="mt-3 text-[14px] font-semibold text-[#243047]">
            {props.artifact.name}
          </h2>
          <div className="mt-5 space-y-3">
            {props.task.run.steps.slice(-3).map((step) => (
              <div key={step.title} className="border-l-2 border-[#B8C8EE] pl-3">
                <p className="text-[8.5px] font-medium text-[#475467]">
                  {step.title}
                </p>
                <p className="mt-1 text-[8px] leading-4 text-[#7A8699]">
                  {step.output}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArtifactPreview(props: ArtifactPreviewProps) {
  const format = formatOf(props.artifact);
  if (format === "XLSX") return <SpreadsheetPreview {...props} />;
  if (format === "PPTX") return <PresentationPreview {...props} />;
  if (format === "DOCX") return <DocumentPreview {...props} />;
  return <GenericArtifactPreview {...props} />;
}
