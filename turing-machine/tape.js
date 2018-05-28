'use strict';

var O = require('../framework');

class Tape{
  constructor(buff){
    this.d1 = new Int32Array(1);
    this.d2 = new Int32Array(1);

    Buffer.from(buff).forEach((byte, index) => {
      index <<= 4;

      O.repeat(8, () => {
        this.set(index++, 1);
        this.set(index++, byte & 1);
        byte >>= 1;
      });
    });
  }

  get(index){
    var b = this.getD(index);
    var d = b === 0 ? this.d1 : this.d2;

    if(index < 0) index = ~index;
    var dIndex = index >> 5;

    if(dIndex >= d.length) return 0;
    return (d[dIndex] >> (index & 31)) & 1;
  }

  set(index, value){
    var b = this.getD(index);
    var d = b === 0 ? this.d1 : this.d2;
    var e = false;

    if(index < 0) index = ~index;
    var dIndex = index >> 5;

    while(dIndex >= d.length){
      d = extend(d);
      e = true;
    }

    if(value === 0) d[dIndex] &= ~(1 << (index & 31));
    else d[dIndex] |= 1 << (index & 31);

    if(e){
      if(b === 0) this.d1 = d;
      else this.d2 = d;
    }
  }

  xor(index){
    var b = this.getD(index);
    var d = b === 0 ? this.d1 : this.d2;
    var e = false;

    if(index < 0) index = ~index;
    var dIndex = index >> 5;

    while(dIndex >= d.length){
      d = extend(d);
      e = true;
    }

    d[dIndex] ^= 1 << (index & 31);

    if(e){
      if(b === 0) this.d1 = d;
      else this.d2 = d;
    }
  }

  toBuffer(allowIncompleteBytes=false){
    var arr = [];
    var index = 0;
    var bit = 0;
    var last = false;

    while(1){
      bit = this.get(index++);
      if(bit === 0) break;

      var num = 0;

      O.repeat(8, i => {
        if(!last)
          last = (i === 0 ? bit : this.get(index++)) === 0;

        if(!last)
          num |= this.get(index++) << i;

        if(!allowIncompleteBytes && last)
          throw new TypeError('Incomplete byte found');
      });

      arr.push(num);

      if(last)
        break;
    }

    return Buffer.from(arr);
  }

  getD(index){
    if(index !== index)
      throw new RangeError(`Value "${index}" is too small/large`);

    return index < 0 ? 0 : 1;
  }
};

module.exports = Tape;

function extend(arr){
  var len = arr.length;
  var arrNew = new Int32Array(len << 1);

  for(var i = 0; i < len; i++)
    arrNew[i] = arr[i];

  return arrNew;
}