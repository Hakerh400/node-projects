'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var fsRec = require('../fs-recursive');
var supportedExtensions = require('./supported-extensions.json');

var minIdentsLen = 5;
var idents = null;

module.exports = {
  generate,
};

function getIdents(){
  if(idents === null) idents = [];
  else idents.length = 0;

  processScripts(O.dirs.projects);
  processScripts(O.dirs.wamp);

  O.sortAsc(idents);

  function processScripts(dir){
    fsRec.processFilesSync(dir, d => {
      if(d.processed || d.isDir) return;
      if(/encrypted\\/.test(d.fullPath)) return;

      var ext = path.parse(d.name).ext.substring(1);
      if(!supportedExtensions.includes(ext)) return;

      var src = fs.readFileSync(d.fullPath).toString();
      processSource(src);
    });
  }

  function processSource(src){
    var reg = /[a-z]+/gi;
    var matches = src.match(reg);
    if(matches === null) return;

    matches.forEach(match => {
      var reg = /^[a-z]+[A-Z][a-zA-Z]+$/;
      if(!reg.test(match)) return;

      var subReg = /.[a-z]+/g;
      var subMatches = match.match(subReg);
      if(subMatches === null) return;

      subMatches.forEach(subMatch => {
        subMatch = subMatch.toLowerCase();

        if(subMatch.length < minIdentsLen) return;
        if(idents.includes(subMatch)) return;

        idents.push(subMatch);
      });
    });
  }
}

function generate(linesNum){
  if(idents === null) getIdents();

  var str = O.ca(linesNum, index => {
    return generateLine(index);
  });

  return str.join`\n`;

  function generateLine(index){
    return [
      getDate(),
      '[', randDigits(5), ']',
      O.rand(20) === 0 ? 'ERROR' : 'INFO', ': ',
      randFuncName(2),
      O.rand(5) === 0 ? ` [${randFuncName(1)}] ` : '',
      randFuncName(2),
      randVersion(),
      ` (${randFileName()})`,
    ].join``;
  }
}

function randFuncName(minLen){
  var identsNum = randInt(minLen);

  var str = O.ca(identsNum, index => {
    var ident = randIdent();
    if(index !== 0) ident = O.capitalize(ident);
    return ident;
  });

  return str.join``;
}

function randClassName(minLen){
  var identsNum = randInt(minLen);

  var str = O.ca(identsNum, index => {
    var ident = randIdent();
    if(index !== 0) ident = O.capitalize(ident);
    return ident;
  });

  return str.join``;
}

function getDate(){
  var currentDate = new Date();

  var time = getTime();
  var date = getDate();

  return `${date} ${time}`;

  function getTime(){
    var hours = getDateParam(currentDate, 'Hours', 2);
    var minutes = getDateParam(currentDate, 'Minutes', 2);

    return `${hours}:${minutes}`;
  }

  function getDate(){
    var day = getDateParam(currentDate, 'Date', 2);
    var month = getDateParam(currentDate, 'Month', 2);
    var year = getDateParam(currentDate, 'FullYear', 4);

    return `${day}-${month}-${year}`;
  }

  function getDateParam(date, param, pad){
    var offset = param === 'Month' ? 1 : 0;
    var val = date[`get${param}`]();
    var valWithOffset = val + offset;

    return valWithOffset.toString().padStart(pad, '0');
  }
}

function randDigits(len){
  return O.ca(len, () => {
    return O.rand(10);
  }).join``;
}

function randVersion(){
  return [
    O.rand(8) + 1,
    O.rand(4),
    O.rand(4),
    O.rand(200) + 1,
  ].join`.`;
}

function randFileName(ext = 'cc'){
  var name = randIdent();

  return `${name}.${ext}`;
}

function randIdent(){
  return idents[O.rand(idents.length)];
}

function randInt(min){
  var val = min;
  while(O.rand(2) === 0) val++;
  return val;
}