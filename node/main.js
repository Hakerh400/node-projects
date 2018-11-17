'use strict';

const DISPLAY_EXIT_CODE = 0;

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const cp = require('child_process');
const O = require('../framework');

const MAIN_SCRIPT_JS = 'main.js';
const MAIN_SCRIPT_PY = 'main.py';

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
    if(files.includes(MAIN_SCRIPT_JS)){
      //////////////////////////////// Begin
      await clear();

      var args = [];

      if(str.length !== 0 && str !== '-'){
        str = str.substring(1).trim();
        args = str.split(/\s+/);
      }

      proc = spawn('node', [
        MAIN_SCRIPT_JS,
        ...args,
      ]);
      //////////////////////////////// End
    }else if(files.includes(MAIN_SCRIPT_PY)){
      //////////////////////////////// Begin
      await clear();

      var args = [];

      if(str.length !== 0 && str !== '-'){
        str = str.substring(1).trim();
        args = str.split(/\s+/);
      }

      proc = spawn('C:/Users/Thomas/AppData/Local/Programs/Python/Python37/python.exe', [
        MAIN_SCRIPT_PY,
        ...args,
      ]);
      //////////////////////////////// End
    }else{
      log(`Missing "${MAIN_SCRIPT_JS}"`);
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

  var batchName = `${str}.bat`;
  var batchFile = path.join(currDir, batchName);

  if(!fs.existsSync(batchFile)){
    log(`Batch file "${batchName}" not found`);
    return;
  }

  //////////////////////////////// Begin
  await clear();

  proc = spawn(batchFile, []);
  //////////////////////////////// End
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
  await processInput(str);
  if(!shouldExit && proc === null) onProcExit();
}

function spawn(name, args){
  var proc = cp.spawn(name, args, {
    cwd: currDir,
    stdio: 'inherit',
  });

  proc.on('exit', onProcExit);

  return proc;
}

async function onProcExit(code=null){
  if(code !== null && DISPLAY_EXIT_CODE)
    log(code);

  proc = null;
  askForInput();
}

function getEntries(dir=currDir){
  return fs.readdirSync(dir);
}

function getDirs(dir=currDir){
  return getEntries(dir).filter(d => {
    return stat(path.join(dir, d)).isDirectory();
  });
}

function getFiles(dir=currDir){
  return getEntries(dir).filter(d => {
    return stat(path.join(dir, d)).isFile();
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

function stat(file){
  try{
    return fs.statSync(file);
  }catch{
    return {
      isFile(){ return 0; },
      isDirectory(){ return 0; },
    };
  }
}