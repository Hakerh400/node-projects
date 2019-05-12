'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class Table{
  constructor(columns){
    this.w = columns.length;
    this.h = 0;

    this.columns = Table.toArr(columns);
    this.rows = [];
  }

  static toArr(arr){
    return arr.map(elem => String(elem));
  }

  addRow(row){
    row = Table.toArr(row);

    let dif = this.w - row.length;
    if(dif < 0) throw new RangeError('Too large row');
    while(dif-- !== 0) row.push('');

    this.rows.push(row);
    this.h++;
  }

  toString(){
    const {w, h, columns, rows} = this;

    const w1 = w - 1;
    const h1 = h - 1;

    const lens = columns.map(s => s.length);
    rows.forEach(row => {
      row.forEach((s, i) => lens[i] = Math.max(lens[i], s.length));
    });
    lens.forEach((len, i) => lens[i] = len + 2);

    const fit = (len, str=null, ch=' ') => {
      if(str === null) return ch.repeat(len);
      const strLen = str.length;
      const start = len - strLen >> 1;
      return (ch.repeat(start) + str).padEnd(len, ch);
    };

    const apply = (s, type, c1, c2, f=flag) => {
      const arr = Array.isArray(c1) ? c1 : null;
      if(arr !== null) c1 = ' ';

      str += s;

      lens.forEach((len, i) => {
        str += fit(
          len - (type && f && i === w1 ? 1 : 0),
          arr !== null ? arr[i] : null,
          c1
        ) + c2;
      });
    };

    const applyArr = arr => {
      const len = arr.length;
      let i = 0;

      while(i !== len){
        const n = len - i === 5 ? 5 : 4;
        const a = arr.slice(i, i += n);
        apply.apply(null, a);
      }
    };

    const setFlag = f => {
      flag = f;
      c1 = getCh('+');
      c2 = getCh('-');
    };

    const getCh = (ch, f=flag) => {
      return f ? ch : '|';
    };

    let str = '';

    let flag;
    let c1, c2;

    setFlag(1);

    const empty = h === 0;
    const c = getCh('+', empty);

    applyArr([
      '+', 1, '-', '-',
      '+\n|', 0, ' ', '|',
      '\n|', 0, columns, '|',
      '\n|', 0, ' ', '|',
      '\n' + c, 1, '=', '=', 1,
    ]);

    str += c;

    rows.forEach((row, ri) => {
      setFlag(ri === h1);

      applyArr([
        '\n|', 0, ' ', '|',
        '\n|', 0, row, '|',
        '\n|', 0, ' ', '|',
        '\n' + c1, 1, '-', c2,
      ]);

      if(flag) str += c1;
    });

    return str;
  }
}

module.exports = Table;