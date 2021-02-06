'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../../omikron');
const rmi = require('../..');

class Tab extends O.Stringifiable{
  #realm = null;
  window = null;
  url = null;

  constructor(id){
    super();

    assert(typeof id === 'number');
    this.id = id;
  }

  get inco(){ return this.window?.inco; }
  get realm(){ return this.#realm; }

  get index(){ assert.fail(); }
  set index(a){ assert.fail(); }

  set realm(realm){
    if(this.#realm === null){
      this.#realm = realm;
      return;
    }

    assert(realm === this.#realm);
  }

  toStr(){
    const arr = ['Tab ', String(this.id), this.inc];

    arr.push('\n', 'url: ', this.url || '(null)');

    arr.push(this.dec);
    return arr;
  }
}

module.exports = Tab;