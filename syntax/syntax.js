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
const StackFrame = require('./stack-frame');
const AST = require('./ast');

const FILE_EXTENSION = 'txt';

const {ParseDef, ParsePat, ParseElem, CompileDef, CompileArr} = StackFrame;
const {ASTNode, ASTDef, ASTPat, ASTElem, ASTNterm, ASTTerm} = AST;

const graphCtors = [
  SG.String, SG.Array, SG.Set, SG.Map,

  ParseDef, ParsePat, ParseElem,
  CompileDef, CompileArr,
  AST, ASTDef, ASTPat, ASTNterm, ASTTerm,
];

class Syntax{
  #defs;
  #ctxCtor;
  #graphRefs;

  constructor(str, ctxCtor){
    const defs = this.#defs = ruleParser.parse(this, str);
    const refs = this.#graphRefs = [this];
    this.#ctxCtor = ctxCtor;

    for(const defName in defs){
      const def = defs[defName]['*'];
      refs.push(def);

      for(const pat of def.sects.include.pats){
        refs.push(pat);

        for(const elem of pat.elems){
          refs.push(elem);
          if(elem.sep !== null) ref.push(elem.sep);
        }
      }
    }

    this.graph = new SG(graphCtors, this.#graphRefs);
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
    const {graph} = this;

    const buf = Buffer.from(str);
    const len = str.length;

    const defs = this.#defs;
    if(!(def in defs)) throw new TypeError(`Unknown definition ${O.sf(def)}`);
    def = defs[def]['*'];

    const ast = new AST(graph, this, new SG.String(graph, str)).persist();
    const cache = graph.ca(str.length, () => new SG.Map(graph)).persist();
    const parsing = graph.ca(str.length, () => new SG.Set(graph)).persist();
    const sfDef = new ParseDef(graph, null, 0, def).persist();

    let sf = sfDef;

    while(sf !== null){
      switch(sf.constructor){
        case ParseDef: parseDef(); break;
        case ParsePat: parsePat(); break;
        case ParseElem: parseElem(); break;
        default: throw new TypeError('....??'); break;
      }
    }

    ast.node = sfDef.val;

    cache.unpersist();
    parsing.unpersist();
    sfDef.unpersist();

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
          return setSf(new ParsePat(graph, sf, index, pats[sf.i]));

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
        return setSf(new ParseElem(graph, sf, index, elems[sf.i]));

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
            return setSf(new ParseElem(sf, index, elem.sep));

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
            return setSf(new ParseDef(graph, sf, index, node.ref.rule['*']));

          const def = sf.val;
          sf.val = null;

          if(def.len === -1) return done();
          node.arr.push(def);
          sf.index += def.len;
        }else if(node instanceof ASTTerm){
          if(node.ref instanceof Element.String){
            const substr = str.slice(index, index + node.ref.str.length);
            if(node.ref.str !== substr) return done();
            node.arr.push(new SG.String(graph, substr));
            sf.index += node.ref.str.length;
          }else if(node.ref instanceof Element.CharsRange){
            // TODO: check buffer bounds
            if(!node.ref.set.has(buf[index])) return done();
            if(node.arr.length === 0) node.arr.push(new SG.String(graph));
            node.arr[0].str += str[index];
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

    function setSf(sfNew){
      if(sf !== sfDef) sf.unpersist();
      sf = sfNew;
      if(sfNew !== null) sfNew.persist();
    }

    function ret(val){
      sf.ret(val);
      setSf(sf.prev);
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

      const node = new ctor(graph, ast, index, ref);
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
    const {graph} = this;

    const sfDef = new CompileDef(graph, null, ast.node);
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
        return sf = new CompileArr(graph, sf, def.pat.elems);

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
              return sf = new CompileArr(graph, sf, elem.arr);

            elem.arr = sf.val;
            sf.val = null;
          }

          sf.j = 1;
          break;

        case 1:
          if(elem instanceof ASTElem){
            if(sf.val === null)
              return sf = new CompileArr(graph, sf, elem.seps);

            elem.seps = sf.val;
            sf.val = null;
          }

          sf.j = 2;
          break;

        case 2:
          if(elem instanceof ASTDef){
            if(sf.val === null)
              return sf = new CompileDef(graph, sf, elem);

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

Syntax.Context = Context;

module.exports = Syntax;