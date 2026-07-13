const fs = require('fs');
const path = require('path');

class Store {
  constructor(file) {
    this.file = file;
    this.data = {};
    try {
      this.data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      /* first run */
    }
  }

  save() {
    clearTimeout(this._t);
    this._t = setTimeout(() => this.flush(), 800);
  }

  flush() {
    clearTimeout(this._t);
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
    } catch (err) {
      console.error('[store] save failed:', err.message);
    }
  }
}

module.exports = { Store };
