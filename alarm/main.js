'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const O = require('../omikron');

const main = () => {
  const f = () => {
    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes();

    if(h === 7 && m === 0){
      while(1)
        cp.execSync(`ffplay -loglevel quiet -nodisp -autoexit -fast alarm.mp3`);
    }

    setTimeout(f, 1e3);
  };

  f();
};

main();