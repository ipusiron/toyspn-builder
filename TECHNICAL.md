# 技術仕様書 - ToySPN Builder

このドキュメントは、ToySPN Builderの技術的な実装の詳細、アルゴリズム、設計上の工夫について解説します。

---

## 📋 目次

1. [アーキテクチャ概要](#アーキテクチャ概要)
2. [コアアルゴリズム](#コアアルゴリズム)
3. [セキュリティ実装](#セキュリティ実装)
4. [パフォーマンス最適化](#パフォーマンス最適化)
5. [UI/UX設計の工夫](#uiux設計の工夫)
6. [数学的背景](#数学的背景)

---

## アーキテクチャ概要

### モジュール構成

```
ToySPN Builder
├── core.js        (暗号化エンジン)
│   ├── ビット操作関数
│   ├── SPN変換関数
│   └── 鍵スケジュール
├── analysis.js    (解析エンジン)
│   ├── 乱数生成
│   ├── アバランシェテスト
│   └── 統計処理
├── messages.js    (日英辞書、表示言語、文言更新)
└── ui.js          (UIコントローラー)
    ├── イベントハンドラ
    ├── DOM操作（XSS対策済み）
    └── SVG可視化
```

### 設計原則

1. 依存ゼロ: 純粋なHTML/CSS/JavaScriptのみで実装
2. IIFEパターン：公開APIだけをToySPN、ToySPNAnalysis、ToySPNMessagesとして公開
3. 状態の分離：UIは編集可能な状態を持ち、解析開始時に配列をコピー
4. セキュリティファースト: XSS対策、入力バリデーション

---

## コアアルゴリズム

### 1. ビット置換（P層）の実装

特徴: 高速なビットレベル操作

```javascript
const permute16 = (x, P) => {
  let y = 0;
  for (let i = 0; i < 16; i++){
    const bit = (x >>> i) & 1;  // i番目のビットを取得
    y |= (bit << P[i]);          // P[i]番目の位置にセット
  }
  return y & 0xFFFF;
};
```

工夫点:
- ビットマスクとシフト演算による高速処理
- ループ展開不要（16回固定で十分高速）
- 配列ルックアップによる柔軟な置換定義

計算量：16回固定のループです。暗号実装としての定数時間性を保証するものではありません。

---

### 2. S-Box（ニブル置換）の実装

特徴：4つのニブルを順番に処理

```javascript
const subNib16 = (x, S) => {
  let y = 0;
  for (let i = 0; i < 4; i++){
    const nib = (x >>> (i*4)) & 0xF;  // i番目のニブル（4bit）
    y |= (S[nib] & 0xF) << (i*4);      // S-Box適用後、元の位置へ
  }
  return y & 0xFFFF;
};
```

工夫点:
- 4ビットごとに表を参照するループ
- S-Boxの内容に応じた変換（全単射でも線形の場合あり）
- JavaScriptエンジンやメモリーアクセスの時間差は評価対象外

拡張性:
- 現在のブロックは16ビット、S-Boxは4ビット固定
- サイズを変えるにはビット演算、UI、検証、テストを含む設計変更が必要

---

### 3. 鍵スケジュール

特徴：16ビットの左回転と固定定数のXOR

```javascript
// 数値範囲の検証後に実行する導出部分の抜粋
const deriveRoundKeys = (masterKey, rounds) => {
  const keys = [];
  let k = masterKey & 0xFFFF;
  for (let r = 0; r < rounds; r++){
    const rot = (r % 5) + 1;              // 1〜5ビット回転
    k = rotl16(k, rot) ^ RC[r % RC.length];  // 回転 + 定数XOR
    keys.push(k & 0xFFFF);
  }
  return keys;
};
```

工夫点:
- 可変回転量：ラウンド番号rは0から始まり、回転量は(r % 5) + 1
- ラウンド定数：固定の16要素を使用。定数列には重複あり
- 左回転：ビットの循環で情報損失なし

数学的性質:
```
k_r = ROT(k_{r-1}, (r mod 5) + 1) ⊕ RC[r]
```
- 回転はGF(2)上の線形変換、定数XORを含む全体はアフィン変換
- RC配列はラウンド鍵の独立性や関連鍵攻撃への耐性を保証しない
- 実装は鍵0〜65535、ラウンド数1〜16の整数を検証してから導出

鍵C0DEの8個のラウンド鍵は次のとおりです。

```text
365C 4747 FCD5 9F99 C694 923B D6D9 012F
```

---

### 4. 全単射（Bijection）検証

特徴: 高速な一意性チェック

```javascript
const isBijection = (arr, size) => {
  if (!Array.isArray(arr) || arr.length !== size) return false;
  const seen = new Set(arr);           // O(n)
  if (seen.size !== size) return false; // 重複チェック
  for (let i = 0; i < size; i++){
    if (!Number.isInteger(arr[i]) || arr[i] < 0 || arr[i] >= size)
      return false;
  }
  return true;
};
```

工夫点:
- Setによる重複検出: O(n) で高速
- 3段階チェック: 長さ → 重複 → 範囲
- 早期リターン: 最初の不正で即座に終了

数学的意味:
- 全単射 ⇔ すべての入力が異なる出力に一意対応
- 可逆性の必要十分条件

---

## セキュリティ実装

### 1. XSS対策

動的な値はHTMLとして解釈させず、textContentで描画します。
要素はcreateElementやcreateElementNSで作り、内容のクリアにはreplaceChildrenを使います。

```javascript
const h4 = document.createElement('h4');
ToySPNMessages.text(h4, 'ラウンド {0}', s.round);
div.appendChild(h4);
```

翻訳関数も最終的にtextContentへ代入します。
辞書の文字列からHTMLを生成することはありません。

適用箇所：

- 暗号化と復号のステップ
- 設定検証の結果
- ヒストグラム表
- 観測値の解説
- SVGのラベル

---

### 2. 入力バリデーション

型と文字列全体を検証し、入力を別の値へ補正して実行することはありません。

```javascript
const clampHex16 = (s) => {
  if (typeof s !== 'string' || !/^[0-9a-fA-F]{1,4}$/.test(s.trim())) fail('invalidHex');
  s = s.trim().toUpperCase();
  return s.padStart(4, '0');
};
```

関数名はclampHex16ですが、範囲外の値を切り詰める関数ではありません。
正常な入力だけを大文字4桁に正規化します。

| 入力 | 扱い |
| --- | --- |
| `abc` | `0ABC` |
| `0` | `0000` |
| 空欄、`12G4`、`0x12` | invalidHex |
| `10000` | invalidHex |
| ラウンド数`1.5`、`1e1`、`17` | invalidRounds |
| 試行回数`9`、`2001` | invalidTrials |

整数は数字のみの文字列を検証し、Number.isSafeIntegerと範囲チェックを行います。
S-Boxは0〜F、P層は0〜15がそれぞれ1回ずつ現れる配列である必要があります。
個々の要素の入力エラーはaria-invalidで示し、重複を含む表全体のエラーはステータスで通知します。

coreの低レベル変換関数は、検証済みの表と16ビット値を受け取る前提です。
UIとavalancheTrialsでその境界を検証します。

---

### 3. Content Security Policy (CSP)

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'none'; script-src 'self'; style-src 'self';
  img-src 'self' data:; connect-src 'none'; base-uri 'none';
  form-action 'none'; object-src 'none';
">
<meta name="referrer" content="no-referrer">
```

- スクリプトとCSS：同一オリジンのファイルだけを許可
- 画像：同一オリジンとdata URLだけを許可
- 接続、フォーム送信、base要素、プラグイン：禁止
- インラインスクリプト、eval、インラインstyle属性：使用しない

frame-ancestorsはmetaでは無視されます。
X-Frame-OptionsとX-Content-Type-OptionsもHTTPヘッダー専用です。
本ツールはこれらによる埋め込み拒否やMIME制御を保証しません。
根拠は[W3C CSP仕様](https://www.w3.org/TR/CSP/#directive-frame-ancestors)と[セキュリティ文書](SECURITY.md)を参照してください。

---

## パフォーマンス最適化

### 1. アバランシェテスト - 効率的な統計処理

1試行で2回暗号化します。1000試行なら2000回の暗号化を実行します。

以下は入力検証とエラー処理を省略した計算部分です。

```javascript
const avalancheTrials = (trials, S, P, roundKeys) => {
  const hist = new Array(17).fill(0);  // 事前確保
  let sum = 0;

  for (let i = 0; i < trials; i++){
    const pt = rand16();
    const bit = 1 << (rand16() % 16);
    const pt2 = pt ^ bit;

    // この実装では2回の暗号化を順番に実行
    const c1 = ToySPN.encryptBlock(pt, S, P, roundKeys);
    const c2 = ToySPN.encryptBlock(pt2, S, P, roundKeys);

    // 2つの暗号文のハミング距離を計算
    const diff = hamming16(c1 ^ c2);
    hist[diff] += 1;  // O(1) 更新
    sum += diff;
  }

  return { hist, avg: sum / trials };
};
```

ハミング距離の高速計算:
```javascript
const hamming16 = (x) => {
  x &= 0xFFFF;
  let c = 0;
  while (x){
    c += x & 1;  // 最下位ビット
    x >>>= 1;    // 論理右シフト（符号なし）
  }
  return c;
};
```

代替手法との比較:
- Population Count (POPCNT): CPU命令だが、JSから直接使えない
- ルックアップテーブル: メモリ vs 速度のトレードオフ（今回は不要）
- 現在の実装：最大16回のループ。処理時間の比較測定は行っていない

---

### 2. SVG可視化の更新

S-BoxとP層の図はそれぞれ16本の対応線を持ちます。
更新時には点、ラベル、線のグループをクリアして作り直します。
表が不正な場合は線を描かず、誤った対応を示さないようにします。

```javascript
inputDots.replaceChildren();
outputDots.replaceChildren();
arrows.replaceChildren();
if (!ToySPN.isBijection(S, 16)) return;
```

矢印先端のdefsは各SVGに1つだけ作り、再利用します。
S-Boxにはarrowhead、P層にはarrowhead-pという異なるIDを使います。
繰り返し編集しても、同じIDの定義が蓄積しない構成です。

DocumentFragmentによる一括更新や、描画速度が何倍になるという保証はありません。
ブラウザーの描画性能とは別に、要素数とIDの一意性を検証します。

---

### 3. 乱数生成とWeb Crypto API

ランダムな鍵、S-Box、P層、解析の平文と反転位置は、coreのrandom16を通じて生成します。

```javascript
const random16 = () => {
  if (!global.crypto || typeof global.crypto.getRandomValues !== 'function') fail('randomUnavailable');
  try {
    return global.crypto.getRandomValues(new Uint16Array(1))[0];
  } catch (_) {
    return fail('randomUnavailable');
  }
};
```

Web Cryptoが利用できない場合はエラーとして扱います。
Math.randomへの代替は行いません。
SとPは生成が完了してからUIの状態に反映するため、途中で乱数取得が失敗しても表は一部分だけ変更されません。

解析では65536通りの乱数を16で割った余りで、反転位置を選びます。
65536は16で割り切れるため、この操作で位置の確率に偏りは生じません。
ただし、乱数源の品質が暗号そのものの安全性を保証するわけではありません。

---

## UI/UX設計の工夫

### 1. 即時検証と結果の失効

SとPはUIのIIFE内で管理します。
表の編集では、入力を読み直し、全単射性と図を更新します。

```javascript
const onSBoxChange = () => {
  invalidate();
  S = readSBox();
  const ok = ToySPN.isBijection(S, 16);
  M.text(sStatus, ok ? '全単射 ✅' : '全単射ではありません ❌');
  sStatus.className = 'status ' + (ok ? 'ok' : 'bad');
  drawSBoxVisualization(S);
};
```

逆Sと逆Pを生成するのは復号時です。
入力中の不正な表から逆写像を作ることはありません。

| 変更した値 | 消す結果 | 保持するもの |
| --- | --- | --- |
| S、P、鍵、ラウンド数 | 暗号化手順、検証結果、解析 | 平文と暗号文の入力欄 |
| 平文、暗号文 | 暗号化手順、検証結果 | 設定に対する解析 |
| 試行回数 | 解析 | 暗号化手順 |
| 標準サンプル | すべての計算結果 | 試行回数 |
| 表示言語 | なし | 入力とすべての数値結果 |

IME変換中は実行を拒否します。
数値入力の変更だけでなく、リセット、ランダム生成、恒等表への変更も同じ失効処理を通ります。

現在の設定は入力欄から読み取り、暗号化/復号と解析の両タブに表示します。
S/Pは全単射を検証してから標準表、恒等表、カスタム表を区別し、不正な表は「要修正」と表示します。
鍵とラウンド数も計算部と同じ検証関数を使い、IME変換中は「入力中」と表示します。
設定の表示処理では入力値を書き換えず、暗号処理や乱数生成も行いません。

### 2. 観測値と解析の状態管理

解析開始時にS、P、鍵、ラウンド数、試行回数を固定します。
SとPはコピーし、実行ボタンを無効化してから遅延処理を予約します。
入力が変わった場合は予約を取り消し、実行世代の番号でも古い処理を拒否します。

計算本体はメインスレッドで同期実行します。
計算が始まった後に途中で中断する機能はありません。
setTimeoutの内側にもtry/catch/finallyを置き、乱数の取得失敗を画面に通知してボタンを有効に戻します。

結果には次を表示します。

- 0〜16ビットの17区分の回数と割合
- 平均反転ビット数
- 7〜9ビットの試行数と割合
- S、P、鍵、ラウンド数、試行回数
- 安全性やSACを判定していないという注記

```javascript
const centerCount = hist[7] + hist[8] + hist[9];
const centerPct = centerCount / trials * 100;
```

centerPctはこの標本での割合であり、合否判定の閾値ではありません。
UIは暗号強度を採点しません。

実行前、結果失効、解析中、エラー、完了を区別して案内を表示します。
解析結果の領域は完了時だけ表示し、現在の設定とは別に「実行時の条件と結果」を示します。
暗号化/復号の操作案内はステップ領域の外に置き、古いステップを消した状態でも次の操作を説明します。
標準サンプルは案内を実行前の状態に戻します。

ラウンド手順は共通のrenderStepsで描画します。
各ラウンドをdetails/summaryで開閉し、最初に処理する1件を開きます。summaryにはラウンド番号と入出力を残します。
2進数表示は記録済みの16進数を16桁にゼロ埋めし、4桁ずつ区切ります。左端はビット15、右端はビット0です。
鍵XORの表示には、その実行に渡したラウンド鍵配列のround - 1番目を使います。
暗号化ではafterP、復号ではbeforeがXOR前の値で、どちらもafterKがXOR後の値です。
開閉とビット表示の切替はDOMの表示状態だけを変更し、暗号化、鍵導出、乱数生成を実行しません。
入力変更やエラーで結果が消えたら表示用の操作欄も隠します。ビット表示の選択はページ内で保持し、保存領域には書き込みません。

言語切替は登録済みの文言と属性を翻訳し、数値を計算し直しません。
辞書の保存対象は言語設定だけで、入力や解析結果をlocalStorageへ保存しません。
保存へのアクセスが例外になっても、現在のページ上での切替は動作します。

Canvasは表示幅とdevicePixelRatioに合わせて描画し、文字は12pxを保ちます。
幅が狭い場合は横軸の目盛りを2刻みにし、全17区分の正確な数値は表に表示します。
ResizeObserverは保存したヒストグラムを再描画するだけで、ランダム解析を再実行しません。

---

### 3. SVG可視化 - 直線矢印による明快な対応表現

設計判断: 曲線ではなく直線を採用

```javascript
// 直線（採用）
const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
line.setAttribute('x1', inputX);
line.setAttribute('y1', inputY + 5);
line.setAttribute('x2', outputX);
line.setAttribute('y2', outputY - 5);
```

各入力と出力の対応を線で示します。
恒等写像では垂直線になります。
線の交差は表の内容によって変わり、曲線より高速であるという測定結果はありません。

図は横方向へスクロールでき、入力欄やページ全体は画面幅に合わせて折り返します。
タブは矢印キーとHome/End、補足説明はEnterとEscapeで操作できます。
非表示のパネルにはhidden属性を使い、CSSでも確実に非表示にします。

---

## 数学的背景

### 1. SPNの可逆性の証明

定理: S, P が全単射 ⇒ SPN は可逆

証明:
```
x: 入力状態、S: S層、P: P層、k: 固定したラウンド鍵
1ラウンドの暗号化: y = P(S(x)) ⊕ k
逆変換: x' = S⁻¹(P⁻¹(y ⊕ k))

x' = x を示す:
  x' = S⁻¹(P⁻¹((P(S(x)) ⊕ k) ⊕ k))
     = S⁻¹(P⁻¹(P(S(x))))      (XORの自己逆性)
     = S⁻¹(S(x))               (P⁻¹ ∘ P = id)
     = x                       (S⁻¹ ∘ S = id)
```

各ラウンドが可逆なので、ラウンド順も逆にたどれば全体を復号できます。

実装での対応:
- `invertSBox(S)`: S⁻¹ を計算
- `invertPermutation(P)`: P⁻¹ を計算
- `isBijection()`: 全単射性を検証

---

### 2. アバランシェ効果の確率モデル

各出力ビットが独立に確率1/2で反転すると仮定すれば、反転ビット数は二項分布になります。

```text
Y ~ Binomial(n=16, p=0.5)
E[Y] = 16 × 0.5 = 8
Var[Y] = 16 × 0.5 × 0.5 = 4
標準偏差 = 2
```

これは比較のためのモデルです。
全単射である暗号では異なる入力が同じ暗号文になることはないため、反転数0は生じません。
厳密なランダム置換の出力差の分布は、0を含む上記の二項分布と同じではありません。

また、平均8という値から独立性やSACを導くことはできません。
SACは、各入力ビットを反転したときに各出力ビットが半分の入力で反転する条件です。
本ツールはその入力ビットと出力ビットの組ごとの確率を計測しません。

確認用の例：

- 恒等S-Box：有効なPと固定鍵なら、どの入力差も反転数1
- 線形S = [0,E,D,3,B,5,6,8,7,9,A,4,C,2,1,F]とデフォルトP：全16入力ビット差の平均は1〜4ラウンドで3、9、3、1
- デフォルト設定のランダム試行：結果は標本に依存し、特定の範囲への一致を保証しない

---

### 3. 鍵スケジュールの限界

```text
k_r = ROT(k_(r-1), rot(r)) ⊕ RC[r]
```

回転と固定値のXORからなる導出は、GF(2)上のアフィン変換です。
ラウンド定数には重複があり、ラウンド鍵が独立になる保証もありません。
ただし、定数の重複だけでラウンド鍵が同一になるとは限りません。

16ビットのマスター鍵は65,536通りしかありません。
入力全体も65,536通りの小さな教材であり、実際の情報保護には利用できません。

[AESの仕様（FIPS 197）](https://csrc.nist.gov/pubs/fips/197/final)は別の構成を定めています。
AESの鍵展開ではRotWord、SubWord、Rconを使います。
MixColumnsは暗号化ラウンドの変換であり、鍵展開の処理ではありません。

---

### 4. Fisher-Yates シャッフル（ランダム生成）

実装は16要素固定です。

```javascript
const shuffledTable = () => {
  const table = Array.from({ length: 16 }, (_, i) => i);
  for (let i = 15; i > 0; i--) {
    const limit = 65536 - (65536 % (i + 1));
    let value;
    do { value = random16(); } while (value >= limit);
    const j = value % (i + 1);
    [table[i], table[j]] = [table[j], table[i]];
  }
  return table;
};
```

余りを取る前に、65536を選択肢の数で割った余りの区間を捨てます。
そのため、一様な16ビット乱数を仮定すれば、各jが等確率になります。
たとえば選択肢が15個なら、65535を引いた場合に再取得します。

交換だけで表を作るため、全単射性を保持します。
各段階で独立な一様乱数を使うという仮定のもとで、16!個の順列は等確率です。
生成回数は棄却が起きるかどうかで変わるため、取得回数が固定とは限りません。

---

## 開発ガイドライン

### コード規約

1. 命名規則:
   - 関数: `camelCase`
   - 定数: `UPPER_SNAKE_CASE`
   - プライベート: 先頭アンダースコア不要（IIFE内部で隠蔽）

2. コメント:
   - JSDoc形式で全公開関数に記述
   - アルゴリズムの「なぜ」を説明

3. セキュリティ:
   - `innerHTML` 使用禁止
   - すべての入力をバリデーション
   - 型チェックを徹底

### テスト方針

手動テスト項目:
- [ ] S-Box全単射チェック（重複入力時）
- [ ] P層全単射チェック（範囲外入力時）
- [ ] 暗号化→復号で元に戻る
- [ ] アバランシェテスト実行（1000回）
- [ ] SVG可視化の正確性
- [ ] ブラウザーコンソールエラーなし

自動テストはNode.js標準のnode:testとassert/strictを使用します。
パッケージのインストールは不要です。

```sh
npm test
```

```javascript
const { test } = require('node:test');
const assert = require('node:assert/strict');
const ToySPN = require('./js/core.js');
test('bijection', () => {
  assert.equal(ToySPN.isBijection([1, 2, 3, 0], 4), true);
  assert.equal(ToySPN.isBijection([1, 1, 2, 3], 4), false);
});
```

- 既知の暗号文とラウンド鍵、デフォルト設定の全65,536平文往復
- 不正な入力、乱数の不在と取得失敗、シャッフルの棄却
- 固定した試行値でのヒストグラムと平均、教育上の反例
- 日英辞書、READMEの見出しと例、相対リンク、整形、CSP
- ブラウザーでは入力変更、言語切替、未確定入力、キーボード、狭い画面を確認

---

## 参考文献

1. SPN構造:
   - Joan Daemen, Vincent Rijmen. "The Design of Rijndael: AES - The Advanced Encryption Standard" (2002)

2. アバランシェ効果:
   - Webster, A.F., Tavares, S.E. "On the design of S-boxes" (CRYPTO 1985)

3. 暗号学的乱数:
   - W3C. "Web Cryptography API" - https://www.w3.org/TR/WebCryptoAPI/

4. XSS対策:
   - OWASP. "Cross Site Scripting Prevention Cheat Sheet"

5. Fisher-Yates シャッフル:
   - Knuth, D.E. "The Art of Computer Programming, Volume 2" (Algorithm P)

---

## 実装の確認方法

コード例は説明用の抜粋を含みます。
実行する正確な処理はjs/内のソースを参照してください。

```sh
git log --oneline
npm test
```

変更後は、Node.jsのテストに加え、HTTPとfile://の画面を確認します。
GitHub Actionsのpushとpull_request両方が成功してから、通常マージで公開します。
mainへの直接pushや、テストの期待値を変更して失敗を隠す運用は行いません。

---

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE) を参照してください。
