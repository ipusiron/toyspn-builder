/**
 * ToySPN Builder - Analysis Module
 *
 * このファイルはSPN暗号の解析機能を提供します。
 * - アバランシェ効果（なだれ効果）テスト
 * - ヒストグラム描画
 *
 * @module ToySPN/analysis
 */

(function(global){
  'use strict';
  const ToySPN = global.ToySPN || (typeof require === 'function' ? require('./core.js') : null);

  // =========================================================
  // ヘルパー関数
  // =========================================================

  /**
   * 暗号学的に安全な16ビット乱数を生成
   * Web Cryptoが使えない場合は失敗として呼び出し側へ通知する
   *
   * @returns {number} 0〜0xFFFFのランダムな16ビット整数
   */
  const rand16 = () => ToySPN.random16();

  /**
   * ハミング距離（反転ビット数）を計算
   * 16ビット整数の中で1が立っているビットの数を数える
   *
   * @param {number} x - 対象の16ビット整数
   * @returns {number} 1のビット数（0〜16）
   * @example
   * hamming16(0b0101) // => 2
   * hamming16(0xFFFF) // => 16
   */
  const hamming16 = (x) => {
    x &= 0xFFFF;
    let c = 0;
    while (x){
      c += x & 1;  // 最下位ビットをカウント
      x >>>= 1;    // 右シフト
    }
    return c;
  };

  // =========================================================
  // アバランシェ効果テスト
  // =========================================================

  /**
   * アバランシェ効果（なだれ効果）テストを実行
   *
   * 平文の1ビットだけを反転させた場合、暗号文が何ビット変化するかを測定。
   * 各出力ビットが確率1/2で反転するモデルの平均は8ビット。安全性は判定しない。
   *
   * アルゴリズム:
   * 1. ランダムな平文を生成
   * 2. ランダムに1ビットを選んで反転
   * 3. 元の平文と反転した平文をそれぞれ暗号化
   * 4. 暗号文のハミング距離を測定
   * 5. これをtrials回繰り返してヒストグラムと平均を計算
   *
   * @param {number} trials - 試行回数（例: 1000）
   * @param {Array<number>} S - S-Boxテーブル
   * @param {Array<number>} P - P層テーブル
   * @param {Array<number>} roundKeys - ラウンド鍵配列
   * @returns {Object} { hist: Array<number>, avg: number }
   *   - hist: 反転ビット数の分布（インデックス0〜16）
   *   - avg: 平均反転ビット数
   */
  const avalancheTrials = (trials, S, P, roundKeys, random = rand16) => {
    if (!Number.isInteger(trials) || trials < 10 || trials > 2000) {
      throw Object.assign(new Error('invalidTrials'), { code: 'invalidTrials' });
    }
    if (!ToySPN.isBijection(S,16) || !ToySPN.isBijection(P,16)) {
      throw Object.assign(new Error('invalidTables'), { code: 'invalidTables' });
    }
    if (!Array.isArray(roundKeys) || roundKeys.length < 1 || roundKeys.length > 16 ||
        !roundKeys.every(k => Number.isInteger(k) && k >= 0 && k <= 0xFFFF)) {
      throw Object.assign(new Error('invalidRounds'), { code: 'invalidRounds' });
    }

    // ヒストグラム: hist[i] = 反転ビット数がiだった回数
    const hist = new Array(17).fill(0);
    let sum = 0;

    for (let i = 0; i < trials; i++){
      // ランダムな平文
      const pt = random();
      // ランダムに1ビット選択
      const position = random();
      if (![pt, position].every(n => Number.isInteger(n) && n >= 0 && n <= 0xFFFF)) {
        throw Object.assign(new Error('randomUnavailable'), { code: 'randomUnavailable' });
      }
      const bit = 1 << (position % 16);
      // 1ビットだけ反転した平文
      const pt2 = pt ^ bit;

      // 両方を暗号化
      const c1 = ToySPN.encryptBlock(pt, S, P, roundKeys);
      const c2 = ToySPN.encryptBlock(pt2, S, P, roundKeys);

      // 暗号文の差分のハミング距離
      const diff = hamming16(c1 ^ c2);
      hist[diff] += 1;
      sum += diff;
    }

    return {
      hist,                 // 分布
      avg: sum / trials     // 平均反転ビット数
    };
  };

  // =========================================================
  // ヒストグラム描画
  // =========================================================

  /**
   * Canvas上にヒストグラムを描画
   *
   * @param {HTMLCanvasElement} canvas - 描画先のcanvas要素
   * @param {Array<number>} hist - ヒストグラムデータ（長さ17）
   */
  const drawHistogram = (canvas, hist) => {
    const ctx = canvas.getContext('2d');
    const W = Math.max(180, canvas.getBoundingClientRect().width), H = 240;
    const scale = global.devicePixelRatio || 1;
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.fillStyle = '#1f2937';
    ctx.strokeStyle = '#1f2937';
    ctx.font = '12px monospace';

    // キャンバスをクリア
    ctx.clearRect(0,0,W,H);

    // 軸を描画（L字型）
    ctx.beginPath();
    ctx.moveTo(40, 10);        // 上端
    ctx.lineTo(40, H-30);      // 下端（縦軸）
    ctx.lineTo(W-10, H-30);    // 右端（横軸）
    ctx.stroke();

    // ヒストグラムの最大値を取得（スケーリング用）
    const maxV = Math.max(...hist) || 1;
    const barW = (W - 60) / hist.length;

    // 各バーを描画
    for (let i = 0; i < hist.length; i++){
      const v = hist[i];
      // 高さを最大値に対する割合で計算
      const h = Math.floor((H - 50) * (v / maxV));
      const x = 40 + i * barW + 1;
      const y = (H-30) - h;

      // バーを描画
      ctx.fillRect(x, y, Math.max(1, barW - 2), h);

      // X軸ラベル（反転ビット数）
      if (W >= 420 || i % 2 === 0) ctx.fillText(String(i), x, H-12);
    }
  };

  // =========================================================
  // 公開API
  // =========================================================

  /**
   * グローバルオブジェクトに解析APIをエクスポート
   * ui.jsから使用される
   */
  global.ToySPNAnalysis = {
    avalancheTrials,   // アバランシェテスト実行
    drawHistogram      // ヒストグラム描画
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.ToySPNAnalysis;

})(typeof window !== 'undefined' ? window : globalThis);
