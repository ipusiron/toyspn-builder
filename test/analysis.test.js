'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const t = require('../js/core.js');
const a = require('../js/analysis.js');
const identity = Array.from({length:16}, (_,i) => i);
test('identity S-box changes exactly one bit at all allowed round counts', () => {
  for(let rounds=1;rounds<=16;rounds++) {
    let seed=0;
    const result=a.avalancheTrials(200,identity,t.DEFAULT_P,t.deriveRoundKeys(0xC0DE,rounds),()=> seed++ & 65535);
    assert.equal(result.avg,1); assert.equal(result.hist[1],200);
    assert.equal(result.hist.reduce((x,y)=>x+y),200);
  }
});
test('deterministic measurements agree with an independent popcount', () => {
  const k=t.deriveRoundKeys(0xC0DE,8);
  let n=0;
  const result=a.avalancheTrials(200,t.DEFAULT_S,t.DEFAULT_P,k,()=> n++);
  const histogram=new Array(17).fill(0);
  for(let i=0;i<200;i++) {
    const x=2*i, bit=(2*i+1)%16;
    const difference=t.encryptBlock(x,t.DEFAULT_S,t.DEFAULT_P,k)^t.encryptBlock(x^(1<<bit),t.DEFAULT_S,t.DEFAULT_P,k);
    const count=difference.toString(2).replace(/0/g,'').length;
    histogram[count]++;
  }
  assert.deepEqual(result.hist,histogram);
  assert.equal(result.avg,histogram.reduce((sum,v,i)=>sum+v*i,0)/200);
});
test('analysis rejects invalid trials, tables, keys and RNG output', () => {
  const k=t.deriveRoundKeys(0,8);
  for(const n of [0,9,2001,10.5,NaN]) assert.throws(()=>a.avalancheTrials(n,identity,identity,k));
  assert.throws(()=>a.avalancheTrials(10,new Array(16).fill(0),identity,k));
  assert.throws(()=>a.avalancheTrials(10,identity,identity,[]));
  assert.throws(()=>a.avalancheTrials(10,identity,identity,k,()=>NaN),{code:'randomUnavailable'});
});
test('random source fails explicitly without Web Crypto or when it throws', () => {
  const code=fs.readFileSync(require.resolve('../js/core.js'),'utf8');
  for(const crypto of [undefined, {getRandomValues(){throw Error('unavailable');}}]) {
    const context=vm.createContext({crypto});
    vm.runInContext(code,context);
    assert.throws(()=>context.ToySPN.random16(),{code:'randomUnavailable'});
  }
});
