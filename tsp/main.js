'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const main = () => {
  // Solution:
  //   Path: (4,6,9,10,11,13,15,18,20,19,17,16,14,8,7,5,1,2,3,12)
  //   Cost: 205.126333

  const cs = [
    [62.0, 58.4], // 1
    [57.5, 56.0], // 2
    [51.7, 56.0], // 3
    [67.9, 19.6], // 4
    [57.7, 42.1], // 5
    [54.2, 29.1], // 6
    [46.0, 45.1], // 7
    [34.7, 45.1], // 8
    [45.7, 25.1], // 9
    [34.7, 26.4], // 10
    [28.4, 31.7], // 11
    [33.4, 60.5], // 12
    [22.9, 32.7], // 13
    [21.5, 45.8], // 14
    [15.3, 37.8], // 15
    [15.1, 49.6], // 16
    [ 9.1, 52.8], // 17
    [ 9.1, 40.3], // 18
    [ 2.7, 56.8], // 19
    [ 2.7, 33.1], // 20
  ];

  const D = 3;
  if(D !== 0) [cs[0], cs[D]] = [cs[D], cs[0]];

  const n = cs.length;
  const d = O.ca(n, i => O.ca(n, j => O.dist(...cs[i], ...cs[j])));
  const C = O.obj();
  const c = new Uint8Array(n);
  const d0 = d[0];

  for(let k = 1; k !== n; k++){
    const obj = C[1 << k] = O.obj();
    obj[k] = d0[k];
  }

  loop: for(let s = 2; s !== n; s++){
    for(let i = 0; i !== s; i++)
      c[i] = s - i;

    while(1){
      let S = 0;
      for(let i = 0; i !== s; i++)
        S |= 1 << c[i];

      const obj = C[S] = O.obj();

      for(let i = 0; i !== s; i++){
        const k = c[i];
        const obj1 = C[S & ~(1 << k)];
        let min = -1;

        for(const m of c){
          if(m === k) continue;
          const a = obj1[m] + d[k][m];
          if(min === -1 || a < min) min = a;
        }

        obj[k] = min;
      }

      let i = 0;
      if(c[i]++ < n - 1) continue;
      for(; c[i] >= n - i - 1;) if(++i >= s) continue loop;
      for(c[i]++; i !== 0; i--) c[i - 1] = c[i] + 1;
    }
  }

  const path = [];
  let S = (1 << n) - 2;
  let min = -1;

  while(S !== 0){
    let mm = -1;
    let m = -1;

    for(let k = 1; k !== n; k++){
      if((S & (1 << k)) === 0) continue;

      const a = C[S][k];
      if(mm === -1 || a < mm){
        mm = a;
        m = k;
      }
    }

    path.unshift(m === D ? 1 : m + 1);
    S &= ~(1 << m);

    if(min === -1) min = mm;
  }

  path.unshift(D + 1);

  log(`Path: (${path.join(',')})`);
  log(`Cost: ${min}`);
};

main();