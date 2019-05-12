'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');
const SF = require('./stack-frame');
const AST = require('./ast');

const {ASTNode, ASTDef, ASTPat, ASTElem, ASTNterm, ASTTerm} = AST;

class CompilerBase extends SF{
  static ptrsNum = this.keys(['ast']);

  constructor(g, ast){
    super(g);
    if(g.dsr) return;

    this.ast = ast;
  }

  tick(th, intp){
    if(this.i++ === 0) return th.call(new CompileDef(this.g, this, this.ast.node));
    th.call(this.rval, 1);
  }
}

class Compile extends SF{
  static ptrsNum = this.keys(['compiler', 'elem']);

  constructor(g, compiler, elem){
    super(g);
    if(g.dsr) return;

    this.compiler = compiler;
    this.elem = elem;
  }
}

class CompileDef extends Compile{
  constructor(g, compiler, elem){
    super(g, compiler, elem);
    if(g.dsr) return;
  }

  tick(th, intp){
    const {g, compiler, elem: def} = this;
    const name = def.ref.name;
    const func = compiler[`[${name}]`];

    if(this.rval === null)
      return th.call(new CompileArr(g, compiler, def.pat.elems));

    def.pat.elems = this.rval;
    this.rval = null;

    th.ret(func(def, th, intp));
  }
}

class CompileArr extends Compile{
  constructor(g, compiler, elem){
    super(g, compiler, elem);
    if(g.dsr) return;
  }

  tick(th, intp){
    const {g, compiler, elem: arr} = this;

    if(this.i === arr.length)
      return th.ret(arr);

    const elem = arr[this.i];

    switch(this.j){
      case 0:
        if(elem instanceof ASTElem){
          if(this.rval === null)
            return th.call(new CompileArr(g, compiler, elem.arr));

          elem.arr = this.rval;
          this.rval = null;
        }

        this.j = 1;
        break;

      case 1:
        if(elem instanceof ASTElem){
          if(this.rval === null)
            return th.call(new CompileArr(g, compiler, elem.seps));

          elem.seps = this.rval;
          this.rval = null;
        }

        this.j = 2;
        break;

      case 2:
        if(elem instanceof ASTDef){
          if(this.rval === null)
            return th.call(new CompileDef(g, compiler, elem));

          arr[this.i] = this.rval;
          this.rval = null;
        }else{
          arr[this.i] = elem;
        }

        this.i++;
        this.j = 0;
        break;
    }
  }
}

module.exports = Object.assign(CompilerBase, {
  Compile,
  CompileDef,
  CompileArr,
});