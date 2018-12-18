'use strict';

const DISPLAY_EXIT_CODE = 0;

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const O = require('../framework');
const readline = require('../readline');
const logSync = require('../log-sync');
const engs = require('./engines');

const sigintBuf = Buffer.from([0x03]);

var currDir = process.cwd();
var rl = readline.rl();

var proc = null;
var shouldExit = 0;

setTimeout(() => main().catch(log));

async function main(){
  askForInput();
}

function askForInput(newLine=1){
  var str = `${newLine ? '\n' : ''}${currDir}>`;
  rl.question(str, onInput);
}

async function processInput(str){
  str = str.trim();
  str = str.replace(/\s+/g, ' ');

  var files = getFiles();

  loadScript: if(str.length === 0 || str.startsWith('-')){
    if(files.includes(engs.node.script)){
      await spawn('node');
    }else if(files.includes(engs.python.script)){
      await spawn('python');
    }else{
      str = 't';
      break loadScript;
    }

    return;
  }

  switch(str){
    case 'cls': case 'clear':
      await clear();
      return;

    case 'dbg':
      if(!files.includes(engs.node.script))
        return log(`Cannot find "${engs.node.script}"`);

      await spawn('node', ['--inspect-brk'], {stdio: 'ignore'});
      return;

    case 'exit': case '.exit': case 'q': case ':q': case ':wq':
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

  await clear();
  proc = spawn(batchFile, []);

  async function spawn(name, args=[], options=O.obj()){
    await clear();

    var eng = engs[name];
    var scriptArgs = [];
    
    if(str.length !== 0 && str !== '-'){
      str = str.substring(1).trim();
      scriptArgs = str.split(/\s+/);
    }

    proc = spawnProc(eng.exe, [
      ...args,
      eng.script,
      ...scriptArgs,
    ], options);
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

function onInput(str){
  (async () => {
    await processInput(str);

    if(!shouldExit && proc === null)
      onProcExit();
  })().catch(log);
}

function spawnProc(name, args=[], options=O.obj()){
  var proc = cp.spawn(name, args, {
    cwd: currDir,
    ...options,
  });

  var onSigint = () => write(sigintBuf);
  var onData = data => write(data);
  var onEnd = () => proc.stdin.end();

  O.proc.on('sigint', onSigint);
  O.proc.stdin.on('data', onData);
  O.proc.stdin.on('end', onEnd);
  O.proc.stdin.ref();

  proc.stdout.on('data', logSync);
  proc.stderr.on('data', logSync);

  var refs = 3;
  proc.stdout.on('end', onFinish);
  proc.stderr.on('end', onFinish);
  proc.on('exit', onFinish);

  return proc;

  function write(buf){
    try{
      proc.stdin.write(buf);
    }catch{}
  }

  function onFinish(){
    if(--refs !== 0) return;

    O.proc.removeListener('sigint', onSigint);
    O.proc.stdin.removeListener('data', onData);
    O.proc.stdin.removeListener('end', onEnd);
    O.proc.stdin.unref();

    onProcExit();
  }
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