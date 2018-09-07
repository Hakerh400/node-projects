'use strict';

const O = require('../framework');

class RandCode{
  constructor(){
    this.identsNum = 0;
  }

  sample(){
    var globalVarsNum = this.rand();
    var globalFuncsNum = this.rand();
    var classesNum = this.rand();

    var {identsNum} = this;
  }

  rand(){
    var val = rand();
    this.identsNum += val;
    return val;
  }
};

module.exports = RandCode;

function rand(){
  var val = O.rand(4);
  while(O.rand(2)) val++;
  return val;
}