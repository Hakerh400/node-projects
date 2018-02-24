'use strict';

var fs = require('fs');
var path = require('path');
var {Canvas} = require('../media/node_modules/canvas');
var O = require('../framework');
var fsRec = require('../fs-recursive');
var identGenerator = require('../ident-generator');
var tempDir = require('../temp-dir')(__filename);
var whiteListedIdents = require('./whitelisted-idents.json');
var skipIdents = require('./skip-idents.json');

var identsFile = path.join(tempDir, 'idents.txt');

var whiteList = generateWhiteList();

module.exports = {
  minify
};

function generateWhiteList(){
  var arr = whiteListedIdents;

  var g = new Canvas(1, 1).getContext('2d');
  var CanvasRenderingContext2D = g.constructor;

  [
    Number,
    String,
    RegExp,
    Array,
    Object,
    Function,
    CanvasRenderingContext2D,
  ].forEach(cs => {
    var idents = Object.getOwnPropertyNames(cs.prototype);
    idents.push(cs.name);

    idents.forEach(ident => {
      if(!arr.includes(ident)){
        arr.push(ident);
      }
    });
  });

  arr = arr.concat(skipIdents);

  arr = arr.filter((a, b, c) => {
    return c.indexOf(a) == b;
  });

  O.sortAsc(arr);

  return arr;
}

function minify(input, output, cb = O.nop){
  if(fs.existsSync(output)){
    fsRec.deleteFilesSync(output);
  }

  fsRec.processFilesSync(input, d => {
    if(!d.isDir && path.parse(d.name).ext.slice(1) == 'js'){
      var data = fs.readFileSync(d.fullPath);
      minifyFile(data.toString(), false);
    }
  });

  fsRec.processFilesSync(input, d => {
    if(d.processed) return;

    var relativePath = d.relativePath.split`\\`.slice(1).join`\\`;
    var outputPath = path.join(output, relativePath);

    if(d.isDir){
      fs.mkdirSync(outputPath);
    }else{
      var data = fs.readFileSync(d.fullPath);

      if(path.parse(d.name).ext.slice(1) == 'js'){
        data = minifyFile(data.toString(), true);
      }

      fs.writeFileSync(outputPath, data);
    }
  });

  cb(null);
}

function minifyFile(str, minify = false){
  var templateStrings = [];
  var funcStrings = [];
  var strings = [];
  var regs = [];
  var sources = [str];

  var iter = 0;

  do{
    var found = false;
    var mainSourcesTemp = [];

    sources.forEach((str, index) => {
      var sourcesTemp = [];

      str = str.replace(/new Function\(\'[a-z0-9]+\'(?:\, \'[a-z0-9]+\')*|setTileParams\(\[[^\]]*/gi, string => {
        found = true;
        var srcTemp = [];

        string = string.replace('new Function', '\u1234');
        string = string.replace(/\s+/g, '');
        string = string.replace('\u1234', 'new Function');

        string = string.replace(/[a-z0-9]+/gi, code => {
          var isWhitelisted = [
            'new',
            'Function',
            'setTileParams',
          ].includes(code);

          if(isWhitelisted) return code;

          srcTemp.push(code);
          return '\x00\x04';
        });

        sourcesTemp = sourcesTemp.concat(srcTemp);
        funcStrings.push(string);

        return '\x00\x00';
      });

      mainSourcesTemp = mainSourcesTemp.concat(sourcesTemp.reverse());
      sourcesTemp = [];

      str = str.replace(/\`(?:\\.|\$\{[^\}]+\}|[^\`])*\`/g, string => {
        found = true;
        var srcTemp = [];

        string = string.replace(/\$\{[^\}]+\}/g, code => {
          srcTemp.push(code);
          return '\x00\x04';
        });

        sourcesTemp = sourcesTemp.concat(srcTemp);
        templateStrings.push(string);

        return '\x00\x01';
      });

      mainSourcesTemp = mainSourcesTemp.concat(sourcesTemp.reverse());
      sourcesTemp = [];

      str = str.replace(/\'(?:\\.|[^\'])*\'/g, string => {
        found = true;
        strings.push(string);
        return '\x00\x02';
      });

      str = str.replace(/\/[^ \/]+\/[gimyu]*/g, regex => {
        found = true;
        regs.push(regex);
        return '\x00\x03';
      });

      str = str.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, comment => {
        found = true;
        return ' ';
      });

      str = str.replace(/(^|[^0-9A-Za-z])(true|false)([^0-9A-Za-z]|$)/g, (match, a, b, c) => {
        found = true;
        return `${a}(!${b == 'true' ? '0' : '1'})${c}`;
      });

      sources[index] = str;
    });

    sources = sources.concat(mainSourcesTemp.reverse());

    iter++;
  }while(found);

  processSources(sources, minify);
  str = sources.shift();

  if(minify){
    funcStrings.forEach((str, index) => {
      str = str.replace(/setTileParams/g, () => {
        return convertIdentName('setTileParams');
      });

      funcStrings[index] = str;
    });
  }

  do{
    var found = false;

    [
      funcStrings,
      templateStrings,
      strings,
      regs,
    ].reverse().forEach((arr, index, arrs) => {
      index = arrs.length - index - 1;

      str = str.replace(new RegExp(`\x00${String.fromCharCode(index)}`, 'g'), () => {
        found = true;
        var str = arr.shift();

        if(index < 2){
          str = str.replace(/\x00\x04/g, () => {
            return sources.shift();
          });
        }

        return str;
      });
    });
  }while(found);

  return str;
}

function processSources(arr, minify = false){
  if(!processSources.idents){
    processSources.idents = [];
    processSources.idents.sorted = false;
  }

  var idents = processSources.idents;
  var reg = /[a-z0-9\_]/i;
  var identReg = /[a-z0-9\_]+(?:\.[a-z0-9\_]+)*/gi;

  if(minify && !idents.sorted){
    O.sortAsc(idents);
    idents.sorted = true;

    fs.writeFileSync(identsFile, exportIdents(idents));
  }

  arr.forEach((str, index) => {
    str = `#${str}#`;
    str = str.replace(/\S/g, a => a + a);

    do{
      var found = false;

      str = str.replace(/(\S)\s+(\S)/g, (a, b1, b2) => {
        var space = reg.test(b1) && reg.test(b2);
        var char = space ? ' ' : '';
        var str = `${b1}${char}${b2}`;

        if(str.length < a.length){
          found = true;
        }

        return str;
      });
    }while(found);

    str = str.replace(/\S\S/g, a => a[0]);

    str = str.replace(identReg, identsList => {
      identsList = identsList.split`.`;
      if(/^[0-9]/.test(identsList[0])) return identsList.join`.`;

      for(var i = 0; i < identsList.length; i++){
        var ident = identsList[i];

        if(!minify){
          if(whiteList.includes(ident)){
            if(skipIdents.includes(ident)) continue;
            else break;
          }

          if(!idents.includes(ident)){
            idents.push(ident);
          }
        }else{
          var index = idents.indexOf(ident);

          if(!~index){
            if(skipIdents.includes(ident)) continue;
            else break;
          }

          ident = generateIdentName(index);
          identsList[i] = ident;
        }
      }

      return identsList.join`.`;
    });

    arr[index] = str.substring(1, str.length - 1);
  });
}

function exportIdents(idents){
  return idents.map((ident, index) => {
    return `${generateIdentName(index).padEnd(5)}${ident}`;
  }).join`\n`;
}

function generateIdentName(index){
  var ident = identGenerator.generate(index + 1);
  while(whiteList.includes(ident)) ident += '_';
  return ident;
}

function convertIdentName(name){
  var index = processSources.idents.indexOf(name);
  return generateIdentName(index);
}