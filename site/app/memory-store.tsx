'use client';
import { useCallback } from 'react';
import { WorkspaceProvider, useWorkspace } from './workspace-store';
import type { MemoryAction } from './memory-domain';
export const MemoryProvider = WorkspaceProvider;
export function useMemory() {
  const { state, dispatch } = useWorkspace();
  const send = useCallback(
    (action: MemoryAction) => dispatch({ type: 'memory', action }),
    [dispatch],
  );
  return { state: state.memory, dispatch: send };
}
