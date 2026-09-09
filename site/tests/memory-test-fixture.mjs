import { initialMemoryState } from '../app/memory-fixtures.ts';
export function memoryTestState(now) {
  const date = new Date(now).toISOString();
  const tasks = [
    {
      id: 'memory-onboarding',
      title: '记忆连续性测试事项',
      context: '专项材料核对',
      type: 'work',
      planIds: [],
      grants: [],
      pending: [],
      uses: [],
      savedScroll: 0,
      messages: [
        {
          id: 'onboarding',
          role: 'user',
          text: '我们这里的“材料齐套”指本次清单要求的材料及其版本已齐备，不代表资金用途已经核实。适用于专项材料核对。下一阶段先梳理材料缺口，再开展后续核查。',
          at: date,
        },
        {
          id: 'intro',
          role: 'assistant',
          text: '已记录本事项对“材料齐套”的解释，并将下一阶段安排整理为工作规划。可以在记忆中查看来源和适用语境。业务结论仍需依据原始材料核实。',
          at: date,
        },
      ],
    },
  ];
  const state = initialMemoryState(now);
  state.tasks = tasks;
  for (const memory of state.memories)
    for (const revision of memory.revisions) {
      if (revision.source.label === '个人材料记录（原对话已删除）') {
        revision.source.taskId = 'memory-onboarding';
        revision.source.eventId = 'onboarding';
      }
    }
  return state;
}
