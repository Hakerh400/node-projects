'use strict';

const fs = require('fs');
const path = require('path');
const wts = require('worker_threads');
const O = require('../omikron');
const readline = require('../readline');

const WORKERS_NUM = 3;
const TIMEOUT = 100;

const cwd = __dirname;
const workerScript = path.join(cwd, 'worker.js');

const rl = readline.rl();

const main = () => {
  const workers = O.ca(WORKERS_NUM, () => null);

  const start = () => {
    for(let i = 0; i !== WORKERS_NUM; i++)
      workers[i] = new wts.Worker(workerScript);
  };

  const kill = () => {
    for(let i = 0; i !== WORKERS_NUM; i++){
      const worker = workers[i];
      worker.terminate();
      workers[i] = null;
    }
  };

  start();

  rl.on('line', () => {
    kill();
    rl.pause();

    setTimeout(() => {
      rl.resume();
      start();
    }, TIMEOUT);
  });

  rl.on('sigint', () => {
    kill();
    rl.close();
  });
};

main();