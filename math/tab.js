'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const Theory = require('./theory');
const util = require('./util');
const su = require('./str-util');

class Tab{
  constructor(title, selected=0){
    this.title = title;
    this.selected = selected;
  }

  render(g, x, y, w, h, ws, hs){ O.virtual('render'); }

  select(){
    assert(!this.selected);
    this.selected = 1;
  }

  unselect(){
    assert(this.selected);
    this.selected = 0;
  }
}

class TheoryTab extends Tab{
  constructor(theory){
    super(theory.title);
    this.theory = theory;
  }

  render(g, x, y, w, h, ws, hs){
    const {title, selected} = this;

    g.fillStyle = selected ? 'white' : '#a9a9a9';
    g.beginPath();
    g.rect(x + 1, y + 1, w - 2, h - 2);
    g.fill();
    g.stroke();

    g.fillStyle = 'black';
    g.fillText(title, x + w / 2, y + h / 2);
  }
}

module.exports = Object.assign(Tab, {
  TheoryTab,
});