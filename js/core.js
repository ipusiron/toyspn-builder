/**
 * ToySPN Builder - Core Cipher Logic (16-bit block)
 *
 * このファイルはSPN（Substitution-Permutation Network）暗号の
 * コアロジックを実装しています。
 *
 * 主な機能:
 * - 16ビットブロック暗号の暗号化/復号
 * - S-Box（4bit置換）の適用
 * - P層（16bitビット置換）の適用
 * - 鍵スケジュール（Rotate + XOR）
 * - 入力バリデーション
 *
 * @module ToySPN/core
 */

(function(global){
  'use strict';

  // =========================================================
  // ユーティリティ関数
  // =========================================================

  /**
   * 16進数文字列を正規化し、4桁に整形する
   * セキュリティ: 型チェック、不正文字削除、長さ制限
   *
   * @param {string} s - 入力文字列
   * @returns {string} 4桁の16進数文字列（例: "C0DE"）
   */
  const clampHex16 = (s) => {
    // 型チェック: string以外は空文字列に変換
    if (typeof s !== 'string') s = '';
    // 16進数文字以外を削除し、大文字化
    s = s.trim().replace(/[^0-9a-fA-F]/g, '').toUpperCase();
    // 空文字列は0000に変換
    if (s.length === 0) s = '0000';
    // 4桁超過は下位4桁のみ取得
    if (s.length > 4) s = s.slice(-4);
    // 左側を0でパディングして4桁に
    return s.padStart(4, '0');
  };

  /**
   * 16進数文字列を16ビット整数に変換
   * セキュリティ: Number.isFinite()で不正値（NaN, Infinity）を検出
   *
   * @param {string} h - 16進数文字列
   * @returns {number} 16ビット整数（0x0000〜0xFFFF）
   */
  const hex16ToNum = (h) => {
    const clamped = clampHex16(h);
    const num = parseInt(clamped, 16);
    // NaN/Infinityチェック: 不正値は0に変換
    return (Number.isFinite(num) ? num : 0) & 0xFFFF;
  };

  /**
   * 16ビット整数を16進数文字列に変換
   *
   * @param {number} n - 整数値
   * @returns {string} 4桁の16進数文字列（例: "C0DE"）
   */
  const numToHex16 = (n) => {
    // 不正な数値は0に変換
    if (!Number.isFinite(n)) n = 0;
    return (n & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  };

  /**
   * 16ビット左回転
   *
   * @param {number} x - 回転する値
   * @param {number} r - 回転ビット数
   * @returns {number} 回転後の16ビット値
   */
  const rotl16 = (x, r) => ((x << (r & 15)) | (x >>> (16 - (r & 15)))) & 0xFFFF;

  // =========================================================
  // SPN コア変換関数
  // =========================================================

  /**
   * P層（ビット置換）を適用
   * 16個のビット位置を並べ替える線形変換
   *
   * @param {number} x - 入力16ビット値
   * @param {Array<number>} P - 置換テーブル（長さ16、0〜15の順列）
   * @returns {number} 置換後の16ビット値
   * @example
   * // P = [0,4,8,12,1,5,9,13,2,6,10,14,3,7,11,15] の場合
   * // bit 0 → bit 0, bit 1 → bit 4, bit 2 → bit 8, ...
   */
  const permute16 = (x, P) => {
    let y = 0;
    for (let i = 0; i < 16; i++){
      const bit = (x >>> i) & 1; // i番目のビットを取得
      y |= (bit << P[i]);         // P[i]番目の位置にセット
    }
    return y & 0xFFFF;
  };

  /**
   * S-Box（4bit置換）を4つのニブルに適用
   * 非線形変換の核心部分
   *
   * @param {number} x - 入力16ビット値（4ニブル）
   * @param {Array<number>} S - S-Boxテーブル（長さ16、0x0〜0xFの順列）
   * @returns {number} S-Box適用後の16ビット値
   * @example
   * // 16ビット値を4つの4bitニブルに分割し、各ニブルにS-Boxを適用
   * // 0x1234 → nibble[0]=4, nibble[1]=3, nibble[2]=2, nibble[3]=1
   */
  const subNib16 = (x, S) => {
    let y = 0;
    for (let i = 0; i < 4; i++){
      const nib = (x >>> (i*4)) & 0xF; // i番目のニブル（4bit）を取得
      y |= (S[nib] & 0xF) << (i*4);     // S-Box適用後、元の位置にセット
    }
    return y & 0xFFFF;
  };

  /**
   * P層の逆置換を計算
   *
   * @param {Array<number>} P - 元の置換テーブル
   * @returns {Array<number>} 逆置換テーブル
   */
  const invertPermutation = (P) => {
    const inv = new Array(P.length).fill(0);
    for (let i = 0; i < P.length; i++){
      inv[P[i]] = i; // P[i] → i の逆写像
    }
    return inv;
  };

  /**
   * S-Boxの逆写像を計算
   *
   * @param {Array<number>} S - 元のS-Boxテーブル
   * @returns {Array<number>} 逆S-Boxテーブル
   */
  const invertSBox = (S) => {
    const inv = new Array(16).fill(0);
    for (let i = 0; i < 16; i++){
      inv[S[i]] = i; // S[i] → i の逆写像
    }
    return inv;
  };

  /**
   * 配列が全単射（bijection）かチェック
   * 全単射 = すべての要素が一意で、0〜(size-1)の範囲を過不足なく含む
   *
   * @param {Array<number>} arr - チェック対象の配列
   * @param {number} size - 期待される配列サイズ
   * @returns {boolean} 全単射ならtrue
   */
  const isBijection = (arr, size) => {
    // 長さチェック
    if (arr.length !== size) return false;
    // 重複チェック: Set のサイズが配列長と一致するか
    const seen = new Set(arr);
    if (seen.size !== size) return false;
    // 範囲チェック: すべて整数で 0 <= arr[i] < size
    for (let i = 0; i < size; i++){
      if (!Number.isInteger(arr[i]) || arr[i] < 0 || arr[i] >= size) return false;
    }
    return true;
  };

  // =========================================================
  // デフォルト値
  // =========================================================

  /**
   * デフォルトS-Box
   * これは適度な非線形性を持つ例示用の置換表
   */
  const DEFAULT_S = [0xC,0x5,0x6,0xB,0x9,0x0,0xA,0xD,0x3,0xE,0xF,0x8,0x4,0x7,0x1,0x2];

  /**
   * デフォルトP層
   * ニブル単位で列方向に並べ替える設計
   * ビット 0,1,2,3 → ビット 0,4,8,12 のようにマッピング
   */
  const DEFAULT_P = [0,4,8,12, 1,5,9,13, 2,6,10,14, 3,7,11,15];

  // =========================================================
  // 鍵スケジュール
  // =========================================================

  /**
   * ラウンド定数（Round Constants）
   * 各ラウンドで異なる定数をXORすることで鍵の独立性を高める
   */
  const RC = [
    0xB7E1, 0x9E37, 0xC6EF, 0x52C6, 0x35A7, 0x1F12, 0x9E37, 0xB7E1,
    0x7F4A, 0xA54F, 0x3C6E, 0xBB67, 0x6A09, 0x510E, 0x1F83, 0x5BE0
  ];

  /**
   * マスター鍵からラウンド鍵を導出
   * 方式: 左回転 + ラウンド定数XOR
   *
   * @param {number} masterKey - 16ビットマスター鍵
   * @param {number} rounds - ラウンド数
   * @returns {Array<number>} ラウンド鍵配列（長さ=rounds）
   */
  const deriveRoundKeys = (masterKey, rounds) => {
    const keys = [];
    let k = masterKey & 0xFFFF;
    for (let r = 0; r < rounds; r++){
      // ラウンドインデックスに応じて回転量を変化（1〜5ビット）
      const rot = (r % 5) + 1;
      // 回転 + ラウンド定数XOR
      k = rotl16(k, rot) ^ RC[r % RC.length];
      keys.push(k & 0xFFFF);
    }
    return keys;
  };

  // =========================================================
  // 暗号化/復号ラウンド関数
  // =========================================================

  /**
   * ブロック暗号化
   * 各ラウンドで S-Box → P層 → AddRoundKey を適用
   *
   * @param {number} pt - 平文（16ビット）
   * @param {Array<number>} S - S-Boxテーブル
   * @param {Array<number>} P - P層テーブル
   * @param {Array<number>} roundKeys - ラウンド鍵配列
   * @param {Array<Object>} [stepsOut] - ステップ記録用配列（オプション）
   * @returns {number} 暗号文（16ビット）
   */
  const encryptBlock = (pt, S, P, roundKeys, stepsOut) => {
    let state = pt & 0xFFFF;
    const R = roundKeys.length;

    for (let r = 0; r < R; r++){
      const before = state;

      // 1. SubNib: S-Boxを各ニブルに適用（非線形変換）
      state = subNib16(state, S);
      const afterS = state;

      // 2. PermuteBits: ビット位置を置換（拡散）
      state = permute16(state, P);
      const afterP = state;

      // 3. AddRoundKey: ラウンド鍵とXOR（鍵混合）
      state = (state ^ roundKeys[r]) & 0xFFFF;

      // ステップ記録（UI表示用）
      if (stepsOut){
        stepsOut.push({
          round: r+1,
          before: numToHex16(before),
          afterS: numToHex16(afterS),
          afterP: numToHex16(afterP),
          afterK: numToHex16(state)
        });
      }
    }
    return state & 0xFFFF;
  };

  /**
   * ブロック復号
   * 暗号化の逆順で XOR → InvP → InvS を適用
   *
   * @param {number} ct - 暗号文（16ビット）
   * @param {Array<number>} invS - 逆S-Boxテーブル
   * @param {Array<number>} invP - 逆P層テーブル
   * @param {Array<number>} roundKeys - ラウンド鍵配列
   * @param {Array<Object>} [stepsOut] - ステップ記録用配列（オプション）
   * @returns {number} 平文（16ビット）
   */
  const decryptBlock = (ct, invS, invP, roundKeys, stepsOut) => {
    let state = ct & 0xFFFF;
    const R = roundKeys.length;

    // ラウンドを逆順に実行
    for (let ri = R-1; ri >= 0; ri--){
      const before = state;

      // 1. AddRoundKey: ラウンド鍵とXOR（XORは自己逆元）
      state = (state ^ roundKeys[ri]) & 0xFFFF;
      const afterK = state;

      // 2. InvPermuteBits: 逆ビット置換
      state = permute16(state, invP);
      const afterP = state;

      // 3. InvSubNib: 逆S-Box適用
      state = subNib16(state, invS);

      // ステップ記録（UI表示用）
      if (stepsOut){
        stepsOut.push({
          round: ri+1,
          before: numToHex16(before),
          afterK: numToHex16(afterK),
          afterP: numToHex16(afterP),
          afterS: numToHex16(state)
        });
      }
    }
    return state & 0xFFFF;
  };

  // =========================================================
  // 公開API
  // =========================================================

  /**
   * グローバルオブジェクトにToySPN APIをエクスポート
   * ui.jsから使用される
   */
  global.ToySPN = {
    // ユーティリティ
    clampHex16, hex16ToNum, numToHex16,
    // 逆写像・検証
    invertPermutation, invertSBox, isBijection,
    // コア変換
    permute16, subNib16,
    // デフォルト値
    DEFAULT_S, DEFAULT_P,
    // 暗号化/復号
    deriveRoundKeys, encryptBlock, decryptBlock
  };

})(window);
