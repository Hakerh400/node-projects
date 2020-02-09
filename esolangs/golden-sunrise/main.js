'use strict';

const fs = require('fs');
const path = require('path');
const esolangs = require('../../../esolangs');
const O = require('../../omikron');
const arrOrder = require('../../arr-order');
const codeGen = require('./code-gen');

const LANG = 'Golden sunrise';

const TIMEOUT = 2e3;

const opts = {
  useBitIO: 1,
};

const sbxOpts = {
  timeout: TIMEOUT,
};

const main = async () => {
  const sandbox = new esolangs.Sandbox();

  while(1){
    const src = codeGen();

    log(src);
    log(`\n${'='.repeat(100)}\n`);

    for(let i = 0;; i++){
      const input = arrOrder.str('01', i);
      let output = null;

      try{
        const result = await sandbox.run(LANG, src, input, opts, sbxOpts);
        if(!result[0]) O.error(result[1]);
        output = result[1].toString();
      }catch{}

      log([input, output].map(a => {
        if(a === null) return '...';
        if(a === '') return '/';
        return a;
      }).join(' ---> '));
    }

    break;
  }

  sandbox.dispose();
};

main().catch(O.error);