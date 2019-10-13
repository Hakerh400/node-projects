'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

const {min, max, abs} = Math;

const main = () => {
  const times = [1, 2, 5, 10];
  const [path, cost] = findMinTime(times, 2);

  log(`\nTime: ${cost}`);
  log(`\nPath:\n`);

  for(const [a, b] of path)
    log(`${a.join(' ')}${b !== null ? ` (${b})` : ''}`);
};

const findMinTime = (array, m) => {
  const elems = O.undupe(array);
  const numsMain = elems.map(a => array.filter(b => b === a).length);
  const sumMain = array.length;
  const elemsNum = elems.length;

  const f = (path, sum) => {
    const nums = path[path.length - 2];
    const m1 = min(sum, m);
    const sum1 = sum - m1;
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

        const [path1, cost1] = f(pathNew, sum1 + !end);
        return [path1, costTotal + cost1];
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

    return rec([], sum, m1, 0);
  };

  const [path, cost] = f([numsMain.slice(), null], sumMain);
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