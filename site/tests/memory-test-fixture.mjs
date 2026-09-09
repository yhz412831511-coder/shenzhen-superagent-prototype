import { initialMemoryState } from '../app/memory-fixtures.ts';

export function memoryTestState(now) {
  const state = initialMemoryState(now);
  state.tasks = [
    {
      id: 'memory-source-task',
      title: '财政支付审查测试事项',
      context: '财政支付审查 · ERS平台数据库费',
      type: 'work',
      planIds: [],
      grants: [],
      pending: [],
      uses: [],
      savedScroll: 0,
      messages: [
        {
          id: 'source-message',
          role: 'user',
          text: '请结合合同标的和实际用途核对支付备注，不要只凭关键词作出结论。',
          at: new Date(now).toISOString(),
        },
      ],
    },
  ];
  return state;
}
