'use strict';

const fs = require('fs');
const path = require('path');
const stream = require('stream');
const O = require('../omikron');
const chunkStream = require('.');

const main = async () => {
  const st = new stream.PassThrough();

  const readChunk = () => {
    chunkStream.read(st).then(onChunk).catch(O.error);
  };

  const onChunk = buf => {
    log(String(buf));
    readChunk();
  };

  readChunk();

  chunkStream.write(st, Buffer.from('abc'));
  chunkStream.write(st, Buffer.from('ddxyz'));
};

main().catch(O.error);