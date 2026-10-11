# セキュリティ対策

このドキュメントは、ToySPN Builderのブラウザー上の対策と、教材としての限界を説明します。
Webアプリの対策と、16ビット暗号の安全性は別の問題です。

## 実装済みのセキュリティ対策

### 1. XSS対策

動的な値はtextContentで描画します。
HTMLの文字列として組み立てず、要素はcreateElementで生成します。
内容のクリアにはreplaceChildrenを使います。

対象は暗号化と復号の手順、設定検証、ヒストグラム表、観測結果の解説です。
日英辞書の文字列もHTMLとして解釈しません。

```javascript
const h4 = document.createElement('h4');
ToySPNMessages.text(h4, 'ラウンド {0}', s.round);
div.appendChild(h4);
```

ユーザー入力をHTMLとして扱わないことが対策です。
数値だけを埋め込んだコード例を理由に、実際にXSSが成立するとは判断しません。

### 2. 入力バリデーション

平文、暗号文、鍵は前後の空白を除き、16進数1〜4桁であることを検証します。
不正な文字を削ったり、空欄を0にしたりして実行しません。

```javascript
const clampHex16 = (s) => {
  if (typeof s !== 'string' || !/^[0-9a-fA-F]{1,4}$/.test(s.trim())) fail('invalidHex');
  return s.trim().toUpperCase().padStart(4, '0');
};
```

- ラウンド数：1〜16の整数
- 試行回数：10〜2000の整数
- S-Box：0〜Fが重複なく1回ずつ現れる16要素
- P層：0〜15が重複なく1回ずつ現れる16要素
- IME変換中：実行を拒否

内部のビットマスクは16ビット演算のためであり、入力検証の代わりではありません。
UIと解析APIで表とパラメーターを検証してから、低レベルの変換関数へ渡します。

### 3. Content Security Policy (CSP)

index.htmlのmetaタグで次の方針を指定します。

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'none'; script-src 'self'; style-src 'self';
  img-src 'self' data:; connect-src 'none'; base-uri 'none';
  form-action 'none'; object-src 'none';
">
```

- スクリプトとCSS：同一オリジンのファイルだけを許可
- 画像：同一オリジンとdata URLを許可
- 接続、フォーム送信、base要素、プラグイン：禁止
- インラインスクリプトとeval：許可しない
- 外部CDN：使用しない

この指定だけですべての攻撃を防げるわけではありません。
入力の検証と、HTMLとして解釈させない描画を併用します。

### 4. Referrer PolicyとHTTPヘッダーの限界

```html
<meta name="referrer" content="no-referrer">
```

このページからのリファラー送信を制限します。
別タブで開くリンクにはnoopener noreferrerを付けています。

frame-ancestorsはmeta CSPでは無視されます。
X-Frame-OptionsとX-Content-Type-OptionsもHTTPレスポンスヘッダー専用で、metaに書いても防御になりません。
このプロジェクトは、これらによる埋め込み拒否やMIME制御を保証しません。
根拠は[W3C CSP仕様](https://www.w3.org/TR/CSP/#directive-frame-ancestors)を参照してください。

### 5. SVGと乱数の扱い

SVG要素はcreateElementNSで生成します。
線の座標やラベルは検証済みの表に基づき、不正な表の対応線は描きません。
矢印先端の定義は各SVGで1つにし、IDも分けています。

ランダム生成はWeb CryptoのgetRandomValuesを使います。
取得できなければエラーを通知し、Math.randomへの代替は行いません。
乱数の品質が高くても、16ビット鍵の総数は変わりません。

## 残存リスクと制限事項

### 教育用暗号の限界

- 鍵とブロックは16ビット。鍵は65,536通り
- なだれ効果の平均や分布は暗号の安全性やSACの証明にならない
- 全単射は復号可能性の条件であり、非線形性や安全性の保証ではない
- 認証、暗号利用モード、ファイル暗号化は未実装
- 実際の秘密情報を保護する目的には使用不可

### 保存と通信

入力値と解析結果を送信する機能はありません。
ページの初回取得では配信元への通信が発生します。
言語の選択だけをlocalStorageに保存し、鍵や入力値、結果は保存しません。

入力や鍵はページを開いている間、DOMとJavaScriptのメモリーに存在します。
ブラウザー拡張や端末上の別のソフトウェアから秘密を守る設計ではありません。
このツールへ本物の秘密情報を入力しないでください。

### GitHub Pagesの制限

このリポジトリから任意のHTTPレスポンスヘッダーを設定することはできません。
ヘッダーによる制御が必要な場合は、それを設定できる配信環境が必要です。
PagesではHTTPSを使用し、公開後にも実際の応答とブラウザー動作を確認します。

## 公開前のチェックリスト

- [ ] npm testがすべて成功している
- [ ] 動的な値がHTMLとして解釈されない
- [ ] 不正な入力、乱数取得失敗、IME変換中の操作を確認した
- [ ] 設定変更後に古い結果が残らない
- [ ] 日英切替で計算が再実行されず、入力と結果が維持される
- [ ] HTTPとfile://でconsoleとCSPのエラーがない
- [ ] 狭い画面、非表示パネル、キーボード操作を確認した
- [ ] 公開されたファイルがmainの内容と一致する
