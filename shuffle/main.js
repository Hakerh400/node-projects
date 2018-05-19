'use strict';

var O = require('../framework');
var Presentation = require('../presentation');
var ImageData = require('../image-data');

const HD = 1;

var w = HD ? 1920 : 640;
var h = HD ? 1080 : 480;
var fps = 60;

setTimeout(main);

function main(){
  var pr = new Presentation(w, h, fps);

  pr.render('-vid/1.mp4', async (w, h, g, g1) => {
    pr.transTime = 5e3;

    var d = new ImageData(g1);

    render(0);
    await pr.fade();
    await pr.wait();

    render(1);
    await pr.fade();
    await pr.wait();

    render(2);
    await pr.fade();
    await pr.wait();

    await pr.fadeOut();

    function render(mode){
      var arr = getArr(mode === 1);

      d.iterate((x, y) => {
        if(mode === 2 && x === 0)
          arr = getArr(1);

        return arr[x];
      });

      d.put();
    }

    function getArr(shuffle){
      var arr = O.ca(w, i => O.hsv(i / w))
      if(shuffle) O.shuffle(arr);
      return arr;
    }
  });
}