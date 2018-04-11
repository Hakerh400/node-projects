'use strict';

var {Canvas} = require('canvas');

var ctx = new Canvas(1, 1).getContext('2d');
ctx.font = '1px arial';

for(var i = 0; ~i; i = -~i){
  ctx.rotate(i);
  ctx.fillText('1', 0, 0);
}