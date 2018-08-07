'use strict';

const VERBOSE = 1;
const MULTIPLE_PROGRAMS = 1;
const INCLUDE_HEADER = 1;
const NORMALIZE_SOURCE = 1;

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const Presentation = require('../presentation');
const functional = require('../functional');
const formatFileName = require('../format-file-name');
const VisualConsole = require('../visual-console');

const {IOBit, IO} = functional.io;

const cwd = __dirname;
const headerFile = path.join(cwd, 'header.txt');
const srcFile = path.join(cwd, 'src.txt');
const inputFile = path.join(cwd, 'input.txt');

const w = 1920;
const h = 1080;
const fps = 60;
const fast = 0;

const sx = 8;
const sy = 12;

const ws = w / sx | 0;
const hs = h / sy | 0;

const ioCtor = MULTIPLE_PROGRAMS ? IOBit : IO;

const cols = {
  bg: new O.Color(0, 0, 0),
  text: new O.Color(192, 192, 192),
  programHeading: new O.Color(255, 255, 0),
  sectionHeading: new O.Color(0, 255, 0),
};

setTimeout(main);

async function main(){
  var img = await VisualConsole.getCharsImg();
  render(img);
}

function render(img){
  if(INCLUDE_HEADER)
    var header = O.buff2ascii(fs.readFileSync(headerFile));

  var src = O.buff2ascii(fs.readFileSync(srcFile));
  var srcs = [src];

  var input = fs.readFileSync(inputFile);
  if(ioCtor === IOBit) input = O.buff2ascii(input);
  var inputs = [input];

  if(MULTIPLE_PROGRAMS){
    srcs = O.sanll(src);
    inputs = O.sanll(input);
  }

  srcs = srcs.map(src => {
    if(INCLUDE_HEADER) src = [header, src];
    if(NORMALIZE_SOURCE) src = functional.normalize(src);

    return src;
  });

  var pr = new Presentation(w, h, fps, fast);

  pr.render('-vid/1.mp4', async (w, h, g, g1) => {
    await pr.frame();

    var vcon = new VisualConsole(g, img, sx, sy, cols.bg, cols.text);
    var index = 0;

    while(1){
      if(VERBOSE){
        if(MULTIPLE_PROGRAMS){
          await programHeader();

          var src = srcs[index];
          var input = inputs[index];
        }

        await sect('IO format', ioCtor.name());
        await sect('Source code', src);
        await sect('Input', input);
      }

      var output = functional.run(src, input, ioCtor);
      await sect('Output', output);

      if(++index === srcs.length)
        break;
    }

    if(VERBOSE)
      await pr.wait(10e3);

    async function programHeader(){
      var char = '#';
      var chars = char.repeat(10);
      var space = ' '.repeat(2);

      var str1 = `${space}Program ${index + 1}${space}`;
      var str2 = ' '.repeat(str1.length);

      var str3 = `${chars}${str2}${chars}`;
      var str4 = `${chars}${str1}${chars}`;
      var str5 = char.repeat(str3.length);

      var str = [str5, str3, str4, str3, str5].join('\n');

      vcon.setTextCol(cols.programHeading);
      await print(str);
      vcon.setTextCol(cols.text);
    }

    async function sect(title, body, col=null){
      await print(title, 1);

      if(col !== null) vcon.setTextCol(col);
      await print(body);
      if(col !== null) vcon.setTextCol(cols.text);
    }

    async function print(str, heading=0){
      if(heading){
        vcon.setTextCol(cols.sectionHeading);

        var hStr = '='.repeat(5);
        str = `${hStr} ${str} ${hStr}`;
      }

      str = `${str}\n\n`;

      for(var i = 0; i !== str.length; i++){
        vcon.print(str[i]);
        await pr.frame();
      }

      if(heading)
        vcon.setTextCol(cols.text);
    }
  });
}