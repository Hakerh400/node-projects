'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const SG = require('../serializable-graph');
const Syntax = require('./syntax');
const langsList = require('./langs-list');
const StackFrame = require('./stack-frame');
const Parser = require('./parser');
const AST = require('./ast');

const {ParseDef, ParsePat, ParseElem} = Parser;
const {CompileDef, CompileArr} = StackFrame;
const {ASTNode, ASTDef, ASTPat, ASTElem, ASTNterm, ASTTerm} = AST;

const baseGraphCtors = [
  SG.String, SG.Array, SG.Set, SG.Map,

  AST, ASTDef, ASTPat, ASTNterm, ASTTerm,
  ParseDef, ParsePat, ParseElem,
  CompileDef, CompileArr,
];

const cwd = __dirname;
const langsDir = path.join(cwd, 'langs');

const namesList = getNamesList();
const cache = O.obj();

class ProgrammingLanguage{
  constructor(syntax, Compiler, Interpreter){
    this.syntax = syntax;
    this.Compiler = Compiler;
    this.Interpreter = Interpreter;

    const ctors = this.graphCtors = baseGraphCtors.slice();

    const refs = this.graphRefs = [this, syntax];
    const {defs} = syntax;

    for(const defName in defs){
      const def = defs[defName]['*'];
      refs.push(def);

      for(const pat of def.sects.include.pats){
        refs.push(pat);

        for(const elem of pat.elems){
          refs.push(elem);
          if(elem.sep !== null) refs.push(elem.sep);
        }
      }
    }
  }

  static get(langName){
    if(!O.has(namesList, langName))
      throw new TypeError(`Unknown programming language ${O.sf(langName)}`);

    const lang = namesList[langName];
    if(O.has(cache, lang))
      return cache[lang];

    const dir = path.join(langsDir, lang);
    const syntax = Syntax.fromDir(path.join(dir, 'syntax'));
    const Compiler = require(path.join(dir, 'compiler'));
    const Interpreter = require(path.join(dir, 'interpreter'));

    const langInstance = new PL(syntax, Compiler, Interpreter);
    cache[lang] = langInstance;

    return langInstance;
  }
};

const PL = ProgrammingLanguage;

module.exports = PL;

function getNamesList(){
  const list = O.obj();

  for(const lang in langsList)
    list[langsList[lang]] = lang;

  return list;
}