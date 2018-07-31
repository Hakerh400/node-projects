'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const Presentation = require('../presentation');
const functional = require('../functional');
const formatFileName = require('../format-file-name');
const VisualConsole = require('../visual-console');

const cwd = __dirname;
const srcFile = path.join(cwd, 'src.txt');
const inputFile = path.join(cwd, 'input.txt');

const w = 1920;
const h = 1080;
const fps = 60;
const fast = 0;

const sx = 8;
const sy = 12;

const IO = functional.io.IOBit;

const cols = {
  bg: new O.Color(0, 0, 0),
  text: new O.Color(192, 192, 192),
  heading: new O.Color(0, 255, 0),
};

setTimeout(main);

async function main(){
  var img = await VisualConsole.getCharsImg();
  render(img);
}

function render(img){
  var src = fs.readFileSync(srcFile, 'ascii');
  src = functional.normalize(src);

  var input = fs.readFileSync(inputFile);
  if(IO === functional.io.IOBit)
    input = input.toString('ascii');

  var pr = new Presentation(w, h, fps, fast);

  pr.render('-vid/1.mp4', async (w, h, g, g1) => {
    await pr.frame();

    var vcon = new VisualConsole(g, img, sx, sy, cols.bg, cols.text);

    await sect('IO format', IO.name());

    await sect('Source code', src);
    await sect('Input', input);

    var output = functional.run(src, input, IO);
    await sect('Output', output);

    await pr.wait(60e3);
    await pr.fadeOut();

    async function sect(title, body, col=null){
      await print(title, 1);

      if(col !== null) vcon.setTextCol(col);
      await print(body);
      if(col !== null) vcon.setTextCol(cols.text);
    }

    async function print(str, heading=0){
      if(heading){
        vcon.setTextCol(cols.heading);

        var hStr = '='.repeat(5);
        str = `${hStr} ${str} ${hStr}`;
      }

      str = `${str}\n\n`;

      for(var i = 0; i !== str.length; i++){
        vcon.print(str[i]);
        await pr.frame();
      }

      if(heading) vcon.setTextCol(cols.text);
    }
  });
}