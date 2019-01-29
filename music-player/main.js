'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const O = require('../omikron');
const readline = require('../readline');
const fsRec = require('../fs-rec');
const setPriority = require('../set-priority');

const TEST_MODE = 1;
const SUB_FOLDERS = 0;
const SHUFFLE = 1;
const SORT = !SHUFFLE;

const mainDir = 'D:/Music';

const rl = readline.rl();

let index = 0;
let playing = 1;
let proc = null;
let file = null;

let timeStart = 0;
let timeTotal = 0;

let wasPaused = 0;
let wasRestarted = 0;
let shouldExit = 0;
let waiting = 0;

setTimeout(() => main().catch(log));

async function main(){
  O.enhanceRNG();

  const dirs = O.sanl(fs.readFileSync(path.join(mainDir, 'playlist.txt'), 'utf8'));
  const files = [];

  dirs.forEach(dir => {
    if(SUB_FOLDERS){
      fsRec.processFilesSync(dir, d => {
        if(d.processed) return;
        if(d.isDir) return;

        if(!files.includes(d.fullPath))
          files.push(d.fullPath);
      });
    }else{
      for(const file of fs.readdirSync(dir)){
        const fp = path.join(dir, file);
        if(!fs.statSync(fp).isFile()) continue;

        if(!files.includes(fp))
          files.push(fp);
      }
    }
  });

  if(SORT) O.sortAsc(files);
  if(SHUFFLE) O.shuffle(files);

  aels();

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
        case ' ': playOrPause(); break;
        case 'r': restart(); break;
        case 'q': exit(); break;

        case 'p': TEST_MODE ? moveTo('Priority') : prev(); break;
        case 'n': TEST_MODE ? moveTo('Nightcore') : next(); break;
        case 't': TEST_MODE && moveTo('Trance'); break;
        case 'i': TEST_MODE && moveTo('Improvable'); break;
        case 'o': TEST_MODE && moveTo('Other'); break;
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
      waiting = TEST_MODE && !(wasPaused || wasRestarted || shouldExit);

      O.while(() => waiting).then(() => {
        waiting = 0;
        res();
      });
    });

    if(!wasRestarted){
      var {name} = path.parse(file);
      log(name);
    }

    wasPaused = 0;
    wasRestarted = 0;
  });
}

function moveTo(dir){
  const fOld = file;
  const pd = path.parse(fOld);
  const fNew = path.join(pd.dir, dir, pd.base);

  if(proc === null) setTimeout(move);
  else proc.on('exit', move);

  next();

  function move(){
    rename(fOld, fNew);
    waiting = 0;
  }
}

function rename(fOld, fNew){
  fsRec.createDirSync(path.join(fNew, '..'));
  fs.renameSync(fOld, fNew);
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
  waiting = 0;
  rl.close();
  kill();
}