'use client';
import { useEffect, useRef, useState, useCallback, type CSSProperties, type ReactNode } from 'react';
import { Plus, X, ArrowLeft, ArrowRight, RotateCw, Maximize2, Minimize2, FolderOpen, Globe2, Terminal, MousePointer2, FileText, Download, Upload, Send, Trash2 } from 'lucide-react';
import { useWorkspace } from './workspace-store';
import { systems, type SystemId } from './fiscal-catalog';
import { ArtifactPreview, Btn, CatalogPage, Monitor, SafetyDetail, SystemPage, type Target, type SystemViewState } from './fiscal-components';
import { annotationsText, navigateTab, openBrowserTarget, safeFilename, targetKey, type Annotation, type BrowserTab, type WorkspaceTarget, type SandboxFile } from './task-workspace-model';
import { updateSession, runSandbox, sessionFor, subscribeSandbox } from './sandbox-client';
import './task-workspace.css';

type DockState = {
  lastRequest?: Target;
  view: '任务概览' | '文件' | '浏览器'; tabs: BrowserTab[]; active: string; width: number;
  expanded: boolean; terminal: boolean; notes: Annotation[]; address: string;
  mode: '' | Annotation['mode']; draft?: Annotation; search: string;
  systemViews: Record<string, SystemViewState>; positions: Record<string, number>;
};
const caches = new Map<string, DockState>();
const initial = (): DockState => ({ view:'任务概览', tabs:[], active:'', width:360, expanded:false, terminal:false, notes:[], address:'', mode:'', search:'', systemViews:{}, positions:{} });
function download(file: SandboxFile) {
  const url = URL.createObjectURL(new Blob([new Uint8Array(file.data)], {type:file.mime}));
  const link = document.createElement('a'); link.href = url; link.download = file.path.split('/').pop() || '文件'; link.style.display='none'; document.body.appendChild(link); link.click();
  setTimeout(() => { link.remove(); URL.revokeObjectURL(url); }, 60000);
}
function FilePreview({file}:{file?:SandboxFile}) {
  const [url,setUrl] = useState('');
  useEffect(() => {
    if (!file) return;
    const value = URL.createObjectURL(new Blob([new Uint8Array(file.data)], {type:file.mime}));
    const frame = requestAnimationFrame(() => setUrl(value)); return () => { cancelAnimationFrame(frame); URL.revokeObjectURL(value); };
  }, [file]);
  if (!file) return <p className="tw-empty">文件已移除，请返回目录。</p>;
  const image = /\.(png|jpe?g|gif|webp)$/i.test(file.path);
  const text = file.mime.startsWith('text/') || /\.(txt|md|csv|json|py|log|xml|yaml|yml)$/i.test(file.path);
  // Blob URLs represent user-selected local files; optimization would require uploading them.
  /* eslint-disable next/no-img-element */
  return <div className="tw-file-preview"><header><strong>{file.path.split('/').pop()}</strong><a className="fw-btn small" href={url} download={file.path.split('/').pop()}><Download size={14}/>下载</a></header>
    {image ? <img src={url} alt={file.path.split('/').pop()} /> : text ? <pre>{new TextDecoder().decode(new Uint8Array(file.data))}</pre> : <p>该格式暂不支持预览，可下载后查看。</p>}
  </div>;
}
function TerminalDrawer({taskId,onClose}:{taskId:string;onClose:()=>void}) {
  const [,refresh] = useState(0);
  const [history,setHistory] = useState(-1);
  useEffect(() => subscribeSandbox(()=>refresh(v=>v+1)), []);
  const session = sessionFor(taskId);
  return <section className="tw-terminal" aria-label="Python 沙箱">
    <header><strong><Terminal size={15}/>Python 沙箱</strong><span>无风险 · 本地处理</span><button aria-label="收起终端" onClick={onClose}><X size={16}/></button></header>
    <div className="tw-terminal-output" role="log" aria-live="polite">
      {!session.records.length && <p>输入 Python 代码或 help 查看文件命令。文件跨命令保留，变量仅在本次执行有效。</p>}
      {session.records.map((r,i)=><div key={i}><pre className="tw-command">{r.command}</pre><small>{r.status}</small><pre>{r.output}</pre></div>)}
      {session.running && <p>{session.status}</p>}
    </div>
    <textarea aria-label="沙箱命令" rows={2} value={session.input} placeholder="例如：print(1 + 1)" onChange={e=>{updateSession(taskId,{input:e.target.value});}}
      onKeyDown={e=>{
        if ((e.metaKey||e.ctrlKey)&&e.key==='Enter') { e.preventDefault(); void runSandbox(taskId,session.input); }
        if (e.altKey && (e.key==='ArrowUp'||e.key==='ArrowDown')) {
          e.preventDefault(); const next=Math.max(0,Math.min(session.records.length-1,(history<0?session.records.length:history)+(e.key==='ArrowUp'?-1:1)));
          setHistory(next); updateSession(taskId,{input:session.records[next]?.command||''});
        }
      }}/>
    <footer><span>{session.cwd}</span><Btn small disabled={!session.records.length} onClick={()=>{updateSession(taskId,{records:[]});}}>清屏</Btn>
      {session.running ? <Btn small onClick={()=>session.stop?.()}>停止</Btn> : <Btn primary small disabled={!session.input.trim()} onClick={()=>void runSandbox(taskId,session.input)}>执行</Btn>}
    </footer>
  </section>;
}
export function TaskWorkspace({taskId,request,visible,onClose,onMemory,onConsult,onUse}:{
  taskId:string; request?:Target; visible:boolean; onClose:()=>void; onMemory:(id:string)=>void;
  onConsult:(id:string,text:string)=>void; onUse:(id:string)=>void;
}) {
  const {state,dispatch} = useWorkspace();
  const [dock,setDock] = useState<DockState>(()=>caches.get(taskId)||initial());
  const [menu,setMenu]=useState(false), [notice,setNotice]=useState('');
  const [selectionBox,setSelectionBox]=useState<{x:number;y:number;width:number;height:number}>();
  const [,tick]=useState(0);
  const panel=useRef<HTMLDivElement>(null), content=useRef<HTMLDivElement>(null);
  const start=useRef<{x:number;y:number}|null>(null);
  const sent=useRef(false);
  const returnFocus=useRef<HTMLElement|null>(null);
  useEffect(()=>{if(!visible)return;returnFocus.current=document.activeElement as HTMLElement;panel.current?.focus({preventScroll:true});return()=>returnFocus.current?.focus({preventScroll:true});},[visible]);
  const update=(patch:Partial<DockState>)=>setDock(old=>{const value={...old,...patch};caches.set(taskId,value);return value;});
  const task=state.memory.tasks.find(t=>t.id===taskId), flow=state.flows[taskId];
  const session=sessionFor(taskId);
  useEffect(()=>subscribeSandbox(()=>tick(n=>n+1)),[]);
  const open=useCallback((target:WorkspaceTarget)=>setDock(old=>{
    const result=openBrowserTarget(old.tabs,target);
    const value={...old,...result,view:'浏览器' as const, mode:'' as const, address:''};
    caches.set(taskId,value);return value;
  }),[taskId]);
  useEffect(()=>{let active=true;if(request&&caches.get(taskId)?.lastRequest!==request)queueMicrotask(()=>{if(active){open(request);setDock(old=>{const note=state.workspaceFeedback?.filter(f=>f.taskId===taskId).flatMap(f=>f.annotations).find(n=>n.id===request.annotationId);const value={...old,lastRequest:request,...(note?{draft:note,positions:{...old.positions,[targetKey(note.target)]:Math.max(0,note.y-20)}}:{})};caches.set(taskId,value);return value;});}});return()=>{active=false;};},[request,open,taskId,state.workspaceFeedback]); // requests are task-scoped objects
  useEffect(()=>{
    if(!visible)return;
    const handler=(e:KeyboardEvent)=>{
      if(document.querySelector('.fw-settings-overlay'))return;
      if(e.key==='Tab'&&(window.innerWidth<=840||dock.expanded)){
        const items=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),summary')||[]).filter(el=>el.getClientRects().length);
        const first=items[0],last=items.at(-1);
        if(e.shiftKey&&(document.activeElement===first||document.activeElement===panel.current)){e.preventDefault();last?.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
      }
      if(e.key==='Escape'){ if(menu)setMenu(false);else if(dock.draft)update({draft:undefined});else if(dock.mode)update({mode:''});else onClose(); }};
    window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);
  });
  const tab=dock.tabs.find(t=>t.id===dock.active);
  const target=tab?.history[tab.cursor];
  useEffect(() => {
    const key=target?targetKey(target):'blank';
    if(content.current) content.current.scrollTop=dock.positions?.[key]||0;
  },[target, dock.positions]);
  const title=(t:WorkspaceTarget)=>t.kind==='system'?systems[t.id as SystemId]?.name||'系统':t.kind==='artifact'?state.artifacts[t.id]?.name||'成果':t.kind==='file'?t.id.split('/').pop()||'文件':t.kind==='capability'?state.catalog.find(c=>c.id===t.id)?.name||'能力':'安全与授权';
  const version=(t:WorkspaceTarget)=>t.kind==='artifact'?'v'+state.artifacts[t.id]?.version:t.kind==='system'?'v'+(flow?.version||1)+' · '+(flow?.submission||'draft'):'当前会话';
  const addFile=(file:SandboxFile)=>{
    if(session.running){setNotice('请等待终端执行结束后添加文件。');return;}
    if(file.data.length>20*1024*1024 || session.files.reduce((n,f)=>n+f.data.length,0)+file.data.length>40*1024*1024){setNotice('单文件上限20MB，任务沙箱上限40MB。');return;}
    let path=file.path, count=1;
    while(session.files.some(f=>f.path===path))path=file.path+' ('+(count++)+')';
    updateSession(taskId,{files:[...session.files,{...file,path}]});setNotice('已添加到沙箱文件。');
  };
  const navigate=(next:WorkspaceTarget)=>{
    if(!tab){open(next);return;}
    update({tabs:dock.tabs.map(t=>t.id===tab.id?navigateTab(t,next):t),mode:'',address:''});
  };
  const closeTab=(id:string)=>{
    const remaining=dock.tabs.filter(t=>t.id!==id);
    update({tabs:remaining,active:dock.active===id?remaining.at(-1)?.id||'':dock.active,mode:''});
  };
  const createNote=(element:HTMLElement,box:DOMRect,quote:string)=>{
    if(!target||!content.current)return;
    const root=content.current.getBoundingClientRect();
    const note:Annotation={id:crypto.randomUUID(),target:{...target},title:title(target),version:version(target),mode:dock.mode||'元素',quote:quote.slice(0,1200),location:(element.getAttribute('aria-label')||element.textContent||element.tagName).trim().slice(0,90),text:'',x:Math.max(0,(box.left-root.left)/root.width),y:box.top-root.top+content.current.scrollTop,width:box.width/root.width,height:box.height};
    update({draft:note});
  };
  const renderTarget=(t:WorkspaceTarget):ReactNode=>{
    if(t.kind==='artifact')return <ArtifactPreview artifact={state.artifacts[t.id]?.taskId===taskId?state.artifacts[t.id]:undefined} onBack={onClose}/>;
    if(t.kind==='file')return <FilePreview file={session.files.find(f=>f.path===t.id)}/>;
    if(t.kind==='system')return flow?<SystemPage system={t.id as SystemId} flow={flow} onOpen={open} view={dock.systemViews[t.id]} onViewChange={patch=>update({systemViews:{...dock.systemViews,[t.id]:{...dock.systemViews[t.id],...patch}}})}/>:<p>此任务尚无关联系统数据。</p>;
    if(t.kind==='operation'){const op=flow?.operations.find(o=>o.id===t.id);return <div className="tw-detail">{op?<SafetyDetail op={op}/>:<p>操作记录不存在。</p>}</div>;}
    return <CatalogPage initialId={t.id} kind={state.catalog.find(c=>c.id===t.id)?.kind==='专业智能体'?'专业智能体':'Skill'} onBack={onClose} onConsult={onConsult} onMemory={onMemory} onUse={onUse}/>;
  };
  if(!task)return null;
  return <div ref={panel} tabIndex={-1} hidden={!visible} className={'tw-dock '+(dock.expanded?'expanded':'')} style={{'--dock-width':dock.width+'px'} as CSSProperties} aria-label="任务工作区">
    <button className="tw-resizer" aria-label="调整工作区宽度" onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();update({width:Math.min(window.innerWidth*.7,Math.max(320,dock.width+(e.key==='ArrowLeft'?40:-40)))})}}}
      onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);start.current={x:e.clientX,y:dock.width};}}
      onPointerMove={e=>{if(start.current)update({width:Math.min(window.innerWidth*.7,Math.max(320,start.current.y+start.current.x-e.clientX))});}}
      onPointerUp={()=>{start.current=null;}}/>
    <header className="tw-header"><strong>{dock.view}</strong><div className="tw-head-actions">
      <button aria-label="添加工作区视图" aria-expanded={menu} onClick={()=>setMenu(!menu)}><Plus size={18}/></button>
      <button aria-label={dock.expanded?'还原工作区':'放大工作区'} onClick={()=>update({expanded:!dock.expanded})}>{dock.expanded?<Minimize2 size={17}/>:<Maximize2 size={17}/>}</button>
      <button aria-label="关闭工作区，返回对话" onClick={onClose}><X size={18}/></button>
    </div>
    {menu&&<div className="tw-menu">{(['任务概览','文件','浏览器','终端'] as const).map(view=><button key={view} onClick={()=>{update(view==='终端'?{terminal:true}:{view});setMenu(false);}}>{view==='文件'?<FolderOpen size={16}/>:view==='浏览器'?<Globe2 size={16}/>:view==='终端'?<Terminal size={16}/>:<FileText size={16}/>} {view}</button>)}</div>}
    </header>
    {notice&&<output className="tw-notice">{notice}<button aria-label="关闭提示" onClick={()=>setNotice('')}><X size={13}/></button></output>}
    <div className="tw-main" hidden={dock.view!=='任务概览'}><Monitor task={task} onOpen={open} onMemory={onMemory} onShowFiles={()=>update({view:'文件'})}/></div>
    <div className="tw-main tw-files" hidden={dock.view!=='文件'}>
      <label className="tw-search">搜索文件<input aria-label="搜索任务文件" value={dock.search} onChange={e=>update({search:e.target.value})}/></label>
      <label className="tw-import"><Upload size={15}/>导入到沙箱<input type="file" multiple disabled={session.running} onChange={async e=>{const files=Array.from(e.target.files||[]);e.target.value='';for(const f of files){if(f.size>20*1024*1024){setNotice('单文件上限20MB。');continue;}addFile({path:'/task/导入资料/'+safeFilename(f.name),data:Array.from(new Uint8Array(await f.arrayBuffer())),mime:f.type||'application/octet-stream'});}}}/></label>
      <details open><summary>任务资料</summary>{(task.contexts||[]).length?(task.contexts||[]).map(c=><p key={c.id}>{c.label}</p>):<p className="tw-empty">暂无附加资料。可从本机导入到沙箱。</p>}</details>
      <details open><summary>生成成果</summary>
        {Object.values(state.artifacts).filter(a=>a.taskId===taskId&&a.name.includes(dock.search)).map(a=>{
          const file={path:'/task/成果副本/'+safeFilename(a.name)+'.txt',data:Array.from(new TextEncoder().encode(a.body)),mime:'text/plain'};
          return <div className="tw-file-row" key={a.id}><button onClick={()=>open({kind:'artifact',id:a.id})}><FileText size={15}/><span>{a.name}<small>v{a.version} · 只读</small></span></button><button aria-label={'下载'+a.name} onClick={()=>download(file)}><Download size={14}/></button><button aria-label={'复制到沙箱：'+a.name} disabled={session.running} onClick={()=>addFile(file)}><Plus size={14}/></button></div>;
        })}
      </details>
      <details open><summary>沙箱文件</summary>{!session.files.length&&<p className="tw-empty">导入资料、复制成果或运行命令后，文件会出现在这里。</p>}
        {session.files.filter(f=>f.path.includes(dock.search)).map(f=><div className="tw-file-row" key={f.path}><button onClick={()=>open({kind:'file',id:f.path})}><FileText size={15}/><span>{f.path.replace('/task/','')}<small>{Math.ceil(f.data.length/1024)} KB</small></span></button><button aria-label={'下载'+f.path} onClick={()=>download(f)}><Download size={14}/></button></div>)}
      </details>
    </div>
    <div className="tw-browser" hidden={dock.view!=='浏览器'}>
      <div className="tw-tabs">{dock.tabs.map(t=><div key={t.id} className={t.id===dock.active?'active':''}><button onClick={()=>update({active:t.id,mode:'',address:''})}>{t.history[t.cursor]?title(t.history[t.cursor]):'新标签页'}</button><button aria-label={'关闭标签'+(t.history[t.cursor]?title(t.history[t.cursor]):'新标签页')} onClick={()=>closeTab(t.id)}><X size={12}/></button></div>)}
        <button aria-label="新建浏览器标签" onClick={()=>{const id=crypto.randomUUID();update({tabs:[...dock.tabs,{id,history:[],cursor:-1}],active:id,mode:'',address:''});}}><Plus size={15}/></button>
      </div>
      <div className="tw-browser-tools">
        <button aria-label="本地业务系统" onClick={()=>{const id=crypto.randomUUID();update({tabs:[...dock.tabs,{id,history:[],cursor:-1}],active:id,mode:'',address:''});}}><Globe2 size={15}/></button>
        <button aria-label="后退" disabled={!tab||tab.cursor<=0} onClick={()=>update({tabs:dock.tabs.map(t=>t.id===tab!.id?{...t,cursor:t.cursor-1}:t),mode:'',address:''})}><ArrowLeft size={15}/></button>
        <button aria-label="前进" disabled={!tab||tab.cursor>=tab.history.length-1} onClick={()=>update({tabs:dock.tabs.map(t=>t.id===tab!.id?{...t,cursor:t.cursor+1}:t),mode:'',address:''})}><ArrowRight size={15}/></button>
        <button aria-label="刷新视图" onClick={()=>{tick(n=>n+1);setNotice('视图已更新。');}}><RotateCw size={15}/></button>
        <form onSubmit={e=>{e.preventDefault();const match=Object.entries(systems).find(([key,s])=>key===dock.address||s.name===dock.address||s.short===dock.address);if(match)navigate({kind:'system',id:match[0]});else {try{const url=new URL(/^https?:\/\//i.test(dock.address)?dock.address:'https://'+dock.address);if(!['http:','https:'].includes(url.protocol))throw Error();window.open(url.href,'_blank','noopener,noreferrer');}catch{setNotice('请输入有效地址或选择本地业务系统。');}}}}>
          <input aria-label="浏览器地址" placeholder={target?title(target):'输入网址，在新窗口打开'} value={dock.address} onChange={e=>update({address:e.target.value})}/></form>
        <button className={dock.mode?'active':''} aria-label="标注模式" aria-pressed={!!dock.mode} disabled={!target||!['artifact','system','file'].includes(target.kind)} onClick={()=>update({mode:dock.mode?'':'元素'})}><MousePointer2 size={15}/><span>标注</span></button>
      </div>
      {dock.mode&&<div className="tw-mark-tools">{(['文字','元素','区域'] as const).map(mode=><button key={mode} aria-pressed={dock.mode===mode} className={dock.mode===mode?'active':''} onClick={()=>update({mode})}>{mode}</button>)}<small>选中内容后填写意见</small><button onClick={()=>update({mode:''})}>完成标注</button></div>}
      <div className={'tw-browser-content '+(dock.mode?'annotating':'')} ref={content}
        onScroll={e=>{if(target){const key=targetKey(target);const y=e.currentTarget.scrollTop;setDock(old=>{const value={...old,positions:{...old.positions,[key]:y}};caches.set(taskId,value);return value;});}}}
        onClickCapture={e=>{if((e.target as HTMLElement).closest('.tw-pin'))return;if(!dock.mode)return;e.preventDefault();e.stopPropagation();if(dock.mode==='元素'){const el=e.target as HTMLElement;createNote(el,el.getBoundingClientRect(),el.innerText||el.getAttribute('aria-label')||'');}}}
        onKeyDownCapture={e=>{if(dock.mode&&!['Escape','Tab'].includes(e.key)){e.preventDefault();e.stopPropagation();}}}
        onBeforeInputCapture={e=>{if(dock.mode){e.preventDefault();e.stopPropagation();}}}
        onPointerDownCapture={e=>{
          if(dock.mode==='元素'&&(e.target as HTMLElement).closest('input,select,button,a'))e.preventDefault();
          if(dock.mode==='区域'){e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);start.current={x:e.clientX,y:e.clientY};}
        }}
        onPointerMoveCapture={e=>{
          if(dock.mode==='区域'&&start.current&&content.current){const p=start.current,r=content.current.getBoundingClientRect();setSelectionBox({x:Math.min(p.x,e.clientX)-r.left,y:Math.min(p.y,e.clientY)-r.top+content.current.scrollTop,width:Math.abs(p.x-e.clientX),height:Math.abs(p.y-e.clientY)});}
        }}
        onPointerUpCapture={e=>{
          if(dock.mode==='文字'){const selection=window.getSelection();if(selection?.toString().trim()&&selection.rangeCount)createNote(e.target as HTMLElement,selection.getRangeAt(0).getBoundingClientRect(),selection.toString());}
          if(dock.mode==='区域'&&start.current){const p=start.current;start.current=null;setSelectionBox(undefined);if(Math.abs(e.clientX-p.x)+Math.abs(e.clientY-p.y)>8)createNote(e.target as HTMLElement,new DOMRect(Math.min(p.x,e.clientX),Math.min(p.y,e.clientY),Math.abs(e.clientX-p.x),Math.abs(e.clientY-p.y)),'页面框选区域');}
        }}>
        <div className="tw-page-inner">{selectionBox&&<span className="tw-selection-box" style={{left:selectionBox.x,top:selectionBox.y,width:selectionBox.width,height:selectionBox.height}}/>}{!target?<div className="tw-start"><Globe2 size={32}/><h3>任务浏览器</h3><p>打开本地业务系统或从文件中选择成果</p>{Object.entries(systems).map(([id,s])=><button key={id} onClick={()=>navigate({kind:'system',id})}>{s.name}<ArrowRight size={14}/></button>)}</div>:renderTarget(target)}
        {target&&dock.notes.map((n,i)=>targetKey(n.target)===targetKey(target)&&n.version===version(target)?<button className="tw-pin" key={n.id} aria-label={'查看标注'+(i+1)} style={{left:(n.x*100)+'%',top:Math.max(0,n.y)}} onClick={()=>update({draft:n})}>{i+1}</button>:null)}
        </div>
      </div>
      {!!dock.notes.length&&<div className="tw-markers">{dock.notes.map((n,i)=><button key={n.id} onClick={()=>{open(n.target);update({draft:n});}}>{i+1} · {n.title} · {n.location.slice(0,16)}{n.version!==version(n.target)?' · 定位可能失效':''}</button>)}</div>}
      {dock.draft&&<form className="tw-note-editor" onSubmit={e=>{e.preventDefault();const note=dock.draft!;if(!note.text.trim())return;update({notes:[...dock.notes.filter(n=>n.id!==note.id),note],draft:undefined});}}>
        <strong>{dock.draft.mode}标注 · {dock.draft.title}</strong><small>{dock.draft.quote.slice(0,100)||dock.draft.location}</small>
        <textarea rows={3} aria-label="标注意见" value={dock.draft.text} onChange={e=>update({draft:{...dock.draft!,text:e.target.value}})}/>
        <div className="tw-note-actions"><Btn small onClick={()=>update({draft:undefined})}>取消</Btn>{dock.notes.some(n=>n.id===dock.draft?.id)&&<Btn small onClick={()=>update({notes:dock.notes.filter(n=>n.id!==dock.draft?.id),draft:undefined})}><Trash2 size={13}/>删除</Btn>}<button className="fw-btn primary small" type="submit" disabled={!dock.draft.text.trim()}>保存标注</button></div>
      </form>}
      {!!dock.notes.length&&<div className="tw-note-footer"><span>{dock.notes.length} 条标注待发送</span><Btn small primary disabled={!!dock.draft} onClick={()=>{if(sent.current)return;sent.current=true;dispatch({type:'workspace-feedback',taskId,text:annotationsText(dock.notes),annotations:dock.notes});update({notes:[],mode:''});setNotice('标注意见已发送到当前对话。');onClose();queueMicrotask(()=>{sent.current=false;});}}><Send size={14}/>发送到对话</Btn></div>}
    </div>
    {dock.terminal&&<TerminalDrawer taskId={taskId} onClose={()=>update({terminal:false})}/>}
  </div>;
}
