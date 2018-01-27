'use strict';

var consoleOriginal = global.console;

var toPrim = () => '1';

var nopf = function(){};

var nop = new Proxy(nopf, {
  getPrototypeOf(){ return null; },
  setPrototypeOf(){ return nop; },
  isExtensible(){ return false; },
  preventExtensions(){ return nop; },
  getOwnPropertyDescriptor(){ return {writable: false} },
  defineProperty(){ return nop; },
  has(){ return nop; },

  get(t, prop){
    if(prop === Symbol.toPrimitive) return toPrim;
    if(prop === 'prototype') return null;

    return nop;
  },

  set(){ return nop; },
  deleteProperty(){ return nop; },

  ownKeys(){
    return [
      'prototype'
    ];
  },

  apply(){ return nop; },
  construct(){ return nop; }
});

Object.defineProperty(global, 'console', {get: nop, set: nop});

var _a4fw = console.abc('1111').someProperty.someMethod()()()()``(null) + console;