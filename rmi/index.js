'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const stdout = process.stdout;
const fdOut = stdout.fd;

const mainDir = 'D:/Data/rmi';
const logsDir = path.join(mainDir, 'logs');

let logFd = null;

let first = 1;
let dateOnStart = 1;

const init = () => {
  if(!fs.existsSync(logsDir))
    fs.mkdirSync(logsDir);

  initLogFd();
  overrideStdout();
};

const initLogFd = () => {
  const logIndex = getLogFileIndex();
  const logFile = path.join(logsDir, `${logIndex}.txt`);

  logFd = fs.openSync(logFile, 'a');
};

const writeLog = data => {
  let str = O.lf(String(data));
  const dateStr = `[${O.date}] `;

  if(dateOnStart){
    str = `${first ? dateStr : '\n'}${str}`;
    dateOnStart = 0;
    if(first) first = 0;
  }

  if(str.endsWith('\n')){
    str = str.slice(0, str.length - 1);
    dateOnStart = 1;
  }

  str = str.replace(/\n/g, `\n${dateStr}`);

  fs.writeSync(logFd, str);
};

const rmiLog = data => {
  writeLog(`${data}\n`);
  return data;
};

const rmiLogRaw = data => {
  writeLog(data);
  return data;
};

const overrideStdout = () => {
  const stdoutWrite = stdout.write.bind(stdout);
  const writeSync = fs.writeSync;

  stdout.write = (...args) => {
    writeLog(arg[0]);
    stdoutWrite(...args);
  };

  fs.writeSync = (...args) => {
    if(args[0] === fdOut)
      writeLog(args[1]);

    writeSync(...args);
  };
};

const getLogFileIndex = () => {
  const logFiles = fs.readdirSync(logsDir);
  const logIndices = [];

  for(const file of logFiles){
    const match = file.match(/^(\d+)\.txt$/i);
    if(match === null) continue;

    const index = BigInt(match[1]);
    if(index === 0n) continue;

    logIndices.push(index);
  }

  const logIndicesNorm = O.sortAsc(O.undupe(logIndices));
  let fileIndex = 1n;

  for(const index of logIndicesNorm){
    if(index === fileIndex){
      fileIndex++;
      continue;
    }

    break;
  }

  return fileIndex;
};

const close = () => {
  fs.closeSync(logFd);
};

module.exports = {
  mainDir,
  logsDir,

  init,
  log: rmiLog,
  logRaw: rmiLogRaw,
  close,
};