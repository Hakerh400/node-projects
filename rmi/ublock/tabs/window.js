'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../../omikron');
const rmi = require('../..');

class Window{
  realm = null;
  #tabsObj = O.obj();
  #tabsArr = [];

  constructor(id){
    this.id = id;
  }

  hasTab(id){
    return O.has(this.#tabsObj, id);
  }

  getTabById(id){
    assert(this.hasTab(id));
    return this.#tabsObj[id];
  }

  getTabByIndex(index){
    if(index >= this.#tabsArr.length)
      return null;

    return this.#tabsArr[index];
  }

  addTab(tab, index){
    assert(tab.window === null);
    assert(tab.index === null);

    const {id} = tab;
    assert(!this.hasTab(id));

    while(index > this.#tabsArr.length)
      this.#tabsArr.push(null);

    this.#tabsObj[id] = tab;
    this.#tabsArr.splice(index, 0, tab);

    tab.window = this;
    tab.index = index;
  }

  removeTab(id){
    assert(this.hasTab(id));

    const tab = this.#tabsObj[id];

    delete this.#tabsObj[id];
    this.#tabsArr.splice(tab.index, 1);

    tab.window = null;
    tab.index = null;
  }

  *[Symbol.iterator](){
    yield* this.#tabsArr;
  }
}

module.exports = Window;