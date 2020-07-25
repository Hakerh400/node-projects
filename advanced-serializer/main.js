'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const arrOrder = require('../arr-order');
const cs = require('.');

const {
  Serializable,
  Tuple,
  Literal,
  Wrapper,
} = cs;

O.bion(1);

const main = () => {
  for(let i = 0; i !== 20; i++){
    const bits = arrOrder.str('01', i, 1);
    const nStr = Pair.deserialize(bits, 3, [new Wrapper(2)]).toString();
    const n = BigInt(`0b1${O.rev(nStr)}`) - 1n;

    log(`${bits} ---> ${n}`);
  }
};

class Pair extends Serializable{
  constructor(base, fst, snd){
    super();

    this.base = base;
    this.fst = fst;
    this.snd = snd;
  }

  ser(ser){
    ser.bit(1);
    return [this.fst, this.snd];
  }

  static deser(deser, args){
    const base = args[0];

    if(args.length === 1)
      return new Digit(base.val, deser.intMax(base.val));

    if(!deser.bit())
      return new Eof();

    return new Tuple(Pair, 3, [base]);
  }

  toStr(){
    return [this.fst, this.snd];
  }
}

class Digit extends Literal{
  constructor(base, val){
    super();

    this.base = base;
    this.val = val;
  }

  ser(ser){
    ser.intMax(this.base, this.val);
  }

  toStr(){
    return String(this.val);
  }
}

class Eof extends Literal{
  ser(ser){}

  toStr(){
    return '';
  }
}

main();