'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../../../omikron');
const debug = require('../../../debug');

O.enhanceRNG();
O.randSeed(1);

const r = O.rand;
const ri = O.randInt;

const codeGen = () => {
  const rules = O.obj();
  const pending = O.obj();
  const stack = [];

  const hasPrefix = lhs => {
    for(let i = 0; i !== lhs.length + 1; i++){
      const prefix = lhs.slice(0, i);
      if(hasRule(prefix)) return 1;
      if(has(prefix)) return 1;
    }
  };

  const has = lhs => {
    return lhs in pending;
  };

  const get = lhs => {
    assert(has(lhs));
    return pending[lhs];
  };

  const push = (...lhsArr) => {
    for(const lhs of lhsArr){
      assert(!hasPrefix(lhs));

      pending[lhs] = stack.length;
      stack.push(lhs);
    }
  };

  const pushAll = lhs => {
    log('\n\n---> ' + O.sf(lhs));
    debug();

    for(let i = 0; i !== lhs.length + 1; i++){
      const prefix = lhs.slice(0, i);

      log('\n\n________________\n\n');
      log.inc();
      O.logf({
        rules,
        pending: O.keys(pending).join(' '),
        stack: stack.join(' '),
      });
      log.dec();
      log('\n\n________________\n\n');
      log(O.sf(lhs), O.sf(prefix));
      log(hasRule(prefix) | 0, has(prefix) | 0);
      debug();

      if(hasRule(prefix)){
        assert(!has(prefix));
        const rhs = getRule(prefix);

        removeRule(prefix);
        addRule(`${lhs}0`, rhs);

        break;
      }else if(has(prefix)){
        const index = pending[prefix];
        assert(stack.length > index);
        assert(stack[index] === prefix);

        const lhsNew = `${lhs}0`;

        stack[index] = lhsNew;
        delete pending[prefix];

        assert(!has(lhsNew));
        pending[lhsNew] = index;

        break;
      }
    }

    for(let i = 0; i !== lhs.length + 1; i++){
      const prefix = lhs.slice(0, i);

      for(const suffix of '01#'){
        const lhsNew = `${prefix}${suffix}`;

        log('\n\n#################################################\n\n');
        log.inc();
        O.logf({
          rules,
          pending: O.keys(pending).join(' '),
          stack: stack.join(' '),
        });
        log(lhsNew);
        log(hasPrefix(lhsNew) ? 'has prefix' : 'does not have prefix');
        log.dec();
        log('\n\n#################################################\n\n');
        debug();

        if(hasPrefix(lhsNew)) continue;

        push(lhsNew);
      }
    }

    log('\n\n################# AFTER #########################\n\n');
    log.inc();
    O.logf({
      rules,
      pending: O.keys(pending).join(' '),
      stack: stack.join(' '),
    });
    log.dec();
    log('\n\n#################################################\n\n');
    debug();
  };

  const pop = () => {
    assert(stack.length !== 0);

    const lhs = stack.pop();
    remove(lhs);

    return lhs;
  };

  const remove = lhs => {
    assert(has(lhs));
    delete pending[lhs];
  };

  const hasRule = lhs => {
    return lhs in rules;
  };

  const addRule = (lhs, rhs) => {
    assert(!hasPrefix(lhs));
    rules[lhs] = rhs;
  };

  const getRule = lhs => {
    assert(hasRule(lhs));
    return rules[lhs];
  };

  const removeRule = lhs => {
    assert(hasRule(lhs));
    delete rules[lhs];
  };

  pushAll('');

  const genRhs = () => {
    let rhs = '';
    let parens = 0;
    let hasArg = 0;
    let hasParens = 0;

    while(1){
      if(hasParens && hasArg && r()){
        if(parens === 0) break;

        rhs += ')';
        parens--;

        continue;
      }

      if(r()){
        if(r()){
          rhs += '(';
          parens++;
          hasArg = 0;
          hasParens = 1;
        }else{
          rhs += '.';
          hasArg = 1;
        }
      }else{
        rhs += r();
      }
    }

    if(rhs === '')
      rhs = '/';

    return rhs;
  };

  const genBitArr = () => {
    let rhs = '';

    while(r())
      rhs += r();

    if(rhs === '')
      rhs = '/';

    return rhs;
  };

  while(stack.length !== 0){
    O.logf({
      rules,
      pending: O.keys(pending).join(' '),
      stack: stack.join(' '),
    });

    const lhs = O.last(stack);

    if(lhs.endsWith('#')){
      pop();
      addRule(lhs, genBitArr());
      continue;
    }

    const len = lhs.length;
    let lenNew = 0;

    while(r())
      lenNew++;

    const lenDif = Math.max(lenNew - len, 0);
    const lhsNew = `${lhs}${'0'.repeat(lenDif)}`;

    pushAll(lhsNew);

    let rhs;

    genRhsLoop: while(1){
      rhs = genRhs(lhs);

      for(const match of O.exec(rhs, /\(([01]+)/g))
        if(match[1].startsWith(lhs))
          continue genRhsLoop;

      break;
    }

    log('='.repeat(100));
    O.logf({
      rules,
      pending: O.keys(pending).join(' '),
      stack: stack.join(' '),
    });
    log(lhs);
    log(lhsNew);
    log('='.repeat(100));

    const index = get(lhsNew);
    remove(lhsNew);

    assert(index < stack.length);
    assert(stack[index] === lhsNew);

    if(index === stack.length - 1){
      stack.pop();
    }else{
      const lhs = stack.pop();
      assert(pending[lhs] === stack.length);
      stack[index] = lhs;
      pending[lhs] = index;
    }

    addRule(lhsNew, rhs);

    for(const match of O.exec(rhs, /\(([01]+)/g))
      pushAll(log(match[1]));
  }

  return O.keys(rules).sort((lhs1, lhs2) => {

  }).map(lhs => {
    return `${lhs} - ${rules[lhs]}`;
  }).join('\n');
};

module.exports = codeGen;