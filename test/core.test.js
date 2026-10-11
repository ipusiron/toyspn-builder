'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const t = require('../js/core.js');

test('published cipher and round constants remain compatible', () => {
  const keys = t.deriveRoundKeys(0xC0DE, 8);
  assert.deepEqual(keys.map(t.numToHex16), ['365C','4747','FCD5','9F99','C694','923B','D6D9','012F']);
  assert.equal(t.encryptBlock(0x1234, t.DEFAULT_S, t.DEFAULT_P, keys), 0xFBC6);
});
test('all 65536 plaintexts round-trip under the default settings', () => {
  const keys = t.deriveRoundKeys(0xC0DE, 8);
  const S = t.invertSBox(t.DEFAULT_S), P = t.invertPermutation(t.DEFAULT_P);
  for (let x = 0; x < 65536; x++) {
    assert.equal(t.decryptBlock(t.encryptBlock(x, t.DEFAULT_S, t.DEFAULT_P, keys), S, P, keys), x);
  }
});
test('hexadecimal normalization accepts only 1-4 digits', () => {
  for (const [input, output] of [['0','0000'],['abc','0ABC'],[' ffff ','FFFF']]) {
    assert.equal(t.clampHex16(input), output);
  }
  for (const x of ['', ' ', 'ZZZZ', '12G4', '-1', '10000', '0x12', null, 1234]) {
    assert.throws(() => t.hex16ToNum(x), { code: 'invalidHex' });
  }
});
test('integer parser rejects truncation, fallback and out-of-range values', () => {
  for (const x of ['', ' ', '1.5', '1e1', '-1', '+1', '0', '17', 'NaN', 'Infinity']) {
    assert.throws(() => t.parseInteger(x, 1, 16), { code: 'invalidInteger' });
  }
  assert.equal(t.parseInteger(' 16 ', 1, 16), 16);
});
test('bijection check rejects missing, duplicate, noninteger and out-of-range entries', () => {
  const valid = Array.from({length:16}, (_, i) => i);
  assert.equal(t.isBijection(valid,16), true);
  for (const x of [NaN, -1, 16, 0.5, '0', undefined, null]) {
    assert.equal(t.isBijection([x, ...valid.slice(1)],16), false);
  }
  assert.equal(t.isBijection(null,16), false);
  assert.equal(t.isBijection(valid.slice(1),16), false);
  assert.equal(t.isBijection(new Array(16).fill(0),16), false);
});
test('key schedule rejects invalid parameters', () => {
  for (const rounds of [0,17,1.5,NaN,Infinity]) {
    assert.throws(() => t.deriveRoundKeys(0,rounds), { code:'invalidRounds' });
  }
  for (const key of [-1,65536,NaN,0.5]) assert.throws(() => t.deriveRoundKeys(key,8));
});
test('bit permutation semantics and substitution inverse are exact', () => {
  for (let i=0;i<16;i++) assert.equal(t.permute16(1<<i,t.DEFAULT_P),1<<t.DEFAULT_P[i]);
  for (let x=0;x<65536;x++) assert.equal(t.subNib16(t.subNib16(x,t.DEFAULT_S),t.invertSBox(t.DEFAULT_S)),x);
});
test('trace values describe forward and reverse operations', () => {
  const k=t.deriveRoundKeys(0xC0DE,8), a=[], b=[];
  const c=t.encryptBlock(0x1234,t.DEFAULT_S,t.DEFAULT_P,k,a);
  assert.equal(t.decryptBlock(c,t.invertSBox(t.DEFAULT_S),t.invertPermutation(t.DEFAULT_P),k,b),0x1234);
  assert.equal(a.length,8); assert.equal(b.length,8);
  for(let i=0;i<8;i++) {
    const f=a[i], r=b[7-i];
    assert.equal(f.before,r.afterS); assert.equal(f.afterS,r.afterP);
    assert.equal(f.afterP,r.afterK); assert.equal(f.afterK,r.before);
  }
});
