# セキュリティ対策

このドキュメントは、ToySPN Builderにおけるセキュリティ対策について説明します。

## 実装済みのセキュリティ対策

### 1. XSS (Cross-Site Scripting) 対策

#### innerHTML の安全な置き換え
- **問題**: `innerHTML` を使用すると、悪意のあるスクリプトが注入される可能性があります
- **対策**: すべての動的コンテンツ生成を `textContent` と `createElement` に変更
- **影響範囲**:
  - 暗号化/復号ステップ表示 (`renderEncryptSteps`, `renderDecryptSteps`)
  - 検証結果表示 (`validateStatus`)
  - ヒストグラムテーブル (`histogram-tbody`)
  - 専門家ヒント (`hint-content`)
  - SVGマーカー生成 (S-Box/P層の可視化)

#### 具体例
```javascript
// 変更前（脆弱）
div.innerHTML = `<h4>ラウンド ${s.round}</h4>`;

// 変更後（安全）
const h4 = document.createElement('h4');
h4.textContent = `ラウンド ${s.round}`;
div.appendChild(h4);
```

### 2. 入力バリデーション強化

#### 16進数入力の厳格化 (`clampHex16`)
- **対策内容**:
  - 型チェック: `typeof s !== 'string'` でstring以外を拒否
  - 文字セット制限: `/[^0-9a-fA-F]/g` で16進数以外を除去
  - 長さ制限: 最大4文字に制限
  - 空文字列対策: デフォルト値 `'0000'` を設定

#### 数値変換の安全性 (`hex16ToNum`, `numToHex16`)
- **対策内容**:
  - `Number.isFinite()` による不正な数値（NaN, Infinity等）の検出
  - ビットマスク `& 0xFFFF` による範囲制限

```javascript
const hex16ToNum = (h) => {
  const clamped = clampHex16(h);
  const num = parseInt(clamped, 16);
  return (Number.isFinite(num) ? num : 0) & 0xFFFF;
};
```

### 3. Content Security Policy (CSP)

#### 厳格なCSPヘッダー
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self';
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;
               font-src 'self';
               connect-src 'self';
               frame-ancestors 'none';
               base-uri 'self';
               form-action 'self';" />
```

#### 各ディレクティブの説明
- `default-src 'self'`: すべてのリソースを同一オリジンに制限
- `script-src 'self'`: インラインスクリプトを禁止（外部ファイルのみ許可）
- `style-src 'self' 'unsafe-inline'`: CSSは同一オリジン + インラインを許可
- `img-src 'self' data: https:`: 画像は同一オリジン + data URI + HTTPS
- `frame-ancestors 'none'`: クリックジャッキング対策（iframe埋め込み禁止）
- `base-uri 'self'`: base要素の悪用を防止
- `form-action 'self'`: フォーム送信先を同一オリジンに制限

### 4. その他のセキュリティヘッダー

#### X-Content-Type-Options
```html
<meta http-equiv="X-Content-Type-Options" content="nosniff" />
```
- MIMEタイプスニッフィング攻撃を防止

#### X-Frame-Options
```html
<meta http-equiv="X-Frame-Options" content="DENY" />
```
- クリックジャッキング攻撃を防止（すべてのframe埋め込みを拒否）

#### Referrer Policy
```html
<meta name="referrer" content="no-referrer" />
```
- リファラー情報の漏洩を防止

### 5. SVG生成のセキュリティ

#### SVG要素の安全な生成
- `createElementNS` を使用してSVG要素を動的に生成
- `innerHTML` を避け、`setAttribute` と `textContent` を使用

```javascript
// 変更前（脆弱）
defs.innerHTML = `<marker id="arrowhead">...</marker>`;

// 変更後（安全）
const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
marker.setAttribute('id', 'arrowhead');
// ... 他の属性設定
defs.appendChild(marker);
```

## 残存リスクと制限事項

### 教育用ツールであることの明示
- このツールは教育目的であり、実運用の暗号化には使用できません
- ブロックサイズが小さく（16ビット）、暗号学的強度は不十分です

### GitHub Pagesの制限
- `.htaccess` や サーバー設定による追加のセキュリティヘッダーは設定できません
- メタタグによるCSPには一部ブラウザーで制限があります

## セキュリティチェックリスト

デプロイ前に以下を確認してください：

- [ ] すべての `innerHTML` が安全な代替手段に置き換えられている
- [ ] ユーザー入力が適切にバリデーションされている
- [ ] CSPヘッダーが設定されている
- [ ] セキュリティ関連のメタタグが設定されている
- [ ] JavaScriptの構文エラーがない (`node -c js/*.js`)
- [ ] ブラウザーコンソールにエラーが出ていない
- [ ] すべての機能が正常に動作している
