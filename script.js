/* ═══════════════════════════════════════════════════════════════════
   FlagVault CTF — XOR Vault Binary Rev · Challenge #R1
   ───────────────────────────────────────────────────────────────
   CHALLENGE SETUP
   ───────────────
   Binary: ELF 64-bit stripped, compiled from C
   Key:    0x5A ('Z', decimal 90)
   Flag:   FlagVault{x0r_k3y_r3v3rs3d_by_3ntr0py}

   Encrypted flag bytes (38 bytes, extracted from .rodata):
   0x1c 0x36 0x3b 0x3d 0x0c 0x3b 0x2f 0x36
   0x2e 0x21 0x22 0x6a 0x28 0x05 0x31 0x69
   0x23 0x05 0x28 0x69 0x2c 0x69 0x28 0x29
   0x69 0x3e 0x05 0x38 0x23 0x05 0x69 0x34
   0x2e 0x28 0x6a 0x2a 0x23 0x27

   ATTACK ROUTES
   ─────────────
   A. Brute force: try all 256 keys, check printable ASCII
   B. Frequency analysis: 0x69 (most frequent) XOR '3' = 0x5a
   C. Known-plaintext: 0x1c XOR 'F'(0x46) = 0x5a
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ──────── Encrypted data ──────── */
const ENC = new Uint8Array([
  0x1c, 0x36, 0x3b, 0x3d, 0x0c, 0x3b, 0x2f, 0x36,
  0x2e, 0x21, 0x22, 0x6a, 0x28, 0x05, 0x31, 0x69,
  0x23, 0x05, 0x28, 0x69, 0x2c, 0x69, 0x28, 0x29,
  0x69, 0x3e, 0x05, 0x38, 0x23, 0x05, 0x69, 0x34,
  0x2e, 0x28, 0x6a, 0x2a, 0x23, 0x27
]);

const WIN_KEY = 0x5a;
const FLAG    = 'FlagVault{x0r_k3y_r3v3rs3d_by_3ntr0py}';

/* ──────── XOR decrypt ──────── */
function xorDecrypt(data, key) {
  return Array.from(data).map(b => b ^ key);
}

function isAllPrintable(bytes) {
  return bytes.every(b => b >= 0x20 && b <= 0x7e);
}

function bytesToStr(bytes) {
  return bytes.map(b => (b >= 0x20 && b <= 0x7e) ? String.fromCharCode(b) : '·').join('');
}

/* ──────── Terminal Simulator ──────── */
let termEl;
let historyPrinted = false;

function termPrint(html, cls = '') {
  const line = document.createElement('div');
  line.className = `tb-line${cls ? ' ' + cls : ''}`;
  line.innerHTML = html;
  termEl.appendChild(line);
  termEl.scrollTop = termEl.scrollHeight;
}

function setKey(hex) {
  document.getElementById('term-input').value = hex;
}

function runBinary() {
  const raw = document.getElementById('term-input').value.trim();
  if (!/^[0-9a-fA-F]{1,2}$/.test(raw)) {
    termPrint('[!] Enter a 1-2 digit hex value (e.g. 5a)', 'tb-bad');
    return;
  }

  const key     = parseInt(raw, 16);
  const decoded = xorDecrypt(ENC, key);
  const printable = isAllPrintable(decoded);
  const str     = bytesToStr(decoded);
  const charRep = (key >= 0x20 && key < 0x7f) ? String.fromCharCode(key) : '.';
  const win     = key === WIN_KEY;

  // Remove cursor
  document.getElementById('cursor')?.remove();

  termPrint(`<span class="tb-input">&gt; ${raw.toLowerCase().padStart(2,'0')}</span>`);
  termPrint(`[*] Trying key: 0x${key.toString(16).padStart(2,'0')} ('${charRep}')`, '');
  termPrint(`[*] Decrypted:  <span class="${win ? 'tb-good' : 'tb-input'}">${escHtml(str)}</span>`);

  if (win) {
    termPrint('[+] Output looks like printable ASCII — that might be your flag!', 'tb-good');
    revealFlag();
  } else if (printable) {
    termPrint('[~] Output is printable but doesn\'t look right. Try another key.', 'tb-sys');
  } else {
    termPrint('[-] Output has non-printable bytes — wrong key?', 'tb-bad');
  }
  termPrint('');

  if (!historyPrinted) {
    termPrint('=== XOR Vault ===', 'tb-banner');
    termPrint('Enter the XOR key (hex, e.g. 5a): ', '');
    historyPrinted = true;
  }
}

/* ──────── Hexdump ──────── */
function buildHexdump() {
  const el = document.getElementById('hexdump-content');
  if (!el) return;

  // Simulate a hexdump of the relevant section
  const baseAddr = 0x2020;
  let html = '<div class="ds-line ds-dim">// .rodata section — encrypted flag buffer</div>';

  for (let row = 0; row < ENC.length; row += 8) {
    const addr = baseAddr + row;
    const hexPart = Array.from(ENC.slice(row, row+8))
      .map(b => `<span style="color:var(--accent2)">${b.toString(16).padStart(2,'0')}</span>`)
      .join(' ');
    const asciiPart = Array.from(ENC.slice(row, row+8))
      .map(b => (b >= 0x20 && b < 0x7f) ? `<span style="color:var(--text)">${String.fromCharCode(b)}</span>` : '<span style="color:var(--text-dim)">.</span>')
      .join('');
    html += `<div class="ds-line"><span style="color:var(--text-dim)">0x${addr.toString(16).padStart(4,'0')}</span>  ${hexPart}   <span style="color:var(--text-dim)">|${asciiPart}|</span></div>`;
  }
  html += '<div class="ds-line ds-note">// No plaintext flag here — it\'s encrypted!</div>';
  el.innerHTML = html;
}

/* ──────── Pseudo-code bytes ──────── */
function buildPseudoBytes() {
  const el = document.getElementById('pseudo-bytes');
  if (!el) return;
  const hexBytes = Array.from(ENC).map((b, i) => {
    const comma = i < ENC.length - 1 ? ',' : '';
    return `<span style="color:var(--accent2)">0x${b.toString(16).padStart(2,'0')}</span>${comma}`;
  }).join(' ');
  el.innerHTML = hexBytes;
}

/* ──────── Entropy / Frequency bars ──────── */
function buildEntropyBars() {
  const el = document.getElementById('entropy-bars');
  if (!el) return;

  const freq = new Array(256).fill(0);
  ENC.forEach(b => freq[b]++);
  const sorted = freq.map((c,i) => ({b:i,c})).filter(x=>x.c>0).sort((a,b)=>b.c-a.c).slice(0,8);
  const maxC = sorted[0]?.c || 1;

  el.innerHTML = sorted.map(({b,c}, i) => `
    <div class="eb-row">
      <span class="eb-byte">0x${b.toString(16).padStart(2,'0')}</span>
      <div class="eb-bar ${i===0?'top':i<3?'mid':''}" style="width:${(c/maxC)*120}px"></div>
      <span class="eb-count">×${c}</span>
    </div>`).join('');
}

/* ──────── Tab switching ──────── */
function switchTab(name) {
  document.querySelectorAll('.dasm-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.dasm-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`[onclick="switchTab('${name}')"]`)?.classList.add('active');
  document.getElementById(`panel-${name}`)?.classList.add('active');
}

/* ──────── Brute Force ──────── */
let bruteResults = [];
let bruteRunning = false;

function startBrute() {
  if (bruteRunning) return;
  bruteRunning = true;
  bruteResults = [];

  document.getElementById('btn-brute').disabled = true;
  document.getElementById('brute-progress').classList.remove('hidden');
  document.getElementById('brute-results-wrap').classList.remove('hidden');
  document.getElementById('brute-results').innerHTML = '';
  document.getElementById('br-done-tag').style.display = 'none';
  document.getElementById('brute-results-wrap').querySelector('.br-header') &&
    (document.getElementById('br-count').textContent = '');

  let k = 0;
  const bar    = document.getElementById('bp-bar');
  const status = document.getElementById('bp-status');

  function tick() {
    const batchEnd = Math.min(k + 16, 256);
    for (; k < batchEnd; k++) {
      const decoded   = xorDecrypt(ENC, k);
      const printable = isAllPrintable(decoded);
      const str       = bytesToStr(decoded);
      bruteResults.push({ k, printable, str });
    }

    const pct = (k / 256) * 100;
    bar.style.width = pct + '%';
    status.textContent = `Trying 0x${(k-1).toString(16).padStart(2,'0')}… (${k}/256)`;

    if (k < 256) {
      setTimeout(tick, 15);
    } else {
      bruteRunning = false;
      status.textContent = `Complete! Tried all 256 keys.`;
      document.getElementById('br-done-tag').style.display = '';
      document.getElementById('btn-brute').disabled = false;
      renderBruteResults();

      // Auto-reveal if correct key visible
      setTimeout(revealFlag, 800);
    }
  }
  tick();
}

function renderBruteResults() {
  const container  = document.getElementById('brute-results');
  const filterOnly = document.getElementById('filter-printable').checked;
  const toShow     = filterOnly ? bruteResults.filter(r => r.printable) : bruteResults;

  document.getElementById('br-count').textContent = `(${toShow.length} results)`;
  container.innerHTML = '';

  toShow.forEach(({ k, printable, str }) => {
    const isWin   = k === WIN_KEY;
    const row     = document.createElement('div');
    row.className = `br-row${isWin ? ' br-winner' : ''}`;
    row.onclick   = () => { setKey(k.toString(16).padStart(2,'0')); runBinary(); };

    const charRep = (k >= 0x20 && k < 0x7f) ? String.fromCharCode(k) : '.';
    row.innerHTML = `
      <span class="br-key${isWin?' bk-win':''}">0x${k.toString(16).padStart(2,'0')} (${k})</span>
      <span class="br-char">${charRep}</span>
      <span class="br-out${isWin?' br-flag':''}">${escHtml(str)}</span>`;

    container.appendChild(row);
    if (isWin) setTimeout(() => row.scrollIntoView({ behavior:'smooth', block:'center' }), 100);
  });
}

/* ──────── Flag reveal ──────── */
function revealFlag() {
  const wrap = document.getElementById('flag-reveal');
  if (!wrap || !wrap.classList.contains('hidden')) return;
  document.getElementById('fr-val').textContent = FLAG;
  wrap.classList.remove('hidden');
  setTimeout(() => wrap.scrollIntoView({ behavior:'smooth', block:'center' }), 300);
}

function copyFlag() {
  const v = document.getElementById('fr-val').textContent;
  const t = document.getElementById('copy-toast');
  navigator.clipboard.writeText(v).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = v; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
  });
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2000);
}

/* ──────── Hints ──────── */
function toggleHint(n) {
  const b = document.getElementById(`h${n}b`);
  const t = document.getElementById(`h${n}t`);
  const h = b.classList.toggle('hidden');
  t.textContent = h ? '▼ Reveal' : '▲ Hide';
}

/* ──────── Submit ──────── */
function submitFlag() {
  const v = document.getElementById('flag-input').value.trim();
  const r = document.getElementById('flag-result');
  if (`FlagVault{${v}}` === FLAG) {
    r.className = 'submit-result correct';
    r.innerHTML = '✓ &nbsp;Correct! Flag accepted. +200 pts';
    revealFlag();
  } else {
    r.className = 'submit-result incorrect';
    r.innerHTML = '✗ &nbsp;Incorrect flag. Keep trying.';
  }
}

/* ──────── Utility ──────── */
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ──────── Boot ──────── */
document.addEventListener('DOMContentLoaded', () => {
  termEl = document.getElementById('terminal-body');

  buildHexdump();
  buildPseudoBytes();
  buildEntropyBars();

  document.getElementById('term-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') runBinary();
  });

  document.getElementById('flag-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') submitFlag();
  });

  console.log('%c⚙️ FlagVault CTF — XOR Vault Binary Rev', 'font-size:14px;font-weight:bold;color:#00e8c8;');
  console.log('%cKey: 0x5a  →  enc[i] ^ 0x5a = plaintext', 'color:#b8cdd9;font-family:monospace;');
  console.log('%cKnown-plaintext: enc[0]=0x1c, "F"=0x46  →  0x1c^0x46=0x5a', 'color:#f5a623;font-family:monospace;');
  console.log(`%cFlag: ${FLAG}`, 'color:#00e8c8;font-family:monospace;');
});
