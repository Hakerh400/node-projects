'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const http = require('http');
const O = require('../omikron');
const readline = require('../readline');
const rmi = require('.');
const methods = require('./methods');

const PORT = 8081;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-requested-with',
  'Cache-Control': 'no-cache',
};

const sem = new O.Semaphore();

const rl = readline.rl();

let server = null;

const main = async () => {
  rmi.init();

  server = http.createServer(onReq);

  server.listen(PORT, () => {
    log(`Server is listening on port ${PORT}`);
  });

  rl.on('line', str => {
    cmd([`> ${str}`], async () => {
      str = str.trim();

      if(str === '')
        return;

      if(str === 'q' || str === 'exit'){
        exit();
        return;
      }

      if(str.includes('.'))
        return await str.split('.').reduce((a, b) => a[b], methods)();

      log(`Unknown command`);
    }).catch(O.nop);
  });
};

const cmd = async (cmdInfo, func) => {
  await sem.wait();

  if(Array.isArray(cmdInfo)){
    rmi.log(cmdInfo);
  }else{
    log(cmdInfo);
  }

  log.inc();

  try{
    return await func();
  }catch(err){
    const isErr = err instanceof Error;
    
    log(`Error: ${isErr ? err.stack : err}`);

    if(isErr)
      throw err.message;

    throw err;
  }finally{
    log.dec();
    sem.signal();
  }
};

const onReq = (req, res) => {
  setHeaders(res);

  const bufs = [];

  req.on('data', buf => {
    bufs.push(buf);
  });

  req.on('end', () => {
    if(req.method !== 'POST'){
      res.end(sf([1, 'Request method must be POST']));
      return;
    }

    const str = Buffer.concat(bufs).toString();

    processReq(str).then(result => {
      res.end(sf([0, result]));
    }).catch(err => {
      res.end(sf([1, err]));
    });
  });

  req.on('error', () => {
    log('Request error');
  });
};

const processReq = str => {
  return cmd(`Request: ${str}`, async () => {
    const req = JSON.parse(str);
    const [methodPath, args] = req;

    const errPth = () => {
      throw `Unknown method ${O.sf(methodPath.join('.'))}`;
    };

    const method = methodPath.reduce((obj, key) => {
      const val = obj[key];
      if(val === undefined) errPth();
      return val;
    }, methods);

    if(typeof method !== 'function')
      errPth();

    const result = await method(...args);

    if(result !== undefined)
      log(`Result: ${sf(result)}`);

    return result;
  });
};

const setHeaders = res => {
  for(const key of O.keys(headers))
    res.setHeader(key, headers[key]);
};

const exit = () => {
  (async () => {
    await sem.wait();

    log('Closing server');

    server.close();
    rl.close();
    rmi.close();
  })().catch(O.exit);
};

const sf = (val=null) => {
  return JSON.stringify(val);
};

main();