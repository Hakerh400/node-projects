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
const Stack = require('./stack');
const StackFrame = require('./stack-frame');
const ruleParser = require('./rule-parser');

const FILE_EXTENSION = 'txt';

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

  /**
   * This function parses the given string using previously defined
   * syntax rules and converts it to abstract syntax tree (AST).
   */

  parse(str, rule){
    const {rules} = this;
    if(!(rule in rules)) throw new TypeError(`Unknown definition ${O.sf(rule)}`);
    rule = rules[rule]['*'];

    /**
     * Cache contains previously parsed syntax structures.
     * For each state of the context (each combination of context parameters) it caches ASTs of
     * all elements (not rules) that are fully or partially parsed at the given index in the
     * string being parsed. It's not only used for optimizations, but also to properly handle
     * left-recursive definitions.
     */
    const cache = new O.MultidimensionalMap();

    /**
     * In order to allow unlimited recursion, all algorithms are implemented iteratively.
     */
    const stack = new Stack(this);
    {
      const elem = new Element.NonTerminal(rule);
      stack.push(elem);
    }
  }
};

Syntax.Context = Context;

module.exports = Syntax;