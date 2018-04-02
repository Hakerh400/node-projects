'use strict';

class Timer{
  constructor(machine){
    this.machine = machine;

    this.enabled = false;

    this.loopFunc = this.loop.bind(this);
    this.timeoutFunc = this.timeout.bind(this);
  }

  start(){
    this.loop();
  }

  loop(){
    var m = this.machine;

    if(m.halted)
      return;

    if(!this.enabled){
      var ctrl = m.in(0x00);

      if(ctrl & 1){
        var timeout = m.in(0x01);
        m.out(ctrl & ~1, 0x00);

        this.enabled = true;
        setTimeout(this.timeoutFunc, timeout);
      }
    }

    setTimeout(this.loopFunc);
  }

  timeout(){
    var m = this.machine;

    m.intReq(0x01);
    this.enabled = false;
  }
};

module.exports = Timer;