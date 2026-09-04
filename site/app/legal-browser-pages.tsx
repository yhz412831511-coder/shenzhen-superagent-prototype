"use client";

import {
  CheckCircle2,
  FileCheck2,
  FileText,
  Landmark,
  LockKeyhole,
  Scale,
  ShieldCheck,
} from "lucide-react";

const SHENZHEN_LEGISLATION_URL =
  "https://www.sz.gov.cn/szsrmzfxxgk/zc/gz/content/post_9452773.html";
const ADMIN_PENALTY_URL =
  "https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/tzsbs/art/2023/art_3712fbfaaed942b3b6b66f14d5288723.html";

export const legalBrowserResources = {
  legislation: {
    id: "legal-source-legislation",
    title: "深圳市人民政府立法工作规程",
    address: SHENZHEN_LEGISLATION_URL,
  },
  penalty: {
    id: "legal-source-penalty",
    title: "中华人民共和国行政处罚法",
    address: ADMIN_PENALTY_URL,
  },
  conflict: {
    id: "legal-source-conflict",
    title: "演示材料冲突对照",
    address: "http://127.0.0.1:3000/preview/legal/evidence/conflict",
  },
  oa: {
    id: "legal-oa-archive",
    title: "深圳OA · 立法审查事项",
    address: "https://oa.demo.sz.gov.cn/legal/archive/LS-2026-DEMO-027",
  },
} as const;

export type LegalBrowserResource =
  (typeof legalBrowserResources)[keyof typeof legalBrowserResources];

export function legalResourceForSource(
  source: string,
): LegalBrowserResource | null {
  if (source.includes("立法工作规程")) {
    return legalBrowserResources.legislation;
  }
  if (source.includes("行政处罚法")) {
    return legalBrowserResources.penalty;
  }
  if (
    source.includes("部门意见采纳表") ||
    source.includes("协调会议纪要") ||
    source.includes("演示材料")
  ) {
    return legalBrowserResources.conflict;
  }
  return null;
}

function OfficialSourcePage({
  type,
}: {
  type: "legislation" | "penalty";
}) {
  const legislation = type === "legislation";
  const matches = legislation
    ? [
        ["送审材料", "送审稿、说明、意见采纳情况和依据材料应当一并提交；重大意见分歧应单独说明。"],
        ["意见协调", "相关单位存在较大意见分歧时，应当组织协调；仍不能一致的，提请市政府协调。"],
        ["审查要求", "内容应当合法合理，重要制度和措施具备可行性、可操作性，并符合立法技术规范。"],
      ]
    : [
        ["法定职权", "行政处罚由具有行政处罚权的行政机关在法定职权范围内实施。"],
        ["电子证据", "电子技术监控记录需要经过法制和技术审核，未经审核或不符合要求的不能作为处罚证据。"],
        ["程序权利", "作出处罚决定前，应当告知事实、理由和依据，并保障陈述、申辩等权利。"],
      ];

  return (
    <article className="w-full max-w-[720px] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-[0_12px_32px_rgba(16,24,40,.07)]">
      <div className="flex items-center gap-3 border-b border-[#E5E9F0] bg-[#FAFBFD] px-4 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#EAF0FF] text-[#4967C5]">
          {legislation ? <Landmark className="size-4" /> : <Scale className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold text-[#2E3A50]">
            {legislation
              ? "深圳市人民政府立法工作规程（试行）"
              : "中华人民共和国行政处罚法"}
          </p>
          <p className="mt-0.5 text-[7.5px] text-[#98A2B3]">
            {legislation ? "深圳市人民政府官方发布" : "国家市场监督管理总局官方发布"}
          </p>
        </div>
        <span className="rounded-md bg-[#EAF7F0] px-2 py-1 text-[7.5px] font-medium text-[#187654]">
          官方来源
        </span>
      </div>
      <div className="px-5 py-5">
        <div className="flex items-center gap-2 rounded-lg border border-[#DDE5F3] bg-[#F7F9FD] px-3 py-2 text-[8px] text-[#60708A]">
          <ShieldCheck className="size-3.5 text-[#4E6CC6]" />
          仅展示与当前任务直接相关的命中范围；完整原文可通过地址栏访问。
        </div>
        <div className="mt-4 space-y-2.5">
          {matches.map(([title, summary], index) => (
            <section
              key={title}
              className="rounded-lg border border-[#E3E8F0] px-3.5 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full bg-[#EDF2FF] text-[7px] font-semibold text-[#4867C3]">
                  {index + 1}
                </span>
                <h3 className="text-[9px] font-semibold text-[#344054]">{title}</h3>
              </div>
              <p className="mt-2 text-[8.5px] leading-[1.7] text-[#5C697C]">
                {summary}
              </p>
            </section>
          ))}
        </div>
        {!legislation ? (
          <p className="mt-4 rounded-lg bg-[#FFF8EA] px-3 py-2 text-[7.8px] leading-4 text-[#8A5A14]">
            “AI识别只作为辅助线索”是依据法定主体、事实查明、证据审核和程序权利形成的任务归纳，不是法律原文。
          </p>
        ) : null}
      </div>
    </article>
  );
}

function ConflictEvidencePage() {
  return (
    <article className="w-full max-w-[720px] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-[0_12px_32px_rgba(16,24,40,.07)]">
      <div className="flex items-center gap-3 border-b border-[#E5E9F0] bg-[#FAFBFD] px-4 py-3">
        <span className="grid size-8 place-items-center rounded-lg bg-[#FFF4DF] text-[#B16D0D]">
          <FileText className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-[#2E3A50]">同一事项的材料表述不一致</p>
          <p className="mt-0.5 text-[7.5px] text-[#98A2B3]">任务内已授权附件 · 只读对照</p>
        </div>
        <span className="rounded-md bg-[#FFF0D4] px-2 py-1 text-[7.5px] font-medium text-[#9B620D]">
          演示材料
        </span>
      </div>
      <div className="p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <section className="rounded-lg border border-[#DFE5EE] p-3.5">
            <p className="text-[8px] font-semibold text-[#526176]">部门意见采纳表.xlsx</p>
            <p className="mt-1 text-[7.5px] text-[#98A2B3]">“职责分工”行 · 演示材料</p>
            <p className="mt-3 text-[9px] leading-5 text-[#344054]">处理状态：已协调一致</p>
          </section>
          <section className="rounded-lg border border-[#E7C786] bg-[#FFFCF5] p-3.5">
            <p className="text-[8px] font-semibold text-[#725018]">协调会议纪要.pdf</p>
            <p className="mt-1 text-[7.5px] text-[#A57A35]">第3页 · 演示材料</p>
            <p className="mt-3 text-[9px] leading-5 text-[#5F451B]">处理状态：仍需进一步确认</p>
          </section>
        </div>
        <div className="mt-4 rounded-lg border border-[#D8E2F5] bg-[#F6F8FD] px-3.5 py-3">
          <p className="text-[8px] font-semibold text-[#4C65AA]">智能体处理</p>
          <p className="mt-1.5 text-[8.5px] leading-4 text-[#526176]">
            不判断哪个部门“真正同意”，暂列为需协调事项，并把两处定位一并带入用户确认。
          </p>
        </div>
      </div>
    </article>
  );
}

function OaArchivePage() {
  const files = ["审查意见.docx", "重点问题清单.xlsx", "意见处理对照.xlsx"];
  return (
    <article className="w-full max-w-[720px] overflow-hidden rounded-xl border border-[#D7DEE8] bg-white shadow-[0_12px_32px_rgba(16,24,40,.07)]">
      <div className="flex items-center gap-3 border-b border-[#DDE5F1] bg-[#F5F8FD] px-4 py-3">
        <span className="grid size-8 place-items-center rounded-lg bg-[#E8F0FF] text-[#315DB8]">
          <Landmark className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-[#25344D]">深圳OA · 立法审查事项</p>
          <p className="mt-0.5 text-[7.5px] text-[#7B899D]">政务外网 · 演示连接</p>
        </div>
        <span className="flex items-center gap-1 rounded-md bg-[#EAF7F0] px-2 py-1 text-[7.5px] font-medium text-[#187654]">
          <CheckCircle2 className="size-3" /> 已归档
        </span>
      </div>
      <div className="p-5">
        <div className="grid gap-x-5 gap-y-3 text-[8.5px] sm:grid-cols-2">
          <div><span className="text-[#98A2B3]">事项编号</span><p className="mt-1 text-[#344054]">LS-2026-DEMO-027</p></div>
          <div><span className="text-[#98A2B3]">执行身份</span><p className="mt-1 text-[#344054]">林思远 · 综合处经办岗</p></div>
          <div><span className="text-[#98A2B3]">办理结果</span><p className="mt-1 text-[#344054]">审查材料已归档</p></div>
          <div><span className="text-[#98A2B3]">归档时间</span><p className="mt-1 text-[#344054]">今天 10:42</p></div>
        </div>
        <div className="mt-5 border-t border-[#E7EAF0] pt-4">
          <p className="text-[8px] font-semibold text-[#526176]">归档成果</p>
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
            OA归档版保持只读。继续修改时，超级智能体会创建新的工作草稿，不覆盖本次归档记录。
          </p>
        </div>
      </div>
    </article>
  );
}

export function LegalBrowserPage({ address }: { address: string }) {
  if (address === SHENZHEN_LEGISLATION_URL) {
    return <OfficialSourcePage type="legislation" />;
  }
  if (address === ADMIN_PENALTY_URL) {
    return <OfficialSourcePage type="penalty" />;
  }
  if (address.includes("/preview/legal/evidence/conflict")) {
    return <ConflictEvidencePage />;
  }
  if (address.includes("oa.demo.sz.gov.cn/legal/archive")) {
    return <OaArchivePage />;
  }
  return null;
}
