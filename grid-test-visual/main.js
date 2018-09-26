'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var browser = require('../browser');
var Presentation = require('../presentation');

var url = '/?project=grid-projects&sub-project=grid';

var w = 1920;
var h = 1080;
var fps = 60;
var duration = 60 * 10;
var framesNum = fps * duration;

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

    var testsDir = path.join(__dirname, '../grid-test/tests');
    var testsNum = fs.readdirSync(testsDir).length;

    for(var i = 0; i < testsNum; i++){
      await pr.caption(`Test ${i + 1}/${testsNum}`);

      evt.type = 'import';
      evt.data = O.sanl(fs.readFileSync(path.join(testsDir, `${i + 1}.txt`), 'utf8')).join('\n').split('\n\n')[0];
      window.emit('_msg', evt);
      pressKey('Digit1');
      g1.drawImage(canvas, 0, 0);
      await pr.fade();
      await pr.wait(3e3);

      pressKey('Enter');
      pressKey('Digit1');
      g1.drawImage(canvas, 0, 0);
      await pr.fade();
      await pr.wait(3e3);

      await pr.fadeOut();
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