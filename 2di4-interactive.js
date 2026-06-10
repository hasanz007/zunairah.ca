(function() {

/* ========== 7-Segment Display ========== */

const SEG_MAP = [
  0b1111110, // 0: a b c d e f
  0b0110000, // 1: b c
  0b1101101, // 2: a b d e g
  0b1111001, // 3: a b c d g
  0b0110011, // 4: b c f g
  0b1011011, // 5: a c d f g
  0b1011111, // 6: a c d e f g
  0b1110000, // 7: a b c
  0b1111111, // 8: a b c d e f g
  0b1111011, // 9: a b c d f g
  0b1110111, // A: a b c e f g
  0b0011111, // B: c d e f g
  0b1001110, // C: a d e f
  0b0111101, // D: b c d e g
  0b1001111, // E: a d e f g
  0b1000111, // F: a e f g
];

const SEG_NAMES = ['a','b','c','d','e','f','g'];
const SEG_IDS   = ['segA','segB','segC','segD','segE','segF','segG'];

const HEX_CHARS = '0123456789ABCDEF';

function initSevenSeg() {
  const container = document.getElementById('sevenSegInputs');
  if (!container) return;
  const toggles = container.querySelectorAll('.bit-toggle');

  function updateDisplay() {
    let value = 0;
    toggles.forEach(btn => {
      if (btn.classList.contains('active')) value |= (1 << parseInt(btn.dataset.bit));
    });
    const pattern = SEG_MAP[value] || 0;
    for (let i = 0; i < 7; i++) {
      const el = document.getElementById(SEG_IDS[i]);
      if (!el) continue;
      const on = !!(pattern & (1 << (6 - i)));
      el.classList.toggle('on', on);
    }
    document.getElementById('segBinary').textContent = value.toString(2).padStart(4, '0');
    document.getElementById('segDecimal').textContent = value;
    document.getElementById('segHex').textContent = HEX_CHARS[value];
    const lit = [];
    for (let i = 0; i < 7; i++) {
      if (pattern & (1 << (6 - i))) lit.push(SEG_NAMES[i]);
    }
    document.getElementById('segLit').textContent = lit.join(', ') || '(none)';
  }

  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      btn.textContent = btn.classList.contains('active') ? '1' : '0';
      updateDisplay();
    });
  });

  updateDisplay();
}

/* ========== 4-Bit Binary Adder ========== */

function fullAdder(a, b, cin) {
  const sum = a ^ b ^ cin;
  const cout = (a & b) | (cin & (a ^ b));
  return { sum, cout };
}

function initAdder() {
  const toggles = document.querySelectorAll('.bit-toggle[data-adder]');
  if (!toggles.length) return;

  function getBits(input) {
    const sel = document.querySelectorAll(`.bit-toggle[data-adder="${input}"]`);
    let val = 0;
    sel.forEach(btn => {
      if (btn.classList.contains('active')) val |= (1 << parseInt(btn.dataset.bit));
    });
    return val;
  }

  function updateAdder() {
    const a = getBits('a');
    const b = getBits('b');
    const cin = getBits('cin');

    const aBits = [(a >> 3) & 1, (a >> 2) & 1, (a >> 1) & 1, a & 1];
    const bBits = [(b >> 3) & 1, (b >> 2) & 1, (b >> 1) & 1, b & 1];

    const sumBits = [];
    let carry = cin;
    const carries = [cin];

    for (let i = 0; i < 4; i++) {
      const result = fullAdder(aBits[3 - i], bBits[3 - i], carry);
      sumBits[3 - i] = result.sum;
      carries[i + 1] = result.cout;
      carry = result.cout;
    }

    for (let i = 0; i < 4; i++) {
      document.getElementById('sA' + i).textContent = aBits[3 - i];
      document.getElementById('sB' + i).textContent = bBits[3 - i];
      document.getElementById('sS' + i).textContent = sumBits[3 - i];
      document.getElementById('sC' + i).textContent = carries[i];
    }
    document.getElementById('dC1').textContent = carries[1];
    document.getElementById('dC2').textContent = carries[2];
    document.getElementById('dC3').textContent = carries[3];
    document.getElementById('sC4').textContent = carries[4];

    const sumVal = (sumBits[0] << 3) | (sumBits[1] << 2) | (sumBits[2] << 1) | sumBits[3];
    document.getElementById('adderBinary').textContent = sumBits.slice(0, 4).join('');
    document.getElementById('adderDecimal').textContent = sumVal;
    document.getElementById('adderCarry').textContent = carries[4];
  }

  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      btn.textContent = btn.classList.contains('active') ? '1' : '0';
      updateAdder();
    });
  });

  updateAdder();
}

/* ========== Logic Gate Explorer ========== */

const GATE_FNS = {
  and:  (a, b) => a & b,
  or:   (a, b) => a | b,
  nand: (a, b) => a & b ? 0 : 1,
  nor:  (a, b) => a | b ? 0 : 1,
  xor:  (a, b) => a ^ b,
  xnor: (a, b) => a ^ b ? 0 : 1,
};

function initGateExplorer() {
  const selector = document.getElementById('gateSelector');
  if (!selector) return;
  const gateBtns = selector.querySelectorAll('.gate-btn');
  const btnA = document.getElementById('gateA');
  const btnB = document.getElementById('gateB');
  const gateBox = document.getElementById('gateBox');
  const outLabel = document.getElementById('gateOutput');
  const lineA = document.getElementById('gateLineA');
  const lineB = document.getElementById('gateLineB');
  const lineOut = document.getElementById('gateLineOut');
  const table = document.getElementById('gateTruthTable');
  if (!btnA) return;

  let currentGate = 'and';

  function updateGate() {
    const a = btnA.classList.contains('active') ? 1 : 0;
    const b = btnB.classList.contains('active') ? 1 : 0;
    const fn = GATE_FNS[currentGate];
    const out = fn(a, b);

    gateBox.textContent = currentGate.toUpperCase();
    outLabel.textContent = out;

    lineA.className = 'gate-line' + (a ? ' high' : '');
    lineB.className = 'gate-line' + (b ? ' high' : '');
    lineOut.className = 'gate-line' + (out ? ' high' : '');

    const rows = [
      ['A', 'B', 'Out'],
      ['0', '0', fn(0, 0)],
      ['0', '1', fn(0, 1)],
      ['1', '0', fn(1, 0)],
      ['1', '1', fn(1, 1)],
    ];

    table.innerHTML = '';
    rows.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        const div = document.createElement('div');
        div.className = ri === 0 ? 'tt-header' : 'tt-cell';
        div.textContent = cell;
        if (ri > 0 && a === (ri - 1) >> 1 && b === (ri - 1) & 1) {
          div.classList.add('highlight');
        }
        table.appendChild(div);
      });
    });
  }

  gateBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      gateBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentGate = btn.dataset.gate;
      updateGate();
    });
  });

  btnA.addEventListener('click', () => {
    btnA.classList.toggle('active');
    btnA.textContent = btnA.classList.contains('active') ? '1' : '0';
    updateGate();
  });

  btnB.addEventListener('click', () => {
    btnB.classList.toggle('active');
    btnB.textContent = btnB.classList.contains('active') ? '1' : '0';
    updateGate();
  });

  updateGate();
}

/* ========== Karnaugh Map Solver ========== */

const KMAP_VARS = { 2: ['A', 'B'], 3: ['A', 'B', 'C'] };

// 2-var groups: { cells: [indices], termLabel }
// cells are K-map positions (not minterm numbers)
// Row 0: [0(A'B'), 1(A'B)]
// Row 1: [2(AB'), 3(AB)]

// 3-var groups:
// Row 0: [0(000), 1(001), 3(011), 2(010)]
// Row 1: [4(100), 5(101), 7(111), 6(110)]

const K2_GROUPS = [
  { cells: [0, 1, 2, 3], vars: {} },                              // 1
  { cells: [0, 1], vars: { A: 0 } },                              // A'
  { cells: [2, 3], vars: { A: 1 } },                              // A
  { cells: [0, 2], vars: { B: 0 } },                              // B'
  { cells: [1, 3], vars: { B: 1 } },                              // B
  { cells: [0],    vars: { A: 0, B: 0 } },                        // A'B'
  { cells: [1],    vars: { A: 0, B: 1 } },                        // A'B
  { cells: [2],    vars: { A: 1, B: 0 } },                        // AB'
  { cells: [3],    vars: { A: 1, B: 1 } },                        // AB
];

const K3_GROUPS = [
  { cells: [0,1,2,3,4,5,6,7], vars: {} },                         // 1
  { cells: [0,1,2,3], vars: { A: 0 } },                           // A'
  { cells: [4,5,6,7], vars: { A: 1 } },                           // A
  { cells: [0,1,4,5], vars: { B: 0 } },                           // B'
  { cells: [1,2,5,6], vars: { C: 1 } },                           // C
  { cells: [2,3,6,7], vars: { B: 1 } },                           // B
  { cells: [3,0,7,4], vars: { C: 0 } },                           // C'
  { cells: [0,1], vars: { A: 0, B: 0 } },                         // A'B'
  { cells: [1,2], vars: { A: 0, C: 1 } },                         // A'C
  { cells: [2,3], vars: { A: 0, B: 1 } },                         // A'B
  { cells: [3,0], vars: { A: 0, C: 0 } },                         // A'C'
  { cells: [4,5], vars: { A: 1, B: 0 } },                         // AB'
  { cells: [5,6], vars: { A: 1, C: 1 } },                         // AC
  { cells: [6,7], vars: { A: 1, B: 1 } },                         // AB
  { cells: [7,4], vars: { A: 1, C: 0 } },                         // AC'
  { cells: [0,4], vars: { B: 0, C: 0 } },                         // B'C'
  { cells: [1,5], vars: { B: 0, C: 1 } },                         // B'C
  { cells: [2,6], vars: { B: 1, C: 1 } },                         // BC
  { cells: [3,7], vars: { B: 1, C: 0 } },                         // BC'
  { cells: [0], vars: { A: 0, B: 0, C: 0 } },                    // A'B'C'
  { cells: [1], vars: { A: 0, B: 0, C: 1 } },                    // A'B'C
  { cells: [2], vars: { A: 0, B: 1, C: 1 } },                    // A'BC
  { cells: [3], vars: { A: 0, B: 1, C: 0 } },                    // A'BC'
  { cells: [4], vars: { A: 1, B: 0, C: 0 } },                    // AB'C'
  { cells: [5], vars: { A: 1, B: 0, C: 1 } },                    // AB'C
  { cells: [6], vars: { A: 1, B: 1, C: 1 } },                    // ABC
  { cells: [7], vars: { A: 1, B: 1, C: 0 } },                    // ABC'
];

function termFromVars(vars, numVars) {
  if (!Object.keys(vars).length) return '1';
  const names = KMAP_VARS[numVars];
  return names.map(n => {
    if (vars[n] === 0) return n + "'";
    if (vars[n] === 1) return n;
    return null;
  }).filter(Boolean).join('');
}

function buildCanonical(cells, numVars) {
  const names = KMAP_VARS[numVars];
  const terms = [];
  for (let i = 0; i < cells.length; i++) {
    if (!cells[i]) continue;
    const bits = (numVars === 2)
      ? [(i >> 1) & 1, i & 1]
      : [i >> 2 & 1, (i >> 1) & 1, i & 1];
    // remap for 3-var: K-map cell order 0,1,3,2,4,5,7,6
    // minterm order: 0,1,2,3,4,5,6,7
    const actualIdx = (numVars === 3)
      ? [0,1,3,2,4,5,7,6][i]
      : i;
    const mins = (numVars === 3)
      ? [(actualIdx >> 2) & 1, (actualIdx >> 1) & 1, actualIdx & 1]
      : [(actualIdx >> 1) & 1, actualIdx & 1];
    const term = names.map((n, j) => mins[j] ? n : n + "'").join('');
    terms.push(term);
  }
  return terms.join(' + ') || '0';
}

function minimizeKMap(cells, numVars) {
  const groups = numVars === 2 ? K2_GROUPS : K3_GROUPS;
  const covered = cells.map(() => false);
  const used = [];

  // sort by group size descending (largest first)
  const sorted = [...groups].sort((a, b) => b.cells.length - a.cells.length);

  for (const g of sorted) {
    // check all cells in this group are 1
    if (!g.cells.every(ci => cells[ci])) continue;
    // check at least one cell is not yet covered
    if (!g.cells.some(ci => !covered[ci])) continue;
    used.push(g);
    g.cells.forEach(ci => { covered[ci] = true; });
  }

  return used.map(g => termFromVars(g.vars, numVars)).join(' + ') || '0';
}

function initKMap() {
  const grid = document.getElementById('kmapGrid');
  if (!grid) return;
  const modeBtns = document.querySelectorAll('#kmapModeSelector .gate-btn');
  const minimizedEl = document.getElementById('kmapMinimized');
  const canonicalEl = document.getElementById('kmapCanonical');

  let numVars = 2;
  let cells = [1, 0, 0, 1]; // default: XNOR pattern

  function renderKMap() {
    const cols = numVars === 2 ? 2 : 4;
    grid.className = 'kmap-grid kmap-grid-' + numVars + 'var';
    grid.innerHTML = '';

    // corner cell (empty)
    const corner = document.createElement('div');
    corner.className = 'kmap-header';
    const varNames = KMAP_VARS[numVars];
    if (numVars === 2) {
      corner.textContent = 'A\\B';
    } else {
      corner.innerHTML = 'A\\BC';
    }
    grid.appendChild(corner);

    // column headers (Gray code)
    const colLabels = numVars === 2 ? ['0', '1'] : ['00', '01', '11', '10'];
    colLabels.forEach(label => {
      const h = document.createElement('div');
      h.className = 'kmap-header';
      h.textContent = label;
      grid.appendChild(h);
    });

    // rows
    for (let r = 0; r < 2; r++) {
      const label = document.createElement('div');
      label.className = 'kmap-row-label';
      label.textContent = r;
      grid.appendChild(label);

      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const cell = document.createElement('div');
        cell.className = 'kmap-cell' + (cells[idx] ? ' val-1' : '');
        cell.textContent = cells[idx];

        const minterm = document.createElement('span');
        minterm.className = 'kmap-minterm';
        const kmap3 = [0,1,3,2,4,5,7,6];
        const mIdx = numVars === 3 ? kmap3[idx] : idx;
        minterm.textContent = 'm' + mIdx;
        cell.appendChild(minterm);

        cell.addEventListener('click', () => {
          cells[idx] = cells[idx] ? 0 : 1;
          updateExpressions();
        });

        grid.appendChild(cell);
      }
    }
  }

  function updateExpressions() {
    const rendered = grid.querySelectorAll('.kmap-cell');
    rendered.forEach((el, i) => {
      el.className = 'kmap-cell' + (cells[i] ? ' val-1' : '');
      el.textContent = cells[i];
    });

    const minimized = minimizeKMap(cells, numVars);
    minimizedEl.textContent = minimized;

    const canonical = buildCanonical(cells, numVars);
    canonicalEl.textContent = canonical;
  }

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      numVars = parseInt(btn.dataset.kmap);
      const size = numVars === 2 ? 4 : 8;
      if (cells.length !== size) cells = new Array(size).fill(0);
      renderKMap();
      updateExpressions();
    });
  });

  renderKMap();
  updateExpressions();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { initSevenSeg(); initAdder(); initGateExplorer(); initKMap(); });
} else {
  initSevenSeg();
  initAdder();
  initGateExplorer();
  initKMap();
}

})();
