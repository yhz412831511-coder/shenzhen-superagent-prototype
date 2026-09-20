'use client';
import { useContext, useEffect, useReducer, type ReactNode } from 'react';
import { initialWorkspace, workspaceReducer } from './fiscal-domain';
import { PARTY_PROJECT } from './party-domain';
import { retiredHistoryIds } from './story-history';
import { WorkspaceContext as Context } from './workspace-context';
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workspaceReducer, undefined, () =>
    initialWorkspace(),
  );
  useEffect(() => {
    if (state.memory.tasks.some((t) => retiredHistoryIds.includes(t.id))) {
      dispatch({ type: 'remove-duplicate-history' });
    }
    // Group conversations already open when this update is loaded, without resetting work.
    for (const task of state.memory.tasks) {
      if (
        (task.id === 'party-history' || state.party[task.id]) &&
        !state.folderTasks[task.id]
      ) {
        dispatch({ type: 'folder', name: PARTY_PROJECT, taskId: task.id });
      }
    }
  }, [state.memory.tasks, state.party, state.folderTasks]);
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
  useEffect(() => {
    const timers = Object.values(state.party)
      .filter(
        (flow) =>
          !flow.stopped &&
          ['collecting', 'sending', 'minutes-sending'].includes(flow.stage),
      )
      .map((flow) =>
        setTimeout(
          () =>
            dispatch({
              type: 'party',
              action: {
                type:
                  flow.stage === 'collecting'
                    ? 'collect-finish'
                    : flow.stage === 'minutes-sending'
                      ? 'minutes-finish'
                      : 'send-finish',
                taskId: flow.id,
                revision: flow.revision,
              },
            }),
          850,
        ),
      );
    return () => timers.forEach(clearTimeout);
  }, [state.party]);
  return (
    <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
  );
}
export function useWorkspace() {
  const s = useContext(Context);
  if (!s) throw Error('WorkspaceProvider required');
  return s;
}
