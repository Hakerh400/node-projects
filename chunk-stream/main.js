'use strict';

const fs = require('fs');
const path = require('path');
const stream = require('stream');
const O = require('../omikron');
const chunkStream = require('.');

const main = async () => {
  const st = new stream.PassThrough();

  const readChunk = () => {
    setTimeout(() => {
      chunkStream.read(st).then(onChunk).catch(O.error);
    }, 1e3);
  };

  const onChunk = buf => {
    log(String(buf));
    readChunk();
  };

  chunkStream.write(st, Buffer.from('abc'));
  chunkStream.write(st, Buffer.from('ddxyz'));
  st.end();

  readChunk();
};

main().catch(O.error);