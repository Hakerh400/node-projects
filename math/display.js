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
  curTabIndex = null;

  ws = null;
  hs = null;
  ofs = null;

  constructor(system){
    this.system = system;
  }

  render(g, iw, ih, w, h){
    const {tabs, tabsNum, ws, hs, ofs} = this;

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

      tabs[i].render(g, ofs, x, y, iw, ih, tabW, tabH, ws, hs);
    }
  }

  get tabsNum(){
    return this.tabs.length;
  }

  get curTab(){
    const {curTabIndex} = this;

    if(curTabIndex === null)
      return null;

    return this.tabs[curTabIndex];
  }

  newTab(index=null){
    const {system, tabs, tabsNum, curTabIndex} = this;
    const theory = system.root;
    const tab = new TheoryTab(theory);

    if(index === null){
      index = curTabIndex !== null ?
        curTabIndex + 1 : tabsNum;
    }

    if(curTabIndex !== null && index <= curTabIndex)
      this.curTabIndex++;

    tabs.splice(index, 0, tab);
    this.selectTabAt(index);

    return tab;
  }

  selectTabAt(index){
    const {tabs, curTab} = this;

    if(curTab !== null)
      curTab.unselect();

    this.curTabIndex = index;

    const curTabNew = this.curTab;
    curTabNew.select();

    return curTabNew;
  }

  adjTab(dif, strict=1){
    const {tabsNum, curTabIndex} = this;

    if(tabsNum === 0){
      assert(!strict);
      return;
    }

    assert(curTabIndex !== null);

    const indexNew = (curTabIndex + dif + tabsNum) % tabsNum;
    return this.selectTabAt(indexNew);
  }

  nextTab(strict){
    return this.adjTab(1, strict);
  }

  prevTab(strict){
    return this.adjTab(-1, strict);
  }

  closeTab(strict=1){
    const {tabs, tabsNum, curTabIndex, curTab} = this;

    if(tabsNum === 0){
      assert(!strict);
      return;
    }

    assert(curTabIndex !== null);
    assert(curTab !== null);

    if(tabsNum === 1){
      curTab.unselect();
      tabs.length = 0;
      this.curTabIndex = null;
      return null;
    }

    let curTabNew = null;

    if(curTabIndex !== 0){
      curTabNew = this.prevTab();
    }else{
      curTabNew = this.nextTab();

      assert(this.curTabIndex === 1);
      this.curTabIndex = 0;
    }

    assert(!curTab.selected);
    tabs.splice(curTabIndex, 1);

    return curTabNew;
  }
}

module.exports = Display;