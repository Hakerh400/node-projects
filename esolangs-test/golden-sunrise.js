'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const esolangs = require('../esolangs');

const LANG = 'Golden sunrise';

const opts = {
  useBitIO: 1,
};

const main = () => {
  const src = `
    0 - (1)
    1 - ()
    # - 111
  `;
  const input = '100';
  const output = esolangs.run(LANG, src, input, opts);

  log(output.toString());
};

main();