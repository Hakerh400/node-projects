'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../../omikron');
const rmi = require('../..');

class Realm{
  #windows = O.obj();

  constructor(name){
    this.name = name;
  }

  hasWindow(id){
    return O.has(this.#windows, id);
  }

  getWindow(id){
    assert(this.hasWindow(id));
    return this.#windows[id];
  }

  addWindow(win){
    assert(win.realm === null);

    const {id} = win;
    assert(!this.hasWindow(id));

    this.#windows[id] = win;
    win.realm = this;
  }

  removeWindow(id){
    assert(this.hasWindow(id));
    const win = this.#windows[id];
    delete this.#windows[id];
    win.realm = null;
  }

  *[Symbol.iterator](){
    yield* O.keys(this.#windows);
  }
}

module.exports = Realm;