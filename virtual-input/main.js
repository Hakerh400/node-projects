'use strict';

var O = require('../framework');
var vi = require('.');

const w = 1920;
const h = 1080;

const [wh, hh] = [w, h].map(a => a >> 1);

setTimeout(main);

async function main(){
  await O.sleep(10e3);

  var num = 1e3;
  var radius = 250;

  O.repeat(num, i => {
    var k = i / (num - 1);
    var r = radius * Math.abs(k * 14 % 2 - 1);
    var angle = k * O.pi2 - O.pih;

    var x = wh + Math.cos(angle) * r | 0;
    var y = hh + Math.sin(angle) * r | 0;

    vi.drag(x, y);
  });
}