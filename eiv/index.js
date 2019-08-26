'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

class Engine{
  constructor(src, input){
    this.src = Buffer.from(src);
    this.input = Buffer.from(input);
  }

  run(){
    O.obj = () => ({});

    const src = this.src.toString();
    const io = new O.IO(this.input, 0, 1);

    const stack = [];

    O.tokenize(src, [
      /\s+/, O.nop,

      /[a-zA-Z0-9_](?:\s*[a-zA-Z0-9_])*\s*\./, (str, gs) => {
        for(const id of str.match(/[a-zA-Z0-9_]/g)){
          const def = [1, id, null];
          stack.push(def);
        }
      },

      /[a-zA-Z0-9_]/, (str, gs) => {
        let found = 0;

        for(let i = stack.length - 1; i !== -1; i--){
          const elem = stack[i];
          if(elem[0] !== 1 || O.last(elem) !== null) continue;
          if(elem[1] === str){
            found = 1;
            break;
          }
        }

        if(!found) throw new SyntaxError(`Identifier ${O.sf(str)} is not bound to any abstraction`);

        const ident = [0, str];
        const last = O.last(stack);

        if(O.last(last) === null){
          stack.push(ident);
          return;
        }
        
        O.setLast(stack, [2, last, ident]);
      },

      /\(/, (str, gs) => {
        stack.push([3, null]);
      },

      /\)/, (str, gs) => {
        const last = O.last(stack);
        if(last === null) throw new SyntaxError(`Unmatched closed parenthese`);
        if(O.last(last) === null) throw new SyntaxError(`${last[0] === 1 ? 'Abstraction' : 'Parenthesis'} cannot be empty`);

        while(stack.length !== 1){
          const elem2 = stack.pop();
          const elem1 = O.last(stack);

          if(elem1[0] === 3){
            O.setLast(stack, elem2);

            if(stack.length !== 1){
              const prev = stack[stack.length - 2];
              if(O.last(prev) !== null){
                const last = stack.pop();
                O.setLast(stack, [2, prev, last]);
              }
            }

            return;
          }

          O.setLast(elem1, elem2);
        }

        throw new SyntaxError(`Unmatched closed parenthese`);
      },
    ], 1, 1);

    if(stack.length === 0)
      throw new SyntaxError(`Expected at least one identifier`);

    while(stack.length !== 1){
      const elem2 = stack.pop();
      const elem1 = O.last(stack);
      if(elem1[0] === 3) throw new SyntaxError(`Unmatched open parenthese`);

      O.setLast(elem1, elem2);
    }

    if(stack[0][0] === 3) throw new SyntaxError(`Unmatched open parenthese`);

    const srcExpr = stack[0];

    const sym1 = Symbol();
    const sym2 = Symbol();

    const toStr = expr => {
      const stack = [expr];
      let s = '';

      while(stack.length !== 0){
        const elem = stack.pop();

        if(elem === sym1){
          if(O.last(stack)[0] !== 0){
            const last = stack.pop();
            stack.push(sym2, last);
            s += '(';
          }
          continue;
        }

        if(elem === sym2){
          s += ')';
          continue;
        }

        const type = elem[0];

        if(type === 0){
          s += elem[1];
        }else if(type === 1){
          stack.push(elem[2]);
          s += elem[1];
          if(elem[2][0] !== 1) s += '.';
        }else{
          stack.push(elem[2], sym1);
          if(elem[1][0] === 1){
            stack.push(sym2);
            s += '(';
          }
          stack.push(elem[1]);
        }
      }

      return s;
    };

    const copy = expr => {
      const stack = [expr = expr.slice()];

      while(stack.length !== 0){
        const expr = stack.pop();
        const type = expr[0];
        if(type === 0) continue;

        stack.push(expr[2] = expr[2].slice());
        if(type === 2) stack.push(expr[1] = expr[1].slice());
      }

      return expr;
    };

    const assign = (expr1, expr2, offset=0) => {
      expr1[0] = expr2[0];
      expr1[1] = expr2[1];
      expr1[2] = expr2[2];
      return expr1;
    };

    const isRedex = expr => {
      return expr[0] === 2 && expr[1][0] === 1;
    };

    const reduce = expr => {
      const abs = expr[1];
      const id = abs[1];
      const arg = expr[2];
      const stack = [abs];

      while(stack.length !== 0){
        const expr = stack.pop();
        const type = expr[0];
        if(expr !== abs && type === 1 && expr[1] === id) continue;

        const expr1 = expr[2];
        if(expr1[0] === 0){
          if(expr1[1] === id) expr[2] = copy(arg);
        }else{
          stack.push(expr1)
        }

        if(type === 2){
          const expr1 = expr[1];
          if(expr1[0] === 0){
            if(expr1[1] === id) expr[1] = copy(arg);
          }else{
            stack.push(expr1);
          }
        }
      }

      return assign(expr, abs[2]);
    };

    log(toStr(srcExpr));

    mainLoop: while(1){
      const stack = [srcExpr];

      while(stack.length !== 0){
        const expr = stack.pop();

        if(isRedex(expr)){
          reduce(expr);
          log(toStr(srcExpr));
          continue mainLoop;
        }

        const type = expr[0];
        if(type === 1) stack.push(expr[2]);
        else if(type === 2) stack.push(expr[2], expr[1]);
      }

      break;
    }

    return io.getOutput();
  }
}

module.exports = Engine;