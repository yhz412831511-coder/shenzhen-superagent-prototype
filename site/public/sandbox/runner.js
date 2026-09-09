/* Executed inside an opaque, network-disabled frame. No business state or credentials. */
self.onmessage = async ({data}) => {
  try {
    self.postMessage({ready:true,phase:'加载 Python 运行时…'});
    const assets = data.assets;
    self.fetch = async input => {
      const url = typeof input === 'string' ? input : input.url || String(input);
      const name = url.split('/').pop();
      if (!url.startsWith('https://sandbox.invalid/') || !Object.hasOwn(assets, name)) throw Error('沙箱禁止网络访问');
      return new Response(assets[name], {headers:{'Content-Type': name.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream'}});
    };
    (0, eval)(new TextDecoder().decode(assets['pyodide.js']));
    (0, eval)(new TextDecoder().decode(assets['pyodide.asm.js']) + '\nself._createPyodideModule = _createPyodideModule;');
    console.warn = (...args) => { if(String(args[0]) !== 'wasm instantiation failed!') self.postMessage({error:args.map(String).join(' ')}); };
    let output = '';
    const py = await self.loadPyodide({indexURL:'https://sandbox.invalid/', stdout: text => { output = (output + text + '\n').slice(-100000); }, stderr: text => { output = (output + text + '\n').slice(-100000); }});
    py.FS.mkdirTree('/task');
    for (const file of data.files) {
      if (!file.path.startsWith('/task/') || file.path.split('/').includes('..')) throw Error('无效任务路径');
      py.FS.mkdirTree(file.path.slice(0,file.path.lastIndexOf('/')));
      py.FS.writeFile(file.path, new Uint8Array(file.data));
    }
    py.FS.mkdirTree(data.cwd || '/task');
    py.FS.chdir(data.cwd || '/task');
    self.postMessage({ready:true});
    py.globals.set('_input_command', data.command);
    let failed = false;
    try {
      await py.runPythonAsync(`
import os, shlex
_command = _input_command.strip()
_parts = shlex.split(_command) if _command.split(' ', 1)[0] in ('ls','pwd','cd','cat','help') else []
if _parts and _parts[0] == 'help':
    print('Python 沙箱：输入 Python 代码，或使用 ls、pwd、cd、cat。文件位于 /task；文件和目录跨命令保留，Python 变量仅在本次执行有效。不支持系统 shell 和网络。')
elif _parts and _parts[0] == 'pwd':
    print(os.getcwd())
elif _parts and _parts[0] == 'ls':
    print('\\n'.join(os.listdir(_parts[1] if len(_parts)>1 else '.')))
elif _parts and _parts[0] == 'cd':
    os.chdir(_parts[1] if len(_parts)>1 else '/task')
    print(os.getcwd())
elif _parts and _parts[0] == 'cat':
    with open(_parts[1], encoding='utf-8') as f: print(f.read())
else:
    await __import__('pyodide.code', fromlist=['eval_code_async']).eval_code_async(_command, globals())
`);
    } catch (e) { failed = true; output += String(e); }
    const files = [];
    function scan(path) {
      for (const name of py.FS.readdir(path)) {
        if (name === '.' || name === '..') continue;
        const next = path + '/' + name;
        const stat = py.FS.lstat(next);
        if (py.FS.isLink(stat.mode)) continue;
        if (py.FS.isDir(stat.mode)) scan(next);
        else {
          if (stat.size > 20*1024*1024 || files.length >= 200) throw Error('沙箱文件超过限制');
          files.push({path:next, data:Array.from(py.FS.readFile(next)), mime:data.files.find(f=>f.path===next)?.mime || 'application/octet-stream'});
        }
      }
    }
    scan('/task');
    self.postMessage({output:output || '执行完成，无输出。', files, failed, cwd:py.FS.cwd()});
  } catch(e) { self.postMessage({error:String(e)}); }
};
