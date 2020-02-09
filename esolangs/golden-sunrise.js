'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const esolangs = require('../../esolangs');

const LANG = 'Golden sunrise';

const opts = {
  useBitIO: 1,
};

const safeOpts = {
  timeout: 1e3,
};

const main = async () => {
  const sandbox = new esolangs.Sandbox();

  while(1){
    const src = `
      0 - ()
      1 - ()
      # - 111
    `;
    const input = '100';
    let result = null;

    try{
      result = await sandbox.run(LANG, src, input, opts, safeOpts);
    }catch(err){
      // if(err instanceof RangeError)
        log(err.message)
      continue;
    }

    log(result.toString());
  }
};

main().catch(O.error);