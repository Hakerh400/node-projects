'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const O = require('../framework');
const fsRec = require('../fs-recursive');

const PROC_PRIORITY = 'realtime';

const mainDir = 'D:/Music';

var index = 0;
var playing = 1;
var proc = null;
var file = null;

var timeStart = 0;
var timeTotal = 0;

var wasPaused = 0;
var shouldExit = 0;

setTimeout(main);

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

  O.shuffle(files);

  while(index !== files.length && !shouldExit){
    if(index < 0) index = 0;

    file = files[index];

    await play();
    await O.while(() => !playing);
  }
}

function aels(){
  O.proc.on('sigint', exit);

  O.proc.stdin.on('data', async data => {
    var str = data.toString('utf8');

    for(var i = 0; i !== str.length; i++){
      var c = str[i];

      switch(c){
        case 'p': prev(); break;
        case 'n': next(); break;
        case 'r': restart(); break;
        case ' ': playOrPause(); break;

        default:
          if('123z'.includes(c)){
            playOrPause();
            await O.while(() => proc !== null);

            var {base} = path.parse(file);
            fs.renameSync(file, path.join(mainDir, c, base));

            playOrPause();
          }
          break;
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

    if(wasPaused){
      wasPaused = 0;
    }else{
      var {name} = path.parse(file);
      log(name);
    }

    setTimeout(setPriority);

    function setPriority(){
      var result = cp.spawnSync('wmic', [
        'process',
        'where',
        'name="ffplay.exe"',
        'CALL',
        'setpriority',
        PROC_PRIORITY,
      ]).stdout.toString('utf8');

      if(result.includes('No Instance(s) Available.'))
        setTimeout(setPriority);
    }
  });
}

function prev(){
  index -= 2;
  kill();
}

function next(){
  kill();
}

function restart(){
  index--;
  kill();
}

function playOrPause(){
  playing ^= 1;
  kill();
}

function kill(){
  if(proc === null) return;
  proc.kill();
}

function exit(){
  shouldExit = 1;
}