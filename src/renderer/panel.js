const $ = (id) => document.getElementById(id);

const STAGE_NAMES = ['Hatchling', 'Grown', 'Ascended'];
const TIER_ICONS = { 1: '🥉', 2: '🥈', 3: '🥇' };

function ago(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function render(state) {
  const { sessions, game } = state;

  $('total-xp').textContent = game.xp.toLocaleString();
  $('total-msgs').textContent = game.messages.toLocaleString();

  // --- sessions (with their background agents) ---
  $('sessions').innerHTML = sessions.length
    ? sessions.map((s) => `
        <div class="session-group">
          <div class="session ${s.state}">
            <span class="dot"></span>
            <span class="proj" title="${esc(s.cwd || '')}">${esc(s.project)}</span>
            <span class="meta">${ago(s.idleMs)} ago</span>
            <span class="statechip">${s.state === 'waiting' ? (s.toolStall ? 'NEEDS OK?' : 'WAITING') : 'WORKING'}</span>
          </div>
          ${(s.agents || []).map((a) => `
            <div class="agent ${a.state}">
              <span class="a-icon">🤖</span>
              <span class="a-desc">${esc(a.description)}</span>
              <span class="a-type">${esc(a.agentType)}</span>
              <span class="a-chip">${a.state === 'running' ? 'RUNNING' : 'DONE'}</span>
            </div>`).join('')}
        </div>`).join('')
    : '<div class="empty">No live Claude Code sessions in the last hour. Go start one — your pet is watching. 👀</div>';

  // --- eggs ---
  $('eggs').innerHTML = game.eggs.length
    ? game.eggs.map((e) => `
        <div class="card egg" style="--rar:${e.rarityColor}">
          <div class="rarity">${esc(e.rarityLabel)} EGG</div>
          <div class="big">${Sprites.eggSvg(e.rarityColor, { size: 46 })}</div>
          <div class="sub">${esc(e.reason || '')}</div>
          <div class="bar"><div class="fill" style="width:${Math.round((100 * e.earned) / e.cost)}%"></div></div>
          <div class="sub">${e.earned} / ${e.cost} XP</div>
          <button class="primary" data-hatch="${e.id}" ${e.ready ? '' : 'disabled'}>
            ${e.ready ? 'HATCH!' : 'INCUBATING'}
          </button>
        </div>`).join('')
    : '<div class="empty">No eggs — unlock achievements to earn more.</div>';

  // --- pets ---
  $('pets').innerHTML = game.pets.length
    ? game.pets.map((p) => `
        <div class="card" style="--rar:${p.rarityColor}">
          <div class="rarity">${esc(p.rarityLabel)}</div>
          <div class="big">${Sprites.petSvg(p.speciesId, p.stage, { size: 52 })}</div>
          <div class="name">${esc(p.name)}</div>
          <div class="sub">${esc(p.species)} · Lv.${p.level} ${STAGE_NAMES[p.stage]}</div>
          <div class="stage-pips">${'●'.repeat(p.stage + 1)}${'○'.repeat(2 - p.stage)}</div>
          <div class="bar"><div class="fill" style="width:${Math.round(p.levelProgress * 100)}%"></div></div>
          ${p.isActive
            ? '<span class="active-tag">★ MAIN PET</span>'
            : `<button data-active="${p.id}">MAKE MAIN</button>`}
        </div>`).join('')
    : '<div class="empty">No pets yet — hatch your first egg!</div>';

  // --- achievements ---
  const unlocked = game.achievements.filter((a) => a.unlockedAt).length;
  document.querySelector('#sec-achievements h2').textContent =
    `▸ Achievements (${unlocked}/${game.achievements.length})`;
  $('achievements').innerHTML = game.achievements.map((a) => `
      <div class="ach ${a.unlockedAt ? 'unlocked' : 'locked'}">
        <span class="icon">${a.unlockedAt ? TIER_ICONS[a.tier] : '🔒'}</span>
        <span>
          <div class="t">${esc(a.name)}</div>
          <div class="d">${esc(a.desc)}</div>
        </span>
      </div>`).join('');
}

document.addEventListener('click', (e) => {
  const hatch = e.target.closest('[data-hatch]');
  if (hatch && !hatch.disabled) window.pet.send('hatch-egg', hatch.dataset.hatch);
  const active = e.target.closest('[data-active]');
  if (active) window.pet.send('set-active-pet', active.dataset.active);
});

$('btn-quit').addEventListener('click', () => window.pet.send('quit'));

window.pet.on('state', render);
