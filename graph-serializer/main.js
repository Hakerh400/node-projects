'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const {Serializer} = require('../functasy');
const SeedList = require('./seed-list');
const inspect = require('./inspect');

const SEED = Date.now();

setTimeout(main);

function main(){
  var G = {
    id: 5,
    a: 'G', b: {
      id: 77,
      m: 'b',
    }, c: {
      id: 18,
      d: {id: 30},
      e: 'd',
    }
  };

  G.a = G;
  G.b.m = G.b;
  G.c.e = G.c.d;

  var buf = serialize(G, SEED);
  var G1 = deserialize(buf, SEED);

  assert.strictEqual(G1.a, G1);
  assert.strictEqual(G1.b.m, G1.b);
  assert.strictEqual(G1.c.e, G1.c.d);

  log('OK');
}

function serialize(G, seed){
  var ser = new Serializer();
  var elems = new Map();
  var list = new SeedList(seed);

  list.add(G);

  while(list.hasMore()){
    var elem = list.next();
    var has = elems.has(elem);

    if(elems.size !== 0){
      ser.write(has);

      if(has){
        ser.write(elems.get(elem), elems.size - 1);
        continue;
      }
    }

    ser.write(elem.id, 255);

    for(var key of O.keys(elem)){
      if(key === 'id') continue;

      ser.write(1);
      ser.write(O.cc(key), 255);

      list.add(elem[key]);
    }

    ser.write(0);
    elems.set(elem, elems.size);
  }

  return ser.getOutput();
}

function deserialize(buf, seed){
  var ser = new Serializer(buf);
  var elems = new Map();
  var list = new SeedList(seed);

  var G = null;
  list.add([null, null]);

  while(list.hasMore()){
    var [parent, key] = list.next();

    if(elems.size !== 0 && ser.read()){
      var elem = elems.get(ser.read(elems.size - 1));
      parent[key] = elem;
      continue;
    }

    var elem = {
      id: ser.read(255),
    };

    while(ser.read()){
      list.add([elem, O.sfcc(ser.read(255))]);
    }

    if(parent === null) G = elem;
    else parent[key] = elem;

    elems.set(elems.size, elem);
  }

  return G;
}