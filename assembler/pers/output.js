'use strict';

var fs = require('fs');
var Peripheral = require('../per.js');

class Output extends Peripheral{
  constructor(){
    super();
  }

  run(){
    var p = this;
    var m = p.machine;
    var mem = m.mem;

    setTimeout(loop);

    function loop(){
      if(!p.active)
        return;

      if(p.isReady()){
        var src = p.getSrc();
        var cnt = p.getCnt();
        var buff = Buffer.allocUnsafe(cnt);

        for(var i = 0; i < cnt; i++)
          buff[i] = mem.readb(src + i);

        fs.writeFileSync(process.stdout.fd, buff);

        p.setReady();
      }

      setTimeout(loop);
    }
  }
};

module.exports = Output;