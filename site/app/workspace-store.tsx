'use client';
import { useContext, useEffect, useReducer, type ReactNode } from 'react';
import { initialWorkspace, workspaceReducer } from './fiscal-domain';
import { WorkspaceContext as Context } from './workspace-context';
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workspaceReducer, undefined, () =>
    initialWorkspace(),
  );
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible')
        dispatch({ type: 'tick', now: Date.now() });
    };
    const timer = setInterval(tick, 30000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
  return (
    <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
  );
}
export function useWorkspace() {
  const s = useContext(Context);
  if (!s) throw Error('WorkspaceProvider required');
  return s;
}
