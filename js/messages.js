// UI messages are kept separate from numeric cipher operations.
(function(global){
  'use strict';
  const ja = {
    changed: '入力や設定が変わりました。再実行してください。入力欄の値は保持しています。',
    composing: '文字の入力を確定してから実行してください。',
    invalidHex: '16進数を1〜4桁で入力してください（0〜9、A〜F）。',
    invalidInteger: '指定範囲の整数を入力してください。',
    invalidRounds: 'ラウンド数は1〜16の整数で入力してください。',
    invalidTrials: '試行回数は10〜2000の整数で入力してください。',
    invalidTables: 'S-Boxは0〜F、P層は0〜15を、それぞれ重複なく入力してください。',
    randomUnavailable: 'Web Cryptoの乱数を利用できません。設定や結果は変更していません。',
    failed: '処理を完了できませんでした。入力とブラウザーの機能を確認してください。'
  };
  global.ToySPNMessages = { ja, error: e => ja[e.code] || ja.failed };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.ToySPNMessages;
})(typeof window !== 'undefined' ? window : globalThis);
