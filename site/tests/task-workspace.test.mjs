import test from 'node:test';
import assert from 'node:assert/strict';
import {openBrowserTarget,navigateTab,annotationsText,validSandboxPath,safeFilename} from '../app/task-workspace-model.ts';
import {initialWorkspace,workspaceReducer} from '../app/fiscal-domain.ts';
test('browser targets reuse tabs and navigation discards forward history',()=>{
  const a={kind:'system',id:'payment'}, b={kind:'system',id:'pm'};
  const first=openBrowserTarget([],a);
  assert.equal(openBrowserTarget(first.tabs,a).tabs.length,1);
  const second=navigateTab(first.tabs[0],b);
  assert.equal(second.cursor,1);
  const back={...second,cursor:0};
  const next=navigateTab(back,{kind:'artifact',id:'new'});
  assert.deepEqual(next.history,[a,{kind:'artifact',id:'new'}]);
});
test('annotations retain provenance and do not execute story commands',()=>{
  const state=initialWorkspace();
  const task=state.memory.tasks[0];
  const before=structuredClone(state.flows);
  const text=annotationsText([{id:'one',target:{kind:'system',id:'pm'},title:'项目管理',version:'v1',mode:'元素',quote:'提交',location:'提交按钮',text:'请确认提交要求',x:0,y:0,width:1,height:20}]);
  const result=workspaceReducer(state,{type:'workspace-feedback',taskId:task.id,text});
  assert.deepEqual(result.flows,before);
  assert.match(result.memory.tasks.find(t=>t.id===task.id).messages.at(-2).text,/项目管理（v1）/);
  assert.match(text,/提交按钮/);
});
test('task paths reject traversal and sanitization preserves Chinese names',()=>{
  assert.equal(validSandboxPath('/task/材料/a.txt'),true);
  for(const path of ['/etc/passwd','/task/../b','/task/./b','/task/a\0b'])assert.equal(validSandboxPath(path),false);
  assert.equal(safeFilename('../资料/a.txt'),'__资料_a.txt');
});
