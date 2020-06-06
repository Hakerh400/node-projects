'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const O = require('../omikron');
const format = require('../format');

const file = format.path('-dw/alarm.mp3');

const main = () => {
  const f = () => {
    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes();

    if(h === 12 && m === 0){
      while(1)
        cp.execSync(`ffplay -loglevel quiet -nodisp -autoexit -fast "${file}"`);
    }

    setTimeout(f, 1e3);
  };

  f();
};

main();