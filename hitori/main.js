'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const debug = require('../debug');

const size = 4;

const main = () => {
  const size1 = size - 1;
  const tilesNum = size ** 2;
  const allNums = O.ca(size, i => i + 1);

  const grid = O.ca(tilesNum, () => null);
  const comb = O.ca(tilesNum, () => 0);
  const visited = O.ca(tilesNum, () => 0)

  const has = (x, y) => x >= 0 && y >= 0 && x < size && y < size;
  const get = (x, y) => grid[y * size + x];
  const set = (x, y, a) => grid[y * size + x] = a;
  const cget = (x, y) => comb[y * size + x];
  const vget = (x, y) => visited[y * size + x];
  const vset = (x, y) => visited[y * size + x] = 1;

  const adj = (x, y, f) => {
    for(let x1 = x - 1; x1 <= x + 1; x1 += 2)
      if(has(x1, y)) f(x1, y);

    for(let y1 = y - 1; y1 <= y + 1; y1 += 2)
      if(has(x, y1)) f(x, y1);
  };

  const mat2str = mat => {
    const pad = String(size).length;
    
    return O.ca(size, y => {
      return O.ca(size, x => {
        return String(mat[y * size + x]).padEnd(pad);
      }).join(' ').trim();
    }).join('\n');
  };

  const grid2str = () => mat2str(grid);
  const comb2str = () => mat2str(comb);

  const inc = () => {
    for(let i = 0; i !== tilesNum; i++)
      if(comb[i] ^= 1) return 0;

    return 1;
  };

  const hasUniqueSolution = () => {
    comb.fill(0);

    let found = 0;

    while(1){
      test: {
        let whiteNum = 0;
        let whiteX = null;
        let whiteY = null;

        for(let y = 0; y !== size; y++){
          for(let x = 0; x !== size; x++){
            // White
            if(cget(x, y)){
              if(!whiteNum++){
                whiteX = x;
                whiteY = y;
              }

              const num = get(x, y);

              // Contains the same white number in the same row
              for(let x1 = x + 1; x1 !== size; x1++)
                if(get(x1, y) === num && cget(x1, y)) break test;

              // Contains the same white number in the same comuln
              for(let y1 = y + 1; y1 !== size; y1++)
                if(get(x, y1) === num && cget(x, y1)) break test;

              continue;
            }

            // Black

            // Contains adjacent black tile to the right
            if(x !== size1 && !cget(x + 1, y)) break test;

            // Contains adjacent black tile to the bottom
            if(y !== size1 && !cget(x, y + 1)) break test;
          }
        }

        if(whiteNum){
          const stack = [];
          let connectedNum = 0;

          visited.fill(0);

          const push = (x, y) => {
            connectedNum++;
            stack.push(x, y);
            vset(x, y);
          };
          
          push(whiteX, whiteY);

          while(stack.length !== 0){
            const y = stack.pop();
            const x = stack.pop();

            adj(x, y, (x1, y1) => {
              if(cget(x1, y1) && !vget(x1, y1))
                push(x1, y1);
            });
          }

          // Not all white tiles are connected
          if(connectedNum !== whiteNum) break test;
        }

        if(found) return 0;
        found = 1;
      }

      if(inc()) return found;
    }
  };

  const stack = [];

  generate: while(1){
    if(stack.length !== tilesNum){
      const index = stack.length;
      const nums = O.shuffle(allNums.slice());

      grid[index] = randPick(nums);
      stack.push(nums);

      continue;
    }

    if(hasUniqueSolution())
      break;

    update: while(1){
      if(stack.length === 0){
        log('/');
        return;
      }

      const index = stack.length - 1;
      grid[index] = null;

      const availNums = O.last(stack);

      if(availNums.length === 0){
        stack.pop();
        continue update;
      }

      grid[index] = randPick(availNums);
      break update;
    }
  }

  log(grid2str());
};

const randPick = arr => {
  const index = O.rand(arr.length);
  const elem = arr[index];
  const last = arr.pop();

  if(index !== arr.length)
    arr[index] = last;

  return elem;
};

main();