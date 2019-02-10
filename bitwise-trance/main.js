'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const readline = require('../readline');
const BT = require('.');

const ops = [
  'jmp',
  'xor',
  'in',
  'out',
];

const rl = readline.rl();

setTimeout(main);

function main(){
  const src = BT.BitBuffer.from(`
    1000101110111010101001010111010
  `);

  const eng = new BT.Engine(src);

  const tick = () => {
    eng.tick().catch(err);
  };

  const logEng = () => {
    log(`\n${eng.toString()}\n`);
  };

  const formatInst = inst => {
    return `[${inst.map((a, i) => {
      return i & 1 ? ops[a] : a;
    }).join(' ')}]`;
  };

  rl.on('sigint', () => {
    O.proc.exit();
  });

  eng.on('read', cb => {
    rl.question('IN: ', bit => {
      cb(bit);
    });
  });

  eng.on('write', bit => {
    log(`OUT: ${bit}`);
  });

  eng.on('beforeTick', (inst, op, addr) => {
    log(`INSTRUCTION ${formatInst(inst)} ${ops[op]} ${addr}`);
    logEng();
  });

  eng.on('afterTick', () => {
    logEng();

    rl.question('', () => {
      log(`${'='.repeat(150)}\n`);
      tick();
    });
  });

  tick();
}

function err(err){
  setTimeout(() => {
    throw err;
  });
}