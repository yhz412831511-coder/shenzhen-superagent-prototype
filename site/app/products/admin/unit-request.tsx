'use client';
import { useState } from 'react';
export function UnitRequest({
  page,
  onSubmit,
}: {
  page: 'applications' | 'tickets';
  onSubmit: (amount: number, purpose: string) => void;
}) {
  const [amount, setAmount] = useState(10),
    [purpose, setPurpose] = useState(''),
    [sent, setSent] = useState(false),
    [error, setError] = useState('');
  return (
    <section className="gov-panel" style={{ marginBottom: 18 }}>
      <h3>{page === 'applications' ? '提交本单位席位需求' : '提交服务问题'}</h3>
      <div className="gov-form">
        {page === 'applications' && (
          <label>
            申请数量
            <input
              type="number"
              min={1}
              max={500}
              value={amount}
              onChange={(e) => {
                setAmount(Number(e.target.value));
                setSent(false);
              }}
            />
          </label>
        )}
        <label>
          用途或问题说明
          <input
            value={purpose}
            onChange={(e) => {
              setPurpose(e.target.value);
              setSent(false);
            }}
            placeholder="说明使用岗位、工作用途或具体问题"
          />
        </label>
      </div>
      <div className="gov-actions">
        <button
          disabled={sent}
          onClick={() => {
            try {
              onSubmit(amount, purpose);
              setSent(true);
              setError('');
            } catch (e) {
              setError(String(e instanceof Error ? e.message : e));
            }
          }}
        >
          {sent ? '已提交，等待市级处理' : '提交本单位申请'}
        </button>
      </div>
      {error && (
        <p role="alert" className="gov-error">
          {error}
        </p>
      )}
      <p>提交固定在本单位范围，不能自行审批或开通席位。</p>
    </section>
  );
}
