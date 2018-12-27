'use strict';

const flags = {  
  MULTIPLE_PROGRAMS: 1,
  TOKENIZED: 0,
  PARSED: 0,
  SERIALIZED: 0,
  NORMALIZED: 0,
  VERBOSE: 1,
};

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Presentation = require('../presentation');
const VisualConsole = require('../visual-console');
const functasy = require('../functasy');

const TIME_TO_WAIT = 5e3;

const cwd = __dirname;
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

const ioCtor = functasy.IO;

const cols = {
  bg: new O.Color(0, 0, 0),
  text: new O.Color(192, 192, 192),
  h1: new O.Color(255, 255, 0),
  h2: new O.Color(0, 255, 0),
};

setTimeout(() => main().catch(log));

async function main(){
  var img = await VisualConsole.getCharsImg();

  if(flags.INCLUDE_HEADER)
    var header = O.buff2ascii(fs.readFileSync(headerFile));

  var src = O.buff2ascii(fs.readFileSync(srcFile));
  var srcs = [src];

  var input = fs.readFileSync(inputFile);
  if(ioCtor.isBit()) input = O.buff2ascii(input);
  var inputs = [input];

  if(flags.MULTIPLE_PROGRAMS){
    srcs = O.sanl(src);
    inputs = O.sanl(input);
  }

  var pr = new Presentation(w, h, fps, fast);

  await pr.render('-vid/1.mp4', async (w, h, g, g1) => {
    await pr.frame();

    var vcon = new VisualConsole(g, img, sx, sy, cols.bg, cols.text);
    var index = 0;

    await h1(`
      Functasy programming language test
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

      if(flags.TOKENIZED){
        var tokenized = functasy.tokenizer.tokenize(src);
        await h2('Tokenized', tokenized);
      }

      if(flags.PARSED){
        var parsed = functasy.parser.parse(tokenized);
        var parsedStr = parsed.toString();
        parsedStr = parsedStr.substring(1, parsedStr.length - 1);
        await h2('Parsed', parsedStr);
      }

      if(flags.SERIALIZED){
        var serialized = functasy.compiler.compile(parsed);
        await h2('Serialized', formatBuff(serialized));
      }

      if(flags.NORMALIZED){
        var normalized = functasy.normalize(serialized);
        await h2('Normalized', normalized);
      }

      var input = inputs[index] || '';
      await h2('Input', input);

      var output = functasy.run(src, input);
      await h2('Output', output);

      if(++index === srcs.length) break;
    }

    if(flags.VERBOSE)
      await pr.wait(TIME_TO_WAIT);

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