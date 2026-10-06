(() => {
  const talents = window.NINJA_DATA.talents;
  const byName = new Map(talents.map((talent) => [talent.name, talent]));
  const builtTalents = new Set();
  const MAX_ELEMENT_POINTS = 100;
  const ELEMENT_ROWS = document.querySelectorAll('.element-row');
  const POINTS_REMAINING = document.getElementById('elementPointsRemaining');

  const BASE_STATS = {
    agility: 109,
    crit: 5,
    dodge: 5,
    purify: 0,
    accuracy: 0,
    combustion: 0,
    reactiveForce: 0,
    dmgBonus: 0,
    dmgReduction: 0,
    critDmg: 150,
  };

  function render() {
    const selected = [...builtTalents].map((name) => byName.get(name)).filter(Boolean);
    document.getElementById('builtTalentList').innerHTML = selected.length
      ? `<div class="built-talent-list">${selected
          .map((talent) => {
            const stats = Object.entries(talent.passiveStats)
              .map(([name, stat]) => `<span class="chip">${name}: ${stat.display}</span>`)
              .join('');
            return `<article class="built-talent"><div class="built-talent-header"><strong>${talent.name}</strong><button type="button" onclick="toggleBuild('${talent.name.replaceAll("'", "\\'")}')">Remove</button></div><div class="chips">${stats || '<span class="dash">No passive stats recorded.</span>'}</div></article>`;
          })
          .join('')}</div>`
      : '<div class="empty">No talents added yet. Choose Build on a talent to add it here.</div>';
  }

  function toggle(name) {
    if (builtTalents.has(name)) {
      builtTalents.delete(name);
    } else if (byName.has(name)) {
      builtTalents.add(name);
    }
    window.renderBrowse();
    render();
    updateStats();
  }

  function getValue(row) {
    return Number(row.querySelector('.element-value').textContent) || 0;
  }

  function setValue(row, value) {
    row.querySelector('.element-value').textContent = value;
  }

  function getTotalPoints() {
    return [...ELEMENT_ROWS].reduce((total, row) => total + getValue(row), 0);
  }

  function updateControls() {
    const remaining = MAX_ELEMENT_POINTS - getTotalPoints();
    POINTS_REMAINING.textContent = remaining;

    ELEMENT_ROWS.forEach((row) => {
      const value = getValue(row);
      row.querySelector('[data-adjust="-1"]').disabled = value <= 0;
      row.querySelector('[data-adjust="1"]').disabled = remaining <= 0;
      row.querySelector('[data-action="max"]').disabled = remaining <= 0;
    });
  }

  function updateStats() {
    const getElementValue = (name) =>
      getValue(document.querySelector(`.element-row[data-element="${name}"]`));
    const wind = getElementValue('Wind');
    const fire = getElementValue('Fire');
    const lightning = getElementValue('Lightning');
    const water = getElementValue('Water');
    const earth = getElementValue('Earth');

    const builtCritChanceBonus = [...builtTalents].reduce((total, name) => {
      const stat = byName.get(name)?.passiveStats['Crit chance%'];
      return total + (stat?.unit === '%' && Number.isFinite(stat.value) ? stat.value : 0);
    }, 0);
    const builtCritDamageBonus = [...builtTalents].reduce((total, name) => {
      const stat = byName.get(name)?.passiveStats['Crit dmg%'];
      return total + (stat?.unit === '%' && Number.isFinite(stat.value) ? stat.value : 0);
    }, 0);
    const builtDodgeBonus = [...builtTalents].reduce((total, name) => {
      const stat = byName.get(name)?.passiveStats['Dodge'];
      return total + (stat?.unit === '%' && Number.isFinite(stat.value) ? stat.value : 0);
    }, 0);
    const builtFlatAgilityBonus = [...builtTalents].reduce((total, name) => {
      const stat = byName.get(name)?.passiveStats['Agility'];
      return total + (stat?.unit === 'flat' && Number.isFinite(stat.value) ? stat.value : 0);
    }, 0);
    const builtPercentAgilityBonus = [...builtTalents].reduce((total, name) => {
      const stat = byName.get(name)?.passiveStats['Agility'];
      return total + (stat?.unit === '%' && Number.isFinite(stat.value) ? stat.value : 0);
    }, 0);
    const builtPurifyBonus = [...builtTalents].reduce((total, name) => {
      const stat = byName.get(name)?.passiveStats['Purify'];
      return total + (stat?.unit === '%' && Number.isFinite(stat.value) ? stat.value : 0);
    }, 0);
    const builtAccuracyBonus = [...builtTalents].reduce((total, name) => {
      const stat = byName.get(name)?.passiveStats['Accuracy'];
      return total + (stat?.unit === '%' && Number.isFinite(stat.value) ? stat.value : 0);
    }, 0);
    const builtDamageBonus = [...builtTalents].reduce((total, name) => {
      const stat = byName.get(name)?.passiveStats['Dmg. Bonus'];
      return total + (stat?.unit === '%' && Number.isFinite(stat.value) ? stat.value : 0);
    }, 0);
    const builtDamageReduction = [...builtTalents].reduce((total, name) => {
      const stat = byName.get(name)?.passiveStats['Dmg. Reduction'];
      return total + (stat?.unit === '%' && Number.isFinite(stat.value) ? stat.value : 0);
    }, 0);

    document.getElementById('statAgility').textContent =
      `${((BASE_STATS.agility + wind + builtFlatAgilityBonus) * (1 + builtPercentAgilityBonus / 100)).toFixed(0)}`;
    document.getElementById('statCrit').textContent =
      `${(BASE_STATS.crit + lightning * 0.4 + builtCritChanceBonus).toFixed(1)}%`;
    document.getElementById('statCritDamage').textContent =
      `${(BASE_STATS.critDmg + lightning * 0.8 + builtCritDamageBonus).toFixed(1)}%`;
    document.getElementById('statDodge').textContent =
      `${(BASE_STATS.dodge + wind * 0.4 + builtDodgeBonus).toFixed(1)}%`;
    document.getElementById('statPurify').textContent =
      `${(BASE_STATS.purify + water * 0.4 + builtPurifyBonus).toFixed(1)}%`;
    document.getElementById('statAccuracy').textContent =
      `${(BASE_STATS.accuracy + builtAccuracyBonus).toFixed(1)}%`;
    document.getElementById('statCombustion').textContent =
      `${(BASE_STATS.combustion + fire * 0.4).toFixed(1)}%`;
    document.getElementById('statReactiveForce').textContent =
      `${(BASE_STATS.reactiveForce + earth * 0.4).toFixed(1)}%`;
    document.getElementById('statDamageBonus').textContent =
      `${(BASE_STATS.dmgBonus + fire * 0.4 + builtDamageBonus).toFixed(1)}%`;
    document.getElementById('statDamageReduction').textContent =
      `${(BASE_STATS.dmgReduction + builtDamageReduction).toFixed(1)}%`;
  }

  ELEMENT_ROWS.forEach((row) => {
    row.querySelectorAll('[data-adjust]').forEach((button) => {
      button.addEventListener('click', () => {
        const adjustment = Number(button.dataset.adjust);
        const currentValue = getValue(row);
        const total = getTotalPoints();
        if (adjustment > 0 && total >= MAX_ELEMENT_POINTS) return;

        setValue(row, Math.max(0, Math.min(MAX_ELEMENT_POINTS, currentValue + adjustment)));
        updateControls();
        updateStats();
      });
    });

    row.querySelector('[data-action="max"]').addEventListener('click', () => {
      const remaining = MAX_ELEMENT_POINTS - getTotalPoints();
      setValue(row, getValue(row) + remaining);
      updateControls();
      updateStats();
    });
  });

  document.getElementById('resetElements').addEventListener('click', () => {
    ELEMENT_ROWS.forEach((row) => setValue(row, 0));
    updateControls();
    updateStats();
  });

  window.toggleBuild = toggle;
  window.NinjaSagaBuilder = {
    isBuilt: (name) => builtTalents.has(name),
    render,
  };

  render();
  updateControls();
  updateStats();
})();
