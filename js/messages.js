// Explicit text translations; numeric cipher operations are language-independent.
(function(global) {
  'use strict';
  const ja = {
    "changed":
      "入力や設定が変わりました。再実行してください。入力欄の値は保持しています。",
    "composing":
      "文字の入力を確定してから実行してください。",
    "measured":
      "今回の観測結果",
    "measurementLimit":
      "平均反転ビット数と分布は、今回の条件でのなだれ効果の観測値です。暗号の安全性やSACの合否を判定するものではありません。",
    "measurementHints":
      [
      "試行ごとにランダムな平文と反転位置を選ぶため、同じ設定でも結果は変わります。",
      "全単射は復号できるための条件です。非線形性や安全性を保証しません。",
      "S-Box、P層、ラウンド数を1項目ずつ変えて分布を観察してください。ラウンド増加による改善は保証されません。",
      "鍵は16ビット（65,536通り）の教育用です。実際の秘密情報の保護には使えません。"
    ],
    "invalidHex":
      "16進数を1〜4桁で入力してください（0〜9、A〜F）。",
    "invalidInteger":
      "指定範囲の整数を入力してください。",
    "invalidRounds":
      "ラウンド数は1〜16の整数で入力してください。",
    "invalidTrials":
      "試行回数は10〜2000の整数で入力してください。",
    "invalidTables":
      "S-Boxは0〜F、P層は0〜15を、それぞれ重複なく入力してください。",
    "randomUnavailable":
      "Web Cryptoの乱数を利用できません。ランダム生成または解析を完了できませんでした。",
    "failed":
      "処理を完了できませんでした。入力とブラウザーの機能を確認してください。"
  };
  const en = {
    "changed":
      "Inputs or settings changed. Run the operation again. Values in the input fields have " +
      "been kept.",
    "composing":
      "Finish composing your input before running the operation.",
    "measured":
      "Observation from this run",
    "measurementLimit":
      "The mean number of flipped bits and its distribution describe this sample under these" +
      " settings. They do not assess cipher security or whether SAC is satisfied.",
    "measurementHints":
      [
      "Each trial uses a random plaintext and flipped bit position, so results can vary even" +
      " with the same settings.",
      "Bijectivity is required for decryption. It does not guarantee nonlinearity or securit" +
      "y.",
      "Change one setting at a time: S-box, P-layer, or rounds. More rounds do not guarantee" +
      " improvement.",
      "The key is only 16 bits (65,536 possibilities). This educational cipher cannot protec" +
      "t real secrets."
    ],
    "invalidHex":
      "Enter 1–4 hexadecimal digits (0–9, A–F).",
    "invalidInteger":
      "Enter an integer in the specified range.",
    "invalidRounds":
      "Enter an integer from 1 to 16 for the round count.",
    "invalidTrials":
      "Enter an integer from 10 to 2000 for the trial count.",
    "invalidTables":
      "Use each value exactly once: 0–F for the S-box and 0–15 for the P-layer.",
    "randomUnavailable":
      "Web Crypto randomness is unavailable. Random generation or analysis could not be comp" +
      "leted.",
    "failed":
      "The operation could not be completed. Check your input and browser capabilities."
  };
  const translations = {
    "SPN（Substitution-Permutation Network）":
      "SPN (Substitution-Permutation Network)",
    "DES（1977）":
      "DES (1977)",
    "AES（2001）":
      "AES (2001)",
    "）":
      ")",
    "このツールの実行にはJavaScriptが必要です。":
      "JavaScript is required to run this tool.",
    "ToySPN Builder - SPN体験ミニツール":
      "ToySPN Builder - Interactive SPN Learning Tool",
    "S-Box・P層・鍵加算で学ぶ現代ブロック暗号の仕組み":
      "Explore block ciphers with S-boxes, bit permutations, and round-key XOR",
    "16ビットの教育用暗号です。なだれ効果は安全性の評価ではありません。秘密情報の保護には使えません。":
      "A 16-bit educational cipher. Avalanche measurements do not assess security. Do not us" +
      "e it to protect secrets.",
    "設計":
      "Design",
    "暗号化/復号":
      "Encrypt / Decrypt",
    "解析":
      "Analyze",
    "学習":
      "Learn",
    "S-Box（4bit，全単射）":
      "S-box (4-bit bijection)",
    "補足説明":
      "More information",
    "4ビット入力を4ビットの値に置換する表です。":
      "A table that substitutes a 4-bit value for each 4-bit input.",
    "0〜Fを重複なく並べてください。全単射でも非線形とは限りません。":
      "Use every value from 0 to F exactly once. A bijection is not necessarily nonlinear.",
    "0x0〜0xF の置換を入力（重複不可）。復号時に逆S-Boxを生成します。":
      "Enter a permutation of 0x0 through 0xF (no duplicates). The inverse S-box is generate" +
      "d for decryption.",
    "💡 全単射 = すべての入力が異なる出力に1対1対応（重複なし・欠落なし）":
      "💡 Bijection = every input maps to a distinct output (no duplicates or missing values)",
    "デフォルトに戻す":
      "Reset to default",
    "ランダム生成":
      "Randomize",
    "恒等S-Box（値を変えない）":
      "Identity S-box (keep values)",
    "対応関係の図（横スクロール可能）":
      "Mapping diagram (scroll horizontally)",
    "対応関係の可視化":
      "Mapping visualization",
    "入力":
      "Input",
    "出力":
      "Output",
    "P層（ビット置換，16bit）":
      "P-layer (16-bit permutation)",
    "16ビットのビット位置を入れ替える線形変換層です。":
      "A linear transformation that rearranges the 16 bit positions.",
    "各ビットiをP[i]番目の位置に移動させます。":
      "Each bit i moves to position P[i].",
    "P層自体は反転ビット数を変えません。次のラウンドのS-Boxへの伝わり方を変えます。":
      "The P-layer itself preserves the number of flipped bits. It changes how differences r" +
      "each the next round's S-boxes.",
    "ビット i（0..15）を P[i] 番目へ。全単射である必要があります。":
      "Bit i (0..15) moves to P[i]. The mapping must be a bijection.",
    "恒等P層（位置を変えない）":
      "Identity P-layer (keep positions)",
    "ラウンド設定":
      "Round settings",
    "ラウンド数":
      "Rounds",
    "S-Box、P層、鍵XORを繰り返す回数です。":
      "The number of repetitions of S-box, P-layer, and key XOR.",
    "1〜16で指定します。回数を増やしても拡散や安全性の改善は保証されません。":
      "Enter 1–16. More rounds do not guarantee better diffusion or security.",
    "最小1":
      "Minimum 1",
    "最大16":
      "Maximum 16",
    "マスター鍵 (16進数 16-bit)":
      "Master key (16-bit hex)",
    "暗号化・復号に使う秘密鍵です。":
      "The secret key used for encryption and decryption.",
    "16進数1〜4桁で指定します（先頭の0は省略可能）。":
      "Enter 1–4 hexadecimal digits (leading zeros may be omitted).",
    "この鍵から各ラウンドで使う鍵を自動生成します。":
      "Round keys are derived automatically from this key.",
    "例: C0DE":
      "e.g. C0DE",
    "🔍 設定を検証":
      "🔍 Validate settings",
    "検証結果":
      "Validation result",
    "暗号化 / 復号":
      "Encrypt / Decrypt",
    "平文 (16進数 16-bit)":
      "Plaintext (16-bit hex)",
    "例: 1234":
      "e.g. 1234",
    "暗号文 (16進数 16-bit)":
      "Ciphertext (16-bit hex)",
    "例: A5F3":
      "e.g. A5F3",
    "暗号化":
      "Encrypt",
    "復号":
      "Decrypt",
    "サンプル":
      "Load sample",
    "ステップ詳細":
      "Step details",
    "なだれ効果テスト（Avalanche Effect）":
      "Avalanche effect test",
    "入力の1ビットを変えたとき、出力が平均して何ビット変化するかを測定します。":
      "Measures the average number of output bits that change when one input bit is flipped.",
    "各出力ビットが確率1/2で反転するモデルの平均は8ビットです。安全性の判定には使えません。":
      "In a model where each output bit flips with probability 1/2, the mean is 8 bits. This" +
      " is not a security test.",
    "※アバランシェ効果とも呼ばれます。":
      "Also known as the avalanche effect.",
    "試行回数":
      "Trials",
    "実行":
      "Run",
    "反転ビット数のヒストグラム。正確な数値は下の表に表示します。":
      "Histogram of flipped bits. Exact values are provided in the table below.",
    "反転ビット数":
      "Flipped bits",
    "回数":
      "Count",
    "割合":
      "Percentage",
    "💡 結果の読み方":
      "💡 How to read the results",
    "学習コンテンツ":
      "Learning resources",
    "SPNとは？":
      "What is an SPN?",
    "は、現代ブロック暗号の基本構造の一つです。":
      " is a basic structure used in modern block ciphers.",
    "Substitution（置換）":
      "Substitution",
    ": S-Boxによる非線形変換で、線形解読を困難にする":
      ": Nonlinear S-box transformations make linear cryptanalysis harder",
    "Permutation（転置）":
      "Permutation",
    ": P層によるビット拡散で、局所的な変化を全体に広げる":
      ": The P-layer spreads local changes across the block over successive rounds",
    "鍵加算":
      "Key addition",
    ": ラウンド鍵をXORして鍵に依存する変換にする":
      ": XOR with a round key makes the transformation key-dependent",
    "これらを繰り返し、変化がどう伝わるかを観察します。AESもSPN型ですが、本ツールとは構成や安全性が異なります。":
      "Repeat these operations and observe how differences propagate. AES is also SPN-based," +
      " but its construction and security differ from this tool.",
    "S-Box（置換層）の役割":
      "The role of the S-box",
    "S-Box（Substitution Box）は、入力を別の値に置換する表です。非線形なものを使う目的がありますが、任意の全単射が非線形とは限りません。恒等S-Boxは線形です。":
      "An S-box (substitution box) maps input values to output values. Nonlinear S-boxes ser" +
      "ve a purpose, but an arbitrary bijection need not be nonlinear. The identity S-box is" +
      " linear.",
    "なぜ非線形性が必要？":
      "Why does nonlinearity matter?",
    [
      "ヒル暗号は、十分な独立した平文と暗号文の組があると行列を求められます。非線形なS-Boxは、このような線形関係だけでは表せない変換を導入します。ただし、S-Boxの追加だ" +
      "けで安全になるわけではありません。"
    ]:
      "With enough linearly independent plaintext–ciphertext pairs, the Hill cipher's key ma" +
      "trix can be recovered. A nonlinear S-box introduces transformations that cannot be ex" +
      "pressed by these linear relationships alone. Adding an S-box does not by itself make " +
      "a cipher secure.",
    "良いS-Boxの条件":
      "Properties to consider in an S-box",
    "全単射（bijection）":
      "Bijection",
    ": すべての入力が異なる出力に対応（復号可能性）":
      ": Each input has a distinct output, allowing decryption",
    "差分耐性":
      "Differential resistance",
    ": 入力差から出力差を予測しにくい":
      ": Output differences should be hard to predict from input differences",
    "線形耐性":
      "Linear resistance",
    ": 入出力間の線形関係が少ない":
      ": Linear approximations between inputs and outputs should have low bias",
    "SAC特性":
      "Strict avalanche criterion (SAC)",
    ": 各入力ビットを反転したとき、各出力ビットが半分の入力で反転する性質。本ツールの平均値だけでは判定できない":
      ": For each input bit, flipping it must flip each output bit for half of all inputs. T" +
      "his tool's mean alone cannot establish this property",
    "P層（拡散層）の役割":
      "The role of the P-layer",
    "P層（Permutation Layer）は、ビット位置を入れ替える線形変換です。":
      "The P-layer (permutation layer) is a linear transformation that rearranges bit positi" +
      "ons.",
    "拡散（Diffusion）とは？":
      "What is diffusion?",
    "平文の1ビットの変化が、暗号文全体に影響を及ぼす性質を":
      "The property in which a one-bit change in the plaintext affects the ciphertext broadl" +
      "y is called ",
    "拡散":
      "diffusion",
    "と呼びます。S-Boxだけでは局所的な変換に留まるため、P層でビットをシャッフルして影響範囲を広げます。":
      ". S-boxes act locally, so the P-layer rearranges bits to spread their influence over " +
      "successive rounds.",
    "設計のポイント":
      "Design considerations",
    "全単射性":
      "Bijectivity",
    ": すべてのビット位置が一意に対応（可逆性）":
      ": Each bit position maps uniquely to another position (reversibility)",
    "遠距離混合":
      "Mixing distant positions",
    ": 近いビット同士だけでなく、遠くのビットも混ぜる":
      ": Connect distant bits as well as nearby bits",
    "高速性":
      "Efficiency",
    ": ハードウェア実装で配線のみで実現可能":
      ": In hardware, a fixed permutation can be implemented as wiring",
    "本ツールのデフォルトP層は、ニブル単位で列方向に並び替える設計です。":
      "The default P-layer transposes the arrangement of bits across nibbles.",
    "鍵スケジュール（鍵導出）":
      "Key schedule (key derivation)",
    "マスター鍵から各ラウンドで使う":
      "A key schedule derives the ",
    "ラウンド鍵":
      "round keys",
    "を生成する仕組みが鍵スケジュールです。":
      " used by individual rounds from the master key.",
    "本ツールの簡易実装":
      "The simplified implementation in this tool",
    "回転":
      "Rotation",
    ": ビットを左へ循環移動する（端から出たビットは反対側に戻る）":
      ": Rotate bits left; bits shifted out at one end return at the other",
    "ラウンド定数（RC）":
      "Round constants (RC)",
    ": 固定の定数列とXORする。定数列には重複がある":
      ": XOR with a fixed sequence of constants. This sequence contains repeats",
    "回転と定数XORによる鍵導出はGF(2)上のアフィン変換です。ラウンド鍵の独立性は保証しません。":
      "Key derivation using rotations and constant XOR is affine over GF(2). It does not gua" +
      "rantee independent round keys.",
    "実用暗号では":
      "In practical ciphers",
    "AESなどでは、S-Box適用やより複雑な変換を含む強固な鍵スケジュールが使われます。関連鍵攻撃への耐性が重要です。":
      "AES uses a key schedule that includes S-box substitution and more complex transformat" +
      "ions. Resistance to related-key attacks is an important consideration.",
    "なだれ効果（Avalanche Effect / アバランシェ効果）":
      "Avalanche effect",
    "なだれ効果（アバランシェ効果）":
      "The avalanche effect",
    "は、入力の小さな変化（1ビット）が出力の大きな変化（約50%のビット）を引き起こす性質です。":
      " is the property in which a small input change (one bit) causes a large output change" +
      " (about 50% of the bits).",
    "測定方法":
      "Measurement procedure",
    "ランダムな平文を暗号化 → 暗号文C1":
      "Encrypt a random plaintext → ciphertext C1",
    "平文の1ビットだけ反転させて暗号化 → 暗号文C2":
      "Flip exactly one plaintext bit and encrypt → ciphertext C2",
    "C1 ⊕ C2 のハミング距離を計測":
      "Count the set bits in C1 ⊕ C2 (the Hamming distance between C1 and C2)",
    "多数回試行して平均を取る":
      "Repeat many times and calculate the mean",
    "理想値":
      "Reference mean",
    "各出力ビットが確率1/2で反転するモデルでは、平均は8ビットです。ただし、平均が8に近いだけで各ビットの反転確率や独立性はわかりません。安全性やSACの合格基準には使えません。":
      "In a model where each output bit flips with probability 1/2, the mean is 8 bits. A me" +
      "an near 8 does not establish individual flip probabilities or independence. It is not" +
      " a pass criterion for security or SAC.",
    "本ツールでヒストグラムを確認し、分布が中央（8付近）に集中しているか観察してください。":
      "Use the histogram to observe whether the distribution clusters near the center (aroun" +
      "d 8).",
    "ブロック暗号の歴史":
      "A brief history of block ciphers",
    "古典暗号の時代":
      "Classical ciphers",
    "シーザー暗号":
      "Caesar cipher",
    ": 単純な文字シフト":
      ": A simple alphabet shift",
    "ヴィジュネル暗号":
      "Vigenère cipher",
    ": 多表式置換だが周期性あり":
      ": Polyalphabetic substitution with a repeating key",
    "ヒル暗号":
      "Hill cipher",
    ": 行列演算（線形代数攻撃に脆弱）":
      ": Matrix operations (vulnerable to linear-algebra attacks)",
    "現代ブロック暗号":
      "Modern block ciphers",
    ": Feistel構造、56ビット鍵（現在は脆弱）":
      ": Feistel structure, 56-bit key (no longer secure)",
    ": SPN構造、128/192/256ビット鍵（現在の標準）":
      ": SPN structure, 128/192/256-bit keys (a current standard)",
    "その他":
      "Other examples",
    ": Blowfish, Twofish, Serpentなど":
      ": Blowfish, Twofish, and Serpent",
    "SPNとFeistel構造が現代ブロック暗号の二大潮流です。":
      "SPN and Feistel networks are two major families of block-cipher structures.",
    "このツールの限界と実用暗号との違い":
      "Limitations and differences from practical ciphers",
    "⚠️ 注意: このツールは教育用であり、実運用には使用できません。":
      "⚠️ Warning: This tool is educational and must not be used in production.",
    "主な制限":
      "Main limitations",
    "項目":
      "Property",
    "AES（実用暗号）":
      "AES (practical cipher)",
    "ブロックサイズ":
      "Block size",
    "16ビット":
      "16 bits",
    "128ビット":
      "128 bits",
    "鍵長":
      "Key length",
    "128/192/256ビット":
      "128/192/256 bits",
    "8（デフォルト）":
      "8 (default)",
    "10/12/14ラウンド":
      "10/12/14 rounds",
    "S-Box設計":
      "S-box design",
    "任意編集可能":
      "User-editable",
    "固定の8ビットS-Box":
      "Fixed 8-bit S-box",
    "鍵スケジュール":
      "Key schedule",
    "単純な回転+XOR":
      "Simple rotation + XOR",
    "S-Box適用含む複雑な変換":
      "More complex transformations including S-box substitution",
    "学習目的での使い方":
      "Learning exercises",
    "S-Boxの全単射性を崩すと入力検証で拒否されることを確認":
      "Break S-box bijectivity and check that input validation rejects it",
    "P層の設計を変えてなだれ効果がどう変化するか観察":
      "Change the P-layer and observe the avalanche measurements",
    "ラウンド数による反転ビット数の変化を観察":
      "Observe how the number of flipped bits changes with the round count",
    "💡 各項目をクリックして詳細を展開してください。":
      "💡 Select a topic to expand its details.",
    "🔗 GitHubリポジトリはこちら（":
      "🔗 GitHub repository (",
    "入力や設定が変わりました。再実行してください。入力欄の値は保持しています。":
      "Inputs or settings changed. Run the operation again. Values in the input fields have " +
      "been kept.",
    "文字の入力を確定してから実行してください。":
      "Finish composing your input before running the operation.",
    "今回の観測結果":
      "Observation from this run",
    "平均反転ビット数と分布は、今回の条件でのなだれ効果の観測値です。暗号の安全性やSACの合否を判定するものではありません。":
      "The mean number of flipped bits and its distribution describe this sample under these" +
      " settings. They do not assess cipher security or whether SAC is satisfied.",
    "試行ごとにランダムな平文と反転位置を選ぶため、同じ設定でも結果は変わります。":
      "Each trial uses a random plaintext and flipped bit position, so results can vary even" +
      " with the same settings.",
    "全単射は復号できるための条件です。非線形性や安全性を保証しません。":
      "Bijectivity is required for decryption. It does not guarantee nonlinearity or securit" +
      "y.",
    "S-Box、P層、ラウンド数を1項目ずつ変えて分布を観察してください。ラウンド増加による改善は保証されません。":
      "Change one setting at a time: S-box, P-layer, or rounds. More rounds do not guarantee" +
      " improvement.",
    "鍵は16ビット（65,536通り）の教育用です。実際の秘密情報の保護には使えません。":
      "The key is only 16 bits (65,536 possibilities). This educational cipher cannot protec" +
      "t real secrets.",
    "16進数を1〜4桁で入力してください（0〜9、A〜F）。":
      "Enter 1–4 hexadecimal digits (0–9, A–F).",
    "指定範囲の整数を入力してください。":
      "Enter an integer in the specified range.",
    "ラウンド数は1〜16の整数で入力してください。":
      "Enter an integer from 1 to 16 for the round count.",
    "試行回数は10〜2000の整数で入力してください。":
      "Enter an integer from 10 to 2000 for the trial count.",
    "S-Boxは0〜F、P層は0〜15を、それぞれ重複なく入力してください。":
      "Use each value exactly once: 0–F for the S-box and 0–15 for the P-layer.",
    "Web Cryptoの乱数を利用できません。ランダム生成または解析を完了できませんでした。":
      "Web Crypto randomness is unavailable. Random generation or analysis could not be comp" +
      "leted.",
    "処理を完了できませんでした。入力とブラウザーの機能を確認してください。":
      "The operation could not be completed. Check your input and browser capabilities.",
    "操作画面":
      "Tool tabs",
    "S-Box 入力{0}の出力":
      "Output for S-box input {0}",
    "入力ビット{0}の移動先":
      "Destination of input bit {0}",
    "全単射 ✅":
      "Bijection ✅",
    "全単射ではありません ❌":
      "Not a bijection ❌",
    "S-Box状態":
      "S-box status",
    "P層状態":
      "P-layer status",
    "✅ 全単射（OK）":
      "✅ Bijection (OK)",
    "❌ 全単射ではありません":
      "❌ Not a bijection",
    "マスター鍵":
      "Master key",
    "ラウンド鍵1":
      "Round key 1",
    "総合判定":
      "Overall validation",
    "✅ 暗号化可能":
      "✅ Ready to encrypt",
    "❌ 設定エラー":
      "❌ Invalid settings",
    "ラウンド {0}":
      "Round {0}",
    "ラウンド {0} (逆順)":
      "Round {0} (reverse order)",
    "S-Box後":
      "After S-box",
    "P層後":
      "After P-layer",
    "鍵加算後 (⊕)":
      "After key XOR (⊕)",
    "逆P層後":
      "After inverse P-layer",
    "逆S-Box後":
      "After inverse S-box",
    "表示するステップがありません":
      "No steps to display",
    "暗号化完了 ✅":
      "Encryption complete ✅",
    "復号完了 ✅":
      "Decryption complete ✅",
    "サンプルを読み込みました":
      "Sample loaded",
    "実行中...":
      "Running...",
    "完了 ✅":
      "Complete ✅",
    "測定値":
      "Measurements",
    "分布と測定の限界":
      "Distribution and measurement limits",
    "比較するときの注意":
      "Notes for comparison",
    "7〜9ビットが反転した試行は{0}/{1}回（{2}%）です。":
      "In {0}/{1} trials ({2}%), 7–9 bits flipped. ",
    " 平均反転ビット数: {0} / 16.0 ビット":
      " Mean flipped bits: {0} / 16.0 bits",
    "試行回数={0}\n平均反転ビット数={1} / 16\nラウンド数={2}、鍵={3}\nS={4}\nP={5}":
      "Trials={0}\nMean flipped bits={1} / 16\nRounds={2}, key={3}\nS={4}\nP={5}"
  };
  let language = 'ja';
  const chooseLanguage = (query, saved, browser) => {
    for (const value of [query, saved]) if (value === 'ja' || value === 'en') return value;
    return /^ja(?:-|$)/i.test(browser || '') ? 'ja' : 'en';
  };
  const initialLanguage = () => {
    let saved;
    try { saved = global.localStorage.getItem('toyspn-language'); } catch (_) { /* Optional preference. */ }
    return chooseLanguage(new URLSearchParams(global.location.search).get('lang'), saved, global.navigator.language);
  };
  const saveLanguage = value => {
    try { global.localStorage.setItem('toyspn-language', value); } catch (_) { /* Storage may be unavailable. */ }
    setLanguage(value);
  };
  const bindings = new Map();
  const t = (source, ...values) => {
    source = String(source);
    const template = language === 'en' ? (translations[source] ?? source) : source;
    return template.replace(/\{(\d+)\}/g, (_, n) => String(values[Number(n)]));
  };
  const text = (element, source, ...values) => {
    element.dataset.message = source;
    element.dataset.messageValues = JSON.stringify(values);
    element.textContent = t(source, ...values);
  };
  const error = e => ja[e.code] || ja.failed;
  const registerStatic = root => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest('[data-message], script, style, #language-toggle')) continue;
      const source = node.textContent.trim();
      if (Object.hasOwn(translations, source)) bindings.set(node, {source, original: node.textContent});
    }
    for (const element of root.querySelectorAll('[aria-label], [placeholder], [title]')) {
      for (const attr of ['aria-label', 'placeholder', 'title']) {
        const source = element.getAttribute(attr);
        if (source && Object.hasOwn(translations, source)) {
          element.dataset['i18n' + attr.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
            .replace(/^./, c => c.toUpperCase())] = source;
        }
      }
    }
  };
  const setLanguage = next => {
    language = next === 'en' ? 'en' : 'ja';
    document.documentElement.lang = language;
    for (const [node, {source, original}] of bindings) {
      if (!node.isConnected) { bindings.delete(node); continue; }
      node.textContent = original.replace(source, t(source));
    }
    document.querySelectorAll('[data-message]').forEach(el => {
      el.textContent = t(el.dataset.message, ...JSON.parse(el.dataset.messageValues));
    });
    document.querySelectorAll('[data-i18n-aria-label], [data-i18n-placeholder], [data-i18n-title]').forEach(el => {
      for (const [attr, prop] of [['aria-label','i18nAriaLabel'], ['placeholder','i18nPlaceholder'], ['title','i18nTitle']]) {
        if (el.dataset[prop]) el.setAttribute(attr, t(el.dataset[prop]));
      }
    });
    // Input controls are not rebuilt; incomplete values, caret, and results remain intact.
    document.querySelectorAll('#sbox-grid input').forEach((el, i) =>
      el.setAttribute('aria-label', t('S-Box 入力{0}の出力', i.toString(16).toUpperCase())));
    document.querySelectorAll('#player-grid input').forEach((el, i) =>
      el.setAttribute('aria-label', t('入力ビット{0}の移動先', i)));
    const button = document.querySelector('#language-toggle');
    button.textContent = language === 'ja' ? 'English' : '日本語';
    button.lang = language === 'ja' ? 'en' : 'ja';
  };
  const clear = element => {
    delete element.dataset.message;
    delete element.dataset.messageValues;
    element.textContent = '';
  };
  global.ToySPNMessages = {
    ja, en, translations, t, text, clear, error, registerStatic, setLanguage,
    chooseLanguage, initialLanguage, saveLanguage,
    get language() { return language; }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.ToySPNMessages;
})(typeof window !== 'undefined' ? window : globalThis);
