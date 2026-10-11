// UI messages are kept separate from numeric cipher operations.
(function(global){
  'use strict';
  const ja = {
    changed: '入力や設定が変わりました。再実行してください。入力欄の値は保持しています。',
    composing: '文字の入力を確定してから実行してください。',
    measured: '今回の観測結果',
    measurementLimit: '平均反転ビット数と分布は、今回の条件でのなだれ効果の観測値です。' +
      '暗号の安全性やSACの合否を判定するものではありません。',
    measurementHints: [
      '試行ごとにランダムな平文と反転位置を選ぶため、同じ設定でも結果は変わります。',
      '全単射は復号できるための条件です。非線形性や安全性を保証しません。',
      'S-Box、P層、ラウンド数を1項目ずつ変えて分布を観察してください。ラウンド増加による改善は保証されません。',
      '鍵は16ビット（65,536通り）の教育用です。実際の秘密情報の保護には使えません。'
    ],
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
