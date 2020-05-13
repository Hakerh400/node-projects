'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const a = O.sanl(O.rfs('1.txt', 1));
const b = O.sanl(O.rfs('2.txt', 1));
const c = a.filter(x => !b.includes(x));

const nn = a => {
  if(a >= '0' && a <= '9') return 0;
  if(a >= 'a' && a <= 'z') return 1;
  if(a >= 'A' && a <= 'Z') return 2;
  if(a === '-') return 3;
  if(a === '_') return 4;

  assert.fail(O.sf(a));
};

c.sort((s1, s2) => {
  assert(s1.length === 11);
  assert(s2.length === 11);

  for(let i = 0; i !== 11; i++){
    const a = s1[i];
    const b = s2[i];
    if(a === b) continue;

    const n1 = nn(a);
    const n2 = nn(b);

    return n1 - n2 || O.cc(a) - O.cc(b);
  }

  assert.fail([s1, s2]);
});

O.wfs('3.txt', c.join('\n'));