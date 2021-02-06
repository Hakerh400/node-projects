'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../../omikron');
const rmi = require('../..');

class Window extends O.Stringifiable{
  realm = null;
  #tabsObj = O.obj();
  #tabsArr = [];
  #tabsNum = 0;

  constructor(id){
    super();

    assert(typeof id === 'number');
    this.id = id;
  }

  get inco(){ return this.realm?.inco; }
  get tabsNum(){ return this.#tabsNum; }

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

  insertTab(tab, index){
    const arr = this.#tabsArr;

    assert(tab.window === null);

    const {id} = tab;
    assert(!this.hasTab(id));

    while(index > arr.length)
      arr.push(null);

    this.#tabsObj[id] = tab;
    arr.splice(index, 0, tab);

    tab.window = this;

    this.#tabsNum++;
  }

  setTab(tab, index){
    const arr = this.#tabsArr;

    assert(tab.window === null);

    const {id} = tab;
    assert(!this.hasTab(id));

    while(index >= arr.length)
      arr.push(null);

    assert(arr[index] === null)

    this.#tabsObj[id] = tab;
    arr[index] = tab;

    tab.window = this;
    tab.realm = this.realm;

    this.#tabsNum++;
  }

  moveTab(tab, indexCur, indexNew){
    const arr = this.#tabsArr;

    assert(this.hasTab(tab.id));
    assert(tab.window === this);

    if(arr[indexCur] !== tab){
      O.logb();
      log(arr.map((a, b) => `${b}: ${a}`).join('\n'));
      log(`tab.id: ${tab.id}`);
      log(`indexCur: ${indexCur}`);
      log(`indexNew: ${indexNew}`);
      O.logb();
      O.exit();
    }

    assert(arr[indexCur] === tab);
    assert(indexNew !== indexCur);

    arr.splice(indexCur, 1);

    while(arr.length < indexNew)
      arr.push(null);
    
    arr.splice(indexNew, 0, tab);
  }

  removeTab(id){
    assert(this.hasTab(id));

    const tab = this.#tabsObj[id];
    const index = this.#tabsArr.indexOf(tab);
    assert(index !== -1);

    delete this.#tabsObj[id];
    this.#tabsArr.splice(index, 1);

    tab.window = null;
    tab.realm = this.realm;

    this.#tabsNum--;
  }

  *[Symbol.iterator](){
    yield* this.#tabsArr;
  }

  toStr(){
    const arr = ['Window ', String(this.id), this.inc];

    for(const tab of this)
      arr.push('\n', tab || '(null)');

    arr.push(this.dec);
    return arr;
  }
}

module.exports = Window;