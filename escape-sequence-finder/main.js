'use strict';

var O = require('../framework');
var media = require('../media');
var logStatus = require('../log-status');

var letters = getLetters();

var w = 1920;
var h = 1080;
var fps = 60;
var hd = true;
var duration = letters.length + 1;
var framesNum = fps * duration;

var offset = 5;

setTimeout(main);

function main(){
  var fontSize = (h - offset * 2) / letters.length;
  var results = [];

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f, framesNum);

    if(f === 1){
      g.textBaseline = 'top';
      g.textAlign = 'left';
    }

    if(f % fps === 1){
      g.fillStyle = 'black';
      g.fillRect(0, 0, w, h);

      var res = [...results, ...O.ca(letters.length - results.length, () => [-1, null])];

      var cols = res.map(([type, details]) => {
        if(type === -1) return 'darkgray';
        if(type === 0) return 'red';
        if(type === 1) return '#00ff00';
        if(type === 2) return 'yellow';
      });

      var strs = letters.map((letter, index) => {
        var [type, details] = res[index];

        if(type === -1) return `${letter}`;
        if(type === 0) return `${letter} --> ${details}`;
        if(type === 1) return `${letter} --> ${stringifyBuffer(details)}`;
        if(type === 2) return `${letter} --> ${details}`;
      });

      drawStr(g, strs, offset, offset, fontSize, cols);

      if(results.length < letters.length){
        var result = test(letters[f / fps | 0]);
        results.push(result);
      }
    }

    return f !== framesNum;
  });
}

function test(letter){
  var func = null;
  var err = null;

  try{
    func = new Function(`return'\\${letter}'`);
  }catch(e){
    err = e;
  }

  var val = func !== null ? func() : null;
  var result = val !== null ? letter !== val ? 1 : 0 : 2;
  var details = result === 1 ? Buffer.from(val) : err !== null ? err : val;

  return [result, details];
}

function getLetters(){
  return O.ca(26, index => {
    var cc0 = 'a'.charCodeAt(0);
    var char = String.fromCharCode(cc0 + index);

    return char;
  });
}

function drawStr(g, strs, x, y, size, cols){
  g.font = `bold ${size}px "Courier New"`;

  strs.forEach((str, index) => {
    g.fillStyle = cols[index];
    g.fillText(str, x, y + index * size);
  });
}

function stringifyBuffer(buff){
  var arr = [...buff];

  var str = arr.map(byte => {
    var str = byte.toString(16);

    str = str.toUpperCase().padStart(2, '0');
    str = `0x${str}`;

    return str;
  });

  str = str.join``;

  return str;
}