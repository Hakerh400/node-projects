'use strict';

const DISPLAY_EXIT_CODE = 0;

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const cp = require('child_process');
const O = require('../framework');

const MAIN_SCRIPT = 'main.js';

var currDir = process.cwd();
var rl = readline.createInterface(process.stdin, process.stdout);

var proc = null;
var shouldExit = 0;

setTimeout(main);

async function main(){
  clear();
  aels();
  askForInput();
}

function aels(){
  process.on('SIGINT', O.nop);
  rl.on('SIGINT', O.nop);
}

function askForInput(newLine=1){
  var str = `${newLine ? '\n' : ''}${currDir}>`;
  rl.question(str, onInput);
}

async function processInput(str){
  str = str.trim();
  str = str.replace(/\s+/g, ' ');

  var files = getFiles();

  if(str.length === 0 || str.startsWith('-')){
    if(files.includes(MAIN_SCRIPT)){
      await clear();

      var args = [];

      if(str.length !== 0 && str !== '-'){
        str = str.substring(1).trim();
        args = str.split(/\s+/);
      }

      proc = cp.spawn('node', [
        MAIN_SCRIPT,
        ...args,
      ], {
        cwd: currDir,
        stdio: 'inherit',
      });

      proc.on('exit', onProcExit);
    }else{
      log(`Missing "${MAIN_SCRIPT}"`);
    }

    return;
  }

  switch(str){
    case 'cls': case 'clear':
      await clear();
      return;

    case 'exit': case '.exit':
      rl.close();
      shouldExit = 1;
      return;
  }

  if(str.length > 1 || /[\/\\]/.test(str)){
    var found = updatePath(str);
    if(!found) log('Directory not found');
    return;
  }
}

function updatePath(str){
  var dirs = str.split(/[\/\\]/);

  if(dirs[0] === ''){
    currDir = currDir.substring(0, 3);
    dirs.shift();
  }else{
    dirs = dirs.map(dir => {
      if(dir.includes('.')) return dir;
      return `*${dir}*`;
    });
  }

  var found = 1;

  dirs.forEach(dir => {
    if(!found) return;
    if(dir === '.') return;

    if(dir === '..'){
      currDir = path.join(currDir, '..');
      return;
    }

    dir = dir.replace(/\*+|[\s\S]/g, token => {
      if(token.startsWith('*')) return '.*';
      return `\\u${O.hex(O.cc(token), 2)}`;
    });

    var dirs = getDirs().sort((dir1, dir2) => {
      var len1 = dir1.length;
      var len2 = dir2.length;

      return (len1 > len2) - (len1 < len2);
    });

    var reg = new RegExp(`^${dir}$`, 'i');
    var matches = dirs.filter(d => reg.test(d));

    if(matches.length === 0){
      found = 0;
      return;
    }

    var index = matches.findIndex(d => d.startsWith(str));
    var match = matches[index !== -1 ? index : 0];

    currDir = path.join(currDir, match);
  });

  return found;
}

async function onInput(str){
  rl.pause();
  await processInput(str);
  if(!shouldExit && proc === null) onProcExit();
}

function onProcExit(code=null){
  if(code !== null && DISPLAY_EXIT_CODE)
    log(code);

  if(proc !== null){
    rl.resume();
    proc = null;
  }
  
  askForInput();
}

function getEntries(dir=currDir){
  return fs.readdirSync(dir);
}

function getDirs(dir=currDir){
  return getEntries(dir).filter(d => {
    return fs.statSync(path.join(dir, d)).isDirectory();
  });
}

function getFiles(dir=currDir){
  return getEntries(dir).filter(d => {
    return fs.statSync(path.join(dir, d)).isFile();
  });
}

async function clear(){
  await write('\x1bc');
}

function write(str){
  return new Promise(res => {
    process.stdout.write(str, () => {
      res();
    });
  });
}