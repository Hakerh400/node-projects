'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const O = require('../omikron');
const logStatus = require('../log-status');

const ALGORITHM = 'sha512';
const LOG_PERIOD = 10;

const args = process.argv.slice(2);

const main = () => {
  if(args.length === 0)
    return O.error('Expected a file path as argument');

  const pth = args.join(' ').replace(/"/g, '');
  if(!path.isAbsolute(pth))
    return O.error('Path must be absolute');
  if(!fs.existsSync(pth))
    return O.error('File not found');

  const stat = fs.statSync(pth);
  if(!stat.isFile())
    return O.error('Path must be a file');

  const fileSize = stat.size;
  const readStream = fs.createReadStream(pth);
  const hash = crypto.createHash(ALGORITHM);

  let logIndex = 0;
  let bytesProcessed = 0;

  readStream.on('data', buf => {
    bytesProcessed += buf.length;

    if(++logIndex === LOG_PERIOD){
      logStatus(bytesProcessed, fileSize, 'byte');
      logIndex = 0;
    }

    hash.update(buf);
  });

  readStream.on('end', buf => {
    log(hash.digest('hex'));
  });
};

main();