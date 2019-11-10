'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const O = require('../omikron');
const esolangs = require('../../esolangs');
const arrOrder = require('../arr-order');

const CRITICAL_DEPTH = 3;
const AFTER_LOOP = 3;
const RANDOM_INPUT = 1;

const LANG = 'Seclusion';
const TIMEOUT = 3;

const main = () => {
  let code = '';

  const r = () => O.rand(2);

  const genVal = (type=null, depth=1) => {
    const star = type === 'star';
    let end = 0;

    if(!star){
      for(let i = CRITICAL_DEPTH; i <= depth; i += CRITICAL_DEPTH){
        if(!r()){
          end = 1;
          break;
        }
      }
    }

    while(1){
      if(end || !r()){
        if(end || !star && !r()){
          let n = 0;
          let i = type === 'putnum' ? 2 : 1;

          while(r()){
            if(r()) n |= i;
            i <<= 1;
          }

          n |= i;
          if(/\d/.test(O.last(code))) code += '|';
          code += n - 1;
        }else{
          if(type === 'parens') continue;

          if(type === null && !r()){
            code += '#';
            return;
          }

          code += '(';
          genVal('parens', depth + 1);

          do{
            code += ',';
            genVal('parens', depth + 1);
          }while(r());

          code += ')';
        }
      }else{
        if(star || !r()){
          if(!star && !r()){
            code += '~';
            genVal(null, depth + 1);
          }else{
            code += '%';
            genVal(null, depth + 1);
          }
        }else{
          code += '*';
          genVal('star', depth + 1);
        }
      }
      break;
    }
  };

  const blocks = [];
  const insts = new Set();
  let lastInstGlob = null;

  const push = block => {
    block.insts = new Set();
    block.lastInst = null;
    block.lastInst1 = null;
    blocks.push(block);
  };

  const pop = () => {
    const block = blocks.pop();
    const prev = O.last(blocks);
    const type = block[0];

    let inst = null

    if(type === 'ifnz' || type === 'ifodd'){
      if(block.lastInst1 !== 'move') inst = block.lastInst1;
      else inst = block.lastInst;
    }else if(type === 'wnz' || type === 'wodd'){
      if(block.insts.has('move') && block.insts.size === 1) inst = 'move';
      else inst = null;
    }

    if(prev !== null) prev.lastInst = inst;
    else lastInstGlob = inst;

    return block;
  };

  const addInst = inst => {
    const block = O.last(blocks);

    if(block !== null){
      block.lastInst = inst;
      block.insts.add(inst);
    }else{
      lastInstGlob = inst;
      insts.add(inst);
    }
  };

  let hasLoop = 0;
  let jump = 0;

  while(1){
    const block = O.last(blocks);
    const type = block !== null ? block[0] : null;
    const sizeIndex = block !== null ? (type === 'ifnz' || type === 'ifodd') && block[2] !== -1 ? 2 : 1 : null;
    const size = block !== null ? block[sizeIndex] : null;
    const lastInst = block !== null ? block.lastInst : lastInstGlob;

    if(block === null){
      if(hasLoop && lastInst !== 'move'){
        let end = 1;

        for(let i = 0; i !== AFTER_LOOP; i++){
          if(r()){
            end = 0;
            break;
          }
        }

        if(end) break;
      }
    }else{
      if(type === 'ifnz' || type === 'ifodd'){
        if(block[2] === -1){
          if(jump || !r()){
            code += ';';
            block[2] = 0;
            jump = 0;
            block.lastInst1 = lastInst;
            block.lastInst = null;
            continue;
          }
        }else{
          if((block[1] !== 0 || block[2] !== 0) && (jump || !r())){
            code += '}';
            pop();
            jump = 0;
            continue;
          }
        }
      }else if(type === 'wnz'){
        if(size !== 0 && lastInst !== 'inc' && (jump || !r())){
          code += '}';
          pop();
          jump = 0;
          continue;
        }
      }else if(type === 'wodd'){
        if(size === 0){
          if(jump || !(r() || r() || r())){
            code += '}';
            pop();
            jump = 0;
            continue;
          }
        }else{
          if(jump || !r()){
            code += '}';
            pop();
            jump = 0;
            continue;
          }
        }
      }else if(type === 'th'){
        if(size >= 2 && lastInst !== 'move' && !r()){
          code += '}';
          pop();
        }
      }
    }

    if(block !== null)
      block[sizeIndex]++;

    let opType;

    if(!r()){
      if(!r()){
        opType = 'move';
        addInst('move');
      }else{
        code += '+';
        addInst('inc');
        continue;
      }
    }else{
      if(!r()){
        if(!r()){
          opType = 'putnum';
          code += '.';
        }else{
          opType = 'putarr';
          code += '!';
        }
        addInst('put');
      }else{
        while(1){
          if(!r()){
            if(!r()){
              if(!r()){
                code += '?';
                push(['ifnz', 0, -1]);
              }else{
                code += ':';
                push(['ifodd', 0, -1]);
              }
            }else{
              if(!r()){
                code += '-';
                push(['wnz', 0]);
              }else{
                code += '/';
                push(['wodd', 0]);
              }
            }
            code += '{';
            hasLoop = 1;
          }else{
            if(!r()){
              code += '{';
              push(['th', 0]);
            }else{
              if(type === null || type === 'th') continue;
              code += '^';
              genVal();
              jump = 1;
              block.lastInst = 'jump';
              addInst('jump');
            }
          }
          break;
        }
        continue;
      }
    }

    genVal(opType);
  }

  log(`${code}\n`);

  const ctx = vm.createContext({
    run(){
      this.output = esolangs.run('Seclusion', code, this.input);
    },

    input: null,
    output: null,
  });

  const script = new vm.Script('this.run()');

  const hex = buf => {
    if(buf === null) return '?';
    return buf.toString('hex').toUpperCase();
  };

  for(const input of genInputs()){
    ctx.input = input;
    ctx.output = null;

    try{
      script.runInContext(ctx, {
        timeout: TIMEOUT * 1e3,
      });
    }catch{}

    log(`${hex(ctx.input)} ---> ${hex(ctx.output)}`);
  }
};

const genInputs = function*(){
  if(RANDOM_INPUT){
    while(1)
      yield Buffer.from(O.ca(O.randInt(0, .95), () => O.rand(256)));
    return;
  }

  const bytes = O.ca(256, i => i);
  let i = 0n;

  while(1)
    yield Buffer.from(arrOrder.arr(bytes, i++));
};

main();