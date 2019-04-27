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

    ast.node = parseDef(0, def);
    log(`\n${'='.repeat(150)}\n`);
    logDef(ast.node);
    log(`\n${'='.repeat(150)}\n`);

    return ast;

    function logDef(def){
      log.inc(`${def.ref.name} ---> ${def.toString()}`);

      for(const elem of def.pat.elems){
        if(!(elem instanceof ASTNterm)) continue;
        logDef(elem.arr[0]);
      }

      log.dec();
    }

    function parseDef(index, def){
      if(index === str.length) return createNewNode(index, def);
      log.inc(`parse (${index}, ${def.name}) {`);

      const pSet = parsing[index];
      log(`stack: [${[...pSet].map(a => a.name).join(', ')}]`);

      let node = getNodeFromCache(index, def);
      if(node !== null){
        log(`cache --->  done: ${!!node.done}  len: ${node.len}`);
        if(node.done || pSet.has(def)){
          log(`nothing to do here`);
          log.dec();
          log(`}`);
          return node;
        }
      }

      pSet.add(def);

      const pats = def.sects.include.pats;
      let prev;

      while(1){
        prev = node;
        node = createNewNode(index, def, node === null);

        for(let i = 0; i !== pats.length; i++){
          const pat = parsePat(index, pats[i]);
          node.pats.push(pat);
        }

        const pp = node.pats;
        node.update();
        log(`ITER --->  [${pp.map(a => a.len).join(', ')}]  ${prev !== null ? prev.len : -1}  ${node.len}`);

        if(prev !== null && node.len <= prev.len){
          node = prev;
          break;
        }

        cache[index].set(def, node);
      }

      log.dec(`len: ${node.len}`);
      log(`}`);

      pSet.delete(def);
      return node;
    }

    function parsePat(index, pat){
      if(index === str.length) return createNewNode(index, pat);
      let node = getNodeFromCache(index, pat, 1);
      if(node.done) return node;
      node = createNewNode(index, pat);

      const elems = pat.elems;

      for(let i = 0; i !== elems.length; i++){
        const elem = parseElem(index, elems[i]);
        node.elems.push(elem);
        if(elem.len === -1) return node.reset();
        index += elem.len;
      }

      return node.update();
    }

    function parseElem(index, elem){
      if(index === str.length) return createNewNode(index, elem);
      let node = getNodeFromCache(index, elem, 1);
      if(node.done) return node;
      node = createNewNode(index, elem);

      const lenMin = elem.range.start;
      const lenMax = elem.range.end;

      if(lenMin === null) throw new TypeError('???');

      while(1){
        if(node.arr.length === lenMax || index === str.length) break;

        if(elem.sep !== null && node.arr.length !== 0){
          const sep = parseElem(index, elem.sep);
          if(sep.len === -1) break;
          node.seps.push(dep);
          index += sep.len;
        }

        if(node instanceof ASTNterm){
          const {ref} = node;
          if(!ref.ruleRange.isAny()) O.noimpl('!ref.ruleRange.isAny()');

          const def = parseDef(index, ref.rule['*']);
          if(def.len === -1) break;
          node.arr.push(def);
          index += def.len;
        }else if(node instanceof ASTTerm){
          if(node.ref instanceof Element.String){
            const substr = str.slice(index, index + node.ref.str.length);
            if(node.ref.str !== substr) break;
            node.arr.push(substr);
            index += node.ref.str.length;
          }else if(node.ref instanceof Element.CharsRange){
            // TODO: check buffer bounds
            if(!node.ref.set.has(buf[index])) break;
            node.arr.push(str[index]);
            index++;
          }else{
            throw new TypeError('Whaat?');
          }
        }else{
          errUnknownAST(node);
        }
      }

      if(node.arr.length < lenMin) return node.reset();
      return node.update();
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