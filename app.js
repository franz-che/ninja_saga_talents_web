const D = window.NINJA_DATA;
const talents = D.talents;
const byName = new Map(talents.map((t) => [t.name, t]));
let compare = [];
const qs = (s) => document.querySelector(s),
  qsa = (s) => [...document.querySelectorAll(s)];
const fmt = (x) => x;

function passiveChips(t) {
  const keys = [
    'Max HP',
    'Max CP',
    'Agility',
    'Crit chance%',
    'Crit dmg%',
    'Dodge',
    'Accuracy',
    'Purify',
    'Dmg. Bonus',
    'Dmg. Reduction',
    'HP regen',
    'CP regen',
  ];
  let out = [];
  for (const k of keys) {
    const v = t.passiveStats[k]?.display;
    if (v !== undefined) out.push(`${k.replace('%', '')}: ${v}`);
  }
  return out.slice(0, 4);
}
function card(t) {
  return `<article class="card"><div class="thumb">${t.images[0] ? `<img loading="lazy" src="${t.images[0]}" alt="${t.name} skill screenshot">` : '<span class="dash">No screenshot</span>'}</div><div class="card-body"><div class="name-row"><div class="name">${t.name}</div><div class="badge ${t.type.toLowerCase()}">${t.type}</div></div><div class="chips">${t.emblemOnly ? '<span class="badge e">Emblem</span>' : ''}${passiveChips(
    t,
  )
    .map((x) => `<span class="chip">${x}</span>`)
    .join(
      '',
    )}</div><div class="card-actions"><button onclick="openTalent('${t.name.replaceAll("'", "\\'")}')">Details</button><button onclick="toggleCompare('${t.name.replaceAll("'", "\\'")}')">${compare.includes(t.name) ? '✓ Comparing' : 'Compare'}</button><button class="${window.NinjaSagaBuilder.isBuilt(t.name) ? 'built' : ''}" aria-pressed="${window.NinjaSagaBuilder.isBuilt(t.name)}" onclick="toggleBuild('${t.name.replaceAll("'", "\\'")}')">${window.NinjaSagaBuilder.isBuilt(t.name) ? '✓ Built' : 'Build'}</button></div></div></article>`;
}
function renderBrowse() {
  const term = qs('#search').value.trim().toLowerCase(),
    typ = qs('#typeFilter').value,
    sort = qs('#sortFilter').value;
  const filtered = talents.filter((t) => {
    if (typ !== 'all' && t.type !== typ) return false;
    const hay = (
      t.name +
      ' ' +
      (t.aliases || []).join(' ') +
      ' ' +
      JSON.stringify(t.passiveStats)
    ).toLowerCase();
    return !term || hay.includes(term);
  });
  if (sort === 'az') {
    filtered.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }
  qs('#talentGrid').innerHTML = filtered.length
    ? filtered.map(card).join('')
    : `<div class="empty">No talents match the current filters.</div>`;
  qs('#browseKpis').innerHTML =
    `<div class="kpi"><b>${talents.length}</b><span>Total talents</span></div><div class="kpi"><b>${talents.filter((x) => x.type === 'Extreme').length}</b><span>Extreme</span></div><div class="kpi"><b>${talents.filter((x) => x.type === 'Secret').length}</b><span>Secret</span></div><div class="kpi"><b>${D.meta.screenshotCount}</b><span>Skill screenshots</span></div>`;
}
function displayStat(t, k) {
  const v = t.passiveStats[k];
  return v ? `<span class="num">${v.display}</span>` : `<span class="dash">—</span>`;
}
function renderStats() {
  const term = qs('#statsSearch').value.trim().toLowerCase(),
    typ = qs('#statsType').value,
    sort = qs('#statsSort').value;
  const filtered = talents.filter((t) => {
    if (typ !== 'all' && t.type !== typ) return false;
    return (
      !term ||
      (t.name + ' ' + (t.aliases || []).join(' ') + ' ' + JSON.stringify(t.passiveStats))
        .toLowerCase()
        .includes(term)
    );
  });
  if (sort === 'az') {
    filtered.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }
  const headers = ['Talent', 'Type', ...D.statColumns];
  qs('#statHead').innerHTML = headers.map((h) => `<th>${h}</th>`).join('');
  qs('#statBody').innerHTML =
    filtered
      .map(
        (t) =>
          `<tr><td><button class="talent-link" onclick="openTalent('${t.name.replaceAll("'", "\\'")}')">${t.name}</button></td><td>${t.type}</td>${D.statColumns.map((k) => `<td>${k === 'Other' ? `<div class="other">${t.passiveStats[k]?.display || '<span class="dash">—</span>'}</div>` : displayStat(t, k)}</td>`).join('')}</tr>`,
      )
      .join('') ||
    `<tr><td colspan="${headers.length}"><div class="empty">No matching talents.</div></td></tr>`;
}
function renderCompare() {
  const area = qs('#compareArea');
  if (!compare.length) {
    area.innerHTML =
      '<div class="empty">Choose talents from Browse Talents and add them here. Up to four at a time.</div>';
    return;
  }
  const cols = compare.map((n) => byName.get(n));
  const rows = ['Type', ...D.statColumns];
  let html =
    '<div class="compare-grid" style="grid-template-columns:240px repeat(' +
    cols.length +
    ',minmax(170px,1fr))">';
  html +=
    '<div class="head">Stat</div>' +
    cols
      .map(
        (t) =>
          `<div class="head"><button class="talent-link" onclick="openTalent('${t.name.replaceAll("'", "\\'")}')">${t.name}</button></div>`,
      )
      .join('');
  for (const k of rows) {
    html += `<div class="label">${k}</div>`;
    for (const t of cols) {
      const val = k === 'Type' ? t.type : t.passiveStats[k]?.display || '—';
      html += `<div class="compare-cell ${val === '—' ? 'none' : 'has'}">${val}</div>`;
    }
  }
  html += '</div>';
  area.innerHTML = html;
}
function toggleCompare(name) {
  if (compare.includes(name)) {
    compare = compare.filter((x) => x !== name);
  } else {
    if (compare.length >= 4) {
      alert('Comparison is limited to 4 talents. Remove one first.');
      return;
    }
    compare.push(name);
  }
  renderBrowse();
  renderCompare();
}
function openTalent(name) {
  const t = byName.get(name);
  if (!t) return;
  qs('#panelTopTitle').innerHTML = `<div class="name">${t.name}</div>`;
  let statRows = '';
  for (const k of D.statColumns) {
    const v = t.passiveStats[k]?.display;
    if (v !== undefined)
      statRows += `<div class="stat-item"><span>${k}</span><span>${v}</span></div>`;
  }
  qs('#panelBody').innerHTML =
    `<div class="hero-title">${t.name}</div><div class="hero-meta">${t.type}${t.emblemOnly ? ' · Emblem-only' : ''}</div><div class="note">Passive-stat view only. Active skills that temporarily modify stats are not included here. The screenshots below remain the source material for the individual skillset.</div><div class="detail-stats">${statRows || '<div class="dash">No passive stats recorded.</div>'}</div><div class="ref-section"><div class="eyebrow">Skill screenshots (${t.images.length})</div><div class="gallery">${t.images.map((src, i) => `<img loading="lazy" src="${src}" alt="${t.name} screenshot ${i + 1}">`).join('')}</div></div>`;
  qs('#drawer').classList.add('open');
}
function switchSection(id) {
  qsa('.section').forEach((x) => x.classList.toggle('active', x.id === id));
  qsa('.nav button').forEach((x) => x.classList.toggle('active', x.dataset.section === id));
  const titles = {
    browse: [
      'Talent Browser',
      'Browse the collection and open any talent for a full screenshot view.',
    ],
    stats: ['Passive Stats', 'A table for exact stat comparison of each talent.'],
    compare: ['Compare', 'Put up to four talents side by side.'],
    builder: ['Character Builder', 'View core stats and adjust elemental values.'],
  };
  qs('#pageTitle').textContent = titles[id][0];
  qs('#pageSubtitle').textContent = titles[id][1];
  if (id === 'browse') renderBrowse();
  if (id === 'stats') renderStats();
  if (id === 'compare') renderCompare();
  if (id === 'builder') window.NinjaSagaBuilder.render();
}
qsa('.nav button').forEach((b) =>
  b.addEventListener('click', () => switchSection(b.dataset.section)),
);
['#search', '#typeFilter', '#sortFilter'].forEach((s) =>
  qs(s).addEventListener('input', renderBrowse),
);
['#statsSearch', '#statsType', '#statsSort'].forEach((s) =>
  qs(s).addEventListener('input', renderStats),
);
qs('#clearBtn').addEventListener('click', () => {
  qs('#search').value = '';
  qs('#typeFilter').value = 'all';
  qs('#sortFilter').value = 'default';
  renderBrowse();
});
qs('#clearCompare').addEventListener('click', () => {
  compare = [];
  renderBrowse();
  renderCompare();
});
qs('#closeDrawer').addEventListener('click', () => qs('#drawer').classList.remove('open'));
qs('#drawer').addEventListener('click', (e) => {
  if (e.target.id === 'drawer') qs('#drawer').classList.remove('open');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') qs('#drawer').classList.remove('open');
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
    qs('#search').focus();
  }
});

renderBrowse();
renderStats();
