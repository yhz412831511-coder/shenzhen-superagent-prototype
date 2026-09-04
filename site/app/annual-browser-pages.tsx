"use client";

import {
  CheckCircle2,
  FileCheck2,
  FileText,
  Landmark,
  Link2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

const SHENZHEN_JUSTICE_PLAN_URL =
  "https://sf.sz.gov.cn/gkmlpt/content/12/12006/post_12006677.html";
const GUANGDONG_JUSTICE_POINTS_URL =
  "https://sf.sz.gov.cn/gkmlpt/content/12/12062/post_12062438.html";

export const annualBrowserResources = {
  shenzhenPlan: {
    id: "annual-source-shenzhen-plan",
    title: "深圳市司法局年度工作计划",
    address: SHENZHEN_JUSTICE_PLAN_URL,
  },
  guangdongPoints: {
    id: "annual-source-guangdong-points",
    title: "全省司法行政工作要点",
    address: GUANGDONG_JUSTICE_POINTS_URL,
  },
  conflict: {
    id: "annual-source-conflict",
    title: "演示材料口径对照",
    address: "http://127.0.0.1:3000/preview/annual/evidence/conflict",
  },
  meeting: {
    id: "annual-meeting-service",
    title: "会议材料服务 · 提交记录",
    address: "https://meeting.demo.sz.gov.cn/materials/ANNUAL-2025-DEMO",
  },
} as const;

export type AnnualBrowserResource =
  (typeof annualBrowserResources)[keyof typeof annualBrowserResources];

export function annualResourceForSource(
  source: string,
): AnnualBrowserResource | null {
  if (source.includes("2024年工作总结") || source.includes("2025年工作计划")) {
    return annualBrowserResources.shenzhenPlan;
  }
  if (source.includes("全省司法行政工作要点")) {
    return annualBrowserResources.guangdongPoints;
  }
  if (
    source.includes("年度工作汇总") ||
    source.includes("重点任务台账") ||
    source.includes("演示材料")
  ) {
    return annualBrowserResources.conflict;
  }
  return null;
}

function OfficialSourcePage({ type }: { type: "shenzhen" | "guangdong" }) {
  const shenzhen = type === "shenzhen";
  const items = shenzhen
    ? [
        ["来源用途", "用于核对深圳司法行政工作的职能范围、年度结构和工作方向。"],
        ["任务边界", "官方公开材料只作为背景依据，不替代本任务中的内部年度台账和完成情况。"],
        ["引用方式", "成果只引用能够回到原文的方向性表述，不从网页推导内部完成比例。"],
      ]
    : [
        ["来源用途", "用于核对全省司法行政工作部署与年度任务方向。"],
        ["层级关系", "上位工作要点作为方向约束，不直接证明深圳内部任务已经完成。"],
        ["引用方式", "命中内容进入事实底账后，仍需标记来源层级和可用范围。"],
      ];

  return (
    <article className="w-full max-w-[720px] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-[0_12px_32px_rgba(16,24,40,.07)]">
      <div className="flex items-center gap-3 border-b border-[#E5E9F0] bg-[#FAFBFD] px-4 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#EAF0FF] text-[#4967C5]">
          <Landmark className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold text-[#2E3A50]">
            {shenzhen
              ? "深圳市司法局2024年工作总结和2025年工作计划"
              : "2025年全省司法行政工作要点"}
          </p>
          <p className="mt-0.5 text-[7.5px] text-[#98A2B3]">
            深圳市司法局官方网站
          </p>
        </div>
        <span className="rounded-md bg-[#EAF7F0] px-2 py-1 text-[7.5px] font-medium text-[#187654]">
          官方来源
        </span>
      </div>
      <div className="px-5 py-5">
        <div className="flex items-center gap-2 rounded-lg border border-[#DDE5F3] bg-[#F7F9FD] px-3 py-2 text-[8px] text-[#60708A]">
          <ShieldCheck className="size-3.5 text-[#4E6CC6]" />
          任务浏览器只展示来源用途和命中范围，不复制大段网页内容。
        </div>
        <div className="mt-4 space-y-2.5">
          {items.map(([title, summary], index) => (
            <section
              key={title}
              className="rounded-lg border border-[#E3E8F0] px-3.5 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full bg-[#EDF2FF] text-[7px] font-semibold text-[#4867C3]">
                  {index + 1}
                </span>
                <h3 className="text-[9px] font-semibold text-[#344054]">
                  {title}
                </h3>
              </div>
              <p className="mt-2 text-[8.5px] leading-[1.7] text-[#5C697C]">
                {summary}
              </p>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}

function ConflictPage() {
  return (
    <article className="w-full max-w-[720px] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-[0_12px_32px_rgba(16,24,40,.07)]">
      <div className="flex items-center gap-3 border-b border-[#E5E9F0] bg-[#FAFBFD] px-4 py-3">
        <span className="grid size-8 place-items-center rounded-lg bg-[#FFF4DF] text-[#B16D0D]">
          <FileText className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-[#2E3A50]">
            同一事项的年度口径不一致
          </p>
          <p className="mt-0.5 text-[7.5px] text-[#98A2B3]">
            已授权任务附件 · 只读对照
          </p>
        </div>
        <span className="rounded-md bg-[#FFF0D4] px-2 py-1 text-[7.5px] font-medium text-[#9B620D]">
          演示材料
        </span>
      </div>
      <div className="p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <section className="rounded-lg border border-[#DFE5EE] p-3.5">
            <p className="text-[8px] font-semibold text-[#526176]">
              年度工作汇总.docx
            </p>
            <p className="mt-1 text-[7.5px] text-[#98A2B3]">总结段落 · 演示材料</p>
            <p className="mt-3 text-[9px] leading-5 text-[#344054]">
              表述：相关工作已全面覆盖
            </p>
          </section>
          <section className="rounded-lg border border-[#E7C786] bg-[#FFFCF5] p-3.5">
            <p className="text-[8px] font-semibold text-[#725018]">
              重点任务台账.xlsx
            </p>
            <p className="mt-1 text-[7.5px] text-[#A57A35]">状态列 · 演示材料</p>
            <p className="mt-3 text-[9px] leading-5 text-[#5F451B]">
              表述：仍处试点推进
            </p>
          </section>
        </div>
        <div className="mt-4 rounded-lg border border-[#D8E2F5] bg-[#F6F8FD] px-3.5 py-3">
          <p className="text-[8px] font-semibold text-[#4C65AA]">用户已确认的处理</p>
          <p className="mt-1.5 text-[8.5px] leading-4 text-[#526176]">
            以正式台账为准，只写“稳步推进”，不写覆盖范围和比例，并同步到全部派生成果。
          </p>
        </div>
      </div>
    </article>
  );
}

function MeetingServicePage() {
  const files = [
    "2025年度司法行政工作报告.docx",
    "领导汇报提纲.pptx",
    "领导讲话参考.docx",
    "备答要点.docx",
  ];
  return (
    <article className="w-full max-w-[720px] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-[0_12px_32px_rgba(16,24,40,.07)]">
      <div className="flex items-center gap-3 border-b border-[#DDE5F1] bg-[#F5F8FD] px-4 py-3">
        <span className="grid size-8 place-items-center rounded-lg bg-[#E8F0FF] text-[#315DB8]">
          <Link2 className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-[#25344D]">
            会议材料服务 · 提交记录
          </p>
          <p className="mt-0.5 text-[7.5px] text-[#7B899D]">政务外网 · 演示连接</p>
        </div>
        <span className="flex items-center gap-1 rounded-md bg-[#EAF7F0] px-2 py-1 text-[7.5px] font-medium text-[#187654]">
          <CheckCircle2 className="size-3" /> 已接收
        </span>
      </div>
      <div className="p-5">
        <div className="grid gap-x-5 gap-y-3 text-[8.5px] sm:grid-cols-2">
          <div><span className="text-[#98A2B3]">材料包</span><p className="mt-1 text-[#344054]">ANNUAL-2025-DEMO</p></div>
          <div><span className="text-[#98A2B3]">提交身份</span><p className="mt-1 text-[#344054]">林思远 · 综合处经办岗</p></div>
          <div><span className="text-[#98A2B3]">校验结果</span><p className="mt-1 text-[#344054]">关联口径一致</p></div>
          <div><span className="text-[#98A2B3]">状态</span><p className="mt-1 text-[#344054]">会议材料服务已接收</p></div>
        </div>
        <div className="mt-5 border-t border-[#E7EAF0] pt-4">
          <p className="text-[8px] font-semibold text-[#526176]">锁定成果</p>
          <div className="mt-2 space-y-1.5">
            {files.map((file) => (
              <div key={file} className="flex items-center gap-2 rounded-lg border border-[#E4E8EF] px-3 py-2">
                <FileCheck2 className="size-3.5 text-[#5573D1]" />
                <span className="flex-1 text-[8.5px] text-[#475467]">{file}</span>
                <LockKeyhole className="size-3 text-[#8B96A7]" />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-[#F4F6F9] px-3 py-2.5">
          <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-[#667085]" />
          <p className="text-[8px] leading-4 text-[#667085]">
            本次会议服务版保持锁定。后续批注会创建协同修订草稿，不覆盖本记录。
          </p>
        </div>
      </div>
    </article>
  );
}

export function AnnualBrowserPage({ address }: { address: string }) {
  if (address === SHENZHEN_JUSTICE_PLAN_URL) {
    return <OfficialSourcePage type="shenzhen" />;
  }
  if (address === GUANGDONG_JUSTICE_POINTS_URL) {
    return <OfficialSourcePage type="guangdong" />;
  }
  if (address.includes("/preview/annual/evidence/conflict")) {
    return <ConflictPage />;
  }
  if (address.includes("meeting.demo.sz.gov.cn/materials")) {
    return <MeetingServicePage />;
  }
  return null;
}
