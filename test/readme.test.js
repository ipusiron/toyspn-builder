'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const t=require('../js/core.js');
const a=require('../js/analysis.js');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8').replace(/\r\n/g,'\n');
const ja=read('README.md'), en=read('README.en.md');
const headings=[
  ["# ToySPN Builder - SPN体験ミニツール",
    "# ToySPN Builder - Interactive SPN Block Cipher Learning Tool"],
  ["## 🌐 デモページ",
    "## 🌐 Demo"],
  ["## 📸 スクリーンショット",
    "## 📸 Screenshots"],
  ["## 🚀 クイックスタート",
    "## 🚀 Quick start"],
  ["### 基本的な使い方",
    "### Basic usage"],
  ["### 実験的な使い方",
    "### Experimental usage"],
  ["## 🎯 対象ユーザー",
    "## 🎯 Intended users"],
  ["## 🌉 ヒル暗号からToySPN Builderへの橋わたし",
    "## 🌉 From the Hill cipher to ToySPN Builder"],
  ["### 1️⃣ ヒル暗号の仕組み",
    "### 1️⃣ How the Hill cipher works"],
  ["### 2️⃣ 現代の暗号で使われる非線形変換",
    "### 2️⃣ Nonlinear transformations in modern ciphers"],
  ["### 3️⃣ ToySPN Builderの構成",
    "### 3️⃣ The ToySPN Builder construction"],
  ["### 4️⃣ ヒル暗号とのちがいとつながり",
    "### 4️⃣ Differences and connections with the Hill cipher"],
  ["### 5️⃣ 非線形性と安全性の区別",
    "### 5️⃣ Nonlinearity is not a security guarantee"],
  ["### 6️⃣ アバランシェ効果（なだれ効果）の観測",
    "### 6️⃣ Observing the avalanche effect"],
  ["### 7️⃣ 学習で区別する性質",
    "### 7️⃣ Properties to distinguish when learning"],
  ["## 📚 本ツールの活用シナリオ",
    "## 📚 Learning scenarios"],
  ["### 🧪 シナリオ1：恒等S-Boxで差の伝わり方を調べる",
    "### 🧪 Scenario 1: Trace differences with an identity S-box"],
  ["### 🔬 シナリオ2：ラウンド数と出力差の関係を調べる",
    "### 🔬 Scenario 2: Investigate rounds and output differences"],
  ["### 🎨 シナリオ3：独自の表で可逆性と観測値を調べる",
    "### 🎨 Scenario 3: Examine reversibility and observations with custom tables"],
  ["## 🎯 ユースケース",
    "## 🎯 Use cases"],
  ["## ✨ 本ツールの機能",
    "## ✨ Features"],
  ["### 🎨 設計機能",
    "### 🎨 Design"],
  ["### 🔐 暗号化/復号機能",
    "### 🔐 Encryption and decryption"],
  ["### 📊 解析機能",
    "### 📊 Analysis"],
  ["### 🎓 学習機能",
    "### 🎓 Learning"],
  ["### 🛡️ セキュリティ・品質",
    "### 🛡️ Security and quality"],
  ["## ⚙️ ミニSPNのアルゴリズム",
    "## ⚙️ Mini-SPN algorithm"],
  ["## 🔧 デフォルトパラメーター",
    "## 🔧 Default parameters"],
  ["## ⚠️ 制限事項",
    "## ⚠️ Limitations"],
  ["## 👨‍💻 開発者向け情報",
    "## 👨‍💻 Developer information"],
  ["## 📁 ディレクトリー構造",
    "## 📁 Directory structure"],
  ["## 💻 動作環境とテスト",
    "## 💻 Environment and tests"],
  ["## 📄 ライセンス",
    "## 📄 License"],
  ["## 🛠️ このツールについて",
    "## 🛠️ About this tool"]
];
test('Japanese and English README headings have identical coverage and order',()=>{
  assert.deepEqual(ja.match(/^#+ .*$/gm),headings.map(p=>p[0]));
  assert.deepEqual(en.match(/^#+ .*$/gm),headings.map(p=>p[1]));
  assert.equal(en.split('\n')[0],'English · [日本語](README.md)');
  assert.match(ja,/\[English\]\(README.en.md\) · 日本語/);
  assert.doesNotMatch(en.split('\n').slice(1).join('\n'),/[\u3040-\u9fff]/);
  assert.doesNotMatch(en,/previously|used to|earlier version|formerly/i);
});
test('original Japanese metadata is preserved byte-for-byte after LF normalization',()=>{
  const metadata=ja.match(/^<!--[\s\S]*?-->/)[0];
  assert.equal(crypto.createHash('sha256').update(metadata).digest('hex'),'f516f58ae36e2abf10178b9fe9e554e2df82d43ed0f969ae654a7b8ce9e86386');
  assert.doesNotMatch(en,/slug:|hub: true/);
});
test('all local documentation links and screenshots exist; screenshot inventories match',()=>{
  for(const file of ['README.md','README.en.md','TECHNICAL.md','SECURITY.md']){
    for(const [,url] of read(file).matchAll(/\]\(([^)]+)\)/g)){
      if(/^(?:https?:|#)/.test(url)) continue;
      assert.ok(fs.existsSync(path.join(root,url.split('#')[0])),file+': '+url);
    }
  }
  for(const [doc,dir] of [[ja,'assets'],[en,'assets/en']]){
    const images=[...doc.matchAll(/!\[[^\]]*\]\((assets\/[^)]+)\)/g)].map(x=>x[1]).sort();
    const files=fs.readdirSync(path.join(root,dir)).filter(x=>x.endsWith('.png')).map(x=>dir+'/'+x).sort();
    assert.deepEqual(images,files); assert.equal(images.length,3);
    for(const image of images) assert.ok(fs.statSync(path.join(root,image)).size<=300*1024);
  }
});
test('directory trees match the complete public file inventory',()=>{
  const walk=dir=>fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(entry=>{
    // Repository metadata, dependencies and ignored local agent settings are not public files.
    if(['.git','node_modules','.claude'].includes(entry.name)) return [];
    const rel=dir?dir+'/'+entry.name:entry.name;
    return entry.isDirectory()?walk(rel):[rel];
  });
  for(const doc of [ja,en]){
    const tree=doc.match(/^toyspn-builder\/[^\n]*\n[\s\S]*?\n```/m)[0].split('\n').slice(1,-1);
    const dirs=[],found=[];
    for(const line of tree){
      const m=line.match(/^((?:│   |    )*)[├└]── (\S+)\s+# .+/);
      assert.ok(m,'Tree row needs hierarchy and comment: '+line);
      const depth=m[1].length/4,name=m[2];
      dirs.length=depth;
      if(name.endsWith('/')) dirs.push(name.slice(0,-1));
      else found.push([...dirs,name].join('/'));
    }
    assert.deepEqual(found.sort(),walk('').sort());
  }
});
test('documented numerical examples agree with the cipher and measurement core',()=>{
  const keys=t.deriveRoundKeys(0xC0DE,8);
  const ct=t.encryptBlock(0x1234,t.DEFAULT_S,t.DEFAULT_P,keys);
  assert.equal(ct,0xFBC6);
  assert.equal(t.decryptBlock(ct,t.invertSBox(t.DEFAULT_S),t.invertPermutation(t.DEFAULT_P),keys),0x1234);
  assert.equal(t.permute16(1<<1,t.DEFAULT_P),1<<4);
  const identity=Array.from({length:16},(_,i)=>i);
  const observation=a.avalancheTrials(200,identity,t.DEFAULT_P,keys,()=>0);
  assert.equal(observation.avg,1); assert.equal(observation.hist[1],200);
  const S=[0,14,13,3,11,5,6,8,7,9,10,4,12,2,1,15];
  const means=[1,2,3,4].map(rounds=>{
    const k=t.deriveRoundKeys(0xC0DE,rounds),base=t.encryptBlock(0,S,t.DEFAULT_P,k);
    return identity.reduce((sum,i)=>sum+(base^t.encryptBlock(1<<i,S,t.DEFAULT_P,k))
      .toString(2).replace(/0/g,'').length,0)/16;
  });
  assert.deepEqual(means,[3,9,3,1]);
  for(const doc of [ja,en]){
    for(const sample of ['1234 → FBC6 → 1234','b1 → b4','1.000',means.join(', '),'65,536','10','2000']){
      assert.ok(doc.includes(sample),sample);
    }
    assert.match(doc,/C0DE/); assert.match(doc,/SAC/);
    assert.match(doc,/S = \[C,5,6,B,9,0,A,D,3,E,F,8,4,7,1,2\]/);
  }
});

test('both READMEs explain the sample scope, current settings and empty states',()=>{
  for(const phrase of ['標準サンプル','右上','要修正','入力中','実行時の条件と結果','再実行','試行回数は保持']){
    assert.ok(ja.includes(phrase),phrase);
  }
  for(const phrase of ['Default sample','top right','Needs correction','Composing input',
    'Settings and results for this run','run again','keeps the trial count']){
    assert.ok(en.includes(phrase),phrase);
  }
  assert.doesNotMatch(ja,/「サンプル」/);
  assert.doesNotMatch(en,/Load sample/);
});

test('round display examples in both READMEs match the executed trace and key',()=>{
  const keys=t.deriveRoundKeys(0xC0DE,8),steps=[];
  t.encryptBlock(0x1234,t.DEFAULT_S,t.DEFAULT_P,keys,steps);
  const s=steps[0];
  const equation=s.afterP+' ⊕ '+t.numToHex16(keys[0])+' = '+s.afterK;
  const bits=(0x1234).toString(2).padStart(16,'0').match(/.{4}/g).join(' ');
  for(const doc of [ja,en]){
    assert.ok(doc.includes(equation));
    assert.ok(doc.includes(bits));
  }
  for(const phrase of ['すべて開く','すべて閉じる','ビット15','ビット0','再計算せず']) assert.ok(ja.includes(phrase));
  for(const phrase of ['Expand all','Collapse all','Bit 15','bit 0','do not recompute']) assert.ok(en.includes(phrase));
});
