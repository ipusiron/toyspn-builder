'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const m=require('../js/messages.js');
test('message dictionaries have matching keys, arrays and template parameters',()=>{
  assert.deepEqual(Object.keys(m.ja).sort(),Object.keys(m.en).sort());
  for(const [ja,en] of Object.entries(m.translations)){
    const params=s=>(s.match(/\{\d+\}/g)||[]).sort();
    assert.deepEqual(params(ja),params(en),ja);
    assert.doesNotMatch(en,/[\u3040-\u9fff]/,ja);
    assert.ok(en.trim());
  }
  for(const key of Object.keys(m.ja)){
    const ja=[m.ja[key]].flat(),en=[m.en[key]].flat();
    assert.equal(ja.length,en.length);
    ja.forEach((value,i)=>assert.equal(m.translations[value],en[i]));
  }
});
test('every Japanese static text and accessibility attribute has an English entry',()=>{
  const html=fs.readFileSync(require.resolve('../index.html'),'utf8').replace(/<!--[\s\S]*?-->/g,'');
  const texts=[...html.matchAll(/>([^<>]+)</g)].map(x=>x[1].trim());
  const attrs=[...html.matchAll(/(?:aria-label|placeholder|title)="([^"]+)"/g)].map(x=>x[1]);
  for(const source of [...texts,...attrs].filter(v=>/[\u3040-\u9fff]/.test(v))){
    assert.ok(Object.hasOwn(m.translations,source),'Missing translation: '+source);
  }
});
test('language preference order is query, saved preference, then browser',()=>{
  for(const [query,saved,browser,expected] of [
    ['en','ja','ja-JP','en'],['ja','en','en-US','ja'],['bad','en','ja','en'],
    [null,null,'ja-JP','ja'],[null,null,'ja','ja'],[null,'bad','fr-FR','en'],
    [null,null,'','en'],[null,null,'jargon','en']
  ]) assert.equal(m.chooseLanguage(query,saved,browser),expected);
  assert.equal(m.t(0),'0');
  assert.equal(m.t('ラウンド {0}',8),'ラウンド 8');
});
