'use strict';

var fs = require('fs');
var Peripheral = require('../per.js');

class Output extends Peripheral{
  constructor(){
    super();

    this.buff = Buffer.allocUnsafe(0);

    this.onData = onData.bind(this);
    process.stdin.on('data', this.onData);
  }

  run(){
    var p = this;
    var m = p.machine;
    var mem = m.mem;

    setTimeout(loop);

    function loop(){
      if(!p.active)
        return;

      main: if(p.isReady()){
        var dest = p.getDest();
        var cnt = p.getCnt();

        if(cnt > p.buff.length)
          break main;

        var buff = p.buff.slice(0, cnt);

        for(var i = 0; i < cnt; i++)
          mem.writeb(buff[i], dest + i);

        p.buff = p.buff.slice(cnt);

        p.setReady();
      }

      setTimeout(loop);
    }
  }

  stop(){
    process.stdin.removeListener('data', this.onData);
    process.stdin.unref();

    super.stop();
  }
};

module.exports = Output;

function onData(buff){
  this.buff = Buffer.concat([this.buff, buff]);
}