'use strict';

var O = require('../framework');
var media = require('../media');
var browser = require('../browser');
var logStatus = require('../log-status');
var formatNumber = require('../format-number');

var w = 1920;
var h = 1080;
var fps = 60;
var hd = true;
var duration = 60;
var framesNum = fps * duration;

var offset = 5;
var hFactor = .9;
var fontSize = 32;

setTimeout(main);

function main(){
  var arr = O.ca(w, () => h + offset);
  var arrIndex = 0;
  var maxVal = 1;
  var factor = h * hFactor / maxVal;
  var bytesPrev = 0;

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f, framesNum);

    if(f === 1){
      g.textBaseline = 'top';
      g.textAlign = 'left';

      g.lineWidth = 2;
      g.strokeStyle = '#ff0000';
    }

    g.fillStyle = 'darkgray';
    g.fillRect(0, 0, w, h);

    g.fillStyle = '#ff8000';
    g.beginPath();
    g.moveTo(-offset, arr[arrIndex]);

    for(var i = arrIndex, x = 0; x < arr.length; x++){
      g.lineTo(x, arr[i]);

      if(i === arr.length - 1) i = 0;
      else i++;
    }

    g.lineTo(w + offset, arr[(arrIndex || arr.length) - 1]);
    g.lineTo(w + offset, h + offset);
    g.lineTo(-offset, h + offset);
    g.closePath();
    g.fill();
    g.stroke();

    drawStr(g, formatBytes(bytesPrev), offset, offset, fontSize, 'black');

    test();

    var privateBytes = getPrivateBytes();

    if(privateBytes > maxVal){
      var newFactor = maxVal / privateBytes;

      for(var i = 0; i < arr.length; i++){
        if(arr[i] > h) continue;
        arr[i] = h - (h - arr[i]) * newFactor;
      }

      maxVal = privateBytes;
      factor = h * hFactor / maxVal;
    }

    arr[arrIndex] = h - privateBytes * factor;

    if(arrIndex === arr.length - 1) arrIndex = 0;
    else arrIndex++;

    bytesPrev = privateBytes;

    return f !== framesNum;
  });
}

function test(){
  if(!(O.static in test))
    return test[O.static] = {};
  var obj = test[O.static];

  var w = 1920;
  var h = 1080;
  var url = '/?project=grid';

  if(!('window' in obj)){
    var window = new browser.Window(w, h, url);

    window.on('_ready', () => {
      obj.ready = true;
    });

    obj.window =  window;
    obj.ready = false;

    return;
  }

  var window = obj.window;

  if(!obj.ready)
    return;

  if(O.rand(2) === 0){
    window.emit('mousedown', {
      button: 0,
      clientX: O.rand(w),
      clientY: O.rand(h),
    });
  }else{
    window.emit('keydown', {
      code: 'Enter',
    });
  }

  window.emit('keydown', {
    code: 'KeyD',
  });
}

function getPrivateBytes(){
  var usage = process.memoryUsage();
  var privateBytes = usage.rss + usage.external;

  return privateBytes;
}

function drawStr(g, str, x, y, size, col){
  g.font = `${size}px arial`;
  g.fillStyle = col;

  O.sanl(str).forEach((str, index) => {
    g.fillText(str, x, y + index * size);
  });
}

function formatBytes(bytes){
  var ordersOfMagnitude = 'kmgt';

  var str = ['', ...ordersOfMagnitude].map((order, index) => {
    var orderStr = order.toUpperCase();
    var val = Math.floor(bytes / 2 ** (10 * index));
    var valStr = formatNumber(val);

    return `${orderStr}B: ${valStr}`;
  });

  str = str.join`\n`;

  return str;
}