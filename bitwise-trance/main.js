'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const readline = require('../readline');
const BT = require('.');

const ops = [
  'jump',
  'xor',
  'read',
  'write',
];

const rl = readline.rl();

setTimeout(main);

function main(){
  const src = BT.BitBuffer.from(`
    0101.0100 0010.1100
  `);

  const eng = new BT.Engine(src);

  const tick = () => {
    eng.tick().catch(err);
  };

  const logEng = () => {
    log(`\n${eng.toString()}\n`);
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

  eng.on('beforeTick', (op, addr) => {
    log(`INSTRUCTION ${ops[op]} ${addr}`);
    logEng();
  });

  eng.on('afterTick', (op, addr) => {
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