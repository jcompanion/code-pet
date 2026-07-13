const { EventEmitter } = require('events');

const RARITIES = {
  common: { label: 'Common', color: '#9aa7a0', weight: 0 },
  uncommon: { label: 'Uncommon', color: '#6fd08c', weight: 1 },
  rare: { label: 'Rare', color: '#5cb8ff', weight: 2 },
  epic: { label: 'Epic', color: '#c78bff', weight: 3 },
  legendary: { label: 'Legendary', color: '#ffb347', weight: 4 },
};

// Every species has 3 evolution stages (Hatchling → Grown → Ascended).
// Pixel-art sprites for each id/stage live in renderer/sprites.js.
const SPECIES = [
  { id: 'blobby', name: 'Blobby', rarity: 'common' },
  { id: 'pup', name: 'Pup', rarity: 'common' },
  { id: 'chirpee', name: 'Chirpee', rarity: 'common' },
  { id: 'foxling', name: 'Foxling', rarity: 'uncommon' },
  { id: 'sporeling', name: 'Sporeling', rarity: 'uncommon' },
  { id: 'cactipup', name: 'Cactipup', rarity: 'uncommon' },
  { id: 'snailwing', name: 'Snailwing', rarity: 'uncommon' },
  { id: 'byteling', name: 'Byteling', rarity: 'rare' },
  { id: 'shroomkin', name: 'Shroomkin', rarity: 'rare' },
  { id: 'axopuff', name: 'Axopuff', rarity: 'rare' },
  { id: 'wispurr', name: 'Wispurr', rarity: 'epic' },
  { id: 'embermouse', name: 'Embermouse', rarity: 'epic' },
  { id: 'prismhorn', name: 'Prismhorn', rarity: 'epic' },
  { id: 'drakon', name: 'Drakon', rarity: 'legendary' },
  { id: 'kentari', name: 'Kentari', rarity: 'legendary' },
  { id: 'voltrex', name: 'Voltrex', rarity: 'legendary' },
];

const NAMES = [
  'Biscuit', 'Mochi', 'Pixel', 'Noodle', 'Waffle', 'Turbo', 'Pebble', 'Miso',
  'Zippy', 'Clover', 'Nimbus', 'Taco', 'Widget', 'Fig', 'Comet', 'Bramble',
  'Sudo', 'Nully', 'Async', 'Boba', 'Tofu', 'Sprocket', 'Juniper', 'Echo',
];

// Global XP needed to hatch an egg, by rarity.
const HATCH_COST = { common: 30, uncommon: 60, rare: 100, epic: 150, legendary: 220 };

// Egg rarity roll weights per achievement tier.
const TIER_WEIGHTS = {
  1: { common: 65, uncommon: 27, rare: 8, epic: 0, legendary: 0 },
  2: { common: 10, uncommon: 45, rare: 32, epic: 11, legendary: 2 },
  3: { common: 0, uncommon: 0, rare: 45, epic: 40, legendary: 15 },
};

const ACHIEVEMENTS = [
  { id: 'first-contact', name: 'First Contact', desc: 'A Claude Code session comes to life', tier: 1, test: (c) => c.sessionsSeen >= 1 },
  { id: 'chatterbox', name: 'Chatterbox', desc: '100 messages exchanged', tier: 1, test: (c) => c.messages >= 100 },
  { id: 'conversationalist', name: 'Conversationalist', desc: '500 messages exchanged', tier: 2, test: (c) => c.messages >= 500 },
  { id: 'millennium', name: 'Millennium Coder', desc: '2,000 messages exchanged', tier: 3, test: (c) => c.messages >= 2000 },
  { id: 'multitasker', name: 'Multitasker', desc: '3 sessions running at once', tier: 2, test: (c) => c.maxConcurrent >= 3 },
  { id: 'hydra', name: 'Hydra', desc: '5 sessions running at once', tier: 3, test: (c) => c.maxConcurrent >= 5 },
  { id: 'night-owl', name: 'Night Owl', desc: 'Coding between midnight and 5am', tier: 2, test: (c) => c.nightOwl },
  { id: 'early-bird', name: 'Early Bird', desc: 'Coding between 5am and 7am', tier: 2, test: (c) => c.earlyBird },
  { id: 'marathon', name: 'Marathon', desc: 'One session hits 200 messages', tier: 2, test: (c) => c.maxSessionMsgs >= 200 },
  { id: 'streak-3', name: 'Warming Up', desc: '3-day coding streak', tier: 1, test: (c) => c.bestStreak >= 3 },
  { id: 'streak-7', name: 'On Fire', desc: '7-day coding streak', tier: 2, test: (c) => c.bestStreak >= 7 },
  { id: 'streak-30', name: 'Unstoppable', desc: '30-day coding streak', tier: 3, test: (c) => c.bestStreak >= 30 },
  { id: 'wrangler', name: 'Session Wrangler', desc: '25 different sessions seen', tier: 2, test: (c) => c.sessionsSeen >= 25 },
  { id: 'evolver', name: 'Evolver', desc: 'A pet evolves for the first time', tier: 2, test: (c) => c.evolutions >= 1 },
  { id: 'apex', name: 'Apex Form', desc: 'A pet reaches its final form', tier: 3, test: (c) => c.maxStage >= 2 },
  { id: 'collector', name: 'Collector', desc: 'Hatch 3 pets', tier: 2, test: (c) => c.petsHatched >= 3 },
  { id: 'menagerie', name: 'Menagerie', desc: 'Hatch 6 pets', tier: 3, test: (c) => c.petsHatched >= 6 },
  { id: 'delegator', name: 'Delegator', desc: '3 background agents running at once', tier: 2, test: (c) => c.maxConcurrentAgents >= 3 },
  { id: 'fleet', name: 'Fleet Commander', desc: '6 background agents running at once', tier: 3, test: (c) => c.maxConcurrentAgents >= 6 },
];

const XP_GAIN = { user: 2, assistant: 3, tool: 1 };

function petLevel(xp) {
  return Math.floor(Math.sqrt(xp / 15)) + 1;
}
function xpForLevel(level) {
  return 15 * (level - 1) * (level - 1);
}
function stageOf(level) {
  return level >= 12 ? 2 : level >= 5 ? 1 : 0;
}
function rollRarity(tier) {
  const weights = TIER_WEIGHTS[tier] || TIER_WEIGHTS[1];
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [rarity, w] of Object.entries(weights)) {
    roll -= w;
    if (roll <= 0) return rarity;
  }
  return 'common';
}
function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function bestStreak(dayKeys) {
  const days = [...dayKeys].map((k) => {
    const [y, m, d] = k.split('-').map(Number);
    return Date.UTC(y, m - 1, d) / 86400000;
  }).sort((a, b) => a - b);
  let best = 0, run = 0, prev = null;
  for (const d of days) {
    run = prev !== null && d === prev + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/**
 * Emits:
 *  - 'change'                      snapshot should be re-broadcast
 *  - 'celebrate' ({type, ...})     hatch / evolve / achievement / levelup
 */
class Game extends EventEmitter {
  constructor(store) {
    super();
    this.store = store;
    const s = (store.data.game = store.data.game || {});
    s.xp = s.xp || 0;
    s.pets = s.pets || [];
    s.eggs = s.eggs || [];
    s.unlocked = s.unlocked || {};
    s.activePetId = s.activePetId || null;
    s.counters = Object.assign(
      {
        messages: 0,
        sessionKeys: [],
        sessionMsgs: {},
        maxSessionMsgs: 0,
        maxConcurrent: 0,
        maxConcurrentAgents: 0,
        days: [],
        nightOwl: false,
        earlyBird: false,
        evolutions: 0,
        maxStage: 0,
        petsHatched: 0,
      },
      s.counters
    );
    this.s = s;
    if (!s.starterGranted) {
      s.starterGranted = true;
      this.grantEgg(1, 'A welcome gift');
    }
  }

  save() {
    this.store.save();
  }

  get counters() {
    const c = this.s.counters;
    return Object.assign({}, c, {
      sessionsSeen: c.sessionKeys.length,
      bestStreak: bestStreak(c.days),
    });
  }

  onActivity({ kind, sessionKey, ts }) {
    const c = this.s.counters;
    c.messages += 1;
    c.sessionMsgs[sessionKey] = (c.sessionMsgs[sessionKey] || 0) + 1;
    c.maxSessionMsgs = Math.max(c.maxSessionMsgs, c.sessionMsgs[sessionKey]);
    const day = dayKey(ts);
    if (!c.days.includes(day)) c.days.push(day);
    const hour = new Date(ts).getHours();
    if (hour >= 0 && hour < 5) c.nightOwl = true;
    if (hour >= 5 && hour < 7) c.earlyBird = true;

    this.addXp(XP_GAIN[kind] || 1);
    this.checkAchievements();
    this.save();
    this.emit('change');
  }

  onSessions(snapshot) {
    const c = this.s.counters;
    c.maxConcurrent = Math.max(c.maxConcurrent, snapshot.length);
    const agentsRunning = snapshot.reduce((n, s) => n + (s.agentsRunning || 0), 0);
    c.maxConcurrentAgents = Math.max(c.maxConcurrentAgents, agentsRunning);
    let changed = false;
    for (const s of snapshot) {
      if (!c.sessionKeys.includes(s.key)) {
        c.sessionKeys.push(s.key);
        changed = true;
      }
    }
    if (changed || snapshot.length) {
      this.checkAchievements();
      this.save();
    }
  }

  addXp(amount) {
    this.s.xp += amount;
    const pet = this.activePet();
    if (!pet) return;
    const before = petLevel(pet.xp);
    const stageBefore = stageOf(before);
    pet.xp += amount;
    const after = petLevel(pet.xp);
    const stageAfter = stageOf(after);
    if (stageAfter > stageBefore) {
      const c = this.s.counters;
      c.evolutions += 1;
      c.maxStage = Math.max(c.maxStage, stageAfter);
      const sp = SPECIES.find((x) => x.id === pet.speciesId);
      this.emit('celebrate', {
        type: 'evolve',
        text: `${pet.name} evolved into its ${stageAfter === 2 ? 'Ascended' : 'Grown'} form!`,
        emoji: '🌟',
      });
    } else if (after > before) {
      this.emit('celebrate', { type: 'levelup', text: `${pet.name} reached Lv.${after}!` });
    }
  }

  checkAchievements() {
    const c = this.counters;
    for (const a of ACHIEVEMENTS) {
      if (this.s.unlocked[a.id]) continue;
      let hit = false;
      try {
        hit = a.test(c);
      } catch {}
      if (!hit) continue;
      this.s.unlocked[a.id] = Date.now();
      const egg = this.grantEgg(a.tier, a.name);
      this.emit('celebrate', {
        type: 'achievement',
        text: `Achievement: ${a.name}! A ${RARITIES[egg.rarity].label.toLowerCase()} egg appears 🥚`,
        emoji: '🏆',
      });
    }
  }

  grantEgg(tier, reason) {
    const rarity = rollRarity(tier);
    const egg = {
      id: 'egg-' + Math.random().toString(36).slice(2, 9),
      rarity,
      reason,
      bornXp: this.s.xp,
      bornAt: Date.now(),
    };
    this.s.eggs.push(egg);
    this.save();
    this.emit('change');
    return egg;
  }

  eggProgress(egg) {
    const cost = HATCH_COST[egg.rarity];
    return { cost, earned: Math.min(cost, this.s.xp - egg.bornXp), ready: this.s.xp - egg.bornXp >= cost };
  }

  hatch(eggId) {
    const idx = this.s.eggs.findIndex((e) => e.id === eggId);
    if (idx === -1) return null;
    const egg = this.s.eggs[idx];
    if (!this.eggProgress(egg).ready) return null;
    const pool = SPECIES.filter((sp) => sp.rarity === egg.rarity);
    const species = pool[Math.floor(Math.random() * pool.length)];
    const used = new Set(this.s.pets.map((p) => p.name));
    const free = NAMES.filter((n) => !used.has(n));
    const name = free.length
      ? free[Math.floor(Math.random() * free.length)]
      : NAMES[Math.floor(Math.random() * NAMES.length)] + ' Jr.';
    const pet = {
      id: 'pet-' + Math.random().toString(36).slice(2, 9),
      speciesId: species.id,
      name,
      xp: 0,
      hatchedAt: Date.now(),
    };
    this.s.eggs.splice(idx, 1);
    this.s.pets.push(pet);
    this.s.counters.petsHatched += 1;
    if (!this.s.activePetId) this.s.activePetId = pet.id;
    this.emit('celebrate', {
      type: 'hatch',
      text: `${name} the ${species.name} hatched! (${RARITIES[species.rarity].label})`,
      emoji: '🐣',
    });
    this.checkAchievements();
    this.save();
    this.emit('change');
    return pet;
  }

  setActive(petId) {
    if (this.s.pets.some((p) => p.id === petId)) {
      this.s.activePetId = petId;
      this.save();
      this.emit('change');
    }
  }

  activePet() {
    return this.s.pets.find((p) => p.id === this.s.activePetId) || null;
  }

  enrichPet(pet) {
    const sp = SPECIES.find((x) => x.id === pet.speciesId) || SPECIES[0];
    const level = petLevel(pet.xp);
    const stage = stageOf(level);
    const cur = xpForLevel(level);
    const next = xpForLevel(level + 1);
    return {
      id: pet.id,
      name: pet.name,
      species: sp.name,
      rarity: sp.rarity,
      rarityLabel: RARITIES[sp.rarity].label,
      rarityColor: RARITIES[sp.rarity].color,
      speciesId: sp.id,
      stage,
      level,
      xp: pet.xp,
      levelProgress: next === cur ? 1 : (pet.xp - cur) / (next - cur),
      isActive: pet.id === this.s.activePetId,
    };
  }

  snapshot() {
    return {
      xp: this.s.xp,
      messages: this.s.counters.messages,
      activePetId: this.s.activePetId,
      activePet: this.activePet() ? this.enrichPet(this.activePet()) : null,
      pets: this.s.pets.map((p) => this.enrichPet(p)),
      eggs: this.s.eggs.map((e) => Object.assign(
        {
          id: e.id,
          rarity: e.rarity,
          rarityLabel: RARITIES[e.rarity].label,
          rarityColor: RARITIES[e.rarity].color,
          reason: e.reason,
        },
        this.eggProgress(e)
      )),
      achievements: ACHIEVEMENTS.map((a) => ({
        id: a.id,
        name: a.name,
        desc: a.desc,
        tier: a.tier,
        unlockedAt: this.s.unlocked[a.id] || null,
      })),
    };
  }
}

module.exports = { Game, SPECIES, RARITIES };
