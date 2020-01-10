'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const wts = require('worker_threads');
const O = require('../omikron');
const readline = require('../readline');
const port = require('./port');

const WORKERS_NUM = 3;
const TIMEOUT = 1e3;

const cwd = __dirname;
const workerScript = path.join(cwd, 'worker.js');

const rl = readline.rl();
const server = http.createServer().listen(port);

const workers = O.ca(WORKERS_NUM, () => null);

const mEmpty = O.sem(1);
const mFull = O.sem(0);
const mRestart = O.sem(1);

const main = async () => {
  server.on('request', onReq);

  await start();

  rl.on('line', () => {
    restart().catch(error);
  });

  rl.on('sigint', () => {
    rl.close();
    server.close();
    close().catch(error);
  });
};

const start = async () => {
  await mEmpty.wait();
  log('start');
  
  for(let i = 0; i !== WORKERS_NUM; i++)
    workers[i] = new wts.Worker(workerScript);

  mFull.signal();
};

const close = async () => {
  await mFull.wait();
  log('close');

  for(let i = 0; i !== WORKERS_NUM; i++){
    const worker = workers[i];
    worker.terminate();
    workers[i] = null;
  }
  
  mEmpty.signal();
};

const restart = async () => {
  await mRestart.wait();
  log.inc('restart');

  await close();
  await O.waita(TIMEOUT);
  await start();

  log.dec();
  mRestart.signal();
};

const onReq = (req, res) => {
  restart().catch(error);
  req.resume();
  res.end();
};

const error = err => {
  process.exitCode = 1;
  O.exit(err);
};

main().catch(error);