'use strict';

const flags = {  
  MULTIPLE_PROGRAMS: 1,
  INCLUDE_HEADER: 0,
  TOKENIZED: 1,
  PARSED: 1,
  BYTECODE: 1,
  NORMALIZED: 1,
};

const fs = require('fs');
const path = require('path');
const O = require('../framework');
const Presentation = require('../presentation');
const functional = require('../functional');
const formatFileName = require('../format-file-name');
const VisualConsole = require('../visual-console');

const {IOBit, IO} = functional.io;

const cwd = __dirname;
const fDir = path.join(cwd, '../../Functional');;
const headerFile = path.join(fDir, 'header.txt');
const srcFile = path.join(fDir, 'src.txt');
const inputFile = path.join(fDir, 'input.txt');

const w = 1920;
const h = 1080;
const fps = 60;
const fast = 0;

const sx = 8;
const sy = 12;

const ws = w / sx | 0;
const hs = h / sy | 0;

const ioCtor = IOBit;

const cols = {
  bg: new O.Color(0, 0, 0),
  text: new O.Color(192, 192, 192),
  h1: new O.Color(255, 255, 0),
  h2: new O.Color(0, 255, 0),
};

setTimeout(main);

async function main(){
  var img = await VisualConsole.getCharsImg();
  render(img);
}

function render(img){
  if(flags.INCLUDE_HEADER)
    var header = O.buff2ascii(fs.readFileSync(headerFile));

  var src = O.buff2ascii(fs.readFileSync(srcFile));
  var srcs = [src];

  var input = fs.readFileSync(inputFile);
  if(ioCtor === IOBit) input = O.buff2ascii(input);
  var inputs = [input];

  if(flags.MULTIPLE_PROGRAMS){
    srcs = O.sanll(src);
    inputs = O.sanll(input);
  }

  var pr = new Presentation(w, h, fps, fast);

  pr.render('-vid/1.mp4', async (w, h, g, g1) => {
    await pr.frame();

    var vcon = new VisualConsole(g, img, sx, sy, cols.bg, cols.text);
    var index = 0;

    await h1(`
      Functional() programming language test
      Details: https://esolangs.org/wiki/Functional()
      Date: ${new Date().toGMTString()}
    `);

    var flagsStr = O.keys(flags).map(flag => {
      var name = flag;
      var value = flags[flag];

      return `${name}: ${value}`;
    }).join('\n');

    await h2('Flags', flagsStr);
    await h2('IO format', ioCtor.name());
    if(flags.INCLUDE_HEADER) await h2('Header', header);

    while(1){
      if(flags.MULTIPLE_PROGRAMS) await h1(`Program ${index + 1}`);
      else await h1(`Program`);

      var src = srcs[index] || '';
      await h2('Source', src);
      if(flags.INCLUDE_HEADER) src = [header, src];

      var tokenized = functional.tokenizer.tokenize(src);
      if(flags.TOKENIZED) await h2('Tokenized', tokenized);

      var parsed = functional.parser.parse(tokenized);
      var parsedStr = parsed.toString();
      parsedStr = parsedStr.substring(1, parsedStr.length - 1);
      if(flags.PARSED) await h2('Parsed', parsedStr);

      var bytecode = functional.compiler.compile(parsed);
      if(flags.BYTECODE) await h2('Bytecode', formatBuff(bytecode));

      var normalized = functional.normalize(bytecode);
      if(flags.NORMALIZED) await h2('Normalized', normalized);

      var input = inputs[index] || '';
      await h2('Input', input);

      var output = functional.run(bytecode, input, ioCtor);
      await h2('Output', output);

      if(++index === srcs.length) break;
    }

    if(flags.VERBOSE) await pr.wait(10e3);

    async function h1(strs){
      if(Array.isArray(strs)) strs = strs.join('\n');
      strs = O.sanl(strs.trim());
      strs = strs.map(str => str.trim());

      var maxLen = strs.reduce((len, str) => {
        return Math.max(str.length, len);
      }, 0);

      var indent = 5;
      var indentSpace = 2;
      var spaceSize = indentSpace * 2 + maxLen;

      var str1 = '#'.repeat(indent);
      var str2 = `${str1}${'#'.repeat(spaceSize)}${str1}`
      var str3 = `${str1}${' '.repeat(spaceSize)}${str1}`

      var str = strs.map(str => {
        str = `${' '.repeat(spaceSize - str.length >> 1)}${str}`;
        str = str.padEnd(spaceSize);

        return `${str1}${str}${str1}`;
      }).join('\n');

      str = [str2, str3, str, str3, str2].join('\n');

      await print(str, 2, cols.h1);
    }

    async function h2(title, body){
      var str1 = '='.repeat(5);
      var str = `${str1} ${title} ${str1}`;

      await print(str, 2, cols.h2);
      await print(body, 2);
    }

    async function print(str, newLines=0, col=cols.text){
      vcon.setTextCol(col);
      str = String(str);

      var newLinesStr = '\n'.repeat(newLines);
      str = `${str}${newLinesStr}`;

      for(var i = 0; i !== str.length; i++)
        await printChar(str[i])
    }

    async function printChar(char){
      if(!(O.static in printChar)){
        var obj = printChar[O.static] = O.obj();
        obj.spacesNum = 0;
      }else{
        var obj = printChar[O.static];
      }

      if(char === ' '){
        obj.spacesNum++;
        return;
      }

      var spacesStr = ' '.repeat(obj.spacesNum);
      obj.spacesNum = 0;

      var str = `${spacesStr}${char}`;
      vcon.print(str);

      await pr.frame();
    }
  });
}

function formatBuff(buff){
  return buff.toString('hex').toUpperCase();
}