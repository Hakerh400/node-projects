'use strict';

const fs = require('fs');
const path = require('path');
const Process = require('./process');
const dirs = require('./dirs.json');
const passwords = require('./passwords.json');

const isElectron = 'navigator' in global;

class Window{
  constructor(){
    this.document = new Document();
  }
};

class Document{
  constructor(){}
};

module.exports = getFramework();

function getFramework(){
  if(isElectron){
    const electron = require('electron');
    const ipc = electron.ipcRenderer;

    console.log = (...args) => void ipc.send('log', args);
    console.info = (...args) => void ipc.send('info', args);
    console.error = (...args) => void ipc.send('error', args);
    console.logRaw = data => void ipc.send('logRaw', data);

    process.on('uncaughtException', err => {
      if(err instanceof Error)
        err = err.stack;
      console.error(err);
    });
  }

  var str = fs.readFileSync(dirs.O).toString();
  str = str.split(/\r\n|\r|\n/);
  str[str.length - 1] = 'return O;';
  str = str.join('\n');

  var window = isElectron ? global : new Window();
  var {document} = window;

  var func = new Function('window', 'document', 'require', str);
  var O = func(window, document, getReq());

  O.init(0);

  O.dirs = dirs;
  O.passwords = passwords;
  O.password = passwords[0];

  init(O);

  return O;
}

function init(O){
  O.proc = new Process(process);
}

function getReq(){
  if(isElectron) return require;

  return (...args) => {
    if(args.length !== 1)
      throw new TypeError('Expected 1 argument');
    
    var arg = args[0];
    if(typeof args[0] !== 'string')
      throw new TypeError('Expected a string');

    if(/[\.\/\\]/.test(arg))
      throw new TypeError('Expected a native module name');

    return require(arg);
  };
}