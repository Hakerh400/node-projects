'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const arrOrder = require('../arr-order');
const cs = require('.');

const main = () => {
  const z = new Zero();
  const obj = new Pair(z, new Pair(new Pair(z, z), z));
  const ser = new cs.Serializer();
  const bits = ser.ser(obj);

  log(bits);
};

class Zero extends cs.Serializable{
  ser(ser){
    ser.bit(0);
  }

  toStr(){
    return '0';
  }
}

class Pair extends cs.Serializable{
  constructor(fst, snd){
    super();
    this.fst = fst;
    this.snd = snd;
  }

  ser(ser){
    ser.bit(1);
    ser.push(this.fst);
    ser.push(this.snd);
  }

  toStr(){
    return ['(', this.fst, ', ', this.snd, ')'];
  }
}

main();