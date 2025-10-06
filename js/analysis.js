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

  // =========================================================
  // ヘルパー関数
  // =========================================================

  /**
   * 暗号学的に安全な16ビット乱数を生成
   * crypto.getRandomValues が使える場合はそれを使用し、
   * 使えない場合は Math.random() にフォールバック
   *
   * @returns {number} 0〜0xFFFFのランダムな16ビット整数
   */
  const rand16 = () => {
    if (window.crypto && crypto.getRandomValues){
      const buf = new Uint16Array(1);
      crypto.getRandomValues(buf);
      return buf[0];
    }
    // フォールバック（暗号学的に安全でない）
    return (Math.random()*0x10000) & 0xFFFF;
  };

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
   * 理想的なブロック暗号では、平均して50%（8/16ビット）が変化する。
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
  const avalancheTrials = (trials, S, P, roundKeys) => {
    // 逆写像は使わないが、一貫性のため計算
    const invS = ToySPN.invertSBox(S);
    const invP = ToySPN.invertPermutation(P);

    // ヒストグラム: hist[i] = 反転ビット数がiだった回数
    const hist = new Array(17).fill(0);
    let sum = 0;

    for (let i = 0; i < trials; i++){
      // ランダムな平文
      const pt = rand16();
      // ランダムに1ビット選択
      const bit = 1 << (rand16() % 16);
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
    const W = canvas.width, H = canvas.height;

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
      const x = 40 + i * barW + 4;
      const y = (H-30) - h;

      // バーを描画
      ctx.fillRect(x, y, barW - 8, h);

      // X軸ラベル（反転ビット数）
      ctx.font = '10px monospace';
      ctx.fillText(String(i), x+2, H-15);
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

})(window);
