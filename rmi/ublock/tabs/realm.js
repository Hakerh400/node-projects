'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../../omikron');
const rmi = require('../..');

class Realm extends O.Stringifiable{
  #windows = O.obj();

  constructor(name, inco=0){
    super();

    this.name = name;
    this.inco = inco;
  }

  hasWindow(id){
    return O.has(this.#windows, id);
  }

  getWindow(id){
    assert(this.hasWindow(id));
    return this.#windows[id];
  }

  addWindow(win){
    assert(typeof win.id === 'number');
    assert(win.realm === null);

    const {id} = win;
    assert(!this.hasWindow(id));

    this.#windows[id] = win;
    win.realm = this;
  }

  removeWindow(id){
    assert(typeof id === 'number');
    assert(this.hasWindow(id));
    const win = this.#windows[id];
    delete this.#windows[id];
    win.realm = null;
  }

  *[Symbol.iterator](){
    yield* O.vals(this.#windows);
  }

  toStr(){
    const arr = ['Realm ', O.sf(this.name), this.inc];

    for(const win of this)
      arr.push('\n', win);

    arr.push(this.dec);
    return arr;
  }
}

module.exports = Realm;