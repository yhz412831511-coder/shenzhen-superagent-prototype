'use client';

import { useState } from 'react';
import {
  changeGovernance,
  governanceActionNames,
  initialGovernance,
  mayManage,
  type AdminRole,
  type GovernanceAction,
} from './governance';
import { memoryCases } from '../../shared/story-corpus';
import type { Audit } from './admin/data';
import './governance.css';

let retained = initialGovernance();
function retain(next: ReturnType<typeof initialGovernance>) {
  retained = next;
}

export function GovernanceView({
  role,
  onAudit,
}: {
  page: string;
  role: AdminRole;
  onAudit: (event: Audit) => void;
}) {
  const [state, setState] = useState(() => retained);
  const editable = mayManage(role, 'intake');
  const act = (type: GovernanceAction['type']) => {
    const next = changeGovernance(state, {
      type,
      revision: state.revision,
      role,
    });
    if (next.revision !== state.revision) {
      const event = next.events[0];
      onAudit({
        id: `GOV-${next.revision}`,
        time: event.at,
        record: event.object,
        page: 'intake',
        action: governanceActionNames[event.action] || event.action,
        result: event.result,
        detail: `${event.object}；本地治理操作，固定案例不等于当前业务日志。`,
        actor: role,
        unit: 'u1',
      });
    }
    retain(next);
    setState(next);
  };
  const actions = (list: [GovernanceAction['type'], string][]) =>
    editable ? (
      <div className="gov-actions">
        {list.map(([key, label]) => (
          <button key={key} onClick={() => act(key)}>
            {label}
          </button>
        ))}
      </div>
    ) : (
      <p className="gov-subtle">当前岗位只可查看此范围。</p>
    );

  return (
    <div className="gov-view">
      {state.error && (
        <p role="alert" className="gov-error">
          {state.error}
        </p>
      )}
      <div className="gov-lead">
        <div>
          <small>个人贡献 / PS-PAYMENT-v1</small>
          <h2>支付核查方法快照</h2>
          <p>
            提交人为杨XX；快照保留提交当时的内容和授权。本人的后续v2修订不覆盖此快照。
          </p>
        </div>
        <span className="gov-badge">{state.skill}</span>
      </div>
      <div className="gov-two">
        <section className="gov-panel">
          <h3>提交内容与来源</h3>
          <p>
            先核对用途与合同标的，再确认资金性质、支付对象和适用依据。关键词只作疑点线索，不作最终裁决。
          </p>
          <dl>
            <dt>来源对话</dt>
            <dd>财政支付审查 · 2026-09-03</dd>
            <dt>原始所有者</dt>
            <dd>杨XX · 个人方法v1</dd>
            <dt>组织使用范围</dt>
            <dd>市政务服务管理局财政核查辅助</dd>
            <dt>排除内容</dt>
            <dd>个人支付原文、其他人的私有记忆、未授权附件</dd>
          </dl>
        </section>
        <section className="gov-panel">
          <h3>独立组织版本</h3>
          <p>
            当前历史版本：ORG-ADOPT-01 /
            v1.0。下方流程处理一份待更新快照；发布后形成独立v2.0，旧版本继续留痕。
          </p>
          <p>
            本轮版本：<b>{state.skillVersion}</b>
          </p>
          {actions(
            state.skill === '待接收' || state.skill === '已退回'
              ? [['receive', '接收提交快照']]
              : state.skill === '待评测'
                ? [
                    ['skill-test', '执行适用性与安全评测'],
                    ['return', '退回补充'],
                  ]
                : state.skill === '待审批'
                  ? [
                      ['approve', '批准组织使用范围'],
                      ['return', '退回补充'],
                    ]
                  : state.skill === '已批准'
                    ? [['skill-publish', '发布独立组织版本']]
                    : [],
          )}
          <details>
            <summary>评测与授权依据</summary>
            <p>
              固定案例检查：术语误判纠正、缺少依据不裁决、提交权限独立。3/3通过后进入审批；无敏感明细，授权只覆盖已提交方法快照。
            </p>
            <p>
              已有组织记忆：
              {memoryCases.find((item) => item.id === 'fiscal-org')?.source}
            </p>
          </details>
        </section>
      </div>
    </div>
  );
}
