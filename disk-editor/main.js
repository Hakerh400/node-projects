'use strict';

var fs = require('fs');
var O = require('../framework');
var media = require('../media');
var buffer = require('../buffer');
var logStatus = require('../log-status');
var formatFileName = require('../format-file-name');
var diskEditor = require('.');

var start = buffer.fromHex('89 50 4E 47 0D 0A 1A 0A');
var end = buffer.fromHex('49 45 4E 44 AE 42 60 82');

var minLen = 1e6;
var speed = 10e3;

var file = '-img/1.png';

setTimeout(main);

function main(){
  file = formatFileName(file);

  var fd = fs.openSync(file, 'w');
  var disk = diskEditor.open('C');

  var singletonBuff = Buffer.alloc(1);
  var sector = 0;

  var stage = 0;
  var index = 0;
  var len = 0;

  while(1){
    if(sector !== 0 && sector % speed === 0){
      logStatus(sector, 245041144, 'sector');
    }

    var buff = disk.read(sector, speed);
    var found = feedBuff(buff);

    sector += speed;

    if(found) break;
  }

  function feedBuff(buff){
    var found = 0;

    for(var i = 0; i < buff.length; i++){
      if(feedByte(buff[i])){
        found = 1;
        break;
      }
    }

    if(found){
      if(len < minLen){
        fd = fs.openSync(file, 'w');
        stage = 0;
        index = 0;
        len = 0;

        return 0;
      }else{
        return 1;
      }
    }
  }

  function feedByte(byte){
    var buff = stage === 0 ? start : end;
    var stagePrev = stage;

    singletonBuff[0] = byte;

    if(byte === buff[index++]){
      if(index === buff.length){
        stage++;
        index = 0;
      }
    }else{
      index = 0;
    }

    if(stage === 1){
      if(stagePrev === 0){
        write(start);
      }else{
        write(singletonBuff);
      }
    }else if(stage === 2){
      write(singletonBuff);
      fs.closeSync(fd);
    }

    return stage === 2;
  }

  function write(buff){
    len += fs.writeSync(fd, buff);
  }
}