'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const browser = require('../browser');
const Presentation = require('../presentation');

const url = '/?project=other-projects&sub-project=grid';

const w = 1920;
const h = 1080;
const fps = 60;
const fast = 0;

const duration = 60 * 10;
const framesNum = fps * duration;

setTimeout(main);

function main(){
  var window = new browser.Window(w, h, url);

  window.addEventListener('_ready', () => {
    render(window);
  });
}

function render(window){
  var canvas = window._canvases[0];
  var pr = new Presentation(w, h, fps, fast);

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