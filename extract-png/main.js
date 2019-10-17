'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const format = require('../format');

const input = 'C:/Program Files (x86)/Google/Chrome/Application/74.0.3729.108/resources.pak'
const output = format.path('-dw/png');

const main = () => {
  const buf = O.rfs(input);
  const start = Buffer.from('89504E470D0A', 'hex');
  const end = Buffer.from('49454E44AE426082', 'hex');
  const len = buf.length - end.length;

  let i = 0;

  while(i < len){
    if(buf.slice(i, i + start.length).equals(start)){
      let j = i + start.length;
      while(!buf.slice(j, j + end.length).equals(end)) j++;
      O.wfs(path.join(output, `${O.hex(i, 4)}.png`), buf.slice(i, j + end.length));
      i = j + end.length;
    }else{
      i++;
    }
  }
};

main();