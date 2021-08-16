'use strict';

const n = 3;
const size = n ** 2;

const tiles = new Set();

const grid = O.ca(size, y => O.ca(size, x => {
  const d = {x, y, val: bv(4)};
  tiles.add(d);
  return d;
}));

const get = (x, y) => {
  return grid[y][x].val;
};

for(const d of tiles){
  const {val} = d;

  assert(bvuge(val, bv(4, 1)));
  assert(bvule(val, bv(4, size)));
}

for(let y = 0; y !== size; y++){
  const vals = [];

  for(let x = 0; x !== size; x++)
    vals.push(get(x, y));

  assert(neq(vals));
}

for(let x = 0; x !== size; x++){
  const vals = [];

  for(let y = 0; y !== size; y++)
    vals.push(get(x, y));

  assert(neq(vals));
}

for(let y1 = 0; y1 !== size; y1 += n){
  for(let x1 = 0; x1 !== size; x1 += n){
    const vals = [];

    for(let y = 0; y !== n; y++)
      for(let x = 0; x !== n; x++)
        vals.push(get(x1 + x, y1 + y));

    assert(neq(vals));
  }
}

const result = O.obj();

for(const d of tiles)
  result[d.y * size + d.x] = d.val;

return result;