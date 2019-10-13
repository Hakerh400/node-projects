'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const {min, max, abs} = Math;

const main = () => {
  const times = [1, 2, 5, 10];
  const m = 2;

  const [path, cost] = findMinTime(times, m);

  log(`\nTime: ${cost}`);
  log(`\nPath:\n`);

  for(const [a, b] of path)
    log(`${a.join(' ')}${b !== null ? ` (${b})` : ''}`);
};

const findMinTime = (array, mMain) => {
  const elems = O.undupe(array);
  const numsMain = elems.map(a => array.filter(b => b === a).length);
  const sumMain = array.length;
  const elemsNum = elems.length;

  const f = (path, sum, m) => {
    const nums = path[path.length - 2];
    const sum1 = sum - m;
    const end = sum1 === 0;

    const rec = (es, sum, remaining, index) => {
      let pathBest = null;
      let costBest = null;

      if(remaining === 0){
        const pathNew = path.slice();
        const numsNew = nums.slice();

        let first = !end;
        let cost = 0;
        let costRet = 0;
        let ret = null;

        for(let i = 0; i !== elemsNum; i++){
          const n = es[i] | 0;
          const elemCost = elems[i];

          if(n !== 0){
            numsNew[i] -= n;
            if(cost < elemCost) cost = elemCost;
          }

          if(first && numsNew[i] !== numsMain[i]){
            first = 0;
            numsNew[i]++;
            costRet = elemCost;
            ret = i;
          }
        }
        
        pathNew.push(numsNew, ret);

        const costTotal = cost + costRet;
        if(end) return [pathNew, costTotal];

        const sum2 = sum1 + !end;
        const mMax = min(sum2, mMain);

        for(let m1 = 2; m1 <= mMax; m1++){
          const [path1, cost1] = f(pathNew, sum2, m1);

          if(pathBest === null || cost1 < costBest){
            pathBest = path1;
            costBest = cost1;
          }
        }

        return [pathBest, costTotal + costBest];
      }

      const available = nums[index];
      const vmin = max(remaining + available - sum, 0);
      const vmax = min(remaining, available);

      for(let n = vmax; n >= vmin; n--){
        const elemsNew = es.slice();
        elemsNew[index] = n;

        const [pathNew, costNew] = rec(elemsNew, sum - available, remaining - n, index + 1);

        if(pathBest === null || costNew < costBest){
          pathBest = pathNew;
          costBest = costNew;
        }
      }

      return [pathBest, costBest];
    };

    return rec([], sum, m, 0);
  };

  let path = null;
  let cost = null;

  const mMax = min(sumMain, mMain);

  for(let m1 = 2; m1 <= mMax; m1++){
    const [path1, cost1] = f([numsMain.slice(), null], sumMain, m1);

    if(path === null || cost1 < cost){
      path = path1;
      cost = cost1;
    }
  }

  const transitions = [];
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

    transitions.push([ts, ret !== null ? elems[ret] : null]);
  }

  return [transitions, cost];
};

main();