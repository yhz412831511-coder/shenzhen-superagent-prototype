import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const source=dirname(require.resolve('pyodide/package.json'));
const target=fileURLToPath(new URL('../public/sandbox/',import.meta.url));
mkdirSync(target,{recursive:true});
const names=['pyodide.js','pyodide.asm.js','pyodide.asm.wasm','python_stdlib.zip','pyodide-lock.json'];
const files=names.map(name=>{
  copyFileSync(join(source,name),join(target,name));
  return {name,sha256:createHash('sha256').update(readFileSync(join(target,name))).digest('hex')};
});
writeFileSync(join(target,'runtime.json'),JSON.stringify({package:'pyodide',version:JSON.parse(readFileSync(join(source,'package.json'),'utf8')).version,files},null,2)+'\n');
