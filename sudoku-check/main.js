'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const n = 3;
const nn = n ** 2;

const table = O.ftext(`
  472583691
  583691472
  691472583
  725836914
  836914725
  914725836
  258369147
  369147258
  147258369
`);

const main = () => {
  log(check(table) ? 1 : 0);
};

const check = str => {
  const lines = O.sanl(str);
  if(lines.length !== nn) return;

  for(let y = 0; y !== nn; y++){
    const line = [...lines[y]];
    if(line.length !== nn) return 0;

    for(let x = 0; x !== nn; x++){
      const c = line[x];

      if(c < '1') return 0;
      if(c > String(nn)) return 0;

      line[x] = c | 0;
    }

    lines[y] = line;
  }

  const get = (x, y) => {
    return lines[y][x];
  };

  for(let i = 0; i !== nn; i++){
    const set1 = new Set();
    const set2 = new Set();

    for(let j = 0; j !== nn; j++){
      set1.add(get(i, j));
      set2.add(get(j, i));
    }

    if(set1.size !== nn) return 0;
    if(set2.size !== nn) return 0;
  }

  for(let i1 = 0; i1 !== nn; i1 += n){
    for(let j1 = 0; j1 !== nn; j1 += n){
      const set = new Set();

      for(let i = 0; i !== n; i++)
        for(let j = 0; j !== n; j++)
          set.add(get(i1 + i, j1 + j));

      if(set.size !== nn) return 0;
    }
  }

  return 1;
};

main();