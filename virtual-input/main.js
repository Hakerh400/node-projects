'use strict';

var O = require('../framework');
var vi = require('.');

setTimeout(main);

async function main(){
  while(1){
    vi.move(vi.cx() + 1, vi.cy() + 1);
    await O.sleep(10);
  }
}