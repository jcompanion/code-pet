/**
 * Pixel-art creature sprites, rendered to SVG so they stay crisp at any size.
 * Each species has a `baby` and `adult` grid; the final "Ascended" stage is
 * generated from the adult: golden crown + brightened palette.
 *
 * Grid format: array of strings. '.' = transparent, other chars index `pal`.
 * Works in both Node (module.exports) and the renderer (window.Sprites).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Sprites = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const GOLD = '#ffd34d';
  const GOLD_DARK = '#c99a1e';

  const SPRITES = {
    // ------------------------------------------------ common
    blobby: {
      pal: { o: '#1f5c33', G: '#7ee08f', D: '#54b96b', k: '#1c2b20', w: '#d9ffe0' },
      baby: [
        '..oooo..',
        '.oGGGGo.',
        'oGwGGGGo',
        'oGkGGkGo',
        'oGGGGGGo',
        'oGGkkGGo',
        '.oDDDDo.',
        '..oooo..',
      ],
      adult: [
        '...oooooo...',
        '..oGGGGGGo..',
        '.oGwGGGGGGo.',
        'oGGGGGGGGGGo',
        'oGGkGGGGkGGo',
        'oGGGGGGGGGGo',
        'oGGGkkkkGGGo',
        'oGDGGGGGGDGo',
        'oDDDDDDDDDDo',
        '.oDDDDDDDDo.',
        '..oooooooo..',
      ],
    },
    pup: {
      pal: { o: '#4a2f1b', B: '#c98d5a', D: '#a56b3c', k: '#241407', n: '#3b2417', w: '#f5e3d0' },
      baby: [
        'oo......oo',
        'oBo....oBo',
        'oBBooooBBo',
        'oBBBBBBBBo',
        'oBkBBBBkBo',
        'oBBBnnBBBo',
        'oBBBBBBBBo',
        '.oBBBBBBo.',
        '..oooooo..',
      ],
      adult: [
        'oo..........oo',
        'oDo........oDo',
        'oDBooooooooBDo',
        '.oBBBBBBBBBBo.',
        '.oBkBBBBBBkBo.',
        '.oBBBwBBwBBBo.',
        '.oBBBBnnBBBBo.',
        '.oBBBBnnBBBBo.',
        '..oBBBBBBBBo..',
        '.oBBoBBBBoBBo.',
        '.oBBo.oo.oBBo.',
        '..oo......oo..',
      ],
    },
    chirpee: {
      pal: { o: '#8a5a10', Y: '#ffd95e', D: '#f0b429', b: '#ff8c42', k: '#2b1c05', w: '#fff3d0' },
      baby: [
        '..oooo..',
        '.oYYYYo.',
        'oYkYYkYo',
        'oYYbbYYo',
        'oYYYYYYo',
        '.oYYYYo.',
        '.oDYYDo.',
        '..obbo..',
      ],
      adult: [
        '....oooo....',
        '...oYYYYo...',
        '..oYkYYkYo..',
        '..oYYbbYYo..',
        '.oYYYbbYYYo.',
        'oYYYYYYYYYYo',
        'oDYYYYYYYYDo',
        'oDDYYYYYYDDo',
        '.oDDDYYDDDo.',
        '..oDDDDDDo..',
        '...obboob...',
        '...obb.bb...',
      ],
    },
    // ------------------------------------------------ uncommon
    foxling: {
      pal: { o: '#7a3c14', F: '#ff9a56', D: '#e07a35', W: '#fff4e8', k: '#2e1505', n: '#3b2417' },
      baby: [
        'o.o....o.o',
        'oFo....oFo',
        'oFFooooFFo',
        'oFFFFFFFFo',
        'oFkFFFFkFo',
        'oWWFnnFWWo',
        '.oWFFFFWo.',
        '..oooooo..',
      ],
      adult: [
        'o.o........o.o',
        'oWFo......oFWo',
        'oFFFooooooFFFo',
        '.oFFFFFFFFFFo.',
        '.oFkFFFFFFkFo.',
        '.oWWFFnnFFWWo.',
        '.oWWWFnnFWWWo.',
        '..oWFFFFFFWo..',
        '..oFFFFFFFFo..',
        '.oFFoFFFFoFFo.',
        '..oo.oFFo.oo..',
        '......oo......',
      ],
    },
    sporeling: {
      pal: { o: '#5c2222', C: '#e05d5d', D: '#b84343', W: '#fff1e0', S: '#f2e3c2', k: '#2e1210' },
      baby: [
        '..oooo..',
        '.oCCCCo.',
        'oCWCCWCo',
        'oCCCCCCo',
        '.oSSSSo.',
        '.oSkkSo.',
        '.oSSSSo.',
        '..oooo..',
      ],
      adult: [
        '...oooooo...',
        '..oCCCCCCo..',
        '.oCWCCCCWCo.',
        'oCCCCWCCCCCo',
        'oDCCCCCCCDCo',
        'oooooooooooo',
        '..oSSSSSSo..',
        '..oSkSSkSo..',
        '..oSSSSSSo..',
        '..oSkkkSSo..',
        '...oSSSSo...',
        '....oooo....',
      ],
    },
    cactipup: {
      pal: { o: '#2f5c28', G: '#7bc86c', D: '#5aa54e', P: '#ff8ac2', Y: '#ffe08a', k: '#14290f' },
      baby: [
        '...PP...',
        '..PYYP..',
        '..oooo..',
        '.oGGGGo.',
        'oGkGGkGo',
        'oGGkkGGo',
        'oDGGGGDo',
        '.oGGGGo.',
        '..oooo..',
      ],
      adult: [
        '.....PP.....',
        '....PYYP....',
        '.....oo.....',
        '...oGGGGo...',
        '..oGkGGkGo..',
        'oo.oGGGGGo.oo',
        'oGooGkkGGooGo',
        'oGGoGGGGGoGGo',
        '.ooDGGGGGDoo.',
        '...oDGGGDo...',
        '...oGGGGGo...',
        '....oooo....',
      ],
    },
    snailwing: {
      pal: { o: '#5a4a7a', S: '#c9a2ff', D: '#a276e0', B: '#f2e3c2', k: '#241a38', w: '#f4ecff' },
      baby: [
        '...ooooo..',
        '..oSSSSSo.',
        '.oSwSSSSSo',
        '.oSSSkSSSo',
        'ooSSSSSSo.',
        'oBkBooooo.',
        'oBBBBBBBo.',
        '.ooooooo..',
      ],
      adult: [
        '..w.......w..',
        '.www.....www.',
        '..oooooo.....',
        '.oSSSSSSo....',
        'oSwSSSSSSo...',
        'oSSSkkSSSo...',
        'oSSSSSSSSo...',
        '.oDSSSSDo....',
        'ooBoooooooBoo',
        'oBkBBBBBBBBo.',
        'oBBBBBBBBBBo.',
        '.oooooooooo..',
      ],
    },
    // ------------------------------------------------ rare
    byteling: {
      pal: { o: '#173d22', V: '#7cfc9b', D: '#4fd678', k: '#0c2413', w: '#eafff0' },
      baby: [
        '.V.....V.',
        '..V...V..',
        '.VVVVVVV.',
        'VVkVVVkVV',
        'VVVVVVVVV',
        'V.VVVVV.V',
        '...V.V...',
        '..V...V..',
      ],
      adult: [
        '..V.......V..',
        '...V.....V...',
        '..VVVVVVVVV..',
        '.VVVVVVVVVVV.',
        'VVVkkVVVkkVVV',
        'VVVVVVVVVVVVV',
        'V.VVDDDDDVV.V',
        'V.V.......V.V',
        'V..VV...VV..V',
        '...VV...VV...',
      ],
    },
    shroomkin: {
      pal: { o: '#3f5c22', G: '#8fd06a', D: '#6cae4b', C: '#c86a4a', E: '#a34e33', w: '#ffe9d9', k: '#1c2e0f' },
      baby: [
        '..CCCC..',
        '.CwCCCC.',
        'CCCCCwCC',
        '.oGGGGo.',
        'oGkGGkGo',
        'oGkkkkGo',
        '.oGGGGo.',
        '..oooo..',
      ],
      adult: [
        '...CCCCCC...',
        '..CCwCCCCC..',
        '.CCCCCCwCCC.',
        '.ECCCCCCCCE.',
        '..oGGGGGGo..',
        '.oGkGGGGkGo.',
        '.oGGGGGGGGo.',
        '.oGkkkkkkGo.',
        '..oGGGGGGo..',
        '.oGGo..oGGo.',
        'oGGo....oGGo',
        '.oo......oo.',
      ],
    },
    axopuff: {
      pal: { o: '#8a3d55', P: '#ffb3c8', D: '#f291b0', R: '#ff6f91', k: '#3d1522', w: '#ffe4ec' },
      baby: [
        'R.oooo.R',
        'RoPPPPoR',
        'oPkPPkPo',
        'oPPPPPPo',
        'oPkkkkPo',
        'RoPPPPoR',
        'R.oPPo.R',
        '...oo...',
      ],
      adult: [
        '.R...oooo...R.',
        'RR..oPPPPo..RR',
        'RRoPPPPPPPPoRR',
        '.oPkPPPPPPkPo.',
        '.oPPPwPPPPPPo.',
        '.oPPkkkkkkPPo.',
        'RRoPPPPPPPPoRR',
        'RR.oPPPPPPo.RR',
        '.R.oPPooPPo.R.',
        '...oPo..oPo...',
        '....o....o....',
      ],
    },
    // ------------------------------------------------ epic
    wispurr: {
      pal: { o: '#5a628a', W: '#e8ecf7', S: '#c3cbe3', k: '#2b2f45', p: '#ffb3c8' },
      baby: [
        'o......o',
        'oWo..oWo',
        'oWWooWWo',
        'oWWWWWWo',
        'oWkWWkWo',
        'oWWWWWWo',
        'oSWSWSWo',
        '.o.oo.o.',
      ],
      adult: [
        '.o........o.',
        'oWo......oWo',
        'oWWooooooWWo',
        'oWWWWWWWWWWo',
        'oWkWWWWWWkWo',
        'oWWpWWWWpWWo',
        'oWWWWkkWWWWo',
        'oWWWWWWWWWWo',
        'oWWWWWWWWWWo',
        'oSWWSWWSWWSo',
        '.o.o.oo.o.o.',
      ],
    },
    embermouse: {
      pal: { o: '#4d4560', M: '#c3bdd4', D: '#a29ab8', F: '#ff9d2e', Y: '#ffd34d', k: '#241f33', n: '#ff8ac2' },
      baby: [
        '....F...',
        '...FYF..',
        '.o.FYF.o',
        'oMooooMo',
        'oMMMMMMo',
        'oMkMMkMo',
        'oMMnnMMo',
        '.oooooo.',
      ],
      adult: [
        '.....F......',
        '....FYF.....',
        '...FFYYF....',
        'oo..FYF..oo.',
        'oMMo.o.oMMo.',
        'oMMMoooMMMo.',
        '.oMMMMMMMo..',
        '.oMkMMMkMo..',
        '.oMMMnMMMo..',
        '.oMMnnnMMo..',
        '..oMMMMMo...',
        '...ooooo....',
      ],
    },
    prismhorn: {
      pal: { o: '#5b4a8a', W: '#f5f0ff', S: '#ded4f2', M: '#b78bff', H: '#ffd34d', k: '#2b2145', n: '#c9b8e8' },
      baby: [
        '...H....',
        '..HH....',
        '.oWWo...',
        'oWWWWo..',
        'oWkWWWo.',
        'oWWnWWMo',
        '.oWWWMo.',
        '.oWoWo..',
      ],
      adult: [
        '.....H......',
        '....HH......',
        '...HH.......',
        '..oWWoo.....',
        '.oWWWWWoo...',
        'oWkWWWWWWMo.',
        'oWWWnWWWMMo.',
        '.oWWWWWMMo..',
        '..oWWWWWo...',
        '..oWWWWWWo..',
        '..oWoWWoWo..',
        '..oo..oo....',
      ],
    },
    // ------------------------------------------------ legendary
    drakon: {
      pal: { o: '#1f4d33', G: '#59c877', D: '#2e8b57', Y: '#ffe08a', V: '#37a05e', k: '#0e2b1a', w: '#eaffef' },
      baby: [
        'o..oo..o',
        'oVoGGoVo',
        '.oGGGGo.',
        'oGkGGkGo',
        'oGGYYGGo',
        'oGYYYYGo',
        '.oGGGGo.',
        'oGo..oGo',
        '.o....o.',
      ],
      adult: [
        '.o...oooo...o.',
        'oVo.oGGGGo.oVo',
        'oVVoGGGGGGoVVo',
        '.oVGGGGGGGGVo.',
        '.oGkGGGGGGkGo.',
        '.oGGGYYYYGGGo.',
        '.oGGYYYYYYGGo.',
        '.oGGYYYYYYGGo.',
        '..oGGGGGGGGo..',
        '.oGGo....oGGo.',
        '.oGGo.oo.oGGo.',
        '..oo..oo..oo..',
      ],
    },
    kentari: {
      pal: { o: '#4a2c14', B: '#b07445', D: '#8f5a30', T: '#e8b48a', H: '#5a3a24', k: '#241204', w: '#ffe9c9' },
      baby: [
        '..HHHH..',
        '.oTTTTo.',
        '.oTkkTo.',
        '..oTTo..',
        '.oTTTTo.',
        'oBBBBBBo',
        'oBoBBoBo',
        '.o.oo.o.',
      ],
      adult: [
        '....HHHH....',
        '...oTTTTo...',
        '...oTkkTo...',
        '....oTTo....',
        '..oTTTTTTo..',
        '..oToTToTo..',
        '....oTTo....',
        '.oBBBBBBBBo.',
        'oBBBBBBBBBBo',
        'oBoBBBBBBoBo',
        '.oBo.BB.oBo.',
        '.oo..oo..oo.',
      ],
    },
    voltrex: {
      pal: { o: '#3f6b1f', G: '#9be15d', D: '#78bf3f', Y: '#ffe34d', W: '#fffbe8', k: '#1c330c' },
      baby: [
        '.oGGGGo.',
        'oGkGGGGo',
        'oGGGGGGo',
        'oGWWWGo.',
        'oGGGGGGo',
        '.oGoGGo.',
        '.oGGGGo.',
        '..oo.oo.',
      ],
      adult: [
        '..oGGGGGGo..',
        '.oGGkGGGGGo.',
        '.oGGGGGGYYo.',
        '.oGGGGGGGo..',
        '.oGWWWWGo...',
        '.oGGGGGGGGo.',
        'oGGoGGGGGGGo',
        'oGGGGGGGoGGo',
        '.oDGGGGGGDo.',
        '.oGGo..oGGo.',
        '.oGGo..oGGo.',
        '..oo....oo..',
      ],
    },
  };

  const EGG = {
    grid: [
      '...oooo...',
      '..oEEEEo..',
      '.oEEwEEEo.',
      '.oEwEEREo.',
      'oEEREEEEEo',
      'oEEEEEREEo',
      'oEREEEEEEo',
      'oEEEEEEREo',
      'oSEEREEESo',
      '.oSSEESSo.',
      '..oSSSSo..',
      '...oooo...',
    ],
    pal: { o: '#4a4438', E: '#f6f1e3', S: '#d9d0b8', w: '#fffdf6' },
  };

  function lighten(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const ch = (v) => Math.min(255, Math.round(v + (255 - v) * amt));
    const r = ch((n >> 16) & 255), g = ch((n >> 8) & 255), b = ch(n & 255);
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  // Add a golden crown centered over the topmost filled pixels.
  function crownify(grid) {
    const rows = grid.map((r) => r.split(''));
    const width = Math.max(...grid.map((r) => r.length));
    let topRow = 0;
    while (topRow < rows.length && rows[topRow].every((c) => c === '.')) topRow++;
    const cells = rows[topRow] || [];
    let first = -1, last = -1;
    cells.forEach((c, i) => {
      if (c !== '.') {
        if (first === -1) first = i;
        last = i;
      }
    });
    const mid = first === -1 ? Math.floor(width / 2) : Math.floor((first + last) / 2);
    const put = (row, col, ch) => {
      while (row.length < col + 1) row.push('.');
      row[col] = ch;
    };
    const r1 = [], r2 = [];
    for (const off of [-2, 0, 2]) put(r1, mid + off, '☆');
    for (const off of [-2, -1, 0, 1, 2]) put(r2, mid + off, '★');
    return [r1.join(''), r2.join(''), ...grid];
  }

  function gridToSvg(grid, pal, opts = {}) {
    const rows = grid;
    const h = rows.length;
    const w = Math.max(...rows.map((r) => r.length));
    let rects = '';
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < rows[y].length; x++) {
        const ch = rows[y][x];
        if (ch === '.') continue;
        const color = pal[ch];
        if (!color) continue;
        rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${color}"/>`;
      }
    }
    const attrs = opts.size ? `width="${opts.size}" height="${opts.size}"` : 'width="100%" height="100%"';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" ${attrs} preserveAspectRatio="xMidYMax meet" shape-rendering="crispEdges">${rects}</svg>`;
  }

  function petSvg(speciesId, stage, opts = {}) {
    const sp = SPRITES[speciesId] || SPRITES.blobby;
    let grid = stage === 0 ? sp.baby : sp.adult;
    let pal = sp.pal;
    if (stage >= 2) {
      grid = crownify(grid);
      pal = Object.assign({}, pal, { '★': GOLD, '☆': GOLD_DARK });
      const bright = {};
      for (const [ch, color] of Object.entries(pal)) {
        bright[ch] = ch === '★' || ch === '☆' ? color : lighten(color, 0.12);
      }
      pal = bright;
    }
    return gridToSvg(grid, pal, opts);
  }

  function eggSvg(rarityColor, opts = {}) {
    const pal = Object.assign({}, EGG.pal, { R: rarityColor || '#9aa7a0' });
    return gridToSvg(EGG.grid, pal, opts);
  }

  return { SPRITES, petSvg, eggSvg, speciesIds: Object.keys(SPRITES) };
});
