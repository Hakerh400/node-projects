'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const O = require('../omikron');
const readline = require('../readline');
const logSync = require('../log-sync');
const engs = require('./engines');
const nodeFlags = require('./node-flags');

const DISPLAY_EXIT_CODE = 0;
const DISPLAY_SIGINT = 0;
const KILL_ON_SECOND_SIGINT = 1;
const ELECTRON_NIGHTLY = 1;

const cwd = __dirname;
const electronAppScript = path.join(cwd, 'electron-app.js');

const sigintBuf = Buffer.from([0x03]);

var currDir = path.join(cwd, '..');
var rl = readline.rl();

var proc = null;
var shouldExit = 0;

setTimeout(() => main().catch(log));

async function main(){
  if(ELECTRON_NIGHTLY){
    engs.electron.exe = engs.electron.exe.replace(
      '/electron/',
      '/electron-nightly/',
    );
  }

  askForInput();
}

function askForInput(newLine=1){
  var str = `${newLine ? '\n' : ''}${currDir}>`;
  rl.question(str, onInput);
}

async function processInput(str){
  str = str.trim();
  str = str.replace(/\s+/g, ' ');

  var scriptArgs = [];
  if(str.length !== 0 && str !== '-')
    scriptArgs = str.slice(1).trim().split(/\s+/);

  var files = getFiles().map(a => a.toLowerCase());

  loadScript: if(str.length === 0 || str.startsWith('-')){
    if(files.includes(engs.electron.script)){
      await spawn('electron', [electronAppScript]);
    }else if(files.includes(engs.node.script)){
      await spawn('node');
    }else if(files.includes(engs.python.script)){
      await spawn('python');
    }else if(files.includes(engs.haskell.script)){
      await spawn('haskell');
    }else if(files.includes(engs.agda.script)){
      await spawn('agda');
    }else if(files.includes(engs.lisp.script)){
      await spawn('lisp');
    }else if(files.includes(engs.z3.script)){
      await spawn('z3');
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

  if(str.length > 1 || /[\.\/\\]/.test(str)){
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
  proc = spawnProc(batchFile);

  async function spawn(name, args=[], options=O.obj()){
    await clear();

    const eng = engs[name];

    if(name === 'node')
      args = nodeFlags.map(a => `--${a}`).concat(args);

    proc = spawnProc(eng.exe, [
      ...args,
      eng.script,
      ...scriptArgs,
    ], options, {
      ...eng.options,
      ...options.stdio === 'ignore' ? {ignore: 1} : {},
    });
  }
}

function updatePath(str){
  if(str === '\\' || str === '/'){
    currDir = currDir.replace(/[\/\\].*/s, a => a[0]);
    return 1;
  }

  var dirs = str.split(/[\/\\]/);

  if(dirs[0] === ''){
    currDir = currDir.slice(0, 3);
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

function spawnProc(file, args=[], options=O.obj(), opts=O.obj(), cb=null){
  const onLog = (data, type) => {
    if(opts.skipFirst && first){
      first = 0;
      return;
    }

    let str = data.toString();

    if(str.includes('Terminate batch job (Y/N)?')) return;
    if(str.includes('Building the projects in this solution one at a time.')) return;

    str = str.replace(/\[Object: null prototype\] /g, '');
    str = str.replace(/\[Object: null prototype\]/g, '[Object]');

    if(type === 0){
      logSync(str);
      return;
    }

    if(type === 1){
      stderrData += str;
      return;
    }
  };

  const onSigint = () => {
    if(DISPLAY_SIGINT)
      logSync('^C');

    const isEsolang = currDir.startsWith('C:\\Projects\\esolangs\\');
    
    if(isEsolang || opts.ignore || opts.killOnSigint || (sigintSent && KILL_ON_SECOND_SIGINT)){
      if(opts.killCmd === null) proc.kill();
      else cp.exec(opts.killCmd);
      return;
    }

    sigintSent = 1;
    write(sigintBuf);
  };

  const onFinish = () => {
    if(--refs !== 0) return;

    O.proc.removeListener('sigint', onSigint);
    O.proc.stdin.removeListener('data', onData);
    O.proc.stdin.removeListener('end', onEnd);
    O.proc.stdin.unref();

    logSync(stderrData);
    onProcExit(exitCode, cb);
  };

  const onError = () => {};

  const write = buf => {
    try{
      proc.stdin.write(buf);
    }catch{}
  };

  opts = Object.assign({
    skipFirst: 0,
    killOnSigint: 0,
    killCmd: null,
    ignore: 0,
  }, opts);

  let stderrData = '';

  const proc = cp.spawn(file, args, {
    cwd: currDir,
    ...options,
  });

  var first = 1;
  var sigintSent = 0;

  var onData = data => write(data);
  var onEnd = () => proc.stdin.end();

  O.proc.on('sigint', onSigint);
  O.proc.stdin.on('data', onData);
  O.proc.stdin.on('end', onEnd);
  O.proc.stdin.ref();

  if(!opts.ignore){
    proc.stdout.on('data', buf => onLog(buf, 0));
    proc.stderr.on('data', buf => onLog(buf, 1));
  }

  var refs = opts.ignore ? 1 : 3;
  var exitCode = null;

  if(!opts.ignore){
    proc.stdout.on('end', onFinish);
    proc.stderr.on('end', onFinish);

    proc.stdin.on('error', onError);
    proc.stdout.on('error', onError);
    proc.stderr.on('error', onError);
  }

  proc.on('exit', code => {
    exitCode = code;
    onFinish();
  });

  return proc;
}

function onProcExit(code=null, cb=null){
  if(cb !== null) cb(code);
  else if(code !== null && DISPLAY_EXIT_CODE) log(code);

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
  await write('\x1B[2J\x1B[0;0H\x1Bc');
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