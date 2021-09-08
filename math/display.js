'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const System = require('./system');
const Tab = require('./tab');
const util = require('./util');
const su = require('./str-util');

const {TheoryTab} = Tab;

class Display{
  tabs = [];

  ws = null;
  hs = null;
  ofs = null;

  constructor(system){
    this.system = system;
  }

  render(g, iw, ih, w, h){
    const {tabs, ws, hs, ofs} = this;
    const tabsNum = tabs.length;

    const tabW = ws * 20;
    const tabH = hs;

    const iwh = iw / 2;
    const ihh = ih / 2;

    const wh = w >> 1;
    const hh = h >> 1;

    g.beginPath();
    g.moveTo(0, tabH);
    g.lineTo(iw, tabH);
    g.stroke();

    for(let i = 0; i !== tabsNum; i++){
      const x = tabW * i;
      const y = 0;

      tabs[i].render(g, x, y, tabW, tabH, ws, hs);
    }
  }

  newTab(index=null){
    const {system, tabs} = this;
    const theory = system.getRoot();
    const tab = new TheoryTab(theory);

    if(index === null){
      tabs.push(tab);
    }else{
      tabs.splice(index, 0, tab);
    }

    return tab;
  }
}

module.exports = Display;