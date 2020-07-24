'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const arrOrder = require('../arr-order');
const cs = require('.');

const main = () => {
  for(let i = 0; i !== 100; i++){
    const bits1 = arrOrder.str('01', i);

    const ser = new cs.Serializer();
    deser(bits1).ser(ser);
    const bits2 = ser.getBits();

    log(`${bits1} ---> ${bits2}`);
  }
};

const deser = bits => {
  const deser = new cs.Deserializer();

  return deser.deser(bits, () => {
    const bit = deser.bit();

    if(bit === 0)
      return [null, new Zero()];

    return [Pair, 2];
  })
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
    return [this.fst, this.snd];
  }

  toStr(){
    return ['(', this.fst, ', ', this.snd, ')'];
  }
}

main();