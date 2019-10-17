'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const {min, max, abs} = Math;

const X = 711n;
const N = X * 10n ** 6n;

const main = () => {
  const factors = factorize(N);
  findNums(factors);
};

const factorize = num => {
  const factors = [];
  let i = 2n;

  while(num !== 1n){
    while(num % i === 0n){
      factors.push(i);
      num /= i;
    }
    while(!isPrime(++i));
  }

  return factors;
};

const isPrime = num => {
  for(let i = 2n; i !== num; i++)
    if(num % i === 0n) return 0;
  return 1;
};

const findNums = array => {
  const mMain = array.length;
  const elems = O.undupe(array);
  const numsMain = elems.map(a => array.filter(b => b === a).length);
  const sumMain = array.length;
  const elemsNum = elems.length;

  const rec1 = (path, sum, m) => {
    const nums = path[path.length - 2];
    const sum1 = sum - m;
    const end = sum1 === 0;

    const rec2 = (es, sum, remaining, index) => {
      let pathBest = null;
      let costBest = null;

      if(remaining === 0){
        const pathNew = path.slice();
        const numsNew = nums.slice();

        let cost = 0n;
        let costRet = 0n;

        for(let i = 0; i !== elemsNum; i++){
          const n = es[i] | 0;
          const elemCost = elems[i];

          if(n !== 0){
            numsNew[i] -= n;
            if(cost < elemCost) cost = elemCost;
          }
        }
        
        pathNew.push(numsNew);

        if(pathNew.length === 9){
          const a = getArr(pathNew).map(a => a[0].reduce((a, b) => a * b, 1n));
          const n = X - (a[0] + a[1] + a[2]);
          const b = a[0] * a[1] * a[2] * n;
          if(b === N) O.exit([...a, n].join(' '));
          return [[], null];
        }

        pathNew.push(null);

        const costTotal = cost + costRet;
        if(end) return [pathNew, costTotal];

        const sum2 = sum1 + !end;
        const mMax = min(sum2, mMain);

        for(let m1 = min(mMax, 1); m1 <= mMax; m1++){
          const [path1, cost1] = rec1(pathNew, sum2, m1);

          if(pathBest === null || cost1 < costBest){
            pathBest = path1;
            costBest = cost1;
          }
        }

        return [pathBest, null];
      }

      const available = nums[index];
      const vmin = max(remaining + available - sum, 0);
      const vmax = min(remaining, available);

      for(let n = vmax; n >= vmin; n--){
        const elemsNew = es.slice();
        elemsNew[index] = n;

        const [pathNew, costNew] = rec2(elemsNew, sum - available, remaining - n, index + 1);

        if(pathBest === null || costNew < costBest){
          pathBest = pathNew;
          costBest = costNew;
        }
      }

      return [pathBest, costBest];
    };

    return rec2([], sum, m, 0);
  };

  const getArr = path => {
    const arr = [];
    const nums = numsMain.slice();

    let prev = numsMain;

    for(let i = 2; i < path.length - 1; i += 2){
      const ts = [];
      const nums = path[i].slice();
      const ret = path[i + 1];

      for(let j = 0; j !== elemsNum; j++)
        nums[j] = prev[j] - nums[j];

      if(ret !== null) nums[ret]++;

      prev = path[i];

      for(let j = 0; j !== elemsNum; j++)
        for(let k = 0; k !== nums[j]; k++)
          ts.push(elems[j]);

      arr.push([ts, ret !== null ? elems[ret] : null]);
    }

    return arr;
  };

  let path = null;
  let cost = null;

  const mMax = min(sumMain, mMain);

  for(let m1 = min(mMax, 1); m1 <= mMax; m1++){
    const [path1, cost1] = rec1([numsMain.slice(), null], sumMain, m1);

    if(path === null || cost1 < cost){
      path = path1;
      cost = cost1;
    }
  }
};

main();