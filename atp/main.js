'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Table = require('../table');

const DEBUG = 0;

const main = () => {
  const target = new Implication(
    new Implication(
      new Identifier(),
      new Identifier(),
    ),
    new Implication(
      new Identifier(),
      new Identifier(),
    ),
  );

  const queue = [new Path()];
  const found = O.obj();
  const t = O.now;

  mainLoop: while(1){
    const {state, rules} = queue.shift();

    for(let i = rulesNum - 1; i !== -1; i--){
      const s = rulesArr[i](state.clone());
      if(s === null) continue;

      const r = rules.slice();
      r.push(i);

      const path = new Path(r, s);
      const {lastAdded} = s;

      if(lastAdded !== null){
        if(lastAdded.eq(target)){
          if(DEBUG) log('\n');
          else log('');
          log(`Found proof in ${((O.now - t) / 1e3).toFixed(3)} seconds\n`);
          log(String(path));
          break mainLoop;
        }

        if(DEBUG){
          const str = lastAdded.toString();
          if(!(str in found)){
            found[str] = 1;
            log(str);
          }
        }
      }

      queue.push(path);
    }
  }
};

const rulesObj = {
  ['Push identifier'](s){
    const {exprs, stack} = s;

    stack.push(new Identifier());

    return s;
  },

  ['Construct Implication'](s){
    const {exprs, stack} = s;

    if(stack.length < 2) return null;
    const opnd2 = stack.pop();
    const opnd1 = stack.pop();
    stack.push(new Implication(opnd1, opnd2));
    
    return s;
  },

  ['Apply axiom 1'](s){
    const {exprs, stack} = s;

    if(stack.length !== 2) return null;
    const b = stack.pop();
    const a = stack.pop();

    if(!s.add(new Implication(a, new Implication(b, a)))) return null;

    return s;
  },

  ['Apply axiom 2'](s){
    const {exprs, stack} = s;

    if(stack.length !== 3) return null;
    const c = stack.pop();
    const b = stack.pop();
    const a = stack.pop();

    if(!s.add(new Implication(
      new Implication(a, new Implication(b, c)),
      new Implication(new Implication(a, b), new Implication(a, c)),
    ))) return null;
    
    return s;
  },

  ['Apply modus ponens'](s){
    const {exprs, stack} = s;

    if(stack.length !== 2) return null;
    const b = stack.pop();
    const a = stack.pop();

    if(!(s.has(a) && s.has(new Implication(a, b)))) return null;
    if(!s.add(b)) return null;
    
    return s;
  },
};

class Element{
  eq(elem){ O.virtual('eq'); }
  toString(){ O.virtual('toString'); }
}

class Path extends Element{
  constructor(rules=[], state=null, ruleIndex=rulesNum - 1){
    super();
    this.rules = rules;
    this.state = state === null ? this.apply(new State()) : state;
    this.ruleIndex = ruleIndex;
  }

  get isValid(){ return this.state !== null; }

  apply(state){
    if(state === null) return null;

    for(const rule of this.rules){
      state = rulesArr[rule](state.clone());
      if(state === null) return null;
    }

    return state;
  }

  update(){
    this.state = this.apply(new State());
  }

  toString(){
    const table = new Table(['Expression', 'Rule']);
    let state = new State();

    for(const rule of this.rules){
      state = rulesArr[rule](state.clone());
      if(state === null) return '(error)';

      const {lastAdded} = state;
      if(lastAdded !== null)
        table.addRow([lastAdded, ruleNames[rule]]);
    }

    return table.toString();
  }
}

class State extends Element{
  constructor(exprs=[], stack=[]){
    super();
    this.exprs = exprs;
    this.stack = stack;
    this.lastAdded = null;
  }

  eq(elem){
    const {exprs, stack} = this;
    const {exprs1, stack1} = elem;

    return elem instanceof State &&
      exprs.length === exprs.length &&
      stack.length === stack1.length &&
      exprs.every((e, i) => e.eq(exprs[i])) &&
      stack.every((e, i) => e.eq(stack1[i]));
  }

  clone(){
    const {exprs, stack, lastAdded} = this;
    return new State(exprs.slice(), stack.slice());
  }

  add(expr){
    const {exprs} = this;
    const str = expr.toString();
    let i = -1;

    while(++i !== exprs.length){
      const str1 = exprs[i].toString();
      if(str === str1) return 0;
      if(str < str1) break;
    }

    exprs.splice(i, 0, expr);
    this.lastAdded = expr;

    return 1;
  }

  has(expr){
    for(const expr1 of this.exprs)
      if(expr.eq(expr1)) return 1;
    return 0;
  }

  toString(){
    const {exprs, stack} = this;
    return `{${exprs.join(', ')}} [${stack.join(', ')}]`;
  }
}

class Operand extends Element{}

class Identifier extends Operand{
  eq(elem){
    return elem instanceof Identifier;
  }

  toString(){
    return 'A';
  }
}

class Implication extends Operand{
  constructor(opnd1, opnd2){
    super();
    this.opnd1 = opnd1;
    this.opnd2 = opnd2;
  }

  eq(elem){
    return elem instanceof Implication &&
      this.opnd1.eq(elem.opnd1) &&
      this.opnd2.eq(elem.opnd2);
  }

  toString(){
    const {opnd1, opnd2} = this;
    return `${
      opnd1 instanceof Implication ? `(${opnd1})` : opnd1}.${
      opnd2 instanceof Implication ? `(${opnd2})` : opnd2}`;
  }
}

const ruleNames = O.keys(rulesObj);
const rulesArr = ruleNames.map(name => rulesObj[name]);
const rulesNum = rulesArr.length;

main();