'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var assembler = require('../assembler');
var dataTypes = require('./data-types.json');
var keywords = require('./keywords.json');
var castTable = require('./cast-table.json');

const TAB_SIZE = 2;

const CWD = __dirname;
const NATIVE_LIBS_DIR = joinNormalize(CWD, 'native-libs');
const ASM_BASE = joinNormalize(NATIVE_LIBS_DIR, 'asm.txt');
const MAIN_HEADER = 'main.h';
const MAIN_FILE = 'main.c';

const WHITE_SPACE_CHARS = ' \r\n\t';
const SUPPORTED_CHARS = getSupportedChars();
const LETTERS_NON_CAP = O.ca(26, i => String.fromCharCode('a'.charCodeAt(0) + i)).join('');
const LETTERS_CAP = LETTERS_NON_CAP.toUpperCase();
const LETTERS = LETTERS_NON_CAP + LETTERS_CAP;
const DIGITS = O.ca(10, i => String.fromCharCode('0'.charCodeAt(0) + i)).join('');
const DIGITS_HEX = DIGITS + [...LETTERS].filter(a => /[a-f]/i.test(a)).join('');
const IDENT_CHARS_FIRST = LETTERS + '_';
const IDENT_CHARS = IDENT_CHARS_FIRST + DIGITS;

var nativeLibs = getNativeLibs();
var globalId = 0;

var operators = [
  [['(', '['], 20, 0, null],
  [[')', ']'], 1, null, null],

  [['\x00(\x00)', '\x00[\x00]', '->', '.', '\x00++', '\x00--'], 19, 19, -1],
  [['plus\x00', 'minus\x00', '!', '~', '++\x00', '--\x00', 'cast\x00', 'deref\x00', 'addr\x00', 'sizeof\x00'], 18, 17, 0],
  [['*', '/', '%'], 16, 16, -1],
  [['+', '-'], 15, 15, -1],
  [['<<', '>>'], 14, 14, -1],
  [['<', '<=', '>', '>='], 13, 13, -1],
  [['==', '!='], 12, 12, -1],
  [['&'], 11, 11, -1],
  [['^'], 10, 10, -1],
  [['|'], 9, 9, -1],
  [['&&'], 8, 8, -1],
  [['||'], 7, 7, -1],
  [['\x00?\x00:\x00'], 6, 5, -1],
  [['=', '+=', '-=', '*=', '/=', '%=', '>>=', '<<=', '&=', '^=', '|='], 4, 3, -1],
  [[','], 2, 2, -1],
];

optimizeOperators();

module.exports = {
  compile,
  compileFile,
  compileFiles,
  compileDir,
};

function compile(srcs){
  if(!(srcs instanceof Array))
    srcs = [srcs];

  nativeLibs.forEach(lib => {
    var src = new Source(null, lib)
    srcs.push(src);
  });

  srcs = srcs.map(src => new Source(src));

  var compiled = srcs.map(src => src.compile());
  var linked = link(compiled);

  return linked;
}

function compileFile(filePath){
  var src = new Source(null, filePath);
  var compiled = compile(src);

  return compiled;
}

function compileFiles(files){
  var srcs = files.map(filePath => {
    var src = new Source(null, filePath);

    return src;
  });

  var compiled = compile(srcs);

  return compiled;
}

function compileDir(dirPath){
  var files = fs.readdirSync(dirPath);

  files = files.filter(fileName => {
    var ext = path.parse(fileName).ext;
    ext = ext.substring(1).toLowerCase();
    return ext === 'c';
  });

  var srcs = files.map(fileName => {
    var filePath = joinNormalize(dirPath, fileName);
    var src = new Source(null, filePath);

    return src;
  });

  var compiled = compile(srcs);

  return compiled;
}

function link(compiled){
  var linker = new Linker(compiled);
  return linker.link();
}

class Source{
  constructor(src = null, filePath = null){
    if(this.src === null && this.filePath === null)
      throw new TypeError('Invalid source type');

    this.src = null;
    this.filePath = null;

    if(src instanceof Source){
      this.src = src.src;
      this.filePath = src.filePath;
    }else if(src instanceof Buffer){
      this.src = src.toString();
    }else if(typeof src === 'string'){
      this.src = src;
    }

    if(filePath !== null)
      this.filePath = filePath;

    if(this.filePath !== null)
      this.filePath = normalizePath(this.filePath);

    if(this.src === null && this.filePath !== null){
      this.src = fs.readFileSync(this.filePath, 'utf8');
    }

    this.parser = null;

    this.csrc = this.src;
    this.hsrcs = [];

    this.globalVars = [];
  }

  includeFile(filePath, join = false){
    var n1 = this.filePath === null;
    var n2 = filePath === null;

    if((n1 && n2) || (join && (n1 || n2)))
      throw new TypeError('No file path found');

    if(n1) filePath = normalizePath(filePath);
    else if(n2) filePath = this.filePath;
    else if(join) filePath = joinNormalize(this.filePath, filePath);
    else filePath = normalizePath(filePath);

    var src = fs.readFileSync(filePath, 'utf8');
    src += '\n';

    this.hsrcs.push([O.sanl(src).length, filePath]);
    src = this.includeFiles(src, filePath);

    return src;
  }

  includeFiles(src = null, filePath = null){
    var n1 = this.src === null;
    var n2 = src === null;
    var n3 = this.filePath === null;
    var n4 = filePath === null;

    if(n1 && n2)
      throw TypeError('No source found');

    if(n3 && n4)
      throw new TypeError('No file path found');

    if(n2)
      src = this.src;

    if(n4)
      filePath = this.filePath;

    src = O.sanl(src);

    for(var i = 0; i < src.length; i++){
      var includeFilePath = this.parseIncludeDirective(filePath, src[i]);
      if(includeFilePath === null)
        break;

      src[i] = this.includeFile(includeFilePath);
    }

    src = src.join('\n');

    if(n2)
      this.src = src;

    return src;
  }

  parseIncludeDirective(filePath, line){
    line = line.trim();
    if(!line.startsWith('#include '))
      return null;

    line = line.substring(9).trimLeft();

    if(line[0] === '<'){
      line = line.substring(1, line.length - 1);
      if(!line.endsWith('.h'))
        throw error('Header file must end with ".h"');

      line = line.substring(0, line.length - 2);
      if(!(line in nativeLibs))
        throw error(`Unrecognized header file "${line}"`);

      return nativeLibs[line];
    }

    if(line[0] === '"' && line[line.length - 1] === '"'){
      line = line.substring(1, line.length - 1);
      return joinNormalize(filePath, line);
    }

    return null;
  }

  getGlobalVar(name){
    for(var i = 0; i < this.globalVars.length; i++){
      if(this.globalVars[i].name === name)
        return this.globalVars[i];
    }

    return null;
  }

  compile(){
    return this.parse();
  }

  parse(){
    this.includeFiles();
    this.parser = new Parser(this);

    var {parser} = this;

    while(parser.trim(), !parser.eof){
      var vari = this.parseGlobalVar();

      if(!this.globalVars.includes(vari))
        this.globalVars.push(vari);
    }

    return this.globalVars;
  }

  parseGlobalVar(){
    var {parser} = this;

    parser.trim();
    parser.save();
    var type = this.parseType(1);

    parser.trim();
    var name = parser.nonKeyword(1);
    if(name === null) this.err('Missing variable or function name');

    var vari = this.getGlobalVar(name);

    if(vari !== null){
      if(!vari.sameType(type)){
        parser.restore();
        this.err('Type mismatch');
      }else if(vari.val !== null){
        parser.restore();
        if(!vari.isFunc) this.err('The variable has already been initialized');
        else this.err('The function has already been defined');
      }
      parser.discard();
    }

    parser.trim();
    var char = parser.char(0);
    var isFunc = char === '(';

    if(vari !== null){
      if(vari.isFunc && !isFunc) this.err('Expected function definition');
      if(!vari.isFunc && isFunc) this.err('Expected variable initialization');
    }

    switch(char){
      case ';':
        if(vari !== null) this.err('Multiple declarations found');
        parser.char(1);
        vari = new GlobalVariable(this, type, name);
        break;

      case '=':
        if(vari === null) this.err('Declaration is required before initialization');
        if(type.asts !== 0) this.err('Cannot perform constant initialization on pointer type');
        if(type.name === 'void') this.err('Cannot perform constant initialization on void type');

        parser.char(1);
        var constLiteral = this.parseConstantLiteral(type);
        vari.assign(constLiteral);
        break;

      case '(':
        var args = this.parseFormalArgs(vari);

        parser.trim();
        char = parser.char(0);

        if(vari === null){
          if(char !== ';') this.err('Declaration is required before definition');
          vari = new Function(this, type, name);
          vari.setFormalArgs(args);
        }else{
          if(char === ';') this.err('The function has already been declared');
          if(char !== '{') this.err('Expected `{`');
        }

        if(char === '{'){
          this.parseFuncDef(vari);
        }else{
          parser.char(1);
        }
        break;

      default:
        this.err('Expected `;`, `=` or `(`');
        parser.char(1);
        break;
    }

    return vari;
  }

  parseType(allowVoid = 0){
    var {parser} = this;

    parser.trim();
    if(!allowVoid)
      parser.save();

    var type = parser.type(1);
    if(type === null) this.err('Unrecognized type');
    var asts = parser.countAsterisks(1);

    if(!allowVoid){
      if(type === 'void' && asts === 0){
        parser.restore();
        this.err('Illegal use of `void` type');
      }else{
        parser.discard();
      }
    }

    return new Type(type, asts);
  }

  parseConstantLiteral(type){
    var {parser} = this;

    parser.trim();

    var cst = new Constant(type);
    var val = null;

    switch(type.name){
      case 'char':
        this.err('Char is not supported');
        break;

      case 'float':
        this.err('Float is not supported');
        break;

      case 'int':
        val = parser.integer(1);
        if(val === null) this.err('Expected integer');
        cst.assign(val);
        break;

      case 'void':
        this.err('Void is not supported');
        break;
    }

    parser.trim();
    if(parser.char(0) !== ';')
      this.err('Expected `;`');

    parser.char(1);

    return cst;
  }

  parseFormalArgs(vari = null){
    var {parser} = this;
    var src = this

    parser.trim();
    if(vari !== null)
      parser.save();

    var char = parser.char(0);
    if(char !== '(') this.err('Expected `(`');
    parser.char(1);

    var args = [];

    while(!parser.eof){
      parser.trim();

      if(parser.char(0) === ')'){
        parser.char(1);
        break;
      }

      var type = this.parseType(0);
      var name = parseArgName();

      var v = new Argument(this, type, name);
      args.push(v);

      parser.trim();
      var char = parser.char(0);

      if(char === ','){
        parser.char(1);
        continue;
      }else if(char === ')'){
        parser.char(1);
        break;
      }else{
        this.err('Expected `,` or `)`');
      }
    }

    if(vari !== null){
      if(!vari.sameFormalArgs(args)){
        parser.restore();
        this.err('Formal arguments mismatch');
      }else{
        parser.discard();
      }
    }

    return args;

    function parseArgName(){
      parser.trim();
      parser.save();

      var name = parser.nonKeyword(1);
      if(name === null) src.err('Missing argument name');

      var isDupe = args.some(arg => arg.name === name);

      if(isDupe){
        parser.restore();
        src.err('Duplicate argument names are not allowed')
      }else{
        parser.discard();
      }

      return name;
    }
  }

  parseFuncDef(func){
    var {parser} = this;

    var args = func.formalArgs;
    var funcDef = new FunctionDefinition(func);

    func.setDef(funcDef);

    var scope = func.createScope();
    this.parseScope(scope);
  }

  parseScope(scope){
    var {parser} = this;

    parser.trim();
    var char = parser.char(0);
    if(char !== '{') this.err('Expected `{`');
    parser.char(1);

    while(parser.trim(), !parser.eof){
      if(parser.char(0) === '}'){
        parser.char(1);
        break;
      }

      this.parseStatement(scope);
    }
  }

  parseStatement(scope){
    var {parser} = this;

    parser.trim();
    parser.save();

    if(parser.char(0) === '{'){
      this.parseCodeBlock(scope);
    }else{
      var ident = parser.ident(0);

      if(ident !== null){
        if(dataTypes.includes(ident)){
          this.parseVarDecl(scope);
        }else if(keywords.includes(ident)){
          switch(ident){
            case 'asm': this.parseAsmDirective(scope); break;

            case 'return': this.parseReturnStatement(scope); break;
            case 'if': this.parseIfStatement(scope); break;
            case 'while': this.parseWhileStatement(scope); break;
            case 'for': this.parseForStatement(scope); break;
            case 'break': this.parseBreakStatement(scope); break;
            case 'continue': this.parseContinueStatement(scope); break;

            default:
              this.restore('Unexpected keyword');
              break;
          }
        }else{
          this.parseExpr(scope, 1, 1);
          parser.update();
          if(parser.char(1) !== ';')
            this.restore('Missing semicolon `;` after expression');
        }
      }else{
        this.parseExpr(scope, 1, 1);
        parser.update();
        if(parser.char(1) !== ';')
          this.restore('Missing semicolon `;` after expression');
      }
    }

    parser.discard();
  }

  parseAsmDirective(scope){
    var {parser} = this;
    var stat = new Statement(scope, 'asm');
    scope.addStatement(stat);

    parser.trim();
    parser.save();

    var asm = parser.ident(1);
    if(asm !== 'asm')
      this.restore('Expected `asm` keyword');

    parser.update();
    if(parser.char(1) !== '{')
      this.restore('Expected `{` at the beginning of assembly block');

    parser.update();

    var str = '';

    while(1){
      if(parser.eof)
        this.restore('Unexpected end of input while parsing assmebly directive');

      var char = parser.char(1);
      if(char === '}') break;
      str += char;
    }

    var arr = O.sanl(str.trim()).map(line => {
      return line.trim();
    });

    var vari = new Variable();
    vari.value = arr;
    stat.addVar(vari);

    parser.discard();
  }

  parseVarDecl(scope){
    var {parser} = this;
    var stat = new Statement(scope, 'varDecl');
    scope.addStatement(stat)

    parser.trim();
    parser.save();

    var type = this.parseType(0);

    parser.update();
    var name = parser.nonKeyword(1);
    if(name === null)
      this.restore('Missing variable name');

    if(scope.getVar(name, 0) !== null)
      this.restore('Variable redefined');

    var vari = new Variable(this, type, name);
    if(!scope.addVar(vari))
      this.restore('Variable declarations are not allowed in nested code blocks');

    parser.update();
    var char = parser.char(1);
    var expr;

    if(char === '='){
      expr = this.parseExpr(scope, 0);
      if(!expr.sameType(vari)){
        if(!expr.canImplicitlyCast(vari))
          this.restore(`Variable "${vari.name}" is of type "${vari.type}", ` +
                       `but the expression on the right hand side resolved to a value of type "${expr.type}"`);

        expr = expr.implicitCast(vari);
      }

    }else{
      expr = new Expression(scope);
      var zero = new Constant('int', 0);

      expr.add(zero);
    }

    var errMsg = expr.finalize();
    if(errMsg !== null) this.restore(errMsg);

    vari.assign(expr);

    parser.update();
    char = parser.char(1);

    if(char === ',')
      this.restore('Commas are not supported in variable declarations');

    if(char !== ';')
      this.restore('Missing semicolon `;`');

    stat.addVar(vari);

    parser.discard();
  }

  parseReturnStatement(scope){
    var {parser} = this;
    var stat = new Statement(scope, 'return');
    scope.addStatement(stat);

    parser.trim();
    parser.save();

    var ident = parser.ident(1);
    if(ident !== 'return')
      this.restore('Expected return statement');

    parser.update();
    var voidType = new Type('void');
    var ret;

    if(scope.sameType(voidType)){
      if(parser.char(1) !== ';')
        this.restore('The function returns void, so the return statement must have no arguments');

      ret = new Variable(scope, 'void');
    }else{
      var expr = this.parseExpr(scope);

      if(!expr.sameType(scope.type))
        this.restore(`The function must return "${scope.type}", ` +
                     `but the expression resolved to "${expr.type}"`);

      if(parser.char(1) !== ';')
        this.restore('Missing semicolon `;` after the return statement');

      ret = expr;
    }

    stat.addVar(ret);

    parser.discard();
  }

  parseExpr(scope, includeCommas = 1, standAlone = 0){
    var {parser} = this;
    var expr = new Expression(scope);

    parser.trim();
    parser.save();

    var parens = 0;

    while(parser.trim(), !parser.eof){
      parser.update();
      var opName = parser.operator(1);
      var op;

      if(!includeCommas && opName === ','){
        parser.restore();
        break;
      }

      if(opName === '(' || opName === '[') parens++;
      else if(opName === ')' || opName === ']') parens--;

      if(parens < 0){
        parser.restore();
        break;
      }

      if(opName !== null){
        op = new Operator(opName);
      }else{
        parser.update();
        var cnst = parser.integer(1);

        if(cnst !== null){
          op = new Constant('int', cnst | 0);
        }else{
          var varName = parser.nonKeyword(1);
          if(varName === null)
            this.restore('Unexpected token in expression');

          op = scope.getVar(varName);
          if(op === null)
            this.restore('Undefined variable');

          if(op.isFunc){
            parser.update();
            var char = parser.char(1);
            if(char !== '(')
              this.restore('Expected function call');

            var func = op;
            var opCall = new Operator('\x00(\x00)');

            parser.update();
            var args = this.parseArgs(scope);

            if(args.val.length !== op.formalArgs.length)
              this.restore(`Expected ${op.formalArgs.length} arguments, but found ${args.val.length} arguments`);

            for(var i = 0; i < args.val.length; i++){
              if(!args.val[i].sameType(op.formalArgs[i].type))
                this.restore('Argument types mismatch');
            }

            var errMsg = expr.add(args);
            if(errMsg !== null) this.restore(errMsg);

            var errMsg = expr.add(opCall);
            if(errMsg !== null) this.restore(errMsg);

            op = func;
          }
        }
      }

      var errMsg = expr.add(op);
      if(errMsg !== null) this.restore(errMsg);

      var char = parser.char(0);

      if(char === ';' || (!includeCommas && char === ','))
        break;
    }

    if(parser.eof)
      this.err('Unexpected end of file');

    var errMsg = expr.finalize();
    if(errMsg !== null) this.restore(errMsg);

    if(standAlone){
      expr.isStandAlone = true;

      var stat = new Statement(scope, 'expr');
      scope.addStatement(stat);
      stat.addVar(expr);
    }

    parser.discard();
    return expr;
  }

  parseArgs(scope){
    var {parser} = this;

    parser.trim();
    parser.save();

    var args = [];

    if(parser.char() !== ')'){
      while(parser.trim(), !parser.eof){
        parser.update();
        var expr = this.parseExpr(scope, 0);
        args.push(expr);

        parser.update();
        var char = parser.char(1);

        if(char === null)
          this.restore('Unexpected end of input while parsing function arguments');

        if(char === ')') break;
        if(char === ',') continue;

        this.restore('Unexpected token in function arguments');
      }
    }

    args = new Arguments(scope, args);

    parser.discard();

    return args;
  }

  parseCodeBlock(scope){
    var {parser} = this;
    var stat = new Statement(scope, 'block');
    scope.addStatement(stat);

    parser.trim();
    parser.save();

    if(parser.char(1) !== '{')
      this.restore('Code block must start with `{`');

    var subScope = stat.createScope();

    while(parser.trim(), !parser.eof){
      parser.update();

      if(parser.char(0) === '}'){
        parser.char(1);
        break;
      }

      this.parseStatement(subScope);
    }

    parser.discard();
  }

  parseIfStatement(scope){
    var {parser} = this;
    var stat = new Statement(scope, 'if');
    scope.addStatement(stat);

    parser.trim();
    parser.save();

    if(parser.ident(1) !== 'if')
      this.restore('If statement must begin with keyword `if`')

    parser.update();
    this.parseStatExpr(scope, stat);

    parser.update();
    var subScope = stat.createScope();
    this.parseStatement(subScope);

    parser.update();
    if(parser.ident(0) === 'else'){
      parser.ident(1);
      subScope = stat.createScope();
      this.parseStatement(subScope);
    }

    parser.discard();
  }

  parseWhileStatement(scope){
    var {parser} = this;
    var stat = new Statement(scope, 'while');
    scope.addStatement(stat);

    parser.trim();
    parser.save();

    if(parser.ident(1) !== 'while')
      this.restore('Expected `while` keyword');

    parser.update();
    this.parseStatExpr(scope, stat);

    parser.update();
    var subScope = stat.createScope();
    this.parseStatement(subScope);

    parser.discard();
  }

  parseForStatement(scope){
    var {parser} = this;
    var stat = new Statement(scope, 'for');
    scope.addStatement(stat);

    parser.trim();
    parser.save();

    if(parser.ident(1) !== 'for')
      this.restore('Expected `for` keyword');

    parser.update();
    if(parser.char(1) !== '(')
      this.restore('Missing open parenthese `(` in `for` statement');

    parser.update();
    var expr = this.parseExpr(scope, 1, 1);
    stat.addVar(expr);
    var errMsg = expr.finalize();
    if(errMsg !== null) this.restore(errMsg);

    parser.update();
    if(parser.char(1) !== ';')
    this.restore('Missing semicolon `;` after the first argument of the `for` statement');

    parser.update();
    expr = this.parseExpr(scope);
    stat.addVar(expr);
    errMsg = expr.finalize();
    if(errMsg !== null) this.restore(errMsg);

    parser.update();
    if(parser.char(1) !== ';')
    this.restore('Missing semicolon `;` after the second argument of the `for` statement');

    parser.update();
    expr = this.parseExpr(scope, 1, 1);
    stat.addVar(expr);
    errMsg = expr.finalize();
    if(errMsg !== null) this.restore(errMsg);

    parser.update();
    if(parser.char(1) !== ')')
      this.restore('Missing closed parenthese `)` in `for` statement');

    parser.update();
    var subScope = stat.createScope();
    this.parseStatement(subScope);

    parser.discard();
  }

  parseBreakStatement(scope){
    var {parser} = this;
    var stat = new Statement(scope, 'break');
    scope.addStatement(stat);

    parser.trim();
    parser.save();

    if(parser.ident(1) !== 'break')
      this.restore('Expected `break` statement');

    if(scope.getLoop() === null)
      this.restore('Break statement can appear only in a loop');

    parser.update();
    if(parser.char(1) !== ';')
      this.restore('Missing semicolon `;` after `break` statement');

    parser.discard();
  }

  parseContinueStatement(scope){
    var {parser} = this;
    var stat = new Statement(scope, 'continue');
    scope.addStatement(stat);

    parser.trim();
    parser.save();

    if(parser.ident(1) !== 'continue')
      this.restore('Expected `continue` statement');

    if(scope.getLoop() === null)
      this.restore('Continue statement can appear only in a loop');

    parser.update();
    if(parser.char(1) !== ';')
      this.restore('Missing semicolon `;` after `continue` statement');

    parser.discard();
  }

  parseStatExpr(scope, stat){
    var {parser} = this;

    parser.trim();
    parser.save();

    parser.update();
    if(parser.char(1) !== '(')
      this.restore('Missing open parenthese `(`');

    parser.update();
    var expr = this.parseExpr(scope);
    stat.addVar(expr);

    parser.update();
    if(parser.char(1) !== ')')
      this.restore('Missing closed parenthese `)`');

    parser.discard();
  }

  restore(msg = null){
    this.parser.restore();
    this.err(msg);
  }

  err(msg = null){
    this.parser.err(msg);
  }
};

class Parser{
  constructor(source){
    this.source = source;
    this.src = O.sanl(source.src);
    this.filePath = source.filePath;

    this.srcDiff = this.src.length - O.sanl(source.csrc).length;

    this.lineIndex = 0;
    this.index = 0;

    this.eol = this.src[0].length === 0;
    this.eof = this.eol && this.src.length === 1;

    this.lineIndexStack = [];
    this.indexStack = [];
    this.eolStack = [];
    this.eofStack = [];

    this.trimEnabled = true
  }

  save(){
    this.lineIndexStack.push(this.lineIndex);
    this.indexStack.push(this.index);
    this.eolStack.push(this.eol);
    this.eofStack.push(this.eof);
  }

  restore(){
    this.lineIndex = this.lineIndexStack.pop();
    this.index = this.indexStack.pop();
    this.eol = this.eolStack.pop();
    this.eof = this.eofStack.pop();
  }

  update(trim = 1){
    this.discard();
    if(trim) this.trim();
    this.save();
  }

  discard(){
    this.lineIndexStack.pop();
    this.indexStack.pop();
    this.eolStack.pop();
    this.eofStack.pop();
  }

  enableTrim(){
    this.trimEnabled = true;
  }

  disableTrim(){
    this.trimEnabled = false;
  }

  char(modify){
    if(this.eof) return null;

    if(!modify){
      if(this.eol) return '\n';
      return this.src[this.lineIndex][this.index];
    }

    var char = null;

    if(this.eol){
      char = '\n';

      this.lineIndex++;

      if(this.lineIndex !== this.src.length){
        this.index = 0;
        this.eol = this.src[this.lineIndex].length === 0;
      }else{
        this.eolf = true;
        this.eof = true;
      }
    }else{
      char = this.src[this.lineIndex][this.index++];

      this.eol = this.index === this.src[this.lineIndex].length;
      this.eof = this.eol && this.lineIndex === this.src.length - 1;
    }

    return char;
  }

  chars(modify, mainStr, trim = 1, exclude = 0){
    if(this.eof) return null;
    this.save();

    var str = '';
    var char;

    if(trim)
      this.trim();

    while(!this.eof){
      var char = this.char(0);
      if(!mainStr.includes(char) ^ exclude)
        break;
      str += this.char(1);
    }

    if(str.length === 0) str = null;
    if(!modify || str === null) this.restore();
    else this.discard();

    return str;
  }

  str(len, modify, trim = 1){
    if(this.eof) return null;
    this.save();

    if(trim)
      this.trim();

    var str = '';
    var char;

    for(var i = 0; i < len; i++){
      char = this.char(1);
      if(char === null){
        str = '';
        break;
      }
      str += char;
    }

    if(str.length === 0) str = null;
    if(!modify || str === null) this.restore();
    else this.discard();

    return str;
  }

  trim(comments = 1){
    if(this.eof || !this.trimEnabled)
      return;

    do{
      while(!this.eof){
        var char = this.char(0);
        if(!WHITE_SPACE_CHARS.includes(char))
          break;
        this.char(1);
      }

      if(!comments || this.comment(1, 0) === null)
        break;
    }while(!this.eof);
  }

  comment(modify, trim = 1){
    if(this.eof) return null;
    this.save();

    if(trim)
      this.trim(0);

    var str = '';
    var char;

    if(this.char(1) === '/'){
      switch(this.char(1)){
        case '/':
          str = `//${this.line(1)}`
          break;

        case '*':
          str = '/*';
          while(1){
            var chars = this.str(2, 0, 0);
            if(chars === null){
              str = '';
              break;
            }
            if(chars === '*/'){
              str += this.str(2, 1, 0);
              break;
            }
            str += this.char(1);
          }
          break;
      }
    }

    if(str.length === 0) str = null;
    if(!modify || str === null) this.restore();
    else this.discard();

    return str;
  }

  line(modify, lastChar = 0){
    if(this.eof) return null;
    this.save();

    var str = '';
    var char;

    while(1){
      char = this.char(1);
      if(char === null) break;
      str += char;
      if(char === '\n') break;
    }

    if(str.length === 0) str = null;
    if(!modify || str === null) this.restore();
    else this.discard();

    if(str !== null && !lastChar)
      str = str.substring(0, str.length - 1);

    return str;
  }

  whiteSpace(modify){
    return this.chars(modify, WHITE_SPACE_CHARS, 0, 0);
  }

  nonWhiteSpace(modify){
    return this.chars(modify, WHITE_SPACE_CHARS, 1, 1);
  }

  lettersNonCap(modify){
    return this.chars(modify, LETTERS_NON_CAP);
  }

  lettersCap(modify){
    return this.chars(modify, LETTERS_CAP);
  }

  letters(modify){
    return this.chars(modify, LETTERS);
  }

  digits(modify){
    return this.chars(modify, DIGITS);
  }

  hexDigits(modify){
    return this.chars(modify, DIGITS_HEX);
  }

  ident(modify, strArr = null, exclude = 0){
    if(this.eof) return null;
    this.save();
    this.trim();

    var str = '';
    var char;

    char = this.char(1);

    if(IDENT_CHARS_FIRST.includes(char)){
      str += char;

      if(IDENT_CHARS.includes(this.char(0)))
        str += this.chars(1, IDENT_CHARS);
    }

    if(str.length === 0){
      str = null;
    }else{
      if(strArr !== null){
        if(!strArr.includes(str) ^ exclude)
          str = null;
      }
    }

    if(!modify || str === null) this.restore();
    else this.discard();

    return str;
  }

  keyword(modify){
    return this.ident(modify, keywords);
  }

  nonKeyword(modify){
    return this.ident(modify, keywords, 1);
  }

  type(modify){
    return this.ident(modify, dataTypes);
  }

  countAsterisks(modify){
    this.save();

    var num = 0;

    while(1){
      this.trim();
      var char = this.char(0);
      if(char !== '*') break;
      this.char(1);
      num++;
    }

    if(!modify) this.restore();
    else this.discard();

    return num;
  }

  integer(modify){
    if(this.eof) return null;

    this.save();
    this.trim();
    this.disableTrim();

    var str = '';

    var sign = this.char(0);
    if(sign === '+' || sign === '-') this.char(1);
    else sign = '';

    var s = this.str(2, 0);
    var isHex = s === '0x' || s === '0X';

    if(isHex) this.str(2, 1);
    else s = '';

    var digits = isHex ? this.hexDigits(1) : this.digits(1);
    if(digits !== null) str = sign + s + digits;

    if(str.length === 0) str = null;
    if(!modify || str === null) this.restore();
    else this.discard();

    this.enableTrim();
    return str;
  }

  operator(modify){
    if(this.eof) return;

    this.save();
    this.trim();

    var str = '';
    var arr = operators.names.slice();
    var arrPrev = null;

    for(var i = 0; !this.eof; i++){
      var char = this.char(0);

      arr = arr.filter(op => op[i] === char);

      if(arr.length === 0){
        if(arrPrev !== null){
          str = arrPrev.find(a => a.length === i);
          if(str === undefined) str = '';
        }

        break;
      }

      this.char(1);
      arrPrev = arr;

      if(arr.length === 1 && arr[0].length === i){
        str = arr[0];
        break;
      }
    }

    if(str.length === 0) str = null;
    if(!modify || str === null) this.restore();
    else this.discard();

    return str;
  }

  err(msg = null){
    var hs = this.source.hsrcs;
    var filePath = this.filePath;
    var lineNum = this.lineIndex - this.srcDiff;

    if(lineNum < 0){
      for(var i = 0; i < hs.length; i++){
        lineNum += hs[i][0] - 1;
        filePath = hs[i][1];

        if(lineNum >= 0)
          break;
      }
    }

    var str = `${filePath}:${lineNum + 1}:${this.index}\n\n`;
    str += `${this.src[this.lineIndex]}\n\n`;
    str += `${'^'.padStart(this.index + 1)}`;

    if(msg !== null)
      str += `\n\n${msg}`;

    return error(str);
  }
};

class Unique{
  constructor(){
    this.id = globalId++;
  }
};

class Type extends Unique{
  constructor(name = null, asts = 0){
    super();

    this.name = name;
    this.asts = asts;
  }

  clone(){
    var type = new Type();

    type.name = this.name;
    type.asts = this.asts;

    return type;
  }

  sameType(type){
    if(type instanceof Variable)
      type = type.type;

    if(type === null)
      throw new TypeError('Cannot compare `null` types');

    return this.name === type.name && this.asts === type.asts;
  }

  sizeof(){
    if(this.name === null)
      throw new TypeError('Cannt get size of a type which has no name');

    if(this.asts !== 0)
      return 4;

    switch(this.name){
      case 'char': return 1; break;
      case 'short': return 2; break;
      case 'int': return 4; break;

      default:
        throw new TypeError('Unrecognized type');
        break;
    }
  }

  isVoid(){
    if(this.name === null)
      throw new TypeError('Cannot void-check type without a name');

    return this.name === 'void' && this.asts === 0;
  }

  toString(){
    return `${this.name}${'*'.repeat(this.asts)}`;
  }
};

class Variable extends Unique{
  constructor(scope = null, type = null, name = null, val = null){
    super();

    if(scope instanceof Variable)
      ({scope, type, name, val} = scope);

    if(typeof type === 'string')
      type = new Type(type);

    this.scope = scope;
    this.name = name;
    this.type = type;
    this.val = val;

    this.offsets = Object.create(null);

    this.isGlobal = false;
    this.isArg = false;
    this.isFunc = false;
    this.isLvalue = false;
  }

  clone(){
    var {scope, type, name, val, offsets} = this;

    if(type instanceof Type) type = type.clone();
    if(val instanceof Variable) val = val.clone();

    var vari = new this.constructor();

    vari.scope = scope;
    vari.type = type;
    vari.name = name;
    vari.val = val;

    for(var offset in offsets)
      vari.offsets[offset] = offsets[offset];

    return vari;
  }

  sameType(type){
    type = this.extractType(type);
    return this.type.sameType(type);
  }

  extractType(type = this.type){
    if(this.type === null)
      return new Type().sameType(this);

    if(type instanceof Variable){
      if(this.isFunc !== type.isFunc) return false;
      if(this.isFunc && !this.sameFormalArgs(type)) return false;
      type = type.type;
    }

    return type;
  }

  assign(val){
    if(val instanceof Constant)
      val = val.val;

    this.val = val;
  }

  resolve(){
    var val = this.val;

    if(val === null)
      throw new TypeError('Cannot resolve a variable without a value');

    if(val instanceof Variable && !(val instanceof Constant))
      throw new TypeError('Cannot resolve a non-constant variable');

    if(val instanceof Constant)
      val = val.val;

    return val;
  }

  getGlobalVars(){
    if(this.scope === null)
      throw new TypeError('No scope found');

    return this.scope.globalVars;
  }

  sizeof(){
    if(this.type === null)
      throw new TypeError('Cannot get size of a value which has no type');

    if(this instanceof Function)
      throw new TypeError('Cannot get size of a function');

    return this.type.sizeof();
  }

  isVoid(){
    if(this.type === null)
      throw new TypeError('Cannot void-check `null` type');

    return this.type.isVoid();
  }

  toLvalue(){
    var lvalue = this.clone();
    lvalue.isLvalue = true;
    return lvalue;
  }

  toString(){
    var str = `${this.type} ${this.name}`;
    if(this.val !== null) str += ` = ${this.val}`;
    return str;
  }
};

class GlobalVariable extends Variable{
  constructor(scope = null, type = null, name = null, val = null){
    super(scope, type, name, val);

    this.isGlobal = true;
  }
};

class Constant extends Variable{
  constructor(type = null, val = null){
    super(null, type, null, val);
  }
};

class Argument extends Variable{
  constructor(scope = null, type = null, name = null, val = null){
    super(scope, type, name, val);

    this.isArg = true;
  }
};

class Arguments extends Variable{
  constructor(scope, arr){
    super(scope, null, null, arr);
  }
};

class Expression extends GlobalVariable{
  constructor(src = null, type = null){
    super(src, type, null, null);

    this.rank = 0;
    this.stack = [];
    this.ops = [];
    this.lvalues = [];

    this.isStandAlone = false;
    this.finalized = false;
  }

  clone(){
    var vari = super.clone();

    vari.rank = this.rank;
    vari.stack = this.stack.map(vari => vari.clone());
    vari.ops = this.ops.map(vari => vari.clone());
    vari.lvalues = this.lvalues.map(vari => vari.clone());

    return vari;
  }

  add(op){
    var {stack, ops} = this;

    if(op instanceof Operator && op.name === '='){
      if(ops.length === 0)
        return 'Missing lhs of the assignment operator';

      var vari = ops.pop();
      if(!(vari instanceof Variable))
        return 'Expected lvalue on the lhs of the assignment operator';

      this.lvalues.push(vari.toLvalue());
    }

    if(op instanceof Variable){
      ops.push(op);
      this.rank++;
    }else{
      while(stack.length !== 0 && op.ipr <= stack[stack.length - 1].spr){
        var errMsg = this.pop();
        if(errMsg !== null)
          return errMsg;
      }

      if(op.name === ')' || op.name === ']'){
        var name = op.name;
        op = stack.pop();

        if(name === ')' && op.name !== '(')
          return 'Missing open parenthese';

        if(name === ']' && op.name !== '[')
          return 'Missing open bracket';
      }else if(op.name === ','){
        ops.push(op);
        this.rank--;
      }else{
        stack.push(op);
      }
    }

    return null;
  }

  pop(){
    var {stack, ops, lvalues} = this;
    var op = stack.pop();

    if(op instanceof Operator && op.name === '='){
      if(this.lvalues.length === 0)
        return 'Missing left operand of assignment operator';

      var lvalue = lvalues.pop();
      ops.push(lvalue);
    }

    ops.push(op);
    this.rank += op.rank;

    if(this.rank < 1)
      return 'Expression rank cannot be less than 1';

    return null;
  }

  finalize(){
    while(this.stack.length !== 0){
      var errMsg = this.pop();
      if(errMsg !== null)
        return errMsg;
    }

    if(this.rank !== 1)
      return 'Expression rank is not 1';

    var errMsg = this.resolveType();
    if(errMsg !== null)
      return errMsg;

    this.finalized = true;

    return null;
  }

  resolveType(){
    var ops = this.ops.slice();
    var stack = [];

    for(var i = 0; i < ops.length; i++){
      var op = ops[i];

      if(op instanceof Variable){
        stack.push(op.type);
      }else{
        var opsNum = 1 - op.rank;
        var opnds = stack.splice(stack.length - opsNum);
        var type;

        switch(op.name){
          case '\x00(\x00)':
            type = opnds[1].clone();
            break;

          default:
            if(opnds.some(op => op.isVoid()))
              return 'Illegal use of `void` type in expression';

            type = new Type('int');
            break;
        }

        stack.push(type);
      }
    }

    this.type = stack[0];

    return null;
  }

  canImplicitlyCast(type){
    type = this.extractType(type);

    if(this.sameType(type))
      return true;

    if(this.type.asts !== type.asts)
      return false;

    var canCast = castTable.some(([from, to]) => {
      return this.type.name === from && type.name === to;
    });

    return canCast;
  }

  implicitCast(type){
    type = this.extractType(type);

    if(!this.canImplicitlyCast(type))
      throw new TypeError(`Cannot perform implicit cast from "${this.type}" to "${type}"`);

    this.add(new CastOperator(this.type.clone(), type.clone()));

    return this;
  }
};

class Function extends Variable{
  constructor(src = null, type = null, name = null, val = null, formalArgs = null){
    super(src, type, name, val);

    this.isGlobal = true;
    this.isFunc = true;

    this.formalArgs = formalArgs;
  }

  clone(){
    throw new TypeError('Cannot clone a function');
  }

  setFormalArgs(args){
    this.formalArgs = args;
  }

  sameFormalArgs(args){
    if(args instanceof Function)
      args = args.formalArgs;

    if(this.formalArgs === null || args === null)
      throw new TypeError('Cannot compare `null` types');

    if(this.formalArgs.length !== args.length)
      return false;

    return this.formalArgs.every((arg, i) => {
      return arg.name === args[i].name && arg.sameType(args[i]);
    });
  }

  setDef(def){
    this.assign(def);
  }

  createScope(){
    if(this.val === null)
      throw new TypeError('Cannot create a code block on function which has no body');

    return this.val.createScope();
  }

  addVar(vari){
    if(this.val === null)
      throw new TypeError('Cannot add a variable to a function which has no body');

    return this.val.addVar(vari);
  }

  getVar(name){
    if(this.val === null)
      throw new TypeError('Cannot get a variable from a function which has no body');

    return this.val.getVar(name);
  }

  toString(){
    return `${this.type} ${this.name}${this.stringifyFormalArgs()}`;
  }

  stringifyFormalArgs(){
    if(this.formalArgs === null)
      return 'null';

    var str = this.formalArgs.map(arg => {
      return arg.toString();
    }).join(', ');

    return `(${str})`;
  }
};

class FunctionDefinition extends Unique{
  constructor(func = null, scope = null){
    super();

    this.func = func;
    this.scope = scope;
  }

  createScope(){
    if(this.scope !== null)
      throw new TypeError('The function definition already has a code block');

    var scope = new Scope(this);
    this.scope = scope;

    if(this.func === null)
      throw new TypeError('The function definition is missing wrapper function');

    var globalVars = this.func.getGlobalVars();
    globalVars.forEach(vari => scope.addVar(vari));

    var formalArgs = this.func.formalArgs;
    if(formalArgs === null)
      throw new TypeError('Cannot create function scope without formal arguments');

    formalArgs.forEach(vari => scope.addVar(vari));

    return scope;
  }

  addStatement(stat){
    if(this.scope === null)
      throw new TypeError('The function has no code blocks assigned to it');

    this.scope.addStatement(stat);
  }

  addVar(vari){
    if(this.scope === null)
      throw new TypeError('Cannot add a variable to a function definition which has no code blocks');

    return this.scope.addVar(name);
  }

  getVar(name){
    if(this.scope === null)
      throw new TypeError('Cannot get a variable from a function definition which has no code blocks');

    return this.scope.getVar(name);
  }

  getType(){
    if(this.func === null)
      throw new TypeError('Cannot get type of the function definition, because it is missing wrapper function');

    return this.func.type;
  }
};

class Scope extends Unique{
  constructor(funcDef = null, parent = null, stats = []){
    super();

    this.funcDef = funcDef;
    this.parent = parent;
    this.stats = stats;

    this.type = this.getType();

    this.vars = [];
    this.scopes = [];

    this.argsSize = 0;
    this.varsSize = 0;

    this.stat = null
  }

  createScope(){
    var scope = new Scope(this.funcDef, this);
    this.scopes.push(scope);
    return scope;
  }

  sameType(vari){
    if(vari === null)
      throw new TypeError('Cannot compare the scope type to the null type');

    var type = this.getType();

    return vari.sameType(type);
  }

  addStatement(stat){
    this.stats.push(stat);
  }

  addVar(vari){
    if(this.parent !== null)
      return 0;

    this.vars.push(vari);

    if(vari.isArg){
      vari.offsets[this.id] = this.argsSize + 8;
      this.argsSize += vari.sizeof();
    }else if(!vari.isGlobal){
      vari.offsets[this.id] = -this.varsSize - 4;
      this.varsSize += vari.sizeof();
    }

    return 1;
  }

  getVar(name, searchInParent = 1){
    var vars = this.vars;
    var vari = null;

    for(var i = 0; i < vars.length; i++){
      var v = vars[i];

      if(v.name === name && (vari === null || vari.isGlobal)){
        vari = v;
        if(!v.isGlobal) break;
      }
    }

    if(vari !== null && (searchInParent || !vari.isGlobal))
      return vari;

    if(this.parent === null || !searchInParent)
      return null;

    return this.parent.getVar(name);
  }

  getFunc(){
    if(this.funcDef === null)
      throw new TypeError('Cannot get function of the scope, because it has no function definition');

    return this.funcDef.func;
  }

  getType(){
    if(this.funcDef === null)
      throw new TypeError('Cannot get type of the scope, because it has no function definition');

    return this.funcDef.getType();
  }

  getOffset(vari, searchInParent = 1){
    if(!(this.id in vari.offsets)){
      if(searchInParent && this.parent !== null)
        return this.parent.getOffset(vari, 1);
      return null;
    }

    return vari.offsets[this.id];
  }

  getArgsSize(searchInParent = 1){
    if(searchInParent && this.parent !== null)
      return this.parent.getArgsSize(1);
    return this.argsSize;
  }

  getVarsSize(searchInParent = 1){
    if(searchInParent && this.parent !== null)
      return this.parent.getVarsSize(1);
    return this.varsSize;
  }

  getLoop(){
    if(this.stat === null)
      return null;
    return this.stat.getLoop();
  }
};

class Statement extends Unique{
  constructor(scope = null, name = null){
    super();

    this.scope = scope;
    this.name = name;

    this.scopes = [];
    this.vars = [];

    this.after = new Unique();
  }

  createScope(){
    var scope = new Scope(this.scope.funcDef, this.scope);
    this.addScope(scope);
    return scope;
  }

  addScope(scope){
    if(scope.stat !== null)
      throw new TypeError('Cannot add the same scope to two statements');

    scope.stat = this;
    this.scopes.push(scope);
  }

  addVar(vari){
    this.vars.push(vari);
  }
  
  getLoop(){
    var {name} = this;

    if(name === 'for' || name === 'while' || name === 'do')
      return this;

    if(this.scope === null)
      return null;

    return this.scope.getLoop();
  }
};

class Operator extends Unique{
  constructor(name){
    super();

    this.name = name;

    this.optimize();
  }

  optimize(){
    var op = operators.find(([a]) => a.includes(this.name));
    if(op === undefined)
      throw new TypeError('Unknown operator');

    this.ipr = op[1];
    this.spr = op[2];
    this.rank = op[3];
  }

  clone(){
    return new Operator(this.name);
  }

  toString(){
    if(this.name === null)
      return 'null';

    return this.name.replace(/\x00/g, '');
  }
};

class CastOperator extends Operator{
  constructor(from, to){
    super('cast\x00');

    if(!(from instanceof Type && to instanceof Type))
      throw new TypeError('Cast operator needs a type');

    this.from = from;
    this.to = to;
  }

  toString(){
    return `${this.from} ---> ${this.to}`;
  }
};

class Linker{
  constructor(srcs){
    this.decls = [];
    this.defs = [];

    this.asm = new Assembler();
    this.machine = new assembler.Machine();

    this.setSrc(srcs);
  }

  setSrc(srcs){
    var {decls, defs} = this;

    srcs.forEach(vars => {
      vars.forEach(vari => {
        this.addVar(vari);
      });
    });

    this.decls.forEach(vari => {
      if(this.getDef(vari.name) === null){
        if(!vari.isFunc) this.err(`Missing initialization for global variable "${vari}"`);
        else this.err(`Missing definition for function "${vari}"`);
      }
    });

    this.checkMainFunc();
  }

  addVar(vari){
    if(vari.val === null) this.addDecl(vari);
    else this.addDef(vari);
  }

  addDecl(vari){
    var decl = this.getDecl(vari.name);
    if(decl !== null && !vari.sameType(decl))
      this.err(`Type mismatch for "${vari}"`);

    if(decl === null)
      this.decls.push(vari);
  }

  addDef(vari){
    if(this.getDef(vari.name) !== null){
      if(!vari.isFunc) this.err(`Multiple initializations for global variable "${vari.name}"`);
      else this.err(`Multiple definitions for function "${vari.name}"`);
    }

    var decl = this.getDecl(vari.name);
    if(decl !== null && !vari.sameType(decl))
      this.err(`Type mismatch for "${vari}"`);

    if(decl === null)
      this.decls.push(vari);

    this.defs.push(vari);
  }

  getDecl(name){
    var {decls} = this;

    for(var i = 0; i < decls.length; i++){
      if(decls[i].name === name)
        return decls[i];
    }

    return null;
  }

  getDef(name){
    var {defs} = this;

    for(var i = 0; i < defs.length; i++){
      if(defs[i].name === name)
        return defs[i];
    }

    return null;
  }

  getVar(name){
    return this.getDef(name);
  }

  checkMainFunc(){
    var mainFunc = this.getDef('main');

    if(mainFunc === null)
      this.err('Missing main function');

    var expected = new Function(null, 'int', null, null, []);

    if(!mainFunc.sameType(expected))
      this.err('Main function must take no arguments and return int');
  }

  link(){
    this.decls.forEach(decl => {
      var def = this.getDef(decl.name);
      decl.id = def.id;
    });

    this.processVars();
    this.processFuncs();

    return this.compile();
  }

  processVars(){
    var {asm} = this;

    this.defs.forEach(vari => {
      if(vari.isFunc) return;

      asm.label(vari.id);
      asm.incIndent();

      switch(vari.type.name){
        case 'int':
          var buff = Buffer.alloc(4);
          buff.writeUInt32LE(vari.resolve() | 0);
          asm.buff(buff);
          break;

        default:
          this.err(`Type "${vari.type}" is not supported`);
          break;
      }

      asm.decIndent();
    });
  }

  processFuncs(){
    var {asm} = this;

    this.defs.forEach(vari => {
      if(!vari.isFunc) return;

      var scope = vari.val.scope;

      if(vari.name === 'main')
        asm.label('main');

      asm.label(vari.id);
      asm.incIndent();

      asm.int(scope.varsSize);
      asm.push('enter');

      this.procScope(scope);

      asm.decIndent();
    });
  }

  procScope(scope){
    var stats = scope.stats;

    stats.forEach(stat => {
      switch(stat.name){
        case 'asm': this.procAsmDirective(scope, stat); break;

        case 'varDecl': this.procVarDecl(scope, stat); break;
        case 'return': this.procRet(scope, stat); break;
        case 'block': this.procBlock(scope, stat); break;
        case 'expr': this.procExpr(scope, stat.vars[0]); break;
        case 'if': this.procIf(scope, stat); break;
        case 'while': this.procWhile(scope, stat); break;
        case 'for': this.procFor(scope, stat); break;
        case 'break': this.procBreak(scope, stat); break;
        case 'continue': this.procContinue(scope, stat); break;

        default:
          this.err(`Unrecognized statement type "${stat.name}"`);
          break;
      }
    });
  }

  procAsmDirective(scope, stat){
    var {asm} = this;

    var vari = stat.vars[0];
    var arr = vari.value;

    arr.forEach(line => {
      asm.push(line);
    });
  }

  procVarDecl(scope, stat){
    var {asm} = this;

    var vari = stat.vars[0];
    var expr = vari.val;

    this.procExpr(scope, expr);

    var offset = scope.getOffset(vari);
    if(offset === null)
      this.err('Missing offset while parsing variable declaration');

    asm.int(offset);
    asm.push('varSet');
  }

  procRet(scope, stat){
    var {asm} = this;

    var expr = stat.vars[0];

    if(expr instanceof Expression){
      this.procExpr(scope, expr);
      asm.int(scope.getArgsSize());
      asm.push('leave');
    }else{
      asm.int(scope.getArgsSize());
      asm.push('leavev');
    }
  }

  procIf(scope, stat){
    var {asm} = this;

    this.procExpr(scope, stat.vars[0]);

    if(stat.scopes.length === 1){
      asm.label(stat.after.id, 0);
      asm.push('jz');

      this.procScope(stat.scopes[0]);
      asm.label(stat.after.id);
    }else{
      asm.label(stat.scopes[1].id, 0);
      asm.push('jz');

      this.procScope(stat.scopes[0]);
      asm.label(stat.after.id, 0);
      asm.push('jmp');
      asm.label(stat.scopes[1].id);

      this.procScope(stat.scopes[1]);
      asm.label(stat.after.id);
    }
  }

  procWhile(scope, stat){
    var {asm} = this;

    asm.label(stat.id);
    this.procExpr(scope, stat.vars[0]);
    asm.label(stat.after.id, 0);
    asm.push('jz');

    this.procScope(stat.scopes[0]);
    asm.label(stat.id, 0);
    asm.push('jmp');

    asm.label(stat.after.id);
  }

  procFor(scope, stat){
    var {asm} = this;

    this.procExpr(scope, stat.vars[0]);
    asm.label(stat.id);

    this.procExpr(scope, stat.vars[1]);
    asm.label(stat.after.id, 0);
    asm.push('jz');

    this.procScope(stat.scopes[0]);
    asm.label(stat.vars[2].id);
    this.procExpr(scope, stat.vars[2]);
    asm.label(stat.id, 0);
    asm.push('jmp');

    asm.label(stat.after.id);
  }

  procBreak(scope, stat){
    var {asm} = this;

    var loop = scope.getLoop();
    asm.label(loop.after.id, 0);
    asm.push('jmp');
  }

  procContinue(scope, stat){
    var {asm} = this;

    var loop = scope.getLoop();
    if(loop.name === 'for') asm.label(loop.vars[2].id, 0);
    else asm.label(loop.id, 0);
    asm.push('jmp');
  }

  procExpr(scope, expr){
    var {asm} = this;

    if(!expr.finalized)
      throw new TypeError('Expression is not finalized');

    expr.ops.forEach(op => {
      if(op instanceof Variable){
        if(op instanceof Constant){
          this.type(op.type, op.val);
        }else if(op instanceof Function){
          this.procFuncLiteral(scope, op);
        }else if(op instanceof Arguments){
          this.procArgs(scope, op);
        }else{
          var vari = op;

          if(vari.isGlobal){
            var isLvalue = vari.isLvalue;
            vari = this.getVar(vari.name);
            asm.label(vari.id, 0);
            if(!isLvalue) asm.push('read');
          }else{
            var offset = scope.getOffset(vari);
            if(offset === null)
              this.err('Missing offset while parsing expression');

            asm.int(offset);
            if(!vari.isLvalue) asm.push('varGet');
          }
        }
      }else{
        this.op(scope, op);
      }
    });

    if(expr.isStandAlone && !expr.isVoid())
      asm.push('pop');
  }

  procFuncLiteral(scope, func){
    var {asm} = this;

    asm.label(func.id, 0);
  }

  procArgs(scope, argsVal){
    var args = argsVal.val;

    for(var i = args.length - 1; i >= 0; i--){
      var arg = args[i];
      this.procExpr(scope, arg);
    }
  }

  procBlock(scope, stat){
    this.procScope(stat.scopes[0]);
  }

  type(type, val){
    var {asm} = this;

    if(type.asts !== 0){
      asm.int(val);
      return;
    }

    switch(type.name){
      case 'int':
        asm.int(val);
        break;

      case 'void':
        this.err('Illegal use of void type');
        break;

      default:
        this.err('Unrecognized type');
        break;
    }
  }

  op(scope, op){
    var {asm} = this;
    var name = op.name;

    switch(name){
      case '\x00(\x00)': this.opCall(op); break;
      case '\x00[\x00]': throw new TypeError('Array indexing is not supported'); break;
      case '->':         throw new TypeError('Arrow operator is not supported'); break;
      case '.':          throw new TypeError('Dot operator is not supported'); break;
      case '\x00++':     throw new TypeError('Postincrement operator is not supported'); break;
      case '\x00--':     throw new TypeError('Postdecrement is not supported'); break;

      case 'plus\x00':   throw new TypeError('Unexpected unary `+` operator'); break;
      case 'minus\x00':  asm.push('minus'); break;
      case '!':          asm.push('not'); break;
      case '~':          asm.push('neg'); break;
      case '++\x00':     throw new TypeError('Preincrement operator is not supported'); break;
      case '--\x00':     throw new TypeError('Predecrement operator is not supported'); break;

      case 'cast\x00':   this.castOp(op); break;

      case 'deref\x00':  throw new TypeError('Unary operator `*` is not supported'); break;
      case 'addr\x00':   throw new TypeError('Unary operator `&` is not supported'); break;
      case 'sizeof\x00': throw new TypeError('Unexpected `sizeof` operator'); break;

      case '*':          asm.push('mul'); break;
      case '/':          asm.push('div'); break;
      case '%':          asm.push('mod'); break;

      case '+':          asm.push('add'); break;
      case '-':          asm.push('sub'); break;

      case '<<':         asm.push('shl'); break;
      case '>>':         asm.push('shr'); break;

      case '<':          asm.push('lt'); break;
      case '<=':         asm.push('le'); break;
      case '>':          asm.push('gt'); break;
      case '>=':         asm.push('ge'); break;

      case '==':         asm.push('eq'); break;
      case '!=':         asm.push('neq'); break;

      case '&':          asm.push('and'); break;
      case '^':          asm.push('xor'); break;
      case '|':          asm.push('or'); break;

      case '&&':         asm.push('land'); break;
      case '||':         asm.push('lor'); break;

      case '\x00?\x00:\x00':   throw new TypeError('Ternary conditional operator is not supported'); break;
      case ',':        asm.push('pop'); break;

      case '=':
        var offset = asm.pop();
        asm.push('push');
        asm.push(offset);

        if(offset[0] === ':') asm.push('write');
        else asm.push('varSet');
        break;

      default:
        if(name.endsWith('='))
          throw new TypeError('Assignment operators are not supported');

        this.err(`Unrecognized operator "${name}"`);
        break;
    }
  }

  castOp(op){
    var {asm} = this;

    if(op.from.asts !== 0)
      return;

    var from = op.from.name;
    var to = op.to.name;

    switch(to){
      case 'char': asm.push(`${2 ** 8 - 1} and`); break;
      case 'short': asm.push(`${2 ** 16 - 1} and`); break;
      case 'int': break;
    }
  }

  opCall(op){
    var {asm} = this;

    asm.push('call');
  }

  compile(){
    this.machine.compile(this.asm.toString());
    return this;
  }

  err(msg){
    msg = `ERROR: ${msg}`;
    error(msg);
  }
};

class Assembler{
  constructor(src = null){
    this.indent = 0;
    this.arr = [];
  }

  push(str){
    str = `${' '.repeat(this.indent * TAB_SIZE)}${str}`;
    this.arr.push(str);
  }

  pop(){
    if(this.arr.length === 0)
      throw new TypeError('Cannot pop from empty assembly array');

    var str = this.arr.pop();
    return str.trim();
  }

  inst(inst){
    this.push(`${inst}`);
  }

  label(label, isDef = 1){
    if(isDef) this.push(`${label}:`);
    else this.push(`:${label}`);
  }

  setIndent(indent){
    this.indent = indent;
  }

  incIndent(){
    this.indent++;
  }

  decIndent(){
    if(this.indent === 0)
      throw new RangeError('Invalid indentation level');

    this.indent--;
  }

  buff(buff){
    var str = [...buff].map(byte => {
      return `_${byte}`;
    }).join(' ');

    this.push(str);
  }

  int(val){
    this.push(val);
  }

  toString(){
    var base = fs.readFileSync(ASM_BASE, 'utf8');
    var str = `${base}\n${this.arr.join('\n')}`;

    return str;
  }
};

function optimizeOperators(){
  operators.names = [];
  operators.namesObj = [];

  operators.forEach(([op]) => {
    op.forEach(name => {
      operators.names.push(name);
      operators.namesObj[name] = 1;
    });
  });
}

function getSupportedChars(){
  var c1 = ' '.charCodeAt(0);
  var c2 = '~'.charCodeAt(0);
  var num = c2 - c1 + 1;

  var chars = WHITE_SPACE_CHARS;
  chars += O.ca(num, i => String.fromCharCode(c1 + i)).join('');

  var charsObj = Object.create(null);

  chars.split('').forEach(char => {
    charsObj[char] = 1;
  });

  return charsObj;
}

function getNativeLibs(){
  var files = fs.readdirSync(NATIVE_LIBS_DIR);
  var libs = [];

  files.forEach((file, index) => {
    if(file.includes('.'))
      return;

    var dir = joinNormalize(NATIVE_LIBS_DIR, file);
    var header = joinNormalize(dir, MAIN_HEADER);
    var main = joinNormalize(dir, MAIN_FILE);

    libs[file] = header;
    libs.push(main);
  });

  return libs;
}

function getLabelId(){
  if(!(O.static in getLabelId)){
    var obj = getLabelId[O.static] = Object.create(null);
    obj.id = 0;
  }

  var obj = getLabelId[O.static];
  var id = obj.id;

  return id;
}

function normalizePath(filePath){
  if(filePath[1] !== ':')
    filePath = path.join(CWD, filePath);

  filePath = path.normalize(filePath);

  if(filePath[0] !== filePath[0].toUpperCase())
    filePath = O.capitalize(filePath);

  return filePath;
}

function joinNormalize(dir, file){
  var base = path.parse(dir).base;

  if(base.includes('.'))
    dir = path.join(dir, '..');

  var filePath = path.join(dir, file);

  return normalizePath(filePath);
}

function error(msg = null){;
  msg = `${msg}\n`;
  fs.writeSync(process.stderr.fd, msg);
  process.exit(1);
}