'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
test('source files remain readable and unminified',()=>{
  const files=['index.html','style.css',...['js','test'].flatMap(dir=>
    fs.readdirSync(path.join(root,dir)).filter(n=>n.endsWith('.js')).map(n=>dir+'/'+n))];
  for(const file of files){
    const source=fs.readFileSync(path.join(root,file),'utf8');
    const lines=source.split(/\r?\n/),limit=file.endsWith('.html')?250:160;
    assert.ok(lines.length>=10,file);
    lines.forEach((line,i)=>assert.ok([...line].length<=limit,`${file}:${i+1}`));
    assert.doesNotMatch(source,/[\t ]+\r?$/m,file);
    assert.doesNotMatch(source,/\uFFFD/,file);
  }
});
