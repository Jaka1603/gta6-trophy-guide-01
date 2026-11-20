// LEONIDA LEDGER — GTA VI trophy guide & tracker.
// One module, no libraries, no network beyond its own two data files.
// Progress (earned, counters, spoiler setting, reveals) lives in localStorage.
const LS_KEY = 'leonida-ledger-v2';
const params = new URLSearchParams(location.search);

const STAGES = [
  { n: 1, name: 'Chapter 1', blurb: 'Story start. Two things before anything else: take the Chapter 1 balcony meditation (Positive Mental Attitude, the one possibly missable trophy) and park a manual save at the chapter start [2] [9].' },
  { n: 2, name: 'Chapter 2', blurb: 'Both leads become playable together — the partner trophies open up here, and the heists hand out the wanted levels they need [2].' },
  { n: 3, name: 'Chapter 3', blurb: 'Mid-story. Keep rotating manual saves; start stranger chains as they appear instead of saving them all for the endgame [6] [9].' },
  { n: 4, name: 'Chapter 4', blurb: 'The last full chapter. The airport set-pieces live here; finish the chains you care about before the finale [3].' },
  { n: 5, name: 'The Finale', blurb: 'The final chapter and the final mission. Choices made here cannot be re-rolled — story missions cannot be replayed [2] [6].' },
  { n: 6, name: 'Strangers & the Living World', blurb: 'Side chains second: the five named strands, Bret\u2019s hunt, and every activity type at least once [3] [5].' },
  { n: 7, name: 'Cleanup & 100%', blurb: 'The long tail: the 100% checklist, the counters, the crime list. The story took about 60–80 hours; full-platinum estimates run to 200–250 hours in total [2] [5].' },
];
const KIND_LABEL = { story: 'Story', collectibles: 'Collectibles', activities: 'Activities', side: 'Side chains', crime: 'Crime', mystery: 'Mystery', money: 'Money', completion: 'Completion' };
const FILTERS = [
  ['all', 'All'], ['story', 'Story'], ['missable', 'Missable'], ['watch', 'Watch'], ['unconfirmed', 'Unconfirmed'],
  ['collectibles', 'Collectibles'], ['activities', 'Activities'], ['side', 'Side chains'], ['crime', 'Crime'],
  ['mystery', 'Mystery'], ['money', 'Money'], ['completion', 'Completion'], ['unearned', 'Unearned only'],
];
const GRADE_LETTER = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };

let trophies = [];
let guides = {};
let sources = [];
let readDate = '20 Nov 2026';

let state = loadState();
let view = ['checklist', 'roadmap', 'missables', 'sources'].includes(params.get('view')) ? params.get('view') : 'checklist';
let filter = 'all';
let query = '';
let selected = Number(params.get('sel')) || 28;

function blankState() { return { earned: [], counters: {}, spoilers: true, revealed: [] }; }
function loadState() {
  if (params.has('demo')) {
    return {
      earned: [2, 3, 44, 4, 8, 9, 33, 16, 21, 53, 30],
      counters: { 28: 6, 31: 41, 15: 87, 32: 12 },
      spoilers: false, revealed: [],
    };
  }
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY));
    if (raw && Array.isArray(raw.earned)) {
      return { earned: raw.earned, counters: raw.counters || {}, spoilers: raw.spoilers !== false, revealed: raw.revealed || [] };
    }
  } catch { /* a corrupt save falls back to a blank one */ }
  return blankState();
}
function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
  const note = document.getElementById('savedNote');
  if (note) note.textContent = 'Saved in this browser · just now';
}

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const earnedSet = () => new Set(state.earned);
const isEarned = (id) => state.earned.includes(id);
const guideOf = (t) => guides[t.id] || {};
const isHidden = (t) => !!guideOf(t).x;
const isMasked = (t) => state.spoilers && isHidden(t) && !isEarned(t.id) && !state.revealed.includes(t.id);
const fmtNum = (n) => n.toLocaleString('en-US');

function flagsOf(t) {
  const g = guideOf(t);
  return { m: !!g.m, w: !!g.w, u: !!g.u, d: !!g.d };
}
function matchesFilter(t) {
  if (query && !t.name.toLowerCase().includes(query)) return false;
  if (filter === 'all') return true;
  if (filter === 'unearned') return !isEarned(t.id);
  if (filter === 'missable') return flagsOf(t).m;
  if (filter === 'watch') return flagsOf(t).w;
  if (filter === 'unconfirmed') return flagsOf(t).u;
  return (guideOf(t).k || []).includes(filter);
}
function filterCount(f) {
  return trophies.filter((t) => {
    if (f === 'all') return true;
    if (f === 'unearned') return !isEarned(t.id);
    if (f === 'missable') return flagsOf(t).m;
    if (f === 'watch') return flagsOf(t).w;
    if (f === 'unconfirmed') return flagsOf(t).u;
    return (guideOf(t).k || []).includes(f);
  }).length;
}
function citedSourcesOf(t) {
  const set = new Set();
  for (const [, cites] of guideOf(t).p || []) for (const c of cites) set.add(c);
  return set;
}
function auditCounts() {
  let steps = 0, stepsCited = 0, guidesCited = 0, miss = 0, watch = 0, unc = 0, dis = 0, single = 0;
  for (const t of trophies) {
    const g = guideOf(t);
    const p = g.p || [];
    let allCited = p.length > 0;
    for (const [, cites] of p) { steps++; if (cites && cites.length) stepsCited++; else allCited = false; }
    if (allCited) guidesCited++;
    const f = flagsOf(t);
    if (f.m) miss++; if (f.w) watch++; if (f.u) unc++; if (f.d) dis++;
    if (citedSourcesOf(t).size === 1) single++;
  }
  const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  let hidden = 0;
  for (const t of trophies) { grades[t.grade]++; if (isHidden(t)) hidden++; }
  return { steps, stepsCited, guidesCited, miss, watch, unc, dis, single, grades, hidden };
}
function sourceCitedBy(n) {
  let count = 0;
  for (const t of trophies) if (citedSourcesOf(t).has(n)) count++;
  return count;
}

/* ---------------- header / audit / chips ---------------- */
function renderHeader() {
  $('#earnedCount').textContent = state.earned.length;
  const per = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) if (isEarned(t.id)) per[t.grade]++;
  const a = auditCounts();
  $('#gradeCounts').innerHTML =
    `P <b>${per.platinum}/${a.grades.platinum}</b> · G <b>${per.gold}/${a.grades.gold}</b> · S <b>${per.silver}/${a.grades.silver}</b> · B <b>${per.bronze}/${a.grades.bronze}</b>`;
  $('#spoilerToggle').checked = state.spoilers;
}
function renderAudit() {
  const a = auditCounts();
  const seg = (html) => `<span class="sep">·</span> ${html}`;
  $('#auditStrip').innerHTML =
    `<span class="a-label">AUDIT</span> <b>55 official</b>` +
    seg(`1P ${a.grades.gold}G ${a.grades.silver}S ${a.grades.bronze}B`) +
    seg(`${a.hidden} hidden`) +
    seg(`<span class="ok">${a.guidesCited}/55 guides cite a source</span>`) +
    seg(`<span class="ok">${a.stepsCited}/${a.steps} steps cited</span>`) +
    seg(`${sources.length} sources read ${readDate}`) +
    seg(`<span class="warn-red">${a.miss} possibly missable</span>`) +
    seg(`<span class="warn-amber">${a.watch} watch</span>`) +
    seg(`${a.unc} unconfirmed`) +
    seg(`${a.single} single-source`) +
    seg(`${a.dis} disagree`);
}
function renderChips() {
  $('#chipRow').innerHTML = FILTERS.map(([key, label]) =>
    `<button type="button" class="chip${filter === key ? ' active' : ''}" data-filter="${key}">${label} <b>${filterCount(key)}</b></button>`).join('');
}

/* ---------------- checklist ---------------- */
function badgesHTML(t) {
  const g = guideOf(t);
  const f = flagsOf(t);
  let out = '';
  if (isHidden(t)) out += '<span class="badge hid">Hidden</span>';
  for (const k of g.k || []) out += `<span class="badge">${KIND_LABEL[k] || k}</span>`;
  if (f.m) out += '<span class="badge miss">Possibly missable</span>';
  if (f.w) out += '<span class="badge watch">Watch</span>';
  if (f.u) out += '<span class="badge unc">Unconfirmed</span>';
  if (f.d) out += '<span class="badge dis">Sources disagree</span>';
  return out;
}
function rowHTML(t) {
  const g = guideOf(t);
  const masked = isMasked(t);
  const name = masked ? 'Hidden trophy' : t.name;
  const desc = masked ? 'Hidden until earned — or reveal it here.' : t.description;
  return `<div class="trow${selected === t.id ? ' selected' : ''}${isEarned(t.id) ? ' earned' : ''}" data-row="${t.id}" role="button" tabindex="0">
    <input type="checkbox" data-earn="${t.id}" ${isEarned(t.id) ? 'checked' : ''} aria-label="Mark ${esc(t.name)} earned">
    <span class="gdot ${t.grade}">${GRADE_LETTER[t.grade]}</span>
    <div class="tmain">
      <div class="tname${masked ? ' masked' : ''}">${esc(name)}</div>
      <div class="tdesc${masked ? ' masked' : ''}">${esc(desc)}</div>
      <div class="badges">${badgesHTML(t)}</div>
      ${masked ? `<button type="button" class="reveal-btn" data-reveal="${t.id}">Reveal</button>` : ''}
    </div>
  </div>`;
}
function renderChecklist() {
  // next up: first unearned trophy in roadmap order (stage, then list order)
  const ordered = [...trophies].sort((a, b) => (guideOf(a).s - guideOf(b).s) || (a.id - b.id));
  const next = ordered.find((t) => !isEarned(t.id));
  $('#nextUp').innerHTML = next ? `<div class="nextup" data-row="${next.id}">
      <div class="nu-label">NEXT UP · IN ROADMAP ORDER</div>
      <div class="nu-name">S${guideOf(next).s} · ${esc(isMasked(next) ? 'Hidden trophy' : next.name)}</div>
      <div class="nu-text">${esc(guideOf(next).h || '')}</div>
    </div>` : '<div class="nextup"><div class="nu-label">LEDGER COMPLETE</div><div class="nu-name">All 55 earned — Leonida Legend.</div></div>';

  let html = '';
  for (const stage of STAGES) {
    const inStage = trophies.filter((t) => guideOf(t).s === stage.n);
    const shown = inStage.filter(matchesFilter);
    if (!shown.length) continue;
    const got = inStage.filter((t) => isEarned(t.id)).length;
    html += `<div class="stage-head">S${stage.n} · ${esc(stage.name)} <span>${got}/${inStage.length} earned</span></div>`;
    html += shown.map(rowHTML).join('');
  }
  $('#checklist').innerHTML = html || '<p style="color:var(--muted)">No trophies match this filter.</p>';
}

/* ---------------- guide pane ---------------- */
function citeHTML(cites) {
  return ' ' + cites.map((n) => `<sup class="cite" data-src="${n}">[${n}]</sup>`).join(' ');
}
function renderGuide() {
  const t = trophies.find((x) => x.id === selected) || trophies[0];
  if (!t) return;
  const g = guideOf(t);
  const f = flagsOf(t);
  const stage = STAGES.find((s) => s.n === g.s);
  const masked = isMasked(t);
  let html = `<h2>${esc(masked ? 'Hidden trophy' : t.name)}</h2>`;
  html += `<div class="glabel">OFFICIAL DESCRIPTION — AS PLAYSTATION PUBLISHES IT</div>`;
  html += `<div class="official">“${esc(masked ? 'Hidden until earned.' : t.description)}”</div>`;
  let chips = `<span class="gchip grade-${t.grade}">${t.grade}</span>`;
  for (const k of g.k || []) chips += `<span class="gchip">${KIND_LABEL[k] || k}</span>`;
  if (stage) chips += `<span class="gchip">Stage ${stage.n} · ${esc(stage.name)}</span>`;
  if (g.c) chips += `<span class="gchip">Count: ${fmtNum(g.c.target)} ${esc(g.c.label)}</span>`;
  if (f.m) chips += '<span class="gchip miss">Possibly missable</span>';
  if (f.w) chips += '<span class="gchip watch">Watch</span>';
  if (f.u) chips += '<span class="gchip unc">Unconfirmed</span>';
  if (f.d) chips += '<span class="gchip dis">Sources disagree</span>';
  html += `<div class="chipset">${chips}</div>`;
  if (!masked) {
    html += `<div class="glabel">IN SHORT</div><div class="inshort">${esc(g.h || '')}</div>`;
    if (g.m) html += `<div class="box miss"><div class="box-title">POSSIBLY MISSABLE — THE ONLY ONE</div><p>${esc(g.m)}</p></div>`;
    if (g.w) html += `<div class="box watch"><div class="box-title">WATCH — UNCONFIRMED WARNING</div><p>${esc(g.w)}</p></div>`;
    if (g.u) html += `<div class="box unc"><div class="box-title">UNCONFIRMED — NO VERIFIED METHOD</div><p>${esc(g.u)}</p></div>`;
    if (g.d) html += `<div class="box dis"><div class="box-title">SOURCES DISAGREE — BOTH VERSIONS SHOWN</div><p>${esc(g.d)}</p></div>`;
    if (g.c) {
      const val = state.counters[t.id] || 0;
      const pct = Math.min(100, Math.round((val / g.c.target) * 100));
      html += `<div class="counter-box"><span class="c-label">YOUR COUNT</span>
        <span class="c-ctrl"><button type="button" class="c-btn" data-cminus="${t.id}" aria-label="Decrease">−</button>
        <span class="c-val" data-cval="${t.id}">${fmtNum(val)}</span>
        <button type="button" class="c-btn" data-cplus="${t.id}" aria-label="Increase">+</button></span>
        <span class="c-target">/ ${fmtNum(g.c.target)} ${esc(g.c.label)}</span>
        <span class="c-bar"><i style="width:${pct}%"></i></span></div>`;
    }
    html += `<ol class="steps">${(g.p || []).map(([text, cites]) =>
      `<li><span class="step-n"></span><span class="step-t">${esc(text)}${citeHTML(cites)}</span></li>`).join('')}</ol>`;
    html += `<label class="earned-toggle"><input type="checkbox" data-earn="${t.id}" ${isEarned(t.id) ? 'checked' : ''}> I have earned this trophy</label>`;
  } else {
    html += `<div class="box unc"><div class="box-title">SPOILER SETTING IS ON</div><p>This trophy is hidden. Its name, description and guide stay masked until you earn it — or reveal it now.</p></div>
      <button type="button" class="reveal-btn" data-reveal="${t.id}">Reveal this trophy</button>`;
  }
  $('#guidePane').innerHTML = html;
}

/* ---------------- sources pane (checklist view) ---------------- */
function sourceCardHTML(s, n) {
  const url = s.url ? `<div class="s-url"><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a></div>`
                     : '<div class="s-url">named source — no public link</div>';
  return `<div class="src-card" id="src-${n}"><div class="s-name"><span class="n">[${n}]</span> ${esc(s.name)}</div>
    ${url}<div class="s-meta">read ${readDate} · cited by ${sourceCitedBy(n)} of 55 guides</div>
    <div class="s-note">${esc(s.note)}</div></div>`;
}
function renderSourcesPane() {
  $('#sourcesPaneTitle').textContent = `SOURCES — READ ${readDate.toUpperCase()}`;
  $('#sourcesPane').innerHTML = sources.map((s, i) => sourceCardHTML(s, i + 1)).join('');
}

/* ---------------- roadmap view ---------------- */
function renderRoadmap() {
  const total = trophies.length;
  const got = state.earned.length;
  const pct = Math.round((got / total) * 100);
  let html = `<h2 class="view-title">Roadmap to the platinum</h2>
    <p class="view-sub">Seven stages, in the order the official descriptions open them: story chapters first, side chains second, the 100% cleanup last. Reviews put the story alone at about 60–80 hours [2]; full-platinum estimates run to 200–250 hours [5]. We print the range and its sources instead of promising a number.</p>
    <div class="goal-rail"><span class="g-label">GOAL — 100% AND THE PLATINUM</span>
      <span>Vice Got a Price! · ${got}/${total} trophies · ${pct}% complete</span>
      <span class="g-bar"><i style="width:${pct}%"></i></span>
      <span class="g-last">Last gate: A Long Road — attain 100% completion</span></div>
    <div class="stage-grid">`;
  for (const stage of STAGES) {
    const inStage = trophies.filter((t) => guideOf(t).s === stage.n);
    const done = inStage.filter((t) => isEarned(t.id)).length;
    const spct = inStage.length ? Math.round((done / inStage.length) * 100) : 0;
    html += `<div class="stage-card"><h3>S${stage.n} · ${esc(stage.name)}</h3>
      <div class="sc-count">${done}/${inStage.length} earned · ${spct}%</div>
      <div class="sc-bar"><i style="width:${spct}%"></i></div>
      <p class="sc-blurb">${esc(stage.blurb)}</p>`;
    for (const t of inStage) {
      const doneT = isEarned(t.id);
      html += `<div class="sc-item${doneT ? ' done' : ''}"><span class="n">${doneT ? '✓ ' : ''}${esc(isMasked(t) ? 'Hidden trophy' : t.name)}</span>
        <div class="d">${esc(isMasked(t) ? 'Hidden until earned.' : (guideOf(t).h || ''))}</div></div>`;
    }
    html += '</div>';
  }
  html += '</div>';
  $('#view-roadmap').innerHTML = html;
}

/* ---------------- missables view ---------------- */
function renderMissables() {
  const card = (t, cls, label) => {
    const g = guideOf(t);
    const text = cls === 'miss' ? g.m : cls === 'watch' ? g.w : g.u;
    return `<div class="flag-card ${cls}"><h3>${label} — ${esc(t.name)}</h3>
      <div class="f-short">${esc(g.h || '')}</div>
      <div class="f-text">${esc(text || '')}</div>
      ${g.d ? `<div class="f-text">${esc(g.d)}</div>` : ''}</div>`;
  };
  let html = `<h2 class="view-title">Missables — the honest board</h2>
    <p class="view-sub">No source we read reports a single <b>confirmed</b> missable trophy on this list [2] [4] [9]. One trophy is flagged as a risk by two guides; seven more carry unconfirmed warnings; two have no verified method at all. This board shows exactly that — nothing is dressed up as certain that is not.</p>
    <div class="flag-grid">`;
  for (const t of trophies) if (flagsOf(t).m) html += card(t, 'miss', 'POSSIBLY MISSABLE');
  for (const t of trophies) if (flagsOf(t).w) html += card(t, 'watch', 'WATCH');
  for (const t of trophies) if (flagsOf(t).u) html += card(t, 'unc', 'UNCONFIRMED');
  html += '</div>';
  $('#view-missables').innerHTML = html;
}

/* ---------------- sources & matrix view ---------------- */
function renderSourcesView() {
  let html = `<h2 class="view-title">Sources &amp; the source matrix</h2>
    <p class="view-sub">Nine sources, read ${readDate}. Every guide in this app is our own wording; the matrix shows which sources stand behind which trophy, so any claim in any guide can be traced in one glance. Where sources disagree, the guide shows both versions and says so.</p>
    <div class="src-grid">${sources.map((s, i) => sourceCardHTML(s, i + 1)).join('')}</div>
    <div class="matrix-wrap"><table class="matrix"><thead><tr><th class="tn">Trophy</th>${sources.map((_, i) => `<th>[${i + 1}]</th>`).join('')}</tr></thead><tbody>`;
  for (const t of trophies) {
    const set = citedSourcesOf(t);
    html += `<tr><td class="tn">${esc(isMasked(t) ? 'Hidden trophy' : t.name)}</td>${sources.map((_, i) => `<td>${set.has(i + 1) ? '<span class="dot">●</span>' : '<span class="nod">·</span>'}</td>`).join('')}</tr>`;
  }
  html += '</tbody></table></div>';
  $('#view-sources').innerHTML = html;
}

/* ---------------- master render ---------------- */
function render() {
  renderHeader();
  renderAudit();
  renderChips();
  renderChecklist();
  renderGuide();
  renderSourcesPane();
  renderRoadmap();
  renderMissables();
  renderSourcesView();
  for (const v of ['checklist', 'roadmap', 'missables', 'sources']) {
    document.getElementById('view-' + v).hidden = v !== view;
  }
  document.querySelectorAll('#tabBar .tab').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
}

/* ---------------- events ---------------- */
document.addEventListener('click', (e) => {
  const tab = e.target.closest('#tabBar .tab');
  if (tab) { view = tab.dataset.view; render(); return; }
  const chip = e.target.closest('[data-filter]');
  if (chip) { filter = chip.dataset.filter; if (view !== 'checklist') view = 'checklist'; render(); return; }
  const reveal = e.target.closest('[data-reveal]');
  if (reveal) {
    const id = Number(reveal.dataset.reveal);
    if (!state.revealed.includes(id)) state.revealed.push(id);
    selected = id; save(); render(); return;
  }
  const cite = e.target.closest('[data-src]');
  if (cite) {
    const n = cite.dataset.src;
    if (view !== 'checklist') { view = 'sources'; render(); }
    const card = document.getElementById('src-' + n);
    if (card) {
      document.querySelectorAll('.src-card.hl').forEach((c) => c.classList.remove('hl'));
      card.classList.add('hl');
      card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    return;
  }
  const minus = e.target.closest('[data-cminus]');
  const plus = e.target.closest('[data-cplus]');
  if (minus || plus) {
    const id = Number((minus || plus).dataset.cminus || (minus || plus).dataset.cplus);
    const g = guides[id];
    const cur = state.counters[id] || 0;
    const nextVal = minus ? Math.max(0, cur - 1) : Math.min(g && g.c ? g.c.target : cur + 1, cur + 1);
    state.counters[id] = nextVal; save(); renderGuide(); renderHeader(); return;
  }
  const row = e.target.closest('[data-row]');
  if (row && !e.target.closest('input, button, a, label')) {
    selected = Number(row.dataset.row); renderChecklist(); renderGuide(); return;
  }
});
document.addEventListener('change', (e) => {
  const box = e.target.closest('[data-earn]');
  if (box) {
    const id = Number(box.dataset.earn);
    if (box.checked) { if (!state.earned.includes(id)) state.earned.push(id); }
    else state.earned = state.earned.filter((x) => x !== id);
    save(); render(); return;
  }
  if (e.target.id === 'spoilerToggle') { state.spoilers = e.target.checked; save(); render(); return; }
  if (e.target.id === 'importFile') {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        const data = JSON.parse(text);
        state = {
          earned: Array.isArray(data.earned) ? data.earned.filter((n) => trophies.some((t) => t.id === n)) : [],
          counters: data.counters && typeof data.counters === 'object' ? data.counters : {},
          spoilers: data.spoilers !== false,
          revealed: Array.isArray(data.revealed) ? data.revealed : [],
        };
        save(); render();
      } catch { alert('That file is not a LEONIDA LEDGER save.'); }
      e.target.value = '';
    });
  }
});
$('#search').addEventListener('input', (e) => {
  query = e.target.value.trim().toLowerCase();
  if (view !== 'checklist') view = 'checklist';
  renderChecklist();
  document.querySelectorAll('#tabBar .tab').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  for (const v of ['checklist', 'roadmap', 'missables', 'sources']) document.getElementById('view-' + v).hidden = v !== view;
});
$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-ledger-save.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

/* ---------------- boot ---------------- */
const [trophDoc, guideDoc] = await Promise.all([
  fetch('data/trophies.json').then((r) => r.json()),
  fetch('data/guides.json').then((r) => r.json()),
]);
trophies = trophDoc.trophies;
guides = guideDoc.guides;
sources = guideDoc.sources;
readDate = guideDoc.read || readDate;
if (!trophies.some((t) => t.id === selected)) selected = trophies[0].id;
render();
