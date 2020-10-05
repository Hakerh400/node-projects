'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const O = require('../omikron');
const format = require('../format');

const file = format.path('C:/Projects/Alarm/alarm.mp3');

const main = () => {
  return playAlarm();

  const f = () => {
    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes();

    if(h === 7 && m === 0){
      playAlarm();
      return;
    }

    setTimeout(f, 1e3);
  };

  f();
};

const playAlarm = () => {
  try{
    while(1)
      cp.execSync(`"C:/Program Files/FFmpeg/bin/latest/ffplay.exe" -loglevel quiet -nodisp -autoexit -fast "${file}"`);
  }catch{}
};

main();