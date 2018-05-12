'use strict';

var Peripheral = require('../per.js');

class Timer extends Peripheral{
  constructor(){
    super();
  }

  run(){
    var p = this;
    var t = null;

    setTimeout(loop);

    function loop(){
      if(!p.active)
        return;

      if(p.isReady()){
        if(t === null)
          t = Date.now();

        if(Date.now() - t > p.getData()){
          p.setReady();
          t = null;
        }
      }else{
        t = null;
      }

      setTimeout(loop);
    }
  }
};

module.exports = Timer;