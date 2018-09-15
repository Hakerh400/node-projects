'use strict';

const HD = 0;

const O = require('../framework');
const media = require('../media');
const melodyDetector = require('.');

const w = HD ? 1920 : 640;
const h = HD ? 1080 : 480;
const fps = 60;
const fast = !HD;

const ws = 1e3;
const scale = ws / w | 0;

const cols = {
  bg: '#a9a9a9',
};

setTimeout(main);

async function main(){
  var data = await media.loadAudio('-dw/1.mp3', 1);
  var framesNum = data.length / scale - ws | 0;

  function init(g){
    g.lineCap = 'round';
    g.lineJoin = 'round';

    g.lineWidth = 1.5;
  }

  media.renderVideo('-vid/1.mp4', w, h, fps, fast, (w, h, g, f) => {
    media.logStatus(f, framesNum);

    if(f === 1) init(g);

    g.fillStyle = cols.bg;
    g.fillRect(0, 0, w, h);

    var arr = slice(data, (f - 1) * scale, ws, w);
    var freqDomain = slice(melodyDetector.dft(data.slice((f - 1) * scale, (f - 1) * scale + ws), 1e-4), 0, ws, w);

    plot(g, freqDomain, 'red', 1);
    plot(g, arr, 'black', 0);

    return f !== framesNum;
  });
}

function plot(g, arr, col, mode){
  if(mode === 0){
    var [min, max] = [-1, 1];
    var yBase = h / 2;
  }else{
    var [min, max] = findMinMax(arr);
    var yBase = h;
  }

  var yBase = mode === 1 ? h - 1 : h / 2;
  var s = h / ((min - max) * 2) / 2;

  g.beginPath();
  g.moveTo(-10, yBase + arr[0] * s);

  arr.forEach((num, index) => {
    g.lineTo(index, yBase + num * s);
  });

  g.lineTo(w + 10, yBase + arr[arr.length - 1] * s);
  g.lineTo(w + 10, h + 10);
  g.lineTo(-10, h + 10);
  g.closePath();

  if(mode === 0){
    g.strokeStyle = col;
    g.stroke();
  }else{
    g.fillStyle = col;
    g.fill();
  }
}

function slice(arr, i, len1, len2){
  var arrNew = [];

  var f = len2 / len1;
  var sum = 0;
  var num = 0;
  var j = 0;

  var start = i;
  var end = start + len1;

  for(i = start; i !== end; i++){
    sum += arr[i];
    num++;

    j += f;

    if(j >= 1){
      var n = j | 0;
      var val = sum / num;

      while(n-- !== 0)
        arrNew.push(val);

      sum = 0;
      num = 0;
      j %= 1;
    }
  }

  if(arrNew.length <= len2){
    while(arrNew.length !== len2)
      arrNew.push(arrNew[arrNew.length - 1]);
  }else{
    arrNew.length = len2;
  }

  return arrNew;
}

function normalize(arr){
  var avg = findAvg(arr);
  if(avg === 0) return arr.slice();
  return arr.map(num => num - avg);
}

function findAvg(arr){
  return arr.reduce((sum, num) => sum + num, 0) / arr.length;
}

function findMinMax(arr){
  var min = arr[0];
  var max = min;

  arr.forEach(num => {
    if(num < min) min = num;
    if(num > max) max = num;
  });

  return [min, max];
}