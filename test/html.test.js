'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
const css=fs.readFileSync(require.resolve('../style.css'),'utf8');
const ui=fs.readFileSync(require.resolve('../js/ui.js'),'utf8');
test('CSP is restrictive and contains no ineffective meta headers',()=>{
  assert.match(html,/Content-Security-Policy/);
  assert.match(html,/connect-src 'none'/);
  assert.doesNotMatch(html,/unsafe-inline|unsafe-eval|frame-ancestors|X-Frame-Options|X-Content-Type-Options/);
  assert.doesNotMatch(html,/\s(?:on\w+|style)\s*=/i);
  assert.match(html,/<noscript>/); assert.match(html,/name="referrer" content="no-referrer"/);
  assert.doesNotMatch(ui,/\.innerHTML\s*=/);
});
test('IDs are unique and local script files exist',()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(new Set(ids).size,ids.length);
  const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(scripts.length,4);
  for(const path of scripts) assert.ok(fs.existsSync(require.resolve('../'+path)));
});
test('mobile layout, hidden states and keyboard help have explicit support',()=>{
  assert.match(css,/\[hidden\]\s*\{\s*display:none !important/);
  assert.match(css,/#chart\s*\{[^}]*max-width:680px/);
  assert.match(css,/font-size:16px/);
  assert.match(css,/prefers-reduced-motion/);
  assert.equal((html.match(/<button class="help-icon"/g)||[]).length,5);
  assert.match(ui,/ArrowRight/); assert.match(ui,/Escape/); assert.match(ui,/aria-expanded/);
});
test('text palette has at least 4.5:1 contrast on its backgrounds',()=>{
  const color=name=>css.match(new RegExp('--'+name+':(#[0-9a-f]{6})'))[1];
  const luminance=hex=>{
    const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255)
      .map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
    return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
  };
  for(const name of ['text','muted','accent','danger','ok','warning']){
    for(const bg of ['#ffffff','#f7f9fc','#fafafa','#fff9e6']){
      const a=luminance(color(name)),b=luminance(bg);
      assert.ok((Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)>=4.5, name+' on '+bg);
    }
  }
});

test('language control is separate from centered header content and tabs',()=>{
  assert.match(html,/<div class="header-actions">\s*<button id="language-toggle"/);
  assert.match(html,/<div class="header-intro">/);
  assert.match(css,/\.header-actions\{[^}]*justify-self:end/);
  assert.match(css,/grid-template-areas:"\. intro actions" "tabs tabs tabs"/);
  assert.match(css,/\.header-inner\{[^}]*gap:1rem/);
});

test('empty-state guidance, current settings and sample effects are explicit',()=>{
  for(const id of ['steps-empty','analysis-empty','sample-note']) assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(html,/<div id="analysis-output" hidden>/);
  assert.match(html,/id="btn-sample"[^>]*aria-describedby="sample-note">標準サンプル/);
  for(const key of ['rounds','key','sbox','player']){
    assert.equal((html.match(new RegExp('data-setting="'+key+'"','g'))||[]).length,2);
  }
  assert.match(ui,/renderCurrentSettings\(\)/);
  assert.match(ui,/showAnalysisState\('complete'\)/);
  assert.match(ui,/showCryptoState\('complete'\)/);
});

test('round disclosure controls use native details with a visible input/output summary',()=>{
  assert.match(html,/id="step-controls"[^>]*hidden/);
  for(const id of ['steps-expand','steps-collapse']) assert.match(html,new RegExp('id="'+id+'"[^>]*aria-controls="steps"'));
  assert.match(ui,/createElement\('details'\)/);
  assert.match(ui,/detail.open = index === 0/);
  assert.match(ui,/入力 \{0\} → 出力 \{1\}/);
  assert.doesNotMatch(css,/max-height:420px/);
});
