'use client';
import { type ReactNode } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { type Field } from './business';
export function Pick({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
  label: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v !== null) onChange(v);
      }}
    >
      <SelectTrigger className="admin-select" aria-label={label}>
        <SelectValue>
          {options
            .map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
            .find((o) => o.value === value)?.label ?? value}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => {
          const item = typeof o === 'string' ? { value: o, label: o } : o;
          return (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  const t = typeof children === 'string' ? children : '';
  const tone = /失败|异常|未通过|高危|拒绝/.test(t)
    ? 'red'
    : /待|执行中|处理中|暂停|隔离|停用|草稿|提醒|接近/.test(t)
      ? 'amber'
      : /通过|正常|成功|完成|生效|上线|开通|发布|启用|可用|已关闭/.test(t)
        ? 'green'
        : 'gray';
  return (
    <span className={'status-badge ' + tone}>
      <i />
      {children}
    </span>
  );
}
export function Panel({
  title,
  aside,
  children,
  className = '',
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={'panel ' + className}>
      <div className="panel-title">
        <h2>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
export function Stat({
  label,
  value,
  unit,
  note,
  onClick,
}: {
  label: string;
  value: string | number;
  unit?: string;
  note?: ReactNode;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span>{label}</span>
      <strong>
        {value}
        <small>{unit}</small>
      </strong>
      <em>{note}</em>
    </>
  );
  return onClick ? (
    <button className="metric clickable" onClick={onClick}>
      {inner}
    </button>
  ) : (
    <div className="metric">{inner}</div>
  );
}
export function Fields({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="field-grid">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
export function FormFields({
  fields,
  values,
  onChange,
}: {
  fields: Field[];
  values: Record<string, string>;
  onChange: (k: string, v: string) => void;
}) {
  return (
    <div className="form-fields">
      {fields.map((f) => (
        <div className="form-field" key={f.key}>
          <label htmlFor={'field-' + f.key}>
            {f.label}
            {f.required && <span className="required"> *</span>}
          </label>
          {f.type === 'select' ? (
            <Pick
              label={f.label}
              value={values[f.key] ?? ''}
              onChange={(v) => onChange(f.key, v)}
              options={f.options ?? []}
            />
          ) : f.type === 'multi' ? (
            <div className="check-options">
              {f.options?.map((v) => (
                <label key={v}>
                  <Checkbox
                    checked={(values[f.key] ?? '').split('、').includes(v)}
                    onCheckedChange={(checked) => {
                      const old = (values[f.key] ?? '')
                        .split('、')
                        .filter(Boolean);
                      onChange(
                        f.key,
                        (checked
                          ? [...old, v]
                          : old.filter((o) => o !== v)
                        ).join('、'),
                      );
                    }}
                  />
                  {v}
                </label>
              ))}
            </div>
          ) : f.type === 'textarea' ? (
            <Textarea
              id={'field-' + f.key}
              rows={4}
              value={values[f.key] ?? ''}
              onChange={(e) => onChange(f.key, e.target.value)}
            />
          ) : (
            <Input
              id={'field-' + f.key}
              type={f.type === 'number' ? 'number' : 'text'}
              min={f.type === 'number' ? 0 : undefined}
              value={values[f.key] ?? ''}
              onChange={(e) => onChange(f.key, e.target.value)}
            />
          )}{' '}
          {f.hint && <small>{f.hint}</small>}
        </div>
      ))}
    </div>
  );
}
export const fmt = (n: number) => n.toLocaleString('zh-CN');
export const token = (n: number) =>
  n >= 10000 ? (n / 10000).toFixed(1) + '万' : fmt(n);
