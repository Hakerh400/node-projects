'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const format = require('../format');

const file = format.path('-dw/1.txt');

const main = () => {
  const str = O.rfs(file, 1).replace(/[^01]+/g,'');

  log(str);
  log();

  log(O.match(str, /(?:1[01])*0/g).map(a => a.split('').filter((a, b)=>b&1).join('')).reduce((a, b) => {
    const c = O.last(a);
    c.push(b);
    if(c.length === 2) a.push([]);
    return a;
  }, [[]]).filter((a, b, c)=>b < c.length - 2).filter((a,b,c)=>c.findIndex(d=>d[0]===a[0])===b).sort((f=>([a],[b])=>f(a.length,b.length)||f(a,b))((a,b)=>(a>b)-(a<b))).map(a => a.join(' ---> ')).join('\n'));
};

main();