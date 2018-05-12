'use strict';

var Peripheral = require('../per.js');

class MotherBoard extends Peripheral{
  constructor(){
    super();
  }

  run(){
    var p = this;

    setTimeout(loop);

    function loop(){
      if(!p.active)
        return;

      if(p.isReady()){
        switch(p.regs[2]){
          case 0: // Shut down
            p.machine.stop();
            break;
        }
      }

      setTimeout(loop);
    }
  }
};

module.exports = MotherBoard;