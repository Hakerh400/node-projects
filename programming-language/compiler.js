'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');
const SF = require('./stack-frame');
const AST = require('./ast');

const {ASTNode, ASTDef, ASTPat, ASTElem, ASTNterm, ASTTerm} = AST;

class Compiler extends SF{
  static ptrsNum = 3;

  constructor(g, ast){
    super(g);
    if(g.dsr) return;

    this.ast = ast;
  }

  get ast(){ return this[2]; } set ast(a){ this[2] = a; }

  tick(intp, th){
    if(this.i++ === 0) return th.call(new CompileDef(this.g, this, this.ast.node));
    th.call(this.val, 1);
  }
}

class Compile extends SF{
  static ptrsNum = 4;

  constructor(g, compiler, elem){
    super(g);
    if(g.dsr) return;

    this.compiler = compiler;
    this.elem = elem;
  }

  get compiler(){ return this[2]; } set compiler(a){ this[2] = a; }
  get elem(){ return this[3]; } set elem(a){ this[3] = a; }
};

class CompileDef extends Compile{
  constructor(g, compiler, elem){
    super(g, compiler, elem);
    if(g.dsr) return;
  }

  tick(intp, th){
    const {g, compiler, elem: def} = this;
    const name = def.ref.name;
    const func = compiler[`[${name}]`];

    if(this.val === null)
      return th.call(new CompileArr(g, compiler, def.pat.elems));

    def.pat.elems = this.val;
    this.val = null;

    th.ret(func(def, intp, th));
  }
};

class CompileArr extends Compile{
  constructor(g, compiler, elem){
    super(g, compiler, elem);
    if(g.dsr) return;
  }

  tick(intp, th){
    const {g, compiler, elem: arr} = this;

    if(this.i === arr.length)
      return th.ret(arr);

    const elem = arr[this.i];

    switch(this.j){
      case 0:
        if(elem instanceof ASTElem){
          if(this.val === null)
            return th.call(new CompileArr(g, compiler, elem.arr));

          elem.arr = this.val;
          this.val = null;
        }

        this.j = 1;
        break;

      case 1:
        if(elem instanceof ASTElem){
          if(this.val === null)
            return th.call(new CompileArr(g, compiler, elem.seps));

          elem.seps = this.val;
          this.val = null;
        }

        this.j = 2;
        break;

      case 2:
        if(elem instanceof ASTDef){
          if(this.val === null)
            return th.call(new CompileDef(g, compiler, elem));

          arr[this.i] = this.val;
          this.val = null;
        }else{
          arr[this.i] = elem;
        }

        this.i++;
        this.j = 0;
        break;
    }
  }
};

module.exports = Object.assign(Compiler, {
  Compile,
  CompileDef,
  CompileArr,
});