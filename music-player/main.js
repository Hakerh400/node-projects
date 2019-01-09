'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const O = require('../omikron');
const readline = require('../readline');
const fsRec = require('../fs-rec');
const setPriority = require('../set-priority');

const SHUFFLE = 1;
const SORT = !SHUFFLE;

const mainDir = 'D:/Music';

var index = 0;
var playing = 1;
var proc = null;
var file = null;

var timeStart = 0;
var timeTotal = 0;

var wasPaused = 0;
var wasRestarted = 0;
var shouldExit = 0;

var rl = readline.rl();

setTimeout(() => main().catch(log));

async function main(){
  aels();

  var dirs = O.sanl(fs.readFileSync(path.join(mainDir, 'playlist.txt'), 'utf8'));
  var files = [];

  dirs.forEach(dir => {
    fsRec.processFilesSync(dir, d => {
      if(d.processed) return;
      if(d.isDir) return;

      files.push(d.fullPath);
    });
  });

  if(SORT) O.sortAsc(files);
  if(SHUFFLE) O.shuffle(files);

  while(index < files.length && !shouldExit){
    if(index < 0) index = 0;

    file = files[index];

    await play();
    await O.while(() => !(playing || shouldExit));
  }

  rl.close();
}

function aels(){
  O.proc.on('sigint', exit);

  rl.on('line', data => {
    var str = data.toString('utf8');

    if(str === ''){
      playOrPause();
      return;
    }

    for(var i = 0; i !== str.length; i++){
      var c = str[i];

      switch(c){
        case 'p': prev(); break;
        case 'n': next(); break;
        case 'r': restart(); break;
        case ' ': playOrPause(); break;
      }
    }
  });
}

function play(){
  return new Promise(res => {
    timeStart = Date.now();
    if(wasPaused) timeStart -= timeTotal;

    proc = cp.spawn('C:/Program Files/FFmpeg/bin/original/ffplay.exe', [
      '-hide_banner',
      '-loglevel', 'quiet',
      '-nodisp',
      '-autoexit',
      '-fast',
      ... wasPaused ? [
        '-ss', `${timeTotal / 1e3}`,
      ] : [],
      '-i', file,
    ]);

    setPriority(proc.pid);

    proc.stdout.on('data', O.nop);
    proc.stderr.on('data', O.nop);

    proc.on('exit', () => {
      if(playing){
        index++;
      }else{
        wasPaused = 1;
        timeTotal = Date.now() - timeStart;
      }

      proc = null;
      res();
    });

    if(!wasRestarted){
      var {name} = path.parse(file);
      log(name);
    }

    wasPaused = 0;
    wasRestarted = 0;
  });
}

function playOrPause(){
  playing ^= 1;
  kill();
}

function prev(){
  nav(-1);
}

function next(){
  nav(1);
}

function restart(){
  wasRestarted = 1;
  nav(0);
}

function nav(di){
  if(wasPaused) index++;
  wasPaused = 0;
  playing = 1;
  index += di - 1;
  kill();
}

function kill(){
  if(proc === null) return;
  proc.kill();
}

function exit(){
  shouldExit = 1;
  rl.close();
}