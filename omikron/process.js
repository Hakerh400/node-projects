'use strict';

const EventEmitter = require('events');
const Ebuf = require('../ebuf');

class Process extends EventEmitter{
  constructor(proc){
    super();
    
    this.proc = proc;
    this.stdin = new Stdin(this, proc.stdin);

    proc.on('SIGINT', this.onSigint.bind(this));
  }

  onSigint(){
    this.emit('sigint');
  }

  exit(code){
    this.proc.exit(code);
  }
};

class Stdin extends EventEmitter{
  constructor(proc, stdin){
    super();

    this.proc = proc;
    this.stdin = stdin;

    stdin.on('data', this.onData.bind(this));
    stdin.on('end', this.onEnd.bind(this));

    this.refs = 0;

    if('unref' in stdin)
      stdin.unref();
  }

  ref(){
    if(this.refs++ === 0)
      this.stdin.ref();
  }

  unref(){
    if(--this.refs === 0)
      this.stdin.unref();
  }

  onData(data){
    var ebuf = new Ebuf();

    for(var byte of data){
      if(byte === 0x03){
        this.proc.onSigint();
        continue;
      }

      ebuf.push(byte);
    }

    this.emit('data', ebuf.getBuf());
  }

  onEnd(){
    this.emit('end');
  }
};

Process.Stdin = Stdin;

module.exports = Process;