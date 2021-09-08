'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Theory = require('./theory');
const util = require('./util');
const su = require('./str-util');

class Tab{
  constructor(title){
    this.title = title;
  }

  render(g, x, y, w, h, ws, hs){ O.virtual('render'); }
}

class TheoryTab extends Tab{
  constructor(theory){
    super(theory.name);
    this.theory = theory;
  }

  render(g, x, y, w, h, ws, hs){
    const {title} = this;

    g.beginPath();
    g.rect(x + 1, y + 1, w - 2, h - 2);
    g.stroke();

    g.fillStyle = 'black';
    g.fillText(title, x + w / 2, y + h / 2);
  }
}

module.exports = Object.assign(Tab, {
  TheoryTab,
});