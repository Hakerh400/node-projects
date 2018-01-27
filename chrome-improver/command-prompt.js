'use strict';

var util = require('util');
var cp = require('child_process');
var debug = require('./debug.js');
var nop = require('./nop.js');

class CommandPrompt{
  constructor(exitCb = nop){
    debug.verbose('Launching command prompt.');
    debug.incIndent();

    this.specialChar = '\x01';

    this.exitCb = exitCb;
    this.cbs = [];
    this.errBuff = Buffer.from([]);

    this.clearBuffer();
    this.spawnProc();
  }

  spawnProc(){
    this.proc = cp.spawn('cmd.exe', []);

    this.proc.stdout.on('data', this.read.bind(this));
    this.proc.stderr.on('data', this.err.bind(this));
    this.proc.on('exit', this.onExit.bind(this));

    this.exec(`@echo off`);
  }

  read(data){
    if(!data.toString().includes(this.specialChar)){
      this.buffer = Buffer.concat([this.buffer, data]);
    }else{
      var str = this.getOutput(true);
      var cb = this.cbs.shift();

      if(cb != nop){
        debug.verbose(`Cmd output: ${util.inspect(str)}`);
      }

      cb(str);
    }
  }

  write(data){
    this.proc.stdin.write(data);
  }

  err(data){
    if(!data.toString().includes(this.specialChar)){
      this.errBuff = Buffer.concat([this.errBuff, data]);
    }

    this.read(data);
  }

  exec(cmds, cb = nop){
    if(typeof cmds === 'string') cmds = [cmds];

    this.cbs.push(cb, nop);
    debug.verbose(`Cmd input: ${util.inspect(cmds.join` && `)}`);
    this.write(`${cmds.join` && `}\n${this.specialChar}\n`);
  }

  execList(list){
    if(!list.length) return;

    var [cmds, cb = nop] = list.shift();

    this.exec(cmds, str => {
      cb(str);
      if(list.length) this.execList(list);
    });
  }

  getOutput(clearBuffer = false){
    var str = this.buffer.toString();
    if(clearBuffer) this.clearBuffer();

    str = str.substring(str.indexOf('\n') + 1);
    str = str.trim();

    return str;
  }

  clearBuffer(){
    this.buffer = Buffer.from([]);
  }

  onExit(exitCode){
    debug.decIndent();
    debug.verbose(`Command prompt exited with exit code ${exitCode}.`);

    var err = this.errBuff.toString();
    err = err.trim();

    this.exitCb(err);
  }
};

module.exports = CommandPrompt;