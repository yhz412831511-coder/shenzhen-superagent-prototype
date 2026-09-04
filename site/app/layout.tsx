import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: '深圳政务超级智能体 · 统一任务工作台',
  description: '面向政务工作人员的可信智能任务工作台仿真原型',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
