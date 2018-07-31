'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const media = require('../media');
const Presentation = require('../presentation');
const functional = require('../functional');
const formatFileName = require('../format-file-name');
const VisualConsole = require('.');

const imgFile = formatFileName('-dw/ascii.png');

const srcFile = formatFileName('-dw/src.txt');
const input = '0';

const w = 1920;
const h = 1080;
const fps = 60;
const fast = 0;

const sx = 8;
const sy = 12;

const cols = {
  bg: new O.Color(0, 0, 0),
  text: new O.Color(192, 192, 192),
};

setTimeout(main);

async function main(){
  var img = await getImg(imgFile);

  render(img);
}

function render(img){
  var pr = new Presentation(w, h, fps, fast);

  pr.render('-vid/1.mp4', async (w, h, g, g1) => {
    await pr.frame();

    var vcon = new VisualConsole(g, img, sx, sy, cols.bg, cols.text);

    var src = fs.readFileSync(srcFile, 'ascii');
    src = functional.normalize(src);

    await print('Source:\n\n');
    await print(src);
    await print('\n\n');

    await print('Input:\n\n');
    await print(input);
    await print('\n\n');

    var output = functional.run(src, input);

    await print('Output:\n\n');
    await print(output);

    await pr.wait(10e3);
    await pr.fadeOut();

    async function print(str){
      str = String(str);

      for(var i = 0; i !== str.length; i++){
        vcon.print(str[i]);
        await pr.frame();
      }
    }
  });
}

async function getImg(){
  return await VisualConsole.getCharsImg(imgFile);
}