'use strict';

let a = bv(8);
let b = bv(8);

assert(bvule(a, bv(8, 10)));
assert(bvule(b, bv(8, 10)));

assert(or(
  eq(a, bv(8, 0)),
  eq(b, bv(8, 0)),
));

assert(eq(bvadd(a, b), bv(8, 10)));

return {a, b};