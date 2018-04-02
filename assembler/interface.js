'use strict';

var readline = require('readline');

const STR_MAX_LEN = 1 << 16;

class Interface{
  constructor(machine){
    this.machine = machine;

    this.buffStart = 0;
    this.buffEnd = 0;

    this.lines = [];
  }

  addEventListeners(){
    this.loopFunc = this.loop.bind(this);
    this.rl = readline.createInterface(process.stdin, process.stdout);
    this.rl.on('line', this.onLine.bind(this));
  }

  removeEventListeners(){
    this.rl.close();
  }

  start(){
    this.addEventListeners();
    this.machine.start();
    this.loop();
  }

  loop(){
    var m = this.machine;
    var mem = m.mem;
    var memBuff = mem.buff;

    if(m.halted){
      this.removeEventListeners();
      return;
    }

    var ctrl = m.in(0x02);

    if(ctrl & 1){
      if(ctrl & 2) this.read();
      else this.write();
    }

    setTimeout(this.loopFunc);
  }

  read(){
    var m = this.machine;
    var mem = m.mem;
    var memBuff = mem.buff;

    var addr = m.in(0x03);

    for(var i = 0; i < STR_MAX_LEN; i++){
      if(memBuff[addr + i] === 0)
        break;
    }

    var buff = memBuff.slice(addr, addr + i);
    console.log(buff.toString());

    m.out(m.in(0x02) & ~1, 0x02);
    m.intReq(0x02);
  }

  write(){
    if(this.lines.length === 0)
      return;

    var m = this.machine;
    var mem = m.mem;
    var memBuff = mem.buff;

    var addr = m.in(0x03);
    var buff = Buffer.from(this.lines.shift());

    for(var i = 0; i < buff.length; i++){
      memBuff[addr + i] = buff[i];
    }

    memBuff[addr + buff.length] = 0;

    m.out(m.in(0x02) & ~1, 0x02);
    m.intReq(0x02);
  }

  onLine(line){
    this.lines.push(line);
  }
};

module.exports = Interface;