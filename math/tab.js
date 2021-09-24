'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('./assert');
const O = require('../omikron');
const Theory = require('./theory');
const EventTarget = require('./event-target');
const util = require('./util');
const su = require('./str-util');

class Tab extends EventTarget{
  constructor(display, title, selected=0){
    super();

    this.display = display
    this.title = title;
    this.selected = selected;
  }

  get isTh(){ return 0; }

  render(g, ofs, x, y, w, h, tw, th){ O.virtual('render'); }

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
  constructor(display, theory){
    super(display, theory.title);

    this.theory = theory;
  }

  get isTh(){ return 1; }

  render(g, ofs, x, y, w, h, tw, th){
    const {title, selected, theory} = this;

    g.fillStyle = selected ? 'white' : '#a9a9a9';
    g.beginPath();
    g.rect(x + 1, y + 1, tw - 2, th - 2);
    g.fill();
    g.stroke();

    g.fillStyle = 'black';
    g.fillText(title, x + tw / 2, y + th / 2);

    if(!selected) return;

    theory.render(g, ofs, 0, y + th, w, h);
  }

  emit(type, ...args){
    const {theory} = this;
    theory.emit(type, this, ...args);
  }

  setTheory(theory){
    process.nextTick(() => {
      this.theory = theory;
    });
  }
}

module.exports = Object.assign(Tab, {
  TheoryTab,
});