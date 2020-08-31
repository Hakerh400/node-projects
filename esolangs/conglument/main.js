'use strict';

const fs = require('fs');
const path = require('path');
const esolangs = require('../../../esolangs');
const O = require('../../omikron');
const arrOrder = require('../../arr-order');
const codeGen = require('./code-gen');

const cwd = __dirname;
const langFile = path.join(cwd, '../lang.txt');

const LANG = O.rfs(langFile, 1);

const DEBUG = 0;
const TIMEOUT = 2e3;
const INDEX_START_RANGE = [1e6, 1e9];
const TEST_NUM = 5;

const TEST = null;

const opts = {
  minify: 0,
  format: 0,
};

const sbxOpts = {
  timeout: TIMEOUT,
};

const sandbox = new esolangs.Sandbox();

const main = async () => {
  log(`Language: ${LANG}`);
  O.logb();

  let srcIndex = 0;

  if(TEST === null){
    for(let i = 1;; i++){
      if(DEBUG)
        log(`Processing source code ${++srcIndex}`);

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
        O.logb();
      }else if(ok){
        // log(src)
        // O.logb();
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
  let has0 = 0;
  let has1 = 0;

  let ss = [];
  let ok = 0;

  for(let i = start; i !== end; i++){
    // i = O.rand(...INDEX_START_RANGE);

    const input = arrOrder.str('01', i);
    let output = null;

    try{
      const result = await sandbox.run(LANG, src, input, opts, sbxOpts);

      if(!result[0]){
        log(src);
        O.error(result[1]);
      }

      output = result[1].toString();
    }catch{}

    const s = [input, output].map(a => {
      if(a === null) return '...';
      // if(a === '') return '/';
      return a;
    }).join(' ---> ');

    if(DEBUG || TEST !== null) log(s);
    ss.push(s);

    if(output !== null){
      if(!has0 && output.includes('0')) has0 = 1;
      if(!has1 && output.includes('1')) has1 = 1;
    }

    if(TEST === null && !ok){
      if(output === null) return 0;
      if(output.length === 0 && length === null) return 0;
      // if(output in outputs) return 0;

      outputs[output] = 1;

      const len = output !== null ? output.length : -1;

      if(length === null){
        length = len;
      }else if(len !== length){
        ok = 1;
      }
    }
  }

  if(ok && has0 && has1){
    log(src);
    log();
    log(ss.join('\n'));
    O.logb();
    return 1;
  }

  return 0;
};

main().catch(O.error);