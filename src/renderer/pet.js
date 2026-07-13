const $ = (id) => document.getElementById(id);
const petEl = $('pet');
const badgeEl = $('badge');
const bubbleEl = $('bubble');
const statusEl = $('status-text');
const xpfillEl = $('xpfill');
const fxEl = $('fx');

let state = null;
let bubbleTimer = null;
let stickyBubble = null; // persistent "waiting" message

// ---------- rendering ----------

function moodFromSessions(sessions) {
  if (!sessions || !sessions.length) return 'sleeping';
  if (sessions.some((s) => s.state === 'waiting')) return 'waiting';
  return 'working';
}

function render() {
  if (!state) return;
  const { game, sessions } = state;
  const mood = moodFromSessions(sessions);
  const pet = game.activePet;
  const readyEgg = game.eggs.find((e) => e.ready);
  const nextEgg = game.eggs[0];

  document.documentElement.style.setProperty(
    '--rarity',
    pet ? pet.rarityColor : readyEgg ? readyEgg.rarityColor : '#9aa7a0'
  );

  petEl.classList.remove('working', 'waiting', 'sleeping', 'egg-idle', 'egg-ready');

  if (!pet) {
    // Egg mode: no hatched pet yet.
    petEl.innerHTML = Sprites.eggSvg((readyEgg || nextEgg || {}).rarityColor);
    petEl.classList.add(readyEgg ? 'egg-ready' : 'egg-idle');
    badgeEl.className = readyEgg ? 'pulse' : 'hidden';
    badgeEl.textContent = readyEgg ? '✨' : '';
    statusEl.innerHTML = readyEgg
      ? 'Tap the egg to hatch!'
      : nextEgg
        ? `Egg: ${nextEgg.earned}/${nextEgg.cost} XP — keep coding!`
        : 'No eggs yet';
    xpfillEl.className = 'egg';
    xpfillEl.style.width = nextEgg ? `${(100 * nextEgg.earned) / nextEgg.cost}%` : '0%';
    return;
  }

  petEl.innerHTML = Sprites.petSvg(pet.speciesId, pet.stage);
  petEl.classList.add(mood);

  const working = sessions.filter((s) => s.state === 'working').length;
  const waiting = sessions.filter((s) => s.state === 'waiting');
  const agents = sessions.reduce((n, s) => n + (s.agentsRunning || 0), 0);

  if (mood === 'sleeping') {
    badgeEl.className = 'drift';
    badgeEl.textContent = '💤';
    statusEl.innerHTML = `<span class="dot sleeping"></span>Lv.${pet.level} ${pet.name} · resting`;
    setStickyBubble(null);
  } else if (mood === 'waiting') {
    badgeEl.className = 'pulse';
    badgeEl.textContent = '❗';
    statusEl.innerHTML = `<span class="dot waiting"></span>${waiting.length} waiting on you!`;
    const first = waiting[0];
    const more = waiting.length - 1;
    const short = first.toolStall
      ? `${first.project} needs an approval!`
      : `${first.project}${more ? ` +${more}` : ''} waiting!`;
    setStickyBubble(short, 'alert', waiting.map((s) => s.project).join(', '));
  } else {
    badgeEl.className = agents ? 'drift' : 'hidden';
    badgeEl.textContent = agents ? '🤖' : '';
    statusEl.innerHTML =
      `<span class="dot working"></span>${working} session${working === 1 ? '' : 's'}` +
      (agents ? ` · ${agents} agent${agents === 1 ? '' : 's'}` : '') + ' …';
    setStickyBubble(null);
  }

  // Ready egg still deserves a hint even with a main pet out.
  if (readyEgg && mood !== 'waiting') {
    badgeEl.className = 'pulse';
    badgeEl.textContent = '🥚';
  }

  xpfillEl.className = '';
  xpfillEl.style.width = `${Math.round(pet.levelProgress * 100)}%`;
}

// ---------- bubbles ----------

function setStickyBubble(text, kind, fullText) {
  stickyBubble = text ? { text, kind, fullText } : null;
  if (!bubbleTimer) applyBubble();
}

function applyBubble() {
  if (stickyBubble) {
    bubbleEl.textContent = stickyBubble.text;
    bubbleEl.dataset.short = stickyBubble.text;
    bubbleEl.dataset.full = stickyBubble.fullText || stickyBubble.text;
    bubbleEl.className = stickyBubble.kind || '';
  } else {
    bubbleEl.className = 'hidden';
  }
  bubbleEl.classList.remove('expanded');
}

function flashBubble(text, kind, ms = 3800) {
  clearTimeout(bubbleTimer);
  bubbleEl.textContent = text;
  bubbleEl.dataset.short = text;
  bubbleEl.dataset.full = text;
  bubbleEl.className = kind || '';
  bubbleTimer = setTimeout(() => {
    bubbleTimer = null;
    applyBubble();
  }, ms);
}

// Hovering the bubble expands the truncated one-liner to the full message,
// and keeps a transient message alive while you're reading it.
let hoverHeldFlash = false;
bubbleEl.addEventListener('mouseenter', () => {
  if (bubbleEl.classList.contains('hidden')) return;
  bubbleEl.textContent = bubbleEl.dataset.full || bubbleEl.textContent;
  bubbleEl.classList.add('expanded');
  if (bubbleTimer) {
    clearTimeout(bubbleTimer);
    bubbleTimer = null;
    hoverHeldFlash = true;
  }
});
bubbleEl.addEventListener('mouseleave', () => {
  bubbleEl.textContent = bubbleEl.dataset.short || bubbleEl.textContent;
  bubbleEl.classList.remove('expanded');
  if (hoverHeldFlash) {
    hoverHeldFlash = false;
    bubbleTimer = setTimeout(() => {
      bubbleTimer = null;
      applyBubble();
    }, 1200);
  }
});

// ---------- fx ----------

function burst(emojis, count = 18) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    p.textContent = emojis[i % emojis.length];
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 70;
    p.style.left = '50%';
    p.style.top = '45%';
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist - 25}px`);
    p.style.setProperty('--rot', `${(Math.random() - 0.5) * 240}deg`);
    p.style.animationDelay = `${Math.random() * 0.15}s`;
    fxEl.appendChild(p);
    setTimeout(() => p.remove(), 1400);
  }
}

// ---------- interactions ----------

// Manual drag: grab the pet itself to move the window; click = react/hatch.
let dragState = null;
petEl.addEventListener('mousedown', (e) => {
  dragState = {
    startX: e.screenX,
    startY: e.screenY,
    moved: false,
  };
  e.preventDefault();
});
window.addEventListener('mousemove', (e) => {
  if (!dragState) return;
  if (!dragState.moved &&
      (Math.abs(e.screenX - dragState.startX) > 4 || Math.abs(e.screenY - dragState.startY) > 4)) {
    dragState.moved = true;
    window.pet.send('drag-start', {
      offX: dragState.startX - window.screenX,
      offY: dragState.startY - window.screenY,
    });
  }
});
window.addEventListener('mouseup', () => {
  if (!dragState) return;
  const wasDrag = dragState.moved;
  dragState = null;
  if (wasDrag) {
    window.pet.send('drag-end');
    return;
  }
  // Plain click on the pet/egg.
  const readyEgg = state && state.game.eggs.find((e) => e.ready);
  if (!state?.game.activePet && readyEgg) {
    window.pet.send('hatch-egg', readyEgg.id);
  } else {
    petEl.classList.add('pounce');
    setTimeout(() => petEl.classList.remove('pounce'), 500);
    burst(['💚'], 5);
  }
});

$('btn-panel').addEventListener('click', () => window.pet.send('open-panel'));

// Corner grip: manual resize, independent of the OS's frameless-window handles.
$('grip').addEventListener('mousedown', (e) => {
  e.preventDefault();
  e.stopPropagation();
  window.pet.send('resize-start', { x: e.screenX, y: e.screenY });
  const stop = () => {
    window.pet.send('resize-end');
    window.removeEventListener('mouseup', stop);
  };
  window.addEventListener('mouseup', stop);
});

// ---------- wire up ----------

window.pet.on('state', (s) => {
  state = s;
  render();
});

window.pet.on('attention', (a) => {
  flashBubble(a.text, 'alert', 5000);
  burst(['❗'], 6);
});

window.pet.on('celebrate', (c) => {
  if (c.type === 'hatch') {
    flashBubble(c.text, 'party', 5500);
    burst(['🎉', '✨', c.emoji], 26);
  } else if (c.type === 'evolve') {
    flashBubble(c.text, 'party', 5500);
    burst(['⚡', '✨', '🌟'], 26);
  } else if (c.type === 'achievement') {
    flashBubble(c.text, 'party', 5000);
    burst(['🏆', '✨'], 18);
  } else if (c.type === 'levelup') {
    flashBubble(c.text, 'party', 2600);
    burst(['✨'], 8);
  }
});
