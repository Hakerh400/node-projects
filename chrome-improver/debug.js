'use strict';

var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var nop = require('./nop.js');

const VERBOSE = true;

var logDir = 'log';
var logFile = 'log.hex';

var indentSize = 2;
var indentLevel = 0;

var logStream = null;

module.exports = {
  init,
  log,
  info,
  verbose,
  err,
  write,
  exit,
  getIndent,
  setIndent,
  incIndent,
  decIndent,
  indentStr
};

function init(cb = nop){
  if(fs.existsSync(logDir)){
    return openLogFile(cb);
  }

  fs.mkdir(logDir, err => {
    if(err) cb(err);
    openLogFile(cb);
  });
}

function openLogFile(cb = nop){
  var logFilePath = path.join(logDir, logFile);

  try{
    var gzip = zlib.createGzip();
    var fsStream = fs.createWriteStream(logFilePath);

    gzip.pipe(fsStream);
    logStream = gzip;

    info('Debug interface created successfully.');
    cb();
  }catch(err){
    cb(err);
  }
}

function log(str, newLine = true){
  str = `${str}`;
  str = indentStr(str, indentLevel);

  if(newLine) write(str);
  displayStr(str, newLine);
}

function info(str, newLine = true){
  str = strLabel(str, '[INFO]');
  str = indentStr(str, indentLevel);

  write(str, newLine);
}

function verbose(str, newLine = true){
  if(!VERBOSE) return;

  str = strLabel(str, '[VERBOSE]');
  str = indentStr(str, indentLevel);

  write(str, newLine);
}

function err(err){
  var str = err;

  if(str instanceof Error){
    str = str.message;
  }

  str = strLabel(str, '[ERROR]');
  str = indentStr(str, indentLevel);

  displayStr(str);
  write(str);
}

function write(str, newLine = true){
  if(newLine) str += '\n';
  logStream.write(str);
}

function strLabel(str, label, space = true){
  str = `${str}`;

  var labelStr = `${label}${space ? ' ' : ''}`;
  var indent = ' '.repeat(labelStr.length);

  str = str.split`\n`;

  str = str.map((line, index) => {
    line = line.trim();

    if(!index){
      return `${labelStr}${line}`;
    }else{
      return `${indent}${line}`;
    }
  });

  str = str.join`\n`;

  return str;
}

function exit(){
  info('Closing debug interface.', false);
  logStream.end();
}

function indentStr(str, indentLevel = 0){
  var indent = ' '.repeat(indentLevel * indentSize);

  str = str.split`\n`;
  str = str.map(line => `${indent}${line}`);
  str = str.join`\n`;

  return str;
}

function displayStr(str, newLine = true){
  var newLineStr = newLine ? '\n' : '';

  process.stdout.write(`${str}${newLineStr}`);
}

function getIndent(){
  return indentLevel;
}

function setIndent(indent){
  indentLevel = indent;
}

function incIndent(){
  indentLevel++;
}

function decIndent(){
  indentLevel--;
}