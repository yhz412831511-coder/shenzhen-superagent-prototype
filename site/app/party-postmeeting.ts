import type { PartyAction, PartyEffect, PartyFlow } from './party-domain';
import { MEETING_COMPARISON } from './shared/story-corpus.ts';
/** Post-meeting decisions append new records. A submission is never an approval. */
export function postMeetingTransition(
  previous: PartyFlow,
  action: PartyAction,
): { flow: PartyFlow; effects: PartyEffect[] } | undefined {
  const eligible = [
    'sent',
    'internal',
    'minutes',
    'minutes-confirm',
    'minutes-submitted',
    'minutes-sending',
    'minutes-failed',
    'minutes-unknown',
    'closed',
  ];
  if (!eligible.includes(previous.stage)) return;
  const isNotes =
    action.type === 'say' &&
    /会后|会议结果|会议决定|纪要|补充记录/.test(action.text);
  const isApproval =
    action.type === 'say' && /已审定纪要|审定依据/.test(action.text);
  if (
    !isNotes &&
    !isApproval &&
    ![
      'minutes-review',
      'minutes-submit',
      'minutes-cancel',
      'minutes-finish',
      'minutes-query',
      'minutes-retry',
    ].includes(action.type)
  )
    return;
  const flow = structuredClone(previous);
  const effects: PartyEffect[] = [];
  const message = (text: string, role: 'assistant' | 'user' = 'assistant') =>
    effects.push({ type: 'message', role, text, anchor: role === 'assistant' });
  const settle = (text: string) => {
    flow.decisions.push({
      anchor: flow.anchor,
      label: text,
      summary: text,
      version: flow.minutesVersion || 1,
    });
  };
  if (
    ['minutes-sending', 'minutes-unknown'].includes(flow.stage) &&
    action.type === 'say'
  ) {
    flow.feedback = '请先核对当前提交结果，未知期间不能改写或重发。';
    return { flow, effects };
  }
  const submitted = () => {
    flow.stage = 'minutes-submitted';
    flow.minutesReceipt = `LOCAL-OA-${flow.id}-minutes-v${flow.minutesVersion}`;
    message(
      `纪要v${flow.minutesVersion}已取得本地受理记录，等待审定。提交结果不代表会议决定生效，请继续补充已审定纪要的依据编号和原文。`,
    );
    effects.push({
      type: 'remember',
      text: `第14次纪要v${flow.minutesVersion}已获得合成提交受理记录，新增责任仍为候选。`,
    });
  };
  if (action.type === 'minutes-finish' && flow.stage === 'minutes-sending') {
    if (flow.outcome === 'failure') {
      flow.stage = 'minutes-failed';
      message('纪要提交明确失败。原送审稿保留，重试须重新确认。');
    } else if (flow.outcome === 'unknown') {
      flow.stage = 'minutes-unknown';
      message('纪要提交结果未知，请查询原请求。未标记成功，不直接重发。');
    } else submitted();
  } else if (
    action.type === 'minutes-query' &&
    flow.stage === 'minutes-unknown'
  ) {
    if (flow.unavailable.includes('oa')) {
      flow.feedback = 'OA当前不可用，原请求保持未知。';
      return { flow, effects };
    }
    settle('查询原纪要提交请求');
    submitted();
  } else if (
    action.type === 'minutes-retry' &&
    flow.stage === 'minutes-failed'
  ) {
    settle('重新核对纪要提交');
    flow.stage = 'minutes-confirm';
    message('请重新确认当前纪要版本与接收方。');
  } else if (isApproval && action.type === 'say') {
    if (flow.stage !== 'minutes-submitted') {
      flow.feedback = '请先形成并审阅纪要；审定依据必须关联已提交版本。';
      return { flow, effects };
    }
    const source = /(?:依据|编号)[：:：\s]+([^\n。]+)/.exec(action.text)?.[1];
    if (!source || action.text.trim().length < 30) {
      flow.feedback =
        '请补充已审定纪要的依据编号和决定原文；仅说“已审定”不足以认定新责任。';
      return { flow, effects };
    }
    settle('审定依据已补充');
    message(action.text, 'user');
    flow.stage = 'closed';
    flow.approvalSource = source;
    message(
      '已关联你提供的审定依据，原提交回执保持原样。依据尚未与源系统核验；责任、期限按纪要原文保留，不自行扩展。跟踪清单和工作续接背景已更新。',
    );
    effects.push({
      type: 'artifact',
      name: '第14次党组会承诺跟踪清单',
      body: `# 承诺跟踪清单\n\n## 审定依据\n${action.text}\n\n## 跟踪条件\n按上述决定原文的责任主体、期限和验收条件跟踪。未明确的字段保留待核，不自动创建正式督办。\n\n## 来源状态\n本人提供，源系统待核验；关联纪要 v${flow.minutesVersion} 与提交结果 ${flow.minutesReceipt}。\n\n## 本次沿用与改进\n${MEETING_COMPARISON.map((x) => `- ${x.step}：${x.after}`).join('\n')}`,
      version: flow.minutesVersion,
    });
    effects.push({
      type: 'remember',
      text: `第14次会议审定依据由本人提供：${source}，源系统待核验。纪要v${flow.minutesVersion}；依据原文记录承诺，未发布组织方法。`,
    });
  } else if (isNotes && action.type === 'say') {
    if (action.text.trim().length < 25) {
      flow.feedback =
        '请提供具体会议记录，包括议题结论、责任分工及期限；不能仅凭“生成纪要”补造会议决定。';
      return { flow, effects };
    }
    settle('会议结果已补充');
    message(action.text, 'user');
    flow.minutesNotes = action.text;
    flow.minutesVersion = (flow.minutesVersion || 0) + 1;
    flow.stage = 'minutes';
    flow.approvalSource = undefined;
    message(
      `已整理纪要 v${flow.minutesVersion}，请预览并核对。新责任和期限仍以你提供的原文为准；提交只送审，不代表审定。`,
    );
    effects.push({
      type: 'artifact',
      minutes: true,
      version: flow.minutesVersion,
      name: '第14次党组会会议纪要（送审稿）',
      body: `# 第14次党组会会议纪要（送审稿）\n\n版本：v${flow.minutesVersion}\n\n## 会议记录原文\n${action.text}\n\n## 会前背景\n第13次验收记录已更正，技术验收通过不代表手续齐套。会前未核实的统计口径不自动转为会议结论。\n\n## 审阅事项\n核对议题结论、责任主体、期限和依据。未明确的字段保留待补，不补造责任。\n\n## 生效边界\n本稿来源于本人补充记录，尚未审定。送审与正式决定生效分开记录；会前通知版本不被改写。`,
    });
  } else if (action.type === 'minutes-review' && flow.stage === 'minutes') {
    settle('纪要已审阅');
    flow.stage = 'minutes-confirm';
    message(
      `准备提交纪要 v${flow.minutesVersion} 至办公室会务审核岗，仅用于审阅。请单独确认本次提交。`,
    );
  } else if (
    action.type === 'minutes-cancel' &&
    flow.stage === 'minutes-confirm'
  ) {
    settle('取消本次纪要提交');
    flow.stage = 'minutes';
    message('纪要保留为送审稿，未发出提交请求。');
  } else if (
    action.type === 'minutes-submit' &&
    flow.stage === 'minutes-confirm'
  ) {
    if (!flow.selected.includes('oa') || flow.unavailable.includes('oa')) {
      flow.feedback = 'OA未选择或当前不可用，未提交。请使用授权途径处理。';
      return { flow, effects };
    }
    settle('本次纪要提交已确认');
    flow.stage = 'minutes-sending';
    message('纪要提交请求已发出，正在核对受理结果。请勿重复提交。');
  } else return { flow: previous, effects: [] };
  flow.feedback = '';
  flow.revision++;
  return { flow, effects };
}
