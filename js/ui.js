// ToySPN Builder - UI glue
(function(){
  'use strict';

  // --- DOM helpers ---
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const M = ToySPNMessages;
  let lastHistogram = null;
  let runVersion = 0;
  let pendingAnalysis = null;
  let composing = false;
  let cryptoState = 'initial';
  let analysisState = 'initial';
  const emptyMessages = {
    initialCrypto: '暗号化または復号を実行すると、各ラウンドの計算過程を表示します。',
    initialAnalysis: '実行すると、反転ビット数の分布と実行時の条件を表示します。',
    changed: '入力や設定が変わりました。結果を表示するには再実行してください。',
    error: '処理できませんでした。上のエラーを確認してから再実行してください。',
    running: '解析中です。完了すると結果を表示します。'
  };
  const showCryptoState = state => {
    cryptoState = state;
    $('#steps-empty').hidden = state === 'complete';
    $('#step-controls').hidden = state !== 'complete';
    if (state !== 'complete') M.text($('#steps-empty'), emptyMessages[state === 'initial' ? 'initialCrypto' : state]);
  };
  const showAnalysisState = state => {
    analysisState = state;
    $('#analysis-empty').hidden = state === 'complete';
    $('#analysis-output').hidden = state !== 'complete';
    if (state !== 'complete') M.text($('#analysis-empty'), emptyMessages[state === 'initial' ? 'initialAnalysis' : state]);
  };
  const renderCurrentSettings = () => {
    // Read the controls, not cached S/P: mutation handlers may not have updated those yet.
    const tableKind = (selector, defaults, radix) => {
      const values = $$(selector).map(input => {
        const raw = input.value.trim();
        return (radix === 16 ? /^[0-9a-f]$/i : /^\d+$/).test(raw) ? parseInt(raw, radix) : NaN;
      });
      if (!ToySPN.isBijection(values, 16)) return '要修正';
      if (values.every((v, i) => v === defaults[i])) return '標準';
      return values.every((v, i) => v === i) ? '恒等' : 'カスタム';
    };
    const read = fn => { try { return fn(); } catch (_) { return '要修正'; } };
    const values = {
      rounds: read(() => ToySPN.parseInteger($('#rounds').value, 1, 16)),
      key: read(() => ToySPN.numToHex16(ToySPN.hex16ToNum($('#master-key').value))),
      sbox: tableKind('#sbox-grid input', ToySPN.DEFAULT_S, 16),
      player: tableKind('#player-grid input', ToySPN.DEFAULT_P, 10)
    };
    $$('[data-setting]').forEach(el => M.text(el, composing ? '入力中' : values[el.dataset.setting]));
  };

  const clearAnalysis = (state = analysisState === 'initial' ? 'initial' : 'changed') => {
    showAnalysisState(state);
    lastHistogram = null;
    runVersion++;
    clearTimeout(pendingAnalysis);
    pendingAnalysis = null;
    $('#btn-avalanche').disabled = composing;
    $('#analysis').removeAttribute('aria-busy');
    $('#chart').getContext('2d').clearRect(0, 0, $('#chart').width, $('#chart').height);
    M.clear($('#avalanche-summary'));
    $('#histogram-tbody').replaceChildren();
    $('#histogram-table').hidden = true;
    $('#expert-hint').hidden = true;
    $('#hint-content').replaceChildren();
    M.clear($('#avalanche-status'));
    $('#avalanche-status').className = 'status';
  };
  const invalidate = (scope = 'all') => {
    renderCurrentSettings();
    if (scope !== 'crypto') clearAnalysis();
    if (scope === 'analysis') return;
    $('#steps').replaceChildren();
    showCryptoState(cryptoState === 'initial' ? 'initial' : 'changed');
    const status = $('#crypto-status');
    if (status.textContent) M.text(status, ToySPNMessages.ja.changed);
    status.className = 'status';
    $('#validate-result').hidden = true;
    M.clear($('#validate-status'));
  };
  const ensureCommitted = () => {
    if (composing) throw Object.assign(new Error('composing'), { code: 'composing' });
  };
  document.addEventListener('compositionstart', () => {
    composing = true;
    invalidate();
  });
  document.addEventListener('compositionend', () => {
    composing = false;
    invalidate();
  });

  // Tabs
  $('.tabs').setAttribute('role', 'tablist');
  $('.tabs').setAttribute('aria-label', '操作画面');
  $$('.tab').forEach((btn, index)=>{
    btn.id = 'tab-' + btn.dataset.tab;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-controls', btn.dataset.tab);
    btn.setAttribute('aria-selected', String(index === 0));
    btn.tabIndex = index === 0 ? 0 : -1;
    const panel = $('#' + btn.dataset.tab);
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', btn.id);
    panel.hidden = index !== 0;
    btn.addEventListener('keydown', event => {
      const tabs = $$('.tab');
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault(); tabs[next].click(); tabs[next].focus();
      }
    });
    btn.addEventListener('click', ()=>{
      $$('.tab').forEach(b=>{
        b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); b.tabIndex = -1;
      });
      $$('.panel').forEach(p=>{ p.classList.remove('active'); p.hidden = true; });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true'); btn.tabIndex = 0;
      $('#'+btn.dataset.tab).classList.add('active');
      $('#'+btn.dataset.tab).hidden = false;
    });
  });
  $$('.help-icon').forEach((button, i) => {
    button.setAttribute('aria-expanded', 'false');
    const content = button.querySelector('.tooltip');
    content.id = 'help-' + i;
    button.setAttribute('aria-controls', content.id);
    content.hidden = true;
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open)); content.hidden = !open;
    });
    button.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        button.setAttribute('aria-expanded', 'false'); content.hidden = true;
      }
    });
  });
  document.addEventListener('click', event => {
    $$('.help-icon').forEach(button => {
      if (!button.contains(event.target)) {
        button.setAttribute('aria-expanded', 'false'); button.querySelector('.tooltip').hidden = true;
      }
    });
  });
  $$('.status, #validate-status').forEach(el => el.setAttribute('aria-live', 'polite'));

  // --- S-Box grid ---
  const sGrid = $('#sbox-grid');
  const makeSBoxInputs = (S) => {
    sGrid.replaceChildren();
    for (let i = 0; i < 16; i++){
      const div = document.createElement('div');
      div.className = 'grid16-item';

      const label = document.createElement('label');
      label.className = 'grid-label';
      M.text(label, i.toString(16).toUpperCase());
      label.htmlFor = 'sbox-' + i;

      const inp = document.createElement('input');
      inp.type = 'text';
      inp.id = 'sbox-' + i;
      inp.setAttribute('aria-label', M.t('S-Box 入力{0}の出力', i.toString(16).toUpperCase()));
      inp.autocomplete = 'off';
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
      const valid = /^[0-9a-fA-F]$/.test(v);
      inp.setAttribute('aria-invalid', String(!valid));
      arr.push(valid ? parseInt(v, 16) : NaN);
    });
    return arr;
  };
  const drawSBoxVisualization = (S) => {
    const svg = $('#sbox-viz');
    const inputDots = $('#input-dots');
    const outputDots = $('#output-dots');
    const arrows = $('#arrows');

    // Clear previous
    inputDots.replaceChildren();
    outputDots.replaceChildren();
    arrows.replaceChildren();

    if (!ToySPN.isBijection(S, 16)) return;

    // Reuse one definition per SVG.
    if (!svg.querySelector('defs')) {
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
    }

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
      M.text(inputText, i.toString(16).toUpperCase());
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
      M.text(outputText, i.toString(16).toUpperCase());
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
      line.setAttribute('marker-end', 'url(#arrowhead)');

      // Add title for hover
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      M.text(title, `${i.toString(16).toUpperCase()} → ${S[i].toString(16).toUpperCase()}`);
      line.appendChild(title);

      arrows.appendChild(line);
    }
  };

  const onSBoxChange = () => {
    invalidate();
    S = readSBox();
    const ok = ToySPN.isBijection(S,16);
    M.text(sStatus, ok ? '全単射 ✅' : '全単射ではありません ❌');
    sStatus.className = 'status ' + (ok ? 'ok' : 'bad');
    drawSBoxVisualization(S);
  };
  $('#sbox-reset').addEventListener('click', ()=>{
    S = ToySPN.DEFAULT_S.slice();
    makeSBoxInputs(S);
    onSBoxChange();
  });

  $('#sbox-random').addEventListener('click', ()=>{
    try {
    ensureCommitted();
    S = ToySPN.shuffledTable();
    makeSBoxInputs(S);
    onSBoxChange();
    } catch (e) { M.text(sStatus, ToySPNMessages.error(e)); }
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
    pGrid.replaceChildren();
    for (let i = 0; i < 16; i++){
      const div = document.createElement('div');
      div.className = 'grid16-item';

      const label = document.createElement('label');
      label.className = 'grid-label';
      M.text(label, 'b' + i);
      label.htmlFor = 'player-' + i;

      const inp = document.createElement('input');
      inp.type = 'number';
      inp.id = 'player-' + i;
      inp.setAttribute('aria-label', M.t('入力ビット{0}の移動先', i));
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
      const valid = /^\d{1,2}$/.test(inp.value) && Number(inp.value) <= 15;
      inp.setAttribute('aria-invalid', String(!valid));
      arr.push(valid ? Number(inp.value) : NaN);
    });
    return arr;
  };
  const drawPLayerVisualization = (P) => {
    const svg = $('#player-viz');
    const inputDots = $('#player-input-dots');
    const outputDots = $('#player-output-dots');
    const arrows = $('#player-arrows');

    // Clear previous
    inputDots.replaceChildren();
    outputDots.replaceChildren();
    arrows.replaceChildren();

    if (!ToySPN.isBijection(P, 16)) return;

    // Reuse one definition per SVG.
    if (!svg.querySelector('defs')) {
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
    }

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
      M.text(inputText, i);
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
      M.text(outputText, i);
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
      M.text(title, `b${i} → b${P[i]}`);
      line.appendChild(title);

      arrows.appendChild(line);
    }
  };

  const onPLayerChange = () => {
    invalidate();
    P = readPLayer();
    const ok = ToySPN.isBijection(P,16);
    M.text(pStatus, ok ? '全単射 ✅' : '全単射ではありません ❌');
    pStatus.className = 'status ' + (ok ? 'ok' : 'bad');
    drawPLayerVisualization(P);
  };
  $('#player-reset').addEventListener('click', ()=>{
    P = ToySPN.DEFAULT_P.slice();
    makePLayerInputs(P);
    onPLayerChange();
  });

  $('#player-random').addEventListener('click', ()=>{
    try {
    ensureCommitted();
    P = ToySPN.shuffledTable();
    makePLayerInputs(P);
    onPLayerChange();
    } catch (e) { M.text(pStatus, ToySPNMessages.error(e)); }
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
    invalidate();
  });

  roundsMaxBtn.addEventListener('click', ()=>{
    roundsEl.value = 16;
    invalidate();
  });

  keyRandomBtn.addEventListener('click', ()=>{
    try {
      ensureCommitted();
      mkeyEl.value = ToySPN.numToHex16(ToySPN.random16());
      invalidate();
    } catch (e) {
      validateResult.hidden = false;
      M.text(validateStatus, ToySPNMessages.error(e));
    }
  });

  validateBtn.addEventListener('click', ()=>{
    try {
    ensureCommitted();
    const okS = ToySPN.isBijection(S,16);
    const okP = ToySPN.isBijection(P,16);
    const mk = ToySPN.hex16ToNum(mkeyEl.value);
    const R = readInteger(roundsEl, 1, 16, 'invalidRounds');
    const keys = ToySPN.deriveRoundKeys(mk, R);

    // Build detailed result
    const sClass = okS ? 'ok' : 'ng';
    const pClass = okP ? 'ok' : 'ng';
    const overall = okS && okP;

    M.clear(validateStatus);

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
      M.text(label, labelText);

      const value = document.createElement('span');
      value.className = `detail-value ${valueClass}`;
      if (isTotal) value.style.fontSize = '15px';
      M.text(value, valueText);

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

    validateResult.hidden = false;
    } catch (e) {
      validateResult.hidden = false;
      M.text(validateStatus, ToySPNMessages.error(e));
    }
  });

  // --- Crypto actions ---
  const ptEl = $('#pt'), ctEl = $('#ct'), cryptoStatus = $('#crypto-status');
  const stepsEl = $('#steps');

  const readInteger = (input, min, max, code) => {
    try { return ToySPN.parseInteger(input.value, min, max); }
    catch (_) { throw Object.assign(new Error(code), { code }); }
  };

  const collectParams = () => {
    ensureCommitted();
    const okS = ToySPN.isBijection(S,16);
    const okP = ToySPN.isBijection(P,16);
    if (!okS || !okP) throw Object.assign(new Error('invalidTables'), { code: 'invalidTables' });
    const R = readInteger(roundsEl, 1, 16, 'invalidRounds');
    const mk = ToySPN.hex16ToNum(mkeyEl.value);
    const rks = ToySPN.deriveRoundKeys(mk, R);
    return { R, mk, rks };
  };

  const binaryValue = hex => {
    const bits = document.createElement('span');
    bits.className = 'step-binary';
    bits.textContent = parseInt(hex, 16).toString(2).padStart(16, '0').match(/.{4}/g).join(' ');
    bits.hidden = !$('#steps-bits').checked;
    return bits;
  };
  $('#steps-bits').addEventListener('change', () => {
    $$('#steps .step-binary').forEach(el => { el.hidden = !$('#steps-bits').checked; });
  });
  const renderSteps = (steps, roundKeys, decrypt = false) => {
    stepsEl.replaceChildren();
    steps.forEach((s, index) => {
      const detail = document.createElement('details');
      detail.className = 'step-round';
      detail.open = index === 0;
      const summary = document.createElement('summary');
      const title = document.createElement('span');
      M.text(title, decrypt ? 'ラウンド {0} (逆順)' : 'ラウンド {0}', s.round);
      const values = document.createElement('span');
      values.className = 'step-summary-values';
      M.text(values, '入力 {0} → 出力 {1}', s.before, decrypt ? s.afterS : s.afterK);
      summary.append(title, values);
      detail.appendChild(summary);
      const body = document.createElement('div');
      body.className = 'step-body';
      if (decrypt && index === 0) {
        const note = document.createElement('p');
        note.className = 'note';
        M.text(note, '復号では最後のラウンド鍵から逆順に使います。');
        body.appendChild(note);
      }
      const rows = decrypt
        ? [['入力', s.before], ['鍵加算後 (⊕)', s.afterK], ['逆P層後', s.afterP], ['逆S-Box後', s.afterS]]
        : [['入力', s.before], ['S-Box後', s.afterS], ['P層後', s.afterP], ['鍵加算後 (⊕)', s.afterK]];
      rows.forEach(([label, value]) => {
        const row = document.createElement('div');
        row.className = 'step-row';
        const labelSpan = document.createElement('span');
        labelSpan.className = 'step-label';
        M.text(labelSpan, label);
        const valueSpan = document.createElement('span');
        valueSpan.className = 'step-value';
        M.text(valueSpan, value);
        const valueGroup = document.createElement('span');
        valueGroup.className = 'step-number';
        valueGroup.append(valueSpan, binaryValue(value));
        row.append(labelSpan, valueGroup);
        body.appendChild(row);
      });
      const heading = document.createElement('h4');
      M.text(heading, '鍵XORの計算');
      const equation = document.createElement('div');
      equation.className = 'xor-equation';
      const operands = [
        ['XOR前', decrypt ? s.before : s.afterP, ''],
        ['ラウンド鍵 {0}', ToySPN.numToHex16(roundKeys[s.round - 1]), '⊕'],
        ['XOR後', s.afterK, '=']
      ];
      operands.forEach(([label, hex, operator]) => {
        const term = document.createElement('div');
        term.className = 'xor-term';
        const name = document.createElement('span');
        name.className = 'step-label';
        M.text(name, label, s.round);
        const value = document.createElement('span');
        value.className = 'xor-value';
        value.textContent = hex;
        const sign = document.createElement('span');
        sign.className = 'xor-operator';
        sign.textContent = operator;
        term.append(sign, name, value, binaryValue(hex));
        equation.appendChild(term);
      });
      body.append(heading, equation);
      detail.appendChild(body);
      stepsEl.appendChild(detail);
    });
  };
  $('#steps-expand').addEventListener('click', () => {
    $$('#steps details').forEach(detail => { detail.open = true; });
  });
  $('#steps-collapse').addEventListener('click', () => {
    $$('#steps details').forEach(detail => { detail.open = false; });
  });

  $('#btn-encrypt').addEventListener('click', ()=>{
    try{
      const { rks } = collectParams();
      const pt = ToySPN.hex16ToNum(ptEl.value);
      const steps = [];
      const ct = ToySPN.encryptBlock(pt, S, P, rks, steps);
      ctEl.value = ToySPN.numToHex16(ct);
      renderSteps(steps, rks);
      showCryptoState('complete');
      M.text(cryptoStatus, '暗号化完了 ✅');
      cryptoStatus.className = 'status ok';
    }catch(e){
      stepsEl.replaceChildren();
      showCryptoState('error');
      M.text(cryptoStatus, ToySPNMessages.error(e));
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
      renderSteps(steps, rks, true);
      showCryptoState('complete');
      M.text(cryptoStatus, '復号完了 ✅');
      cryptoStatus.className = 'status ok';
    }catch(e){
      stepsEl.replaceChildren();
      showCryptoState('error');
      M.text(cryptoStatus, ToySPNMessages.error(e));
      cryptoStatus.className = 'status bad';
    }
  });

  $('#btn-sample').addEventListener('click', ()=>{
    if (composing) return;
    S = ToySPN.DEFAULT_S.slice();
    P = ToySPN.DEFAULT_P.slice();
    makeSBoxInputs(S);
    makePLayerInputs(P);
    onSBoxChange();
    onPLayerChange();
    ptEl.value = '1234';
    mkeyEl.value = 'C0DE';
    roundsEl.value = 8;
    ctEl.value = '';
    invalidate();
    stepsEl.replaceChildren();
    showCryptoState('initial');
    showAnalysisState('initial');
    M.text(cryptoStatus, '標準サンプルを設定しました（S/Pは標準、平文1234・鍵C0DE・8ラウンド）。');
    cryptoStatus.className = 'status';
  });

  // --- Analysis: Avalanche ---
  const trialsEl = $('#trials');
  const avBtn = $('#btn-avalanche');
  const avStatus = $('#avalanche-status');
  const canvas = $('#chart');
  const summary = $('#avalanche-summary');
  [roundsEl, mkeyEl].forEach(input => input.addEventListener('input', () => invalidate()));
  [ptEl, ctEl].forEach(input => input.addEventListener('input', () => invalidate('crypto')));
  trialsEl.addEventListener('input', () => invalidate('analysis'));

  const analyzeAvalancheResult = (avg, hist, trials) => {
    // These describe this sample only; they are not cryptographic grades.
    const centerCount = hist[7] + hist[8] + hist[9];
    const centerPct = (centerCount / trials) * 100;
    return {
      verdict: ToySPNMessages.ja.measured,
      verdictClass: 'measured',
      analysis: '7〜9ビットが反転した試行は{0}/{1}回（{2}%）です。',
      values: [centerCount, trials, centerPct.toFixed(1)],
      suggestions: ToySPNMessages.ja.measurementHints
    };
  };

  avBtn.addEventListener('click', ()=>{
    try{
      const { rks, R, mk } = collectParams();
      const t = readInteger(trialsEl, 10, 2000, 'invalidTrials');
      const savedS = S.slice(), savedP = P.slice();
      clearAnalysis('running');
      const version = runVersion;
      avBtn.disabled = true;
      $('#analysis').setAttribute('aria-busy', 'true');
      M.text(avStatus, '実行中...');
      pendingAnalysis = setTimeout(()=>{
        if (version !== runVersion) return;
        try {
        const { hist, avg } = ToySPNAnalysis.avalancheTrials(t, savedS, savedP, rks);
        lastHistogram = hist.slice();
        showAnalysisState('complete');
        ToySPNAnalysis.drawHistogram(canvas, hist);
        M.text(summary, '試行回数={0}\n平均反転ビット数={1} / 16\nラウンド数={2}、鍵={3}\nS={4}\nP={5}',
          t, avg.toFixed(3), R, ToySPN.numToHex16(mk),
          savedS.map(n => n.toString(16).toUpperCase()).join(' '), savedP.join(' '));

        // Populate histogram data table
        const tbody = $('#histogram-tbody');
        tbody.replaceChildren();
        let hasData = false;
        for (let i = 0; i < hist.length; i++){
          if (hist[i] > 0) hasData = true;
          const pct = ((hist[i] / t) * 100).toFixed(1);
          const tr = document.createElement('tr');

          const td1 = document.createElement('td');
          M.text(td1, String(i));
          const td2 = document.createElement('td');
          M.text(td2, String(hist[i]));
          const td3 = document.createElement('td');
          M.text(td3, `${pct}%`);

          tr.appendChild(td1);
          tr.appendChild(td2);
          tr.appendChild(td3);
          tbody.appendChild(tr);
        }
        $('#histogram-table').hidden = !hasData;

        // Show expert hint
        const { verdict, verdictClass, analysis, values, suggestions } = analyzeAvalancheResult(avg, hist, t);
        const expertHint = $('#expert-hint');
        const hintContent = $('#hint-content');

        hintContent.replaceChildren();

        const section1 = document.createElement('div');
        section1.className = 'hint-section';
        const h4_1 = document.createElement('h4');
        M.text(h4_1, '測定値');
        const p1 = document.createElement('p');
        const span1 = document.createElement('span');
        span1.className = `hint-verdict ${verdictClass}`;
        M.text(span1, verdict);
        p1.appendChild(span1);
        const average = document.createElement('span');
        M.text(average, ' 平均反転ビット数: {0} / 16.0 ビット', avg.toFixed(3));
        p1.appendChild(average);
        section1.appendChild(h4_1);
        section1.appendChild(p1);

        const section2 = document.createElement('div');
        section2.className = 'hint-section';
        const h4_2 = document.createElement('h4');
        M.text(h4_2, '分布と測定の限界');
        const p2 = document.createElement('p');
        M.text(p2, analysis, ...values);
        const limit = document.createElement('p');
        M.text(limit, M.ja.measurementLimit);
        section2.appendChild(h4_2);
        section2.appendChild(p2);
        section2.appendChild(limit);

        const section3 = document.createElement('div');
        section3.className = 'hint-section';
        const h4_3 = document.createElement('h4');
        M.text(h4_3, '比較するときの注意');
        const ul = document.createElement('ul');
        suggestions.forEach(s => {
          const li = document.createElement('li');
          M.text(li, s);
          ul.appendChild(li);
        });
        section3.appendChild(h4_3);
        section3.appendChild(ul);

        hintContent.appendChild(section1);
        hintContent.appendChild(section2);
        hintContent.appendChild(section3);
        expertHint.hidden = false;

        M.text(avStatus, '完了 ✅');
        avStatus.className = 'status ok';
        } catch (e) {
          clearAnalysis('error');
          M.text(avStatus, ToySPNMessages.error(e));
          avStatus.className = 'status bad';
        } finally {
          pendingAnalysis = null;
          avBtn.disabled = false;
          $('#analysis').removeAttribute('aria-busy');
        }
      }, 10);
    }catch(e){
      clearAnalysis('error');
      M.text(avStatus, ToySPNMessages.error(e));
      avStatus.className = 'status bad';
    }
  });

  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => {
      if (lastHistogram && !$('#analysis').hidden) ToySPNAnalysis.drawHistogram(canvas, lastHistogram);
    }).observe(canvas);
  }

  // --- Accordion for Learn section ---
  $$('.accordion-header').forEach((btn, i) => {
    const content = btn.nextElementSibling;
    content.id = 'learn-' + i;
    content.hidden = true;
    btn.setAttribute('aria-controls', content.id);
    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const wasActive = item.classList.contains('active');

      // Close all accordions
      $$('.accordion-item').forEach(item => {
        item.classList.remove('active');
        item.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
        item.querySelector('.accordion-content').hidden = true;
      });

      // Open clicked one if it wasn't active
      if (!wasActive) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        content.hidden = false;
      }
    });
  });

  M.registerStatic(document.documentElement);
  $('#language-toggle').addEventListener('click', () => M.saveLanguage(M.language === 'ja' ? 'en' : 'ja'));
  M.setLanguage(M.initialLanguage());
})();
