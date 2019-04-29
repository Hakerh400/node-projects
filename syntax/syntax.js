'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Rule = require('./rule');
const Section = require('./section');
const Pattern = require('./pattern');
const Element = require('./element');
const Range = require('./range');
const Context = require('./context');
const ruleParser = require('./rule-parser');
const StackFrame = require('./stack-frame');
const AST = require('./ast');

const FILE_EXTENSION = 'txt';

const {ASTNode, ASTDef, ASTPat, ASTElem, ASTNterm, ASTTerm} = AST;

class Syntax{
  constructor(str, ctxCtor){
    this.rules = ruleParser.parse(this, str);
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

  parse(str, def){
    const N = O.noimpl;

    const buf = Buffer.from(str);
    const len = str.length;

    const {rules: defs} = this;
    if(!(def in defs)) throw new TypeError(`Unknown definition ${O.sf(def)}`);
    def = defs[def]['*'];

    const ast = new AST(this, str);
    const cache = O.ca(str.length, () => new Map());
    const parsing = O.ca(str.length, () => new Set());
    const sfDef = new StackFrame.StackFrameDef(null, 0, def);

    let sf = sfDef;

    while(sf !== null){
      switch(sf.constructor){
        case StackFrame.StackFrameDef: parseDef(); break;
        case StackFrame.StackFramePat: parsePat(); break;
        case StackFrame.StackFrameElem: parseElem(); break;
        default: throw new TypeError('....??'); break;
      }
    }

    ast.node = sfDef.val;

    return ast;

    function parseDef(){
      const {index, ref: def} = sf;
      const pSet = parsing[index];

      if(sf.node === null){
        if(index === str.length) return createNewNode(index, def);

        let node = getNodeFromCache(index, def);
        if(node !== null && (node.done || pSet.has(def)))
          return ret(node);

        pSet.add(def);
        sf.node = node;
        sf.i = -1;
      }
      
      const pats = def.sects.include.pats;
      let {node, nodePrev: prev} = sf;

      if(sf.i === -1){
        sf.nodePrev = prev = node;
        sf.node = node = createNewNode(index, def, node === null);
        sf.i = 0;
      }else if(sf.i === pats.length){
        const pp = node.pats;
        node.update();

        if(prev !== null && node.len <= prev.len){
          sf.node = node = prev;
          pSet.delete(def);
          return ret(node);
        }

        cache[index].set(def, node);
        sf.i = -1;
      }else{
        if(sf.val === null)
          return sf = new StackFrame.StackFramePat(sf, index, pats[sf.i]);

        sf.i++;
        node.pats.push(sf.val);
        sf.val = null;
      }
    }

    function parsePat(){
      const {index, ref: pat} = sf;

      if(sf.node === null){
        if(index === str.length) return ret(createNewNode(index, pat));
        let node = getNodeFromCache(index, pat, 1);
        if(node.done) return ret(node);
        node = createNewNode(index, pat);

        sf.node = node;
      }

      const {elems} = pat;
      let {node} = sf;

      if(sf.val === null)
        return sf = new StackFrame.StackFrameElem(sf, index, elems[sf.i]);

      sf.i++;
      const elem = sf.val;
      sf.val = null;

      node.elems.push(elem);
      if(elem.len === -1) return ret(node.reset());
      sf.index += elem.len;
      if(sf.i === elems.length) ret(node.update());
    }

    function parseElem(){
      const {index, ref: elem} = sf;

      if(sf.node === null){
        if(index === str.length) return ret(createNewNode(index, elem));
        let node = getNodeFromCache(index, elem, 1);
        if(node.done) return ret(node);
        node = createNewNode(index, elem);

        sf.node = node;
      }

      const lenMin = elem.range.start;
      const lenMax = elem.range.end;
      let {node} = sf;
      if(lenMin === null) throw new TypeError('???');

      if(node.arr.length === lenMax || index === str.length) return done();

      if(sf.i === 0){
        if(elem.sep !== null && node.arr.length !== 0){
          if(sf.val === null)
            return sf = new StackFrame.StackFrameElem(sf, index, elem.sep);

          const sep = sf.val;
          sf.val = null;

          if(sep.len === -1) return done();
          node.seps.push(sep);
          sf.index += sep.len;
        }

        sf.i = 1;
      }else{
        if(node instanceof ASTNterm){
          if(!node.ref.ruleRange.isAny()) O.noimpl('!ref.ruleRange.isAny()');
          if(sf.val === null)
            return sf = new StackFrame.StackFrameDef(sf, index, node.ref.rule['*']);

          const def = sf.val;
          sf.val = null;

          if(def.len === -1) return done();
          node.arr.push(def);
          sf.index += def.len;
        }else if(node instanceof ASTTerm){
          if(node.ref instanceof Element.String){
            const substr = str.slice(index, index + node.ref.str.length);
            if(node.ref.str !== substr) return done();
            node.arr.push(substr);
            sf.index += node.ref.str.length;
          }else if(node.ref instanceof Element.CharsRange){
            // TODO: check buffer bounds
            if(!node.ref.set.has(buf[index])) return done();
            if(node.arr.length === 0) node.arr.push('');
            node.arr[0] += str[index];
            sf.index++;
          }else{
            throw new TypeError('Whaat?');
          }
        }else{
          errUnknownAST(node);
        }

        sf.i = 0;
      }

      function done(){
        if(node.arr.length < lenMin) return ret(node.reset());
        return ret(node.update());
      }
    }

    function ret(val){
      sf.ret(val);
      sf = sf.prev;
    }

    function createNewNode(index, ref, addToCache=1){
      let ctor;

      if(ref instanceof Rule){
        ctor = ASTDef;
      }else if(ref instanceof Pattern){
        ctor = ASTPat;
      }else if(ref instanceof Element){
        if(ref instanceof Element.NonTerminal){
          ctor = ASTNterm;
        }else if(ref instanceof Element.Terminal){
          ctor = ASTTerm;
        }else{
          errUnknownRef(ref);
        }
      }else{
        errUnknownRef(ref);
      }

      const node = new ctor(ast, index, ref);
      if(index === str.length) return node.finalize();
      if(addToCache) cache[index].set(ref, node);

      return node;
    }

    function getNodeFromCache(index, ref, force=0){
      const map = cache[index];

      if(map.has(ref)) return map.get(ref);
      if(!force) return null;
      return createNewNode(index, ref);
    }

    function errUnknownRef(ref){
      unknownType('reference', ref.constructor.name);
    }

    function errUnknownAST(ast){
      unknownType('AST', ast.constructor.name);
    }

    function unknownType(type, name){
      throw new TypeError(`Unknown ${type} type ${O.sf(name)}`);
    }
  }

  compile(ast, funcs){
    return processDef(ast.node);

    function processDef(def){
      const name = def.ref.name;
      if(!O.has(funcs, name)) return null;
      const func = funcs[name];

      def.pat.elems = processArr(def.pat.elems);
      return func(def);
    }

    function processArr(arr){
      return arr.map(elem => {
        if(elem instanceof ASTElem){
          elem.arr = processArr(elem.arr);
          elem.seps = processArr(elem.seps);
        }

        if(elem instanceof ASTDef)
          return processDef(elem);

        return elem;
      });
    }
  }
};

Syntax.Context = Context;

module.exports = Syntax;