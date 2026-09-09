import type { SandboxFile } from './task-workspace-model';
import { validSandboxPath } from './task-workspace-model';
export type TerminalRecord = { command: string; output: string; status: '完成' | '异常' | '已取消' };
type Session = { files: SandboxFile[]; records: TerminalRecord[]; running: boolean; status: string; input: string; cwd: string; stop?: () => void };
const sessions = new Map<string, Session>();
const listeners = new Set<() => void>();
export const sessionFor = (id: string) => {
  if (!sessions.has(id)) sessions.set(id, { files: [], records: [], running: false, status: '', input: '', cwd: '/task' });
  return sessions.get(id)!;
};
export function subscribeSandbox(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
export function notifySandbox() { listeners.forEach(fn => fn()); }
let resources: Promise<Record<string, ArrayBuffer>> | undefined;
const base = () => location.pathname.startsWith('/shenzhen-superagent-prototype') ? '/shenzhen-superagent-prototype/' : '/';
function getResources() {
  return resources ||= Promise.all(['pyodide.js','pyodide.asm.js','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json'].map(async name => {
    const response = await fetch(base() + 'sandbox/' + name);
    if (!response.ok) throw Error('沙箱资源加载失败，请重试');
    return [name, await response.arrayBuffer()] as const;
  })).then(Object.fromEntries).catch(error => { resources = undefined; throw error; });
}
export async function runSandbox(id: string, command: string) {
  const session = sessionFor(id);
  if (session.running || !command.trim()) return;
  session.running = true; session.status = '加载 Python 沙箱…'; notifySandbox();
  let frame: HTMLIFrameElement | undefined;
  let port: MessagePort | undefined;
  const timer = setTimeout(() => finish('操作超时，已停止执行并恢复上一次完成操作后的文件快照。', '已取消'), 60000);
  let done = false;
  const finish = (output: string, status: TerminalRecord['status'], files?: SandboxFile[], cwd?: string) => {
    if (done) return;
    done = true; clearTimeout(timer); port?.close(); frame?.remove();
    if (files) session.files = files;
    if (cwd) session.cwd = cwd;
    session.running = false; session.status = ''; session.stop = undefined;
    session.records.push({ command, output, status }); notifySandbox();
  };
  session.stop = () => finish('当前操作已取消，已恢复上一次完成操作后的文件快照。', '已取消');

  try {
    const assets = await getResources();
    if (done) return;
    const worker = await fetch(base() + 'sandbox/runner.js').then(r => {
      if (!r.ok) throw Error('沙箱执行器加载失败');
      return r.text();
    });
    if (done) return;
    frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;width:1px;height:1px;left:-100px;top:-100px;border:0';
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('aria-hidden', 'true');
    // Opaque origin; CSP also applies to its blob worker. Runtime bytes come only from the parent.
    frame.srcdoc = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' blob:; worker-src blob:; connect-src 'none'; img-src 'none'; style-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'"><script>
      addEventListener('message', event => {
        if(event.source !== parent || !event.ports[0]) return;
        const port = event.ports[0];
        port.postMessage({ready:true,phase:'隔离容器已启动'});
        try {
        const worker = new Worker(URL.createObjectURL(new Blob([event.data.code], {type:'text/javascript'})));
        worker.onmessage = e => port.postMessage(e.data);
        worker.onerror = e => port.postMessage({error: e.message});
        worker.postMessage(event.data.payload);
        } catch (error) { port.postMessage({error:String(error)}); }
      }, {once:true});
    </script>`;
    const channel = new MessageChannel(); port = channel.port1;
    port.onmessage = event => {
      const data = event.data;
      if (data.ready) { session.status = data.phase || '正在执行 · 无风险 · 本地处理'; notifySandbox(); return; }
      if (data.error) { finish(String(data.error), '异常'); return; }
      if (typeof data.output !== 'string' || !Array.isArray(data.files)) { finish('沙箱返回格式无效', '异常'); return; }
      const files = data.files as SandboxFile[];
      if (files.length > 200 || files.some(f => typeof f.path !== 'string' || !validSandboxPath(f.path) || !Array.isArray(f.data) || f.data.length > 20 * 1024 * 1024 || f.data.some(n => !Number.isInteger(n) || n < 0 || n > 255)) || files.reduce((n,f) => n+f.data.length,0) > 40*1024*1024) {
        finish('沙箱文件超过限制，保留执行前快照。', '异常'); return;
      }
      finish(data.output.slice(0, 100000), data.failed ? '异常' : '完成', files, typeof data.cwd === 'string' && (data.cwd === '/task' || validSandboxPath(data.cwd)) ? data.cwd : '/task');
    };
    frame.onload = () => {
      session.status = '初始化隔离执行容器…'; notifySandbox();
      frame!.contentWindow!.postMessage({ code: worker, payload: { assets, files: session.files, command, cwd: session.cwd } }, '*', [channel.port2]);
    };
    document.body.appendChild(frame);
  } catch (error) { finish(String(error), '异常'); }
}

export function updateSession(id: string, patch: Partial<Session>) { Object.assign(sessionFor(id), patch); notifySandbox(); }
