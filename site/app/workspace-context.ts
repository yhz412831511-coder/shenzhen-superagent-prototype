import { createContext, type Dispatch } from 'react';
import type { WorkspaceState, WorkspaceAction } from './fiscal-domain';

// Keep context identity independent of hot-updated business logic.
export const WorkspaceContext = createContext<{
  state: WorkspaceState;
  dispatch: Dispatch<WorkspaceAction>;
} | null>(null);
