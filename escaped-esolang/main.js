'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');

const DEBUG = 0;

const cwd = __dirname;
const srcFile = path.join(cwd, 'prog.txt');

const GeneratorFunction = function*(){}.constructor;

const main = () => {
  let src = O.rfs(srcFile, 1).
    replace(/[\.\#\*\@\<\>]/g, a => ` ${['arg', 'func', 'call', 'pair', 'fst', 'snd']['.#*@<>'.indexOf(a)]} `).
    replace(/(?<=[a-z]\b|[\)\]\|])(?!\s*(?:[\)\]\|]|$))/g, ',');

  // O.exit(src);

  while(/[\[\]]/.test(src)){
    const srcPrev = src;

    src = src.replace(/\[([^\[\]]*)\]/, (a, b) => {
      return `\`${b.replace(/\`/g, `\\\``)}\``;
    });

    assert(src !== srcPrev);
  }

  src = src.
    replace(/(?=call|pair|fst|snd)/g, '[').
    replace(/\[/g, 'yield[').
    replace(/\|/g, ']').
    replace(/[01]+/g, a => `'${a}'+`);

  // O.exit(src);

  const input = '1011';
  const result = O.rec(call, initInput(input), src);
  const output = parseOutput(result);

  log(output);
};

const call = function*(arg, src0=null, src1=null){
  arg = arg.replace(/\@+$/g, '');

  const src = arg.startsWith('1') ? src1 : src0;
  assert(src !== null);

  arg = arg.slice(1);

  if(DEBUG){
    log(src);
    log();
    log('.'.repeat(20));
    log();
    log(arg);
    O.logb();
  }

  const func = new GeneratorFunction(
    'arg, func, call, pair, fst, snd',
    `return(${src})`,
  );

  const result = yield [func, arg, src, call, pair, fst, snd];

  if(typeof result !== 'string'){
    O.logb();
    log(typeof result);
    log();
    log(result);
    O.logb();
    assert.fail();
  }

  return result;
};

const pair = function*(str1, str2){
  if(!(str1 || str2)) return '';

  return (
    (str1[0] || '@') +
    (str2[0] || '@') +
    (yield [pair, str1.slice(1), str2.slice(1)])
  );
};

const fst = function*(str){
  if(str === '') return '';
  if(str.startsWith('@')) return '';

  return str[0] + (yield [fst, str.slice(2)]);
};

const snd = function*(str){
  return O.tco(fst, str.slice(1));
};

const initInput = str => {
  return `0${str.replace(/./g, a => `1${a}`)}`;
};

const parseOutput = str => {
  let s = '';

  while(str.startsWith('1')){
    s += str[1] === '1' ? '1' : '0';
    str = str.slice(2);
  }

  return s;
};

main();