'use client';
import { useState } from 'react';
import { CalendarClock, ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMemory } from './memory-store';
import { current, eligible, nextSlot, type Schedule } from './memory-domain';
import { actionClass, Field, inputClass } from './memory-page';
export function MemoryReminders({
  onOpenTask,
}: {
  onOpenTask: (id: string) => void;
}) {
  const { state, dispatch } = useMemory();
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('我的工作规划提醒');
  const [cadence, setCadence] = useState<Schedule['cadence']>('weekly');
  const [weekday, setWeekday] = useState(1);
  const [time, setTime] = useState('09:00');
  const [ids, setIds] = useState<string[]>([]);
  const plans = state.memories.filter((m) => {
    const p = current(m).payload;
    return (
      eligible(m, state.now) &&
      p.kind === 'episodic' &&
      p.subtype === 'plan' &&
      !['completed', 'cancelled'].includes(p.progress)
    );
  });
  const open = (c?: Schedule) => {
    setEditing(c?.id || 'new');
    setName(c?.name || '我的工作规划提醒');
    setCadence(c?.cadence || 'weekly');
    setWeekday(c?.weekday ?? 1);
    setTime(c?.time || '09:00');
    setIds(c?.planIds || plans.map((m) => m.id));
  };
  const scheduleLabel = (c: Schedule) =>
    `${{ daily: '每天', weekdays: '工作日', weekly: '每周' }[c.cadence]}${c.cadence === 'weekly' ? '日一二三四五六'[c.weekday] : ''} ${c.time}`;
  return (
    <div className="space-y-5 p-5 lg:p-7 text-[color:var(--ui-text)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[19px] font-semibold">
            <CalendarClock className="size-5 text-[color:var(--ui-brand)]" />
            工作规划提醒
          </h2>
          <p className="mt-2 text-[length:var(--ui-font-control)] text-[color:var(--ui-muted)]">
            按周期汇总需要关注的规划，提醒结果保留为普通任务。
          </p>
        </div>
        <Button
          className={
            actionClass +
            ' bg-[var(--ui-brand)] text-[color:var(--ui-on-brand)]'
          }
          onClick={() => open()}
        >
          <Plus className="size-4" />
          创建提醒
        </Button>
      </div>
      {state.notice && (
        <output className="rounded-lg bg-[var(--ui-brand-soft)] p-3 text-[length:var(--ui-font-control)]">
          {state.notice}
        </output>
      )}
      {editing && (
        <div className="max-w-3xl space-y-4 rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5">
          <h3 className="text-[length:var(--ui-font-body)] font-medium">
            提醒范围与周期
          </h3>
          <Field label="提醒名称">
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="运行周期">
              <select
                className={inputClass}
                value={cadence}
                onChange={(e) => setCadence(e.target.value as typeof cadence)}
              >
                <option value="daily">每天</option>
                <option value="weekdays">工作日</option>
                <option value="weekly">每周</option>
              </select>
            </Field>
            <Field label="运行时间（北京时间）">
              <input
                type="time"
                className={inputClass}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </Field>
            {cadence === 'weekly' && (
              <Field label="星期">
                <select
                  className={inputClass}
                  value={weekday}
                  onChange={(e) => setWeekday(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 0].map((n) => (
                    <option key={n} value={n}>
                      星期{'日一二三四五六'[n]}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-[length:var(--ui-font-control)] font-medium">
              允许本提醒读取的工作规划
            </p>
            {plans.map((m) => (
              <label
                key={m.id}
                className="flex gap-3 rounded-lg border border-[var(--ui-border)] p-3 text-[length:var(--ui-font-control)]"
              >
                <input
                  type="checkbox"
                  checked={ids.includes(m.id)}
                  onChange={(e) =>
                    setIds(
                      e.target.checked
                        ? [...ids, m.id]
                        : ids.filter((id) => id !== m.id),
                    )
                  }
                />
                <span>{current(m).title}</span>
              </label>
            ))}
            {!plans.length && (
              <p className="text-[length:var(--ui-font-control)] text-[color:var(--ui-muted)]">
                请先在情景记忆中确认一项未完成的工作规划。
              </p>
            )}
          </div>
          <p className="text-[length:var(--ui-font-meta)] leading-6 text-[color:var(--ui-muted)]">
            启用后，仅为本人汇总选定范围中的临期、逾期、首次回顾或发生变化的工作规划。不会向其他人员发送消息，也不会自动销项。
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>
              取消
            </Button>
            <Button
              disabled={!ids.length || !name.trim() || !time}
              onClick={() => {
                dispatch({
                  type: 'schedule',
                  id: editing === 'new' ? undefined : editing,
                  schedule: {
                    name,
                    enabled: true,
                    cadence,
                    weekday,
                    time,
                    timezone: 'Asia/Shanghai',
                    planIds: ids,
                  },
                });
                setEditing(null);
              }}
            >
              确认范围并启用
            </Button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {state.schedules.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface)] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-[length:var(--ui-font-body)] font-medium">
                  {c.name}
                </h3>
                <p className="mt-2 text-[length:var(--ui-font-control)] text-[color:var(--ui-muted)]">
                  {scheduleLabel(c)} · {c.enabled ? '已启用' : '已暂停'} ·{' '}
                  {
                    c.planIds.filter((id) => plans.some((m) => m.id === id))
                      .length
                  }
                  项未完成规划
                </p>
                <p className="mt-1 text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
                  {c.enabled
                    ? '下次：' +
                      new Date(nextSlot(c, state.now)).toLocaleString('zh-CN', {
                        timeZone: 'Asia/Shanghai',
                      })
                    : '暂停后不再生成周期提醒'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={actionClass}
                  onClick={() => open(c)}
                >
                  调整
                </Button>
                <Button
                  variant="outline"
                  className={actionClass}
                  onClick={() =>
                    dispatch({
                      type: 'schedule',
                      id: c.id,
                      schedule: { ...c, enabled: !c.enabled },
                    })
                  }
                >
                  {c.enabled ? '暂停' : '启用'}
                </Button>
              </div>
            </div>
            <div className="mt-4 space-y-2 border-t border-[var(--ui-border)] pt-3">
              {c.runs.map((id) => {
                const t = state.tasks.find((t) => t.id === id);
                return t ? (
                  <button
                    key={id}
                    onClick={() => onOpenTask(id)}
                    className="flex w-full items-center justify-between rounded-lg bg-[var(--ui-canvas)] p-3 text-left text-[length:var(--ui-font-control)]"
                  >
                    {t.title}
                    <ArrowRight className="size-4" />
                  </button>
                ) : null;
              })}
              {!c.runs.length && (
                <p className="text-[length:var(--ui-font-control)] text-[color:var(--ui-muted)]">
                  尚无需要关注的周期运行结果。
                </p>
              )}
            </div>
          </div>
        ))}
        {!state.schedules.length && !editing && (
          <div className="rounded-xl border border-dashed border-[var(--ui-border)] p-10 text-center text-[length:var(--ui-font-control)] text-[color:var(--ui-muted)]">
            尚未启用周期提醒。已确认的规划仍可作为相关任务的上下文。
          </div>
        )}
      </div>
      <details className="text-[length:var(--ui-font-meta)] text-[color:var(--ui-muted)]">
        <summary className="cursor-pointer">运行说明与辅助验证</summary>
        <p className="my-3 leading-6">
          本地页面可见期间检查周期。页面隐藏时暂停，恢复后只检查最近到期周期；浏览器关闭后不运行。辅助时钟只用于验证，不修改电脑时间。
        </p>
        <p className="my-2">
          当前验证时钟：
          {new Date(state.now).toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
          })}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className={actionClass}
            disabled={!state.schedules.some((c) => c.enabled)}
            onClick={() => {
              const next = Math.min(
                ...state.schedules
                  .filter((c) => c.enabled)
                  .map((c) => nextSlot(c, state.now)),
              );
              dispatch({ type: 'advance', ms: next - state.now });
            }}
          >
            推进至下一运行周期
          </Button>
          <Button
            variant="outline"
            className={actionClass}
            onClick={() =>
              dispatch({ type: 'tick', now: state.now - state.offset })
            }
          >
            重复检查当前周期
          </Button>
          <Button
            variant="outline"
            className={actionClass}
            onClick={() => dispatch({ type: 'advance', ms: 86400000 })}
          >
            推进一天
          </Button>
        </div>
      </details>
    </div>
  );
}
