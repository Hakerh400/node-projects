'use strict';

var O = require('../framework');

class PerformanceTester{
  constructor(){
    this.funcs = [];
  }

  addFunc(func){
    this.funcs.push(func);
  }

  test(epochsNum = 1){
    var arr = this.funcs.map(func => [func, 0]);

    var maxFuncNameLen = 0;
    var maxTimeStrLen = 0;

    var funcsNum = arr.length;
    var startIndex = O.rand(funcsNum);

    O.repeat(epochsNum, epoch => {
      arr.forEach((obj, index) => {
        if(startIndex !== 0){
          index = (startIndex + epoch + index) % funcsNum;
          obj = arr[index];
        }

        var [func, time] = obj;

        if(epoch === 0 && func.name.length > maxFuncNameLen)
          maxFuncNameLen = func.name.length;

        if('gc' in global)
          global.gc();

        var t = Date.now();
        func();
        time += Date.now() - t;

        if(epoch !== epochsNum - 1){
          obj[1] = time;
        }else{
          var timeStr = (time / 1e3).toFixed(3);
          if(timeStr.length > maxTimeStrLen)
            maxTimeStrLen = timeStr.length;

          obj[1] = timeStr;
        }
      });
    });

    var str = arr.map(([func, time]) => {
      var name = func.name;

      var paddedName = `${name}:`.padEnd(maxFuncNameLen + 1);
      var paddedTime = `${time}`.padStart(maxTimeStrLen);

      return `${paddedName} ${paddedTime}`;
    }).join`\n`;

    return str;
  }
};

module.exports = PerformanceTester;