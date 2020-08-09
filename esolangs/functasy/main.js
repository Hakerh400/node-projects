'use strict';

const fs = require('fs');
const path = require('path');
const esolangs = require('../../../esolangs');
const O = require('../../omikron');
const arrOrder = require('../../arr-order');
const logStatus = require('../../log-status');
const codeGen = require('./code-gen');

const cwd = __dirname;
const langFile = path.join(cwd, '../lang.txt');

const LANG = O.rfs(langFile, 1);

const DEBUG = 1;
const TIMEOUT = 10e3;
const INDEX_START_RANGE = [1e6, 1e9];
const TEST_NUM = 5;

const TEST = null;

const opts = {
  useBitIO: 1,
};

const sbxOpts = {
  timeout: TIMEOUT,
};

const sandbox = new esolangs.Sandbox();

const main = async () => {
  log(`Language: ${LANG}`);
  sep();

  if(TEST === null){
    for(let i = 1;; i++){
      if(DEBUG)
        logStatus(i, null, 'source code');

      const src = codeGen();

      if(DEBUG){
        log('\n');
        log(src);
        log();
      }

      const start = O.rand(...INDEX_START_RANGE);
      const end = start + TEST_NUM;
      const ok = await test(src, start, end);

      if(DEBUG){
        sep();
      }else if(ok){
        log(src)
        sep();
      }
    }
  }else{
    const start = arrOrder.id('01'.split(''), ''.split(''));
    await test(TEST, start, O.N);
  }

  sandbox.dispose();
};

const test = async (src, start, end) => {
  const outputs = O.obj();
  let length = null;

  for(let i = start; i !== end; i++){
    // i = O.rand(...INDEX_START_RANGE);

    const input = arrOrder.str('01', i);
    let output = null;

    try{
      const result = await sandbox.run(LANG, src, input, opts, sbxOpts);
      if(!result[0]) O.error(result[1]);
      output = result[1].toString();
    }catch{}

    if(DEBUG || TEST !== null){
      log([input, output].map(a => {
        if(a === null) return '...';
        if(a === '') return '/';
        return a;
      }).join(' ---> '));
    }

    if(TEST === null){
      if(output === null) return 0;
      if(output.length === 0) return 0;
      if(output in outputs) return 0;

      outputs[output] = 1;

      const len = output !== null ? output.length : -1;
      if(length === null) length = len;
      else if(len !== length) return 1;
    }
  }

  return 0;
};

const sep = () => {
  log(`\n${'='.repeat(100)}\n`);
};

main().catch(O.error);