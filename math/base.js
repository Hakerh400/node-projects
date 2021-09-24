'use strict';

const assert = require('./assert');
const O = require('../omikron');
const util = require('./util');
const su = require('./str-util');

class Base{
  static *deser(ser){ O.virtual('deser', 1); }

  *ser(ser){ O.virtual('ser'); }
}

const serMixed = function*(ser, val){
  if(typeof val === 'number'){
    ser.write(0, 3);
    ser.writeInt(val);
    return;
  }

  if(typeof val === 'string'){
    ser.write(1, 3);
    ser.writeStr(val);
    return;
  }

  if(O.isArr(val)){
    ser.write(2, 3);
    ser.writeInt(val.length);

    for(const elem of val)
      yield [serMixed, ser, elem];

    return;
  }

  assert(typeof val === 'object');
  ser.write(3, 3);

  if(val === null){
    ser.write(0);
    return;
  }

  ser.write(1);

  if(O.proto(val) === null){
    ser.write(0);

    const keys = O.keys(val);

    ser.writeInt(keys.length);

    for(const key of keys){
      // assert(typeof key === 'string');
      ser.writeStr(key);
      yield [serMixed, ser, val[key]];
    }

    return;
  }

  ser.write(1);

  // assert(val instanceof Base);
  return O.tco([val, 'ser'], ser);
};

const deserMixed = function*(ser, ctor){
  const type = Number(ser.read(3));

  if(type === 0)
    return Number(ser.readInt());

  if(type === 1)
    return ser.readStr();

  if(type === 2){
    const len = Number(ser.readInt());
    const arr = [];

    for(let i = 0; i !== len; i++)
      arr.push(yield [deserMixed, ser, ctor]);

    return arr;
  }

  if(!ser.read())
    return  null;

  if(!ser.read()){
    const size = Number(ser.readInt());
    const obj = O.obj();

    for(let i = 0; i !== size; i++){
      const key = ser.readStr();
      obj[key] = yield [deserMixed, ser, ctor];
    }

    return obj;
  }

  return O.tco([ctor, 'deser'], ser);
};

module.exports = Object.assign(Base, {
  serMixed,
  deserMixed,
});