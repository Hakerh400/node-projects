'use strict';

var O = require('../framework');
var Presentation = require('../presentation');
var browser = require('../browser');
var hash = require('../hash');

var w = 1920;
var h = 1080;
var fps = 60;
var duration = 60 * 10;
var framesNum = fps * duration;

var url = '/?project=grid';

setTimeout(main);

function main(){
  var window = new browser.Window(w, h, url);

  window.addEventListener('_ready', () => {
    render(window);
  });
}

function render(window){
  var canvas = window._canvases[0];
  var pr = new Presentation(w, h, fps);

  pr.render('-vid/1.mp4', async (w, h, g, g1) => {
    g1.font = '48px arial';

    var evt = {
      type: null,
      data: null,
    };

    for(var index = 0; index < 100; index++){
      await pr.caption(`index: ${index}`);

      evt.type = 'import';
      evt.data = '';
      window.emit('_msg', evt);
      pressKey('Digit1');
      g1.drawImage(canvas, 0, 0);
      await pr.fade();
      await pr.wait(1e3);

      var obj = Object.create(null);
      var str = '';
      var iter = 0;

      while(1){
        evt.type = 'import';
        evt.data = str;
        window.emit('_msg', evt);

        pressKey('Enter');
        pressKey('Digit1');
        g.drawImage(canvas, 0, 0);
        await pr.frame();

        evt.type = 'export';
        window.emit('_msg', evt);
        str = evt.data;

        var sha512 = hash(str);
        if(sha512 in obj)
          break;

        obj[sha512] = iter++;

        str = str.match(/[0-9a-f]{2}/gi).map(a => parseInt(a, 16));
        str[index] ^= 0xFF;
        str = str.map(a => a.toString(16).padStart(2, '0')).join('');
      }

      await pr.wait(3e3);
      await pr.fadeOut();

      await pr.caption(`iterations: ${iter}, sequence length: ${iter - obj[sha512]}`);
    }
  });

  function pressLetter(letter){
    pressKey(`Key${letter.toUpperCase()}`);
  }

  function pressKey(key){
    window.emit('keydown', {code: key});
    window.emit('keyup', {code: key});
  }
}