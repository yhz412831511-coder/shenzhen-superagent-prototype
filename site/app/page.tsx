'use client';
import { MemoryProvider } from './memory-store';
import { FiscalWorkbench } from './fiscal-workbench';
import { AppearanceProvider } from './appearance';
export default function Page() {
  return (
    <AppearanceProvider>
      <MemoryProvider>
        <FiscalWorkbench />
      </MemoryProvider>
    </AppearanceProvider>
  );
}
