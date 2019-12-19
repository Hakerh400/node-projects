'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const assert = require('assert');
const vm = require('vm');
const cp = require('child_process');
const net = require('net');
const http = require('http');
const https = require('https');
const stream = require('stream');
const zlib = require('zlib');
const crypto = require('crypto');
const readline = require('readline');
const querystring = require('querystring');
const worker = require('worker_threads');
const O = require('../omikron');
const media = require('../media');
const textRecovery = require('../text-recovery');
const arrOrder = require('../arr-order');
const bisect = require('../bisect');
const hash = require('../hash');
const format = require('../format');
const logSync = require('../log-sync');
const debug = require('../debug');

const {
  Worker, isMainThread, parentPort, workerData,
} = require('worker_threads');

if(isMainThread){
  O.repeat(3, () => {
    new Worker(__filename);
  });
  return;
}

O.enhanceRNG();

while(1){
  const a = O.ca(1e3, () => O.rand(256));
  while(a.length !== 0) a.pop();
}