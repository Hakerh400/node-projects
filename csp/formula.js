'use strict';

const w = 5;
const h = 5;
const n = 5;

const tiles = new Set();

const grid = O.ca(h, y => O.ca(w, x => {
  const d = {x, y, val: bool()};
  tiles.add(d);
  return d;
}));

const get = (x, y) => {
  return grid[y][x].val;
};

let num = bv(8, 0);

for(const d of tiles){
  num = ite(d.val, inc(num), num);
  // num = bvadd(num, ite(d.val, bv(8, 1), bv(8, 0)));
}

assert(eq(num, bv(8, n)));

const result = O.obj();

for(const d of tiles)
  result[d.y * w + d.x] = d.val;

return result;