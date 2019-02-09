'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

setTimeout(main);

function main(){
  const B = Object;
  const dp = B.defineProperty;
  const gd = B.getOwnPropertyDescriptor;
  const gds = B.getOwnPropertyDescriptors;
  const hp = (t, p) => B.prototype.hasOwnProperty.call(t, p);

  const data = {
    objProxy: new WeakMap,
    proxyObj: new WeakMap,
    objPaths: new WeakMap,
    userObjs: new WeakSet,
  };

  const descType = desc => {
    return hp(desc, 'value') ? 0 : 1;
  };

  const queue = [global];

  while(queue.length !== 0){
    const target = queue.shift();
  }

  function proxify(target){
    b = new Proxy(t, {
      getPrototypeOf(t){
        let r = B.getPrototypeOf(t);
        info(t, 'GET_PROTO', r);
        return P(r, m, t, '[[proto]]');
      },

      setPrototypeOf(t, v){
        info(t, 'SET_PROTO');
        B.setPrototypeOf(t, v);
        return 1;
      },

      isExtensible(t){
        let r = B.isExtensible(t);
        info(t, 'IS_EXTENSIBLE', r);
        return r;
      },

      preventExtensions(t){
        info(t, 'PREVENT_EXTS');
        B.preventExtensions(t);
        return 1;
      },

      getOwnPropertyDescriptor(t, p){
        let r = m ? gd(Object.create(null), '') : gd(t)[p];
        info(t, 'DESC', p, r);
        return r;
      },

      defineProperty(t, p, d){
        info(t, 'DEFINE_PROP', p, d);
        dp(t, p, d);
        return 1;
      },

      has(t, p){
        let r = p in t;
        info(t, 'HAS', p, r);
        return r;
      },

      get(t, p){
        let r = typeof t === 'function' && [
          'length', 'name', 'arguments', 'caller', 'prototype',
        ].includes(p) ? null : t[p];

        info(t, 'GET', p, r);

        const isSym = typeof p === 'symbol';
        let pStr = String(p);
        if(isSym) pStr = pStr.slice(7, pStr.length - 1);

        return P(r, m, t, `${
          isSym || !/^[a-zA-Z\_\$][a-zA-Z0-9\_\$]*$/.test(p) ?
          `[${pStr}]` : `.${pStr}`
        }`);
      },
      
      set(t, p, v){
        info(t, 'SET', p, v);
        t[p] = v;
        return 1;
      },

      deleteProperty(t, p){
        info(t, 'DELETE', p);
        delete t[p];
        return 1;
      },

      ownKeys(t){
        let r = Reflect.ownKeys(t);
        info(t, 'KEYS', r);
        return P(r);
      },

      apply(f, t, args){
        let r = f.apply(P(t, m), args);
        info(f, 'CALL', t, args, r);
        return P(r, m, f, '()');
      },

      construct(f, args, t){
        let r = Reflect.construct(t, args, P(t, m));
        info(f, 'NEW', t, args, r);
        return P(r, m, t, `[[new]]()`);
      },
    });
  }
}