'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');
const Rule = require('./rule');
const Section = require('./section');
const Pattern = require('./pattern');
const Element = require('./element');
const Range = require('./range');
const Context = require('./context');
const ruleParser = require('./rule-parser');
const AST = require('./ast');

const FILE_EXTENSION = 'txt';

class Syntax{
  constructor(str, ctxCtor){
    this.defs = ruleParser.parse(this, str);
    this.ctxCtor = ctxCtor;
  }

  static fromStr(str, ctxCtor){
    return new Syntax(str, ctxCtor);
  }

  static fromDir(dir, ctxCtor){
    dir = path.normalize(dir);

    const dirs = [dir];
    let str = '';

    while(dirs.length !== 0){
      const d = dirs.shift();

      const names = O.sortAsc(fs.readdirSync(d).filter(name => {
        return O.ext(name) === FILE_EXTENSION;
      }));

      for(const name of names){
        const file = path.join(d, name);
        const stat = fs.statSync(file);

        if(stat.isDirectory()){
          dirs.push(file);
          continue;
        }

        if(!stat.isFile())
          throw new TypeError(`Unsupported file system entry ${O.sf(file)}`);

        const pack = path.relative(dir, file)
          .replace(/\.[a-z0-9]+$/i, '')
          .replace(/[\/\\]/g, '.')
          .replace(/\-./g, a => a[1].toUpperCase());

        const src = O.rfs(file, 1);
        str = `${str}\n#package{${pack}}\n${src}`;
      }
    }

    return new Syntax(str, ctxCtor);
  }

  compile(ast, funcs){
    const {graph} = this;

    const sfDef = new CompileDef(graph, compiler, null, ast.node);
    let sf = sfDef;

    while(sf !== null){
      switch(sf.constructor){
        case CompileDef: compileDef(); break;
        case CompileArr: compileArr(); break;
        default: throw new TypeError('....??'); break;
      }
    }

    return sfDef.val;

    function compileDef(){
      const {elem: def} = sf;

      const name = def.ref.name;
      if(!O.has(funcs, name)) return ret(null);
      const func = funcs[name];

      if(sf.val === null)
        return sf = new CompileArr(graph, compiler, sf, def.pat.elems);

      def.pat.elems = sf.val;
      sf.val = null;

      ret(func(def));
    }

    function compileArr(){
      const {elem: arr} = sf;

      if(sf.i === arr.length)
        return ret(arr);

      const elem = arr[sf.i];

      switch(sf.j){
        case 0:
          if(elem instanceof ASTElem){
            if(sf.val === null)
              return sf = new CompileArr(graph, compiler, sf, elem.arr);

            elem.arr = sf.val;
            sf.val = null;
          }

          sf.j = 1;
          break;

        case 1:
          if(elem instanceof ASTElem){
            if(sf.val === null)
              return sf = new CompileArr(graph, compiler, sf, elem.seps);

            elem.seps = sf.val;
            sf.val = null;
          }

          sf.j = 2;
          break;

        case 2:
          if(elem instanceof ASTDef){
            if(sf.val === null)
              return sf = new CompileDef(graph, compiler, sf, elem);

            arr[sf.i] = sf.val;
            sf.val = null;
          }else{
            arr[sf.i] = elem;
          }

          sf.i++;
          sf.j = 0;
          break;
      }
    }

    function ret(val){
      sf.ret(val);
      sf = sf.prev;
    }
  }
};

module.exports = Object.assign(Syntax, {
  Rule,
  Section,
  Pattern,
  Element,
  Range,
  Context,
});