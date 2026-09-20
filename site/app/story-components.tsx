'use client';
import { useWorkspace } from './workspace-store';
export function StoryAttachment({
  taskId,
  messageId,
  onOpen,
}: {
  taskId: string;
  messageId: string;
  onOpen: (target: { kind: 'artifact'; id: string }) => void;
}) {
  const { state, dispatch } = useWorkspace();
  const r = state.storyRounds[taskId];
  if (!r || r.anchor !== messageId) return null;
  const act = (choice: 'prepare' | 'submit' | 'cancel' | 'keep') =>
    dispatch({ type: 'story-choice', taskId, version: r.version, choice });
  return (
    <div className="party-actions" aria-label="本轮成果操作">
      <button
        className="party-button"
        onClick={() => onOpen({ kind: 'artifact', id: r.artifact })}
      >
        预览本轮成果 v{r.version}
      </button>
      {r.stage === 'review' && (
        <>
          <button className="party-button" onClick={() => act('keep')}>
            保留工作稿
          </button>
          {r.receiver && (
            <button
              className="party-button primary"
              onClick={() => act('prepare')}
            >
              审阅完成，准备提交
            </button>
          )}
        </>
      )}
      {r.stage === 'confirm' && (
        <>
          <button
            className="party-button primary"
            onClick={() => act('submit')}
          >
            确认本次提交
          </button>
          <button className="party-button" onClick={() => act('cancel')}>
            暂不提交
          </button>
        </>
      )}
    </div>
  );
}
