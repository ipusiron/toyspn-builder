'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const t=require('../js/core.js');
const m=require('../js/messages.js');
test('increasing rounds does not guarantee more diffusion',()=>{
  const S=[0,14,13,3,11,5,6,8,7,9,10,4,12,2,1,15];
  const result=[];
  for(let r=1;r<=4;r++){
    const k=t.deriveRoundKeys(0xC0DE,r), base=t.encryptBlock(0,S,t.DEFAULT_P,k);
    let sum=0;
    for(let i=0;i<16;i++) sum+=(base^t.encryptBlock(1<<i,S,t.DEFAULT_P,k)).toString(2).replace(/0/g,'').length;
    result.push(sum/16);
  }
  assert.deepEqual(result,[3,9,3,1]);
});
test('UI explains measurement limits without grading cipher security',()=>{
  const source=fs.readFileSync(require.resolve('../js/ui.js'),'utf8');
  assert.doesNotMatch(source,/暗号学的に良好|暗号として機能しません|verdict = '優秀'|verdict = '不合格'/);
  assert.match(m.ja.measurementLimit,/安全性やSAC/);
  assert.match(m.ja.measurementHints.join(' '),/65,536/);
  assert.match(fs.readFileSync(require.resolve('../index.html'),'utf8'),/全単射でも非線形とは限りません/);
});
