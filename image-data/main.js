'use strict';

var O = require('../framework');
var media = require('../media');
var logStatus = require('../log-status');
var ImageData = require('.');

var w = 1920;
var h = 1080;
var fps = 60;
var hd = true;

var duration = 30;
var framesNum = fps * duration;

setTimeout(main);

function main(){
  var [wh, hh] = [null, null];
  var d = null;

  media.renderVideo('-vid/1.mp4', w, h, fps, hd, (w, h, g, f) => {
    logStatus(f, framesNum);

    if(f == 1){
      [wh, hh] = [w, h].map(a => a >> 1);
      d = new ImageData(g, true);
    }

    var f1 = f;
    var f2 = f1 ** .75;

    d.iterate((x, y, r, g, b) => {
      var dd = Math.hypot(x - wh, y - hh) > 300;
      var fa = dd ? f1 : 0;
      var fb = dd ? f2 : 0;

      return [
        (x ^ y ^ fa) & 0xFF,
        (y ^ fa ^ fb) & 0xFF,
        (fa ^ x ^ (x + y - fb)) & 0xFF,
      ];
    });

    d.put();

    return f != framesNum;
  });
}