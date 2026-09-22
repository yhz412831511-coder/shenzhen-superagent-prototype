import { ShieldCheck, LockKeyhole, UserRoundCheck, Waypoints } from 'lucide-react';
import { riskPolicies, type RiskTier } from '../../../shared/risk-policy.ts';
import { records, type State } from './data.ts';
import { Panel } from './ui.tsx';

const icons = {
  低: ShieldCheck,
  中: Waypoints,
  高: UserRoundCheck,
  红线: LockKeyhole,
};

export function RiskPolicyPanel({
  state,
  selected,
  onSelect,
}: {
  state: State;
  selected: string;
  onSelect: (level: RiskTier | 'all') => void;
}) {
  const checks = state.safety?.checks ?? [];
  return (
    <Panel
      title="风险分级与控制"
      aside={<span>发布版本联动任务执行</span>}
    >
      <p className="risk-policy-intro">
        同一套等级用于规则发布、任务执行和审计记录。高风险需要本人确认；红线不接受确认或单位级例外。
      </p>
      <div className="risk-policy-grid">
        {(Object.keys(riskPolicies) as RiskTier[]).map((level) => {
          const policy = riskPolicies[level];
          const Icon = icons[level];
          const ruleCount = records(state, 'rules').filter(
            (rule) =>
              rule.fields.riskLevel === level && rule.status === '已生效',
          ).length;
          const checkLabel = level === '红线' ? '红线' : level + '风险';
          const count = checks.filter((check) => check.risk === checkLabel).length;
          return (
            <button
              type="button"
              key={level}
              className={'risk-policy-card ' + policy.tone + (selected === level ? ' selected' : '')}
              aria-pressed={selected === level}
              onClick={() => onSelect(selected === level ? 'all' : level)}
            >
              <span className="risk-policy-icon"><Icon size={18} /></span>
              <span className="risk-policy-title">
                <strong>{policy.label}</strong>
                <small>{policy.control}</small>
              </span>
              <b>{ruleCount}<small> 条已生效</small></b>
              <p>{policy.summary}</p>
              <footer>本期命中 {count} 次</footer>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
