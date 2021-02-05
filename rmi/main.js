'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const http = require('http');
const O = require('../omikron');
const methods = require('./methods');

const PORT = 8081;

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'x-requested-with',
  'Cache-Control': 'no-cache',
};

const sem = new O.Semaphore();

let server = null;

const main = () => {
  process.on('SIGINT', () => {
    (async () => {
      await sem.wait();
      log('Closing server');
      server.close();
    })().catch(O.exit);
  });

  server = http.createServer(onReq);

  server.listen(PORT, () => {
    log(`Server is listening on port ${PORT}`);
  });
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

const processReq = async str => {
  try{
    await sem.wait();

    log(`Request: ${str}`);
    log.inc();

    const req = JSON.parse(str);

    // log(`Request: ${
    //   methodPath.join('.')}(${
    //   args.map(a => sf(a)).join(', ')})`);

    const [methodPath, args] = req;
    const method = methodPath.reduce((obj, key) => obj[key], methods);

    const result = await method(...args);
    log(`Result: ${sf(result)}`);

    return result;
  }catch(err){
    log(`Error: ${err}`);

    if(err instanceof Error)
      throw err.message;

    throw err;
  }finally{
    log.dec();
    sem.signal();
  }
};

const setHeaders = res => {
  for(const key of O.keys(headers))
    res.setHeader(key, headers[key]);
};

const sf = val => {
  return JSON.stringify(val);
};

main();