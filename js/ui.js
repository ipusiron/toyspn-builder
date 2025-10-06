// ToySPN Builder - UI glue
(function(){
  'use strict';

  // --- DOM helpers ---
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  // Tabs
  $$('.tab').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.tab').forEach(b=>b.classList.remove('active'));
      $$('.panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      $('#'+btn.dataset.tab).classList.add('active');
    });
  });

  // --- S-Box grid ---
  const sGrid = $('#sbox-grid');
  const makeSBoxInputs = (S) => {
    sGrid.innerHTML = '';
    for (let i = 0; i < 16; i++){
      const div = document.createElement('div');
      div.className = 'grid16-item';

      const label = document.createElement('label');
      label.className = 'grid-label';
      label.textContent = i.toString(16).toUpperCase();

      const inp = document.createElement('input');
      inp.type = 'text';
      inp.maxLength = 1;
      inp.value = S[i].toString(16).toUpperCase();
      inp.dataset.idx = String(i);
      inp.addEventListener('input', onSBoxChange);

      div.appendChild(label);
      div.appendChild(inp);
      sGrid.appendChild(div);
    }
  };
  const readSBox = () => {
    const arr = [];
    $$('#sbox-grid .grid16-item input').forEach(inp=>{
      const v = inp.value.trim();
      const n = parseInt(v || '0', 16);
      arr.push((Number.isFinite(n) ? n : 0) & 0xF);
    });
    return arr;
  };
  const drawSBoxVisualization = (S) => {
    const svg = $('#sbox-viz');
    const inputDots = $('#input-dots');
    const outputDots = $('#output-dots');
    const arrows = $('#arrows');

    // Clear previous
    inputDots.innerHTML = '';
    outputDots.innerHTML = '';
    arrows.innerHTML = '';

    // Add arrowhead marker
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3, 0 6');
    polygon.setAttribute('fill', 'var(--accent)');
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.insertBefore(defs, svg.firstChild);

    const startX = 60;
    const spacing = 46;
    const inputY = 40;
    const outputY = 160;

    // Draw input dots and labels
    for (let i = 0; i < 16; i++){
      const x = startX + i * spacing;

      // Input dot
      const inputDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      inputDot.setAttribute('cx', x);
      inputDot.setAttribute('cy', inputY);
      inputDot.setAttribute('class', 'viz-dot input');
      inputDots.appendChild(inputDot);

      // Input label
      const inputText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      inputText.setAttribute('x', x);
      inputText.setAttribute('y', inputY - 12);
      inputText.setAttribute('class', 'viz-text');
      inputText.textContent = i.toString(16).toUpperCase();
      inputDots.appendChild(inputText);

      // Output dot
      const outputDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      outputDot.setAttribute('cx', x);
      outputDot.setAttribute('cy', outputY);
      outputDot.setAttribute('class', 'viz-dot output');
      outputDots.appendChild(outputDot);

      // Output label
      const outputText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      outputText.setAttribute('x', x);
      outputText.setAttribute('y', outputY + 18);
      outputText.setAttribute('class', 'viz-text');
      outputText.textContent = i.toString(16).toUpperCase();
      outputDots.appendChild(outputText);
    }

    // Draw arrows
    for (let i = 0; i < 16; i++){
      const inputX = startX + i * spacing;
      const outputX = startX + S[i] * spacing;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', inputX);
      line.setAttribute('y1', inputY + 5);
      line.setAttribute('x2', outputX);
      line.setAttribute('y2', outputY - 5);
      line.setAttribute('class', 'viz-arrow');

      // Add title for hover
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${i.toString(16).toUpperCase()} → ${S[i].toString(16).toUpperCase()}`;
      line.appendChild(title);

      arrows.appendChild(line);
    }
  };

  const onSBoxChange = () => {
    S = readSBox();
    const ok = ToySPN.isBijection(S,16);
    sStatus.textContent = ok ? '全単射 ✅' : '全単射ではありません ❌';
    sStatus.className = 'status ' + (ok ? 'ok' : 'bad');
    drawSBoxVisualization(S);
  };
  $('#sbox-reset').addEventListener('click', ()=>{
    S = ToySPN.DEFAULT_S.slice();
    makeSBoxInputs(S);
    onSBoxChange();
  });

  $('#sbox-random').addEventListener('click', ()=>{
    // Fisher-Yates shuffle to maintain bijection
    S = Array.from({length: 16}, (_, i) => i);
    for (let i = 15; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [S[i], S[j]] = [S[j], S[i]];
    }
    makeSBoxInputs(S);
    onSBoxChange();
  });

  $('#sbox-identity').addEventListener('click', ()=>{
    // Identity mapping: 0->0, 1->1, ..., F->F (no substitution)
    S = Array.from({length: 16}, (_, i) => i);
    makeSBoxInputs(S);
    onSBoxChange();
  });

  // --- P-layer grid ---
  const pGrid = $('#player-grid');
  const makePLayerInputs = (P) => {
    pGrid.innerHTML = '';
    for (let i = 0; i < 16; i++){
      const div = document.createElement('div');
      div.className = 'grid16-item';

      const label = document.createElement('label');
      label.className = 'grid-label';
      label.textContent = 'b' + i;

      const inp = document.createElement('input');
      inp.type = 'number';
      inp.min = 0; inp.max = 15;
      inp.value = P[i];
      inp.dataset.idx = String(i);
      inp.addEventListener('input', onPLayerChange);

      div.appendChild(label);
      div.appendChild(inp);
      pGrid.appendChild(div);
    }
  };
  const readPLayer = () => {
    const arr = [];
    $$('#player-grid .grid16-item input').forEach(inp=>{
      const n = parseInt((inp.value || '0'), 10);
      arr.push((Number.isFinite(n) ? n : 0) & 0xF);
    });
    return arr;
  };
  const drawPLayerVisualization = (P) => {
    const svg = $('#player-viz');
    const inputDots = $('#player-input-dots');
    const outputDots = $('#player-output-dots');
    const arrows = $('#player-arrows');

    // Clear previous
    inputDots.innerHTML = '';
    outputDots.innerHTML = '';
    arrows.innerHTML = '';

    // Add arrowhead marker
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead-p');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3, 0 6');
    polygon.setAttribute('fill', 'var(--accent)');
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.insertBefore(defs, svg.firstChild);

    const startX = 60;
    const spacing = 46;
    const inputY = 40;
    const outputY = 160;

    // Draw input dots and labels
    for (let i = 0; i < 16; i++){
      const x = startX + i * spacing;

      // Input dot
      const inputDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      inputDot.setAttribute('cx', x);
      inputDot.setAttribute('cy', inputY);
      inputDot.setAttribute('class', 'viz-dot input');
      inputDots.appendChild(inputDot);

      // Input label
      const inputText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      inputText.setAttribute('x', x);
      inputText.setAttribute('y', inputY - 12);
      inputText.setAttribute('class', 'viz-text');
      inputText.textContent = i;
      inputDots.appendChild(inputText);

      // Output dot
      const outputDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      outputDot.setAttribute('cx', x);
      outputDot.setAttribute('cy', outputY);
      outputDot.setAttribute('class', 'viz-dot output');
      outputDots.appendChild(outputDot);

      // Output label
      const outputText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      outputText.setAttribute('x', x);
      outputText.setAttribute('y', outputY + 18);
      outputText.setAttribute('class', 'viz-text');
      outputText.textContent = i;
      outputDots.appendChild(outputText);
    }

    // Draw arrows
    for (let i = 0; i < 16; i++){
      const inputX = startX + i * spacing;
      const outputX = startX + P[i] * spacing;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', inputX);
      line.setAttribute('y1', inputY + 5);
      line.setAttribute('x2', outputX);
      line.setAttribute('y2', outputY - 5);
      line.setAttribute('class', 'viz-arrow');
      line.setAttribute('marker-end', 'url(#arrowhead-p)');

      // Add title for hover
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `b${i} → b${P[i]}`;
      line.appendChild(title);

      arrows.appendChild(line);
    }
  };

  const onPLayerChange = () => {
    P = readPLayer();
    const ok = ToySPN.isBijection(P,16);
    pStatus.textContent = ok ? '全単射 ✅' : '全単射ではありません ❌';
    pStatus.className = 'status ' + (ok ? 'ok' : 'bad');
    drawPLayerVisualization(P);
  };
  $('#player-reset').addEventListener('click', ()=>{
    P = ToySPN.DEFAULT_P.slice();
    makePLayerInputs(P);
    onPLayerChange();
  });

  $('#player-random').addEventListener('click', ()=>{
    // Fisher-Yates shuffle to maintain bijection
    P = Array.from({length: 16}, (_, i) => i);
    for (let i = 15; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [P[i], P[j]] = [P[j], P[i]];
    }
    makePLayerInputs(P);
    onPLayerChange();
  });

  $('#player-identity').addEventListener('click', ()=>{
    // Identity mapping: bit i -> bit i (no permutation)
    P = Array.from({length: 16}, (_, i) => i);
    makePLayerInputs(P);
    onPLayerChange();
  });

  // --- Status elements & initial state ---
  const sStatus = $('#sbox-status');
  const pStatus = $('#player-status');
  let S = ToySPN.DEFAULT_S.slice();
  let P = ToySPN.DEFAULT_P.slice();
  makeSBoxInputs(S);
  onSBoxChange();
  makePLayerInputs(P);
  onPLayerChange();

  // --- Rounds & Key ---
  const roundsEl = $('#rounds');
  const mkeyEl = $('#master-key');
  const roundsMinBtn = $('#rounds-min');
  const roundsMaxBtn = $('#rounds-max');
  const keyRandomBtn = $('#key-random');
  const validateBtn = $('#validate');
  const validateResult = $('#validate-result');
  const validateStatus = $('#validate-status');

  roundsMinBtn.addEventListener('click', ()=>{
    roundsEl.value = 1;
  });

  roundsMaxBtn.addEventListener('click', ()=>{
    roundsEl.value = 16;
  });

  keyRandomBtn.addEventListener('click', ()=>{
    // Generate random 16-bit key
    const randomKey = Math.floor(Math.random() * 0x10000);
    mkeyEl.value = ToySPN.numToHex16(randomKey);
  });

  validateBtn.addEventListener('click', ()=>{
    const okS = ToySPN.isBijection(S,16);
    const okP = ToySPN.isBijection(P,16);
    const mk = ToySPN.hex16ToNum(mkeyEl.value);
    const R = Math.max(1, Math.min(16, parseInt(roundsEl.value||'8',10)));
    const keys = ToySPN.deriveRoundKeys(mk, R);

    // Build detailed result
    const sClass = okS ? 'ok' : 'ng';
    const pClass = okP ? 'ok' : 'ng';
    const overall = okS && okP;

    validateStatus.innerHTML = '';

    const createDetailRow = (labelText, valueText, valueClass = '', isTotal = false) => {
      const row = document.createElement('div');
      row.className = 'detail-row';
      if (isTotal) {
        row.style.marginTop = '8px';
        row.style.paddingTop = '12px';
        row.style.borderTop = '2px solid var(--border)';
      }

      const label = document.createElement('span');
      label.className = 'detail-label';
      if (isTotal) label.style.fontSize = '15px';
      label.textContent = labelText;

      const value = document.createElement('span');
      value.className = `detail-value ${valueClass}`;
      if (isTotal) value.style.fontSize = '15px';
      value.textContent = valueText;

      row.appendChild(label);
      row.appendChild(value);
      return row;
    };

    validateStatus.appendChild(createDetailRow('S-Box状態', okS ? '✅ 全単射（OK）' : '❌ 全単射ではありません', sClass));
    validateStatus.appendChild(createDetailRow('P層状態', okP ? '✅ 全単射（OK）' : '❌ 全単射ではありません', pClass));
    validateStatus.appendChild(createDetailRow('ラウンド数', String(R)));
    validateStatus.appendChild(createDetailRow('マスター鍵', ToySPN.numToHex16(mk)));
    validateStatus.appendChild(createDetailRow('ラウンド鍵1', ToySPN.numToHex16(keys[0])));
    validateStatus.appendChild(createDetailRow('総合判定', overall ? '✅ 暗号化可能' : '❌ 設定エラー', overall ? 'ok' : 'ng', true));

    validateResult.style.display = 'block';
  });

  // --- Crypto actions ---
  const ptEl = $('#pt'), ctEl = $('#ct'), cryptoStatus = $('#crypto-status');
  const stepsEl = $('#steps');

  const collectParams = () => {
    const okS = ToySPN.isBijection(S,16);
    const okP = ToySPN.isBijection(P,16);
    if (!okS || !okP) throw new Error('S and P must be bijective.');
    const R = Math.max(1, Math.min(16, parseInt(roundsEl.value||'8',10)));
    const mk = ToySPN.hex16ToNum(mkeyEl.value);
    const rks = ToySPN.deriveRoundKeys(mk, R);
    return { R, mk, rks };
  };

  const renderEncryptSteps = (steps) => {
    stepsEl.innerHTML = '';
    steps.forEach(s => {
      const div = document.createElement('div');
      div.className = 'step-round';

      const h4 = document.createElement('h4');
      h4.textContent = `ラウンド ${s.round}`;
      div.appendChild(h4);

      const createRow = (label, value, showArrow = false) => {
        const row = document.createElement('div');
        row.className = 'step-row';
        const labelSpan = document.createElement('span');
        labelSpan.className = 'step-label';
        labelSpan.textContent = label;
        row.appendChild(labelSpan);
        if (showArrow) {
          const arrow = document.createElement('span');
          arrow.className = 'step-arrow';
          arrow.textContent = '↓';
          row.appendChild(arrow);
        }
        const valueSpan = document.createElement('span');
        valueSpan.className = 'step-value';
        valueSpan.textContent = value;
        row.appendChild(valueSpan);
        return row;
      };

      div.appendChild(createRow('入力', s.before));
      div.appendChild(createRow('S-Box後', s.afterS, true));
      div.appendChild(createRow('P層後', s.afterP, true));
      div.appendChild(createRow('鍵加算後 (⊕)', s.afterK, true));

      stepsEl.appendChild(div);
    });
    if (steps.length === 0) {
      const div = document.createElement('div');
      div.className = 'step-round';
      div.textContent = '表示するステップがありません';
      stepsEl.appendChild(div);
    }
  };

  const renderDecryptSteps = (steps) => {
    stepsEl.innerHTML = '';
    steps.forEach(s => {
      const div = document.createElement('div');
      div.className = 'step-round';

      const h4 = document.createElement('h4');
      h4.textContent = `ラウンド ${s.round} (逆順)`;
      div.appendChild(h4);

      const createRow = (label, value, showArrow = false) => {
        const row = document.createElement('div');
        row.className = 'step-row';
        const labelSpan = document.createElement('span');
        labelSpan.className = 'step-label';
        labelSpan.textContent = label;
        row.appendChild(labelSpan);
        if (showArrow) {
          const arrow = document.createElement('span');
          arrow.className = 'step-arrow';
          arrow.textContent = '↓';
          row.appendChild(arrow);
        }
        const valueSpan = document.createElement('span');
        valueSpan.className = 'step-value';
        valueSpan.textContent = value;
        row.appendChild(valueSpan);
        return row;
      };

      div.appendChild(createRow('入力', s.before));
      div.appendChild(createRow('鍵加算後 (⊕)', s.afterK, true));
      div.appendChild(createRow('逆P層後', s.afterP, true));
      div.appendChild(createRow('逆S-Box後', s.afterS, true));

      stepsEl.appendChild(div);
    });
    if (steps.length === 0) {
      const div = document.createElement('div');
      div.className = 'step-round';
      div.textContent = '表示するステップがありません';
      stepsEl.appendChild(div);
    }
  };

  $('#btn-encrypt').addEventListener('click', ()=>{
    try{
      const { rks } = collectParams();
      const pt = ToySPN.hex16ToNum(ptEl.value);
      const steps = [];
      const ct = ToySPN.encryptBlock(pt, S, P, rks, steps);
      ctEl.value = ToySPN.numToHex16(ct);
      renderEncryptSteps(steps);
      cryptoStatus.textContent = '暗号化完了 ✅';
      cryptoStatus.className = 'status ok';
    }catch(e){
      cryptoStatus.textContent = e.message;
      cryptoStatus.className = 'status bad';
    }
  });

  $('#btn-decrypt').addEventListener('click', ()=>{
    try{
      const { rks } = collectParams();
      const ct = ToySPN.hex16ToNum(ctEl.value);
      const invS = ToySPN.invertSBox(S);
      const invP = ToySPN.invertPermutation(P);
      const steps = [];
      const pt = ToySPN.decryptBlock(ct, invS, invP, rks, steps);
      ptEl.value = ToySPN.numToHex16(pt);
      renderDecryptSteps(steps);
      cryptoStatus.textContent = '復号完了 ✅';
      cryptoStatus.className = 'status ok';
    }catch(e){
      cryptoStatus.textContent = e.message;
      cryptoStatus.className = 'status bad';
    }
  });

  $('#btn-sample').addEventListener('click', ()=>{
    ptEl.value = '1234';
    mkeyEl.value = 'C0DE';
    roundsEl.value = 8;
    stepsEl.innerHTML = '';
    cryptoStatus.textContent = 'サンプルを読み込みました';
    cryptoStatus.className = 'status';
  });

  // --- Analysis: Avalanche ---
  const trialsEl = $('#trials');
  const avBtn = $('#btn-avalanche');
  const avStatus = $('#avalanche-status');
  const canvas = $('#chart');
  const summary = $('#avalanche-summary');

  const analyzeAvalancheResult = (avg, hist, trials) => {
    const deviation = Math.abs(avg - 8.0);
    let verdict, verdictClass, analysis, suggestions;

    // Calculate distribution metrics
    const centerCount = hist[7] + hist[8] + hist[9];
    const centerPct = (centerCount / trials) * 100;

    if (deviation < 0.5 && centerPct > 50) {
      verdict = '優秀';
      verdictClass = 'excellent';
      analysis = 'なだれ効果が理想的です。入力1ビットの変化が出力の約半分に影響を及ぼしており、良好な拡散性を示しています。';
      suggestions = [
        '現在のS-BoxとP層の組み合わせは暗号学的に良好です',
        'この設定を保存して、他の設定と比較してみましょう',
        'さらにラウンド数を増やすと、より安定した拡散が得られます'
      ];
    } else if (deviation < 1.0 && centerPct > 40) {
      verdict = '良好';
      verdictClass = 'good';
      analysis = 'なだれ効果は許容範囲内です。実用暗号には不十分ですが、教育目的としては十分な拡散性を示しています。';
      suggestions = [
        'ラウンド数を増やすと、より理想値に近づきます',
        'P層の設計を見直し、より遠距離のビット混合を試してみましょう',
        'S-Boxをランダム生成して、異なる結果を観察してみましょう'
      ];
    } else if (deviation < 2.0) {
      verdict = '要改善';
      verdictClass = 'fair';
      analysis = 'なだれ効果が不十分です。拡散性に偏りがあり、暗号学的強度が低い可能性があります。';
      suggestions = [
        'ラウンド数が少なすぎる可能性があります（推奨: 8ラウンド以上）',
        'P層が恒等置換に近い場合、ビットが十分に混ざりません',
        'S-Boxの設計を見直し、より非線形性の高いものを試しましょう'
      ];
    } else {
      verdict = '不合格';
      verdictClass = 'poor';
      analysis = 'なだれ効果が著しく不足しています。このままでは暗号として機能しません。設定を根本的に見直す必要があります。';
      suggestions = [
        'S-BoxまたはP層が全単射でない可能性があります（検証ボタンで確認）',
        'ラウンド数が1〜2の場合、拡散が全く不十分です',
        'デフォルト設定に戻して、基本的な動作を確認しましょう',
        'P層が恒等置換（i→i）になっていないか確認してください'
      ];
    }

    return { verdict, verdictClass, analysis, suggestions };
  };

  avBtn.addEventListener('click', ()=>{
    try{
      const { rks } = collectParams();
      const t = Math.max(10, Math.min(2000, parseInt(trialsEl.value||'200',10)));
      avStatus.textContent = '実行中...';
      setTimeout(()=>{
        const { hist, avg } = ToySPNAnalysis.avalancheTrials(t, S, P, rks);
        ToySPNAnalysis.drawHistogram(canvas, hist);
        summary.textContent = `試行回数=${t}\n平均反転ビット数=${avg.toFixed(3)} (理想値 ~ 8.0)`;

        // Populate histogram data table
        const tbody = $('#histogram-tbody');
        tbody.innerHTML = '';
        let hasData = false;
        for (let i = 0; i < hist.length; i++){
          if (hist[i] > 0) hasData = true;
          const pct = ((hist[i] / t) * 100).toFixed(1);
          const tr = document.createElement('tr');

          const td1 = document.createElement('td');
          td1.textContent = String(i);
          const td2 = document.createElement('td');
          td2.textContent = String(hist[i]);
          const td3 = document.createElement('td');
          td3.textContent = `${pct}%`;

          tr.appendChild(td1);
          tr.appendChild(td2);
          tr.appendChild(td3);
          tbody.appendChild(tr);
        }
        $('#histogram-table').style.display = hasData ? 'block' : 'none';

        // Show expert hint
        const { verdict, verdictClass, analysis, suggestions } = analyzeAvalancheResult(avg, hist, t);
        const expertHint = $('#expert-hint');
        const hintContent = $('#hint-content');

        hintContent.innerHTML = '';

        const section1 = document.createElement('div');
        section1.className = 'hint-section';
        const h4_1 = document.createElement('h4');
        h4_1.textContent = '総合評価';
        const p1 = document.createElement('p');
        const span1 = document.createElement('span');
        span1.className = `hint-verdict ${verdictClass}`;
        span1.textContent = verdict;
        p1.appendChild(span1);
        p1.appendChild(document.createTextNode(` 平均反転ビット数: ${avg.toFixed(3)} / 16.0 ビット`));
        section1.appendChild(h4_1);
        section1.appendChild(p1);

        const section2 = document.createElement('div');
        section2.className = 'hint-section';
        const h4_2 = document.createElement('h4');
        h4_2.textContent = '分析';
        const p2 = document.createElement('p');
        p2.textContent = analysis;
        section2.appendChild(h4_2);
        section2.appendChild(p2);

        const section3 = document.createElement('div');
        section3.className = 'hint-section';
        const h4_3 = document.createElement('h4');
        h4_3.textContent = '改善のための提案';
        const ul = document.createElement('ul');
        suggestions.forEach(s => {
          const li = document.createElement('li');
          li.textContent = s;
          ul.appendChild(li);
        });
        section3.appendChild(h4_3);
        section3.appendChild(ul);

        hintContent.appendChild(section1);
        hintContent.appendChild(section2);
        hintContent.appendChild(section3);
        expertHint.style.display = 'block';

        avStatus.textContent = '完了 ✅';
        avStatus.className = 'status ok';
      }, 10);
    }catch(e){
      avStatus.textContent = e.message;
      avStatus.className = 'status bad';
    }
  });

  // --- Accordion for Learn section ---
  $$('.accordion-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const wasActive = item.classList.contains('active');

      // Close all accordions
      $$('.accordion-item').forEach(i => i.classList.remove('active'));

      // Open clicked one if it wasn't active
      if (!wasActive) {
        item.classList.add('active');
      }
    });
  });

})();
