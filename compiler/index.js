'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var dataTypes = require('./data-types.json');
var keywords = require('./keywords.json');

const TAB_SIZE = 2;

const CWD = process.cwd();
const NATIVE_LIBS_DIR = joinNormalize(CWD, 'native-libs');
const MAIN_HEADER = 'main.h';

const WHITE_SPACE_CHARS = ' \r\n\t'
const SUPPORTED_CHARS = getSupportedChars();
const LETTERS_NON_CAP = O.ca(26, i => String.fromCharCode('a'.charCodeAt(0) + i)).join``;
const LETTERS_CAP = LETTERS_NON_CAP.toUpperCase();
const LETTERS = LETTERS_NON_CAP + LETTERS_CAP;
const DIGITS = O.ca(10, i => String.fromCharCode('0'.charCodeAt(0) + i)).join``;
const DIGITS_HEX = DIGITS + [...LETTERS].filter(a => /[a-f]/i.test(a)).join``;
const IDENT_CHARS_FIRST = LETTERS + '_';
const IDENT_CHARS = IDENT_CHARS_FIRST + DIGITS;

const MEM_SIZE = 1 << 16;
const MEM_MAX_ADDR = MEM_SIZE - 1;

var nativeLibs = getNativeLibs();
var globalId = 0;

var operators = [
  [['(', '['], 20, 0, null],
  [[')', ']'], 1, null, null],

  [['(\0)', '[\0]', '->', '.', '\0++', '\0--'], 19, 19, -1],
  [['plus\0', 'minus\0', '!', '~', '++\0', '--\0', 'cast\0', 'deref\0', 'addr\0', 'sizeof\0'], 18, 17, 0],
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
  [['?\0:\0'], 6, 5, -1],
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
      var buff = fs.readFileSync(this.filePath);
      this.src = buff.toString();
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

    var buff = fs.readFileSync(filePath);
    var src = buff.toString();
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

    src = src.join`\n`;

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
        throw error();

      line = line.substring(0, line.length - 2);
      if(!(line in nativeLibs))
        throw error();

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
    var stat = null;

    parser.trim();
    parser.save();

    var ident = parser.ident(0);

    if(ident !== null){
      if(dataTypes.includes(ident)){
        stat = this.parseVarDecl(scope);
      }else if(keywords.includes(ident)){
        switch(ident){
          case 'return':
            this.parseReturnStatement(scope);
            break;

          default:
            this.restore('Unexpected keyword');
            break;
        }
      }else{
        throw 2;
      }
    }else{
      throw 0;
    }

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
      this.restore('Variable declarations are not alowed in nested code blocks')

    parser.update();
    var char = parser.char(1);
    var expr;

    if(char === '='){
      expr = this.parseExpr(scope, 0);
      if(!expr.sameType(vari))
        this.restore(`Variable "${vari.name}" is of type "${vari.type}", ` +
                     `but the expression on the right hand side resolved to a value of type "${expr.type}"`);

    }else{
      expr = new Expression(scope);
      var zero = new Constant('int', 0);

      expr.add(zero);
    }

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

  parseExpr(scope, includeCommas = 1){
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

          if(!op.isFunc){
            if(op.isGlobal)
              this.restore('Using global variables in expressions is not allowed');
          }else{
            parser.update();
            var char = parser.char(1);
            if(char !== '(')
              this.restore('Expected function call');

            var func = op;
            var opCall = new Operator('(\0)');

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

class Linker{
  constructor(srcs){
    this.decls = [];
    this.defs = [];

    this.asm = new Assembler();
    this.mcode = new MachineCode();

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

    var expected = new Function(null, 'void', null, null, []);

    if(!mainFunc.sameType(expected))
      this.err('Main function must take no arguments and return void');
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
          buff.writeUInt32LE(vari.resolve() & MEM_MAX_ADDR);
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
      var stats = scope.stats;

      asm.label(vari.id);
      asm.incIndent();

      asm.int(scope.varsSize);
      asm.add('enter');

      stats.forEach(stat => {
        switch(stat.name){
          case 'varDecl': this.procVarDecl(scope, stat); break;
          case 'return': this.procRet(scope, stat); break;

          default:
            this.err('Unrecognized statement type');
            break;
        }
      });

      asm.decIndent();
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
    asm.add('varSet');
  }

  procRet(scope, stat){
    var {asm} = this;

    var expr = stat.vars[0];

    if(expr instanceof Expression){
      this.procExpr(scope, expr);
      asm.int(scope.argsSize);
      asm.add('leave');
    }else{
      asm.int(scope.argsSize);
      asm.add('leavev');
    }
  }

  procExpr(scope, expr){
    var {asm} = this;

    expr.ops.forEach(op => {
      if(op instanceof Variable){
        if(op instanceof Constant){
          this.type(op.type, op.val);
        }else if(op instanceof Function){
          this.procFuncLiteral(scope, op);
        }else if(op instanceof Arguments){
          this.procArgs(scope, op);
        }else{
          var offset = scope.getOffset(op);
          if(offset === null)
            this.err('Missing offset while parsing expression');

          asm.int(offset);
          asm.add('varGet');
        }
      }else{
        this.op(op);
      }
    });
  }

  procFuncLiteral(scope, func){
    var {asm} = this;

    asm.add(`:${func.id}`);
  }

  procArgs(scope, argsVal){
    var args = argsVal.val;

    for(var i = args.length - 1; i >= 0; i--){
      var arg = args[i];
      this.procExpr(scope, arg);
    }
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

  op(op){
    var {asm} = this;
    var name = op.name;

    switch(name){
      case '(\0)':     this.opCall(op);  break;
      case '[\0]':     throw new TypeError('Array indexing is not supported'); break;
      case '->':       throw new TypeError('Arrow operator is not supported'); break;
      case '.':        throw new TypeError('Dot operator is not supported'); break;
      case '\0++':     throw new TypeError('Postincrement operator is not supported'); break;
      case '\0--':     throw new TypeError('Postdecrement is not supported'); break;

      case 'plus\0':   throw new TypeError('Unexpected unary `+` operator'); break;
      case 'minus\0':  asm.add('minus'); break;
      case '!':        asm.add('not');   break;
      case '~':        asm.add('neg');   break;
      case '++\0':     throw new TypeError('Preincrement operator is not supported'); break;
      case '--\0':     throw new TypeError('Predecrement operator is not supported'); break;
      case 'cast\0':   throw new TypeError('Cast is not supported'); break;
      case 'deref\0':  throw new TypeError('Unary operator `*` is not supported'); break;
      case 'addr\0':   throw new TypeError('Unary operator `&` is not supported'); break;
      case 'sizeof\0': throw new TypeError('Unexpected `sizeof` operator'); break;

      case '*':        asm.add('mul');   break;
      case '/':        asm.add('div');   break;
      case '%':        asm.add('mod');   break;

      case '+':        asm.add('add');   break;
      case '-':        asm.add('sub');   break;

      case '<<':       asm.add('shl');   break;
      case '>>':       asm.add('shr');   break;

      case '<':        asm.add('le');    break;
      case '<=':       asm.add('leq');   break;
      case '>':        asm.add('ge');    break;
      case '>=':       asm.add('geq');   break;

      case '==':       asm.add('eq');    break;
      case '!=':       asm.add('neq');   break;

      case '&':        asm.add('and');   break;
      case '^':        asm.add('xor');   break;
      case '|':        asm.add('or');    break;

      case '&&':       throw new TypeError('Logical `&&` operator is not supported'); break;
      case '||':       throw new TypeError('Logical `||` operator is not supported'); break;

      case '?\0:\0':   throw new TypeError('Ternary conditional operator is not supported'); break;
      case ',':        throw new TypeError('Comma operator is not supported'); break;

      default:
        if(name.endsWith('='))
          throw new TypeError('Assignment operators are not supported');

        this.err(`Unrecognized operator "${name}"`);
        break;
    }
  }

  opCall(op){
    var {asm} = this;

    asm.add('call');
  }

  compile(){
    this.mcode.compile(this.asm);
    return this.mcode;
  }

  err(msg){
    msg = `ERROR: ${msg}`;
    error(msg);
  }
};

class Assembler{
  constructor(src = null){
    this.src = src;
    this.indent = 0;
    this.arr = [];
  }

  add(str){
    str = `${' '.repeat(this.indent * TAB_SIZE)}${str}`;
    this.arr.push(str);
  }

  inst(inst){
    this.add(`${inst}`);
  }

  label(label){
    this.add(`${label}:`);
  }

  setSrc(src){
    this.src = src;
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
    }).join` `;

    this.add(str);
  }

  int(val){
    this.add(val);
  }

  toString(){
    return this.arr.join`\n`;
  }
};

class MachineCode{
  constructor(asm = null, hex = null){
    if(asm instanceof Assembler)
      asm = asm.toString();

    this.asm = asm;
    this.hex = hex;
  }

  compile(asm = null){
    if(asm instanceof Assembler)
      asm = asm.toString();

    if(asm !== null) this.asm = asm;
    else asm = this.asm;

    if(asm === null)
      throw new TypeError('Cannot process `null` assembly data');

    this.hex = Buffer.alloc(0);

    return this.hex;
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
      case 'int':
        return 4;
        break;

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
  }

  clone(){
    var {scope, type, name, val} = this;

    if(type instanceof Type) type = type.clone();
    if(val instanceof Variable) val = val.clone();

    var vari = new this.constructor();

    vari.scope = scope;
    vari.type = type;
    vari.name = name;
    vari.val = val;

    return vari;
  }

  sameType(type){
    if(this.type === null)
      return new Type().sameType(this);

    if(type instanceof Variable){
      if(this.isFunc !== type.isFunc) return false;
      if(this.isFunc && !this.sameFormalArgs(type)) return false;
    }

    return this.type.sameType(type);
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
  }

  clone(){
    var vari = super.clone();

    vari.rank = this.rank;
    vari.stack = this.stack.map(vari => vari.clone());
    vari.ops = this.ops.map(vari => vari.clone());

    return vari;
  }

  add(op){
    if(op instanceof Variable){
      this.ops.push(op);
      this.rank++;
    }else{
      while(this.stack.length !== 0 && op.ipr <= this.stack[this.stack.length - 1].spr){
        var errMsg = this.pop();
        if(errMsg !== null)
          return errMsg;
      }

      if(op.name !== ')' && op.name !== ']'){
        this.stack.push(op);
      }else{
        var name = op.name;
        op = this.stack.pop();

        if(name === ')' && op.name !== '(')
          return 'Missing open parenthese';

        if(name === ']' && op.name !== '[')
          return 'Missing open bracket';
      }
    }

    return null;
  }

  pop(){
    var x = this.stack.pop();

    this.ops.push(x);
    this.rank += x.rank;

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
        var ops = stack.splice(stack.length - opsNum);

        /*
          Determine result type
        */

        var type = new Type('int');

        stack.push(type);
      }
    }

    this.type = stack[0];

    return null;
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
    }).join`, `;

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

  getOffset(vari){
    if(!(this.id in vari.offsets))
      return null;

    return vari.offsets[this.id];
  }
};

class Statement extends Unique{
  constructor(scope = null, name = null){
    super();

    this.scope = scope;
    this.name = name;

    this.scopes = [];
    this.vars = [];
  }

  createScope(){
    var scope = new Scope(this.scope);
    this.addScope(scope);
    return scope;
  }

  addScope(){
    this.scopes.push(scope);
  }

  addVar(vari){
    this.vars.push(vari);
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
  chars += O.ca(num, i => String.fromCharCode(c1 + i)).join``;

  var charsObj = Object.create(null);

  chars.split``.forEach(char => {
    charsObj[char] = 1;
  });

  return charsObj;
}

function getNativeLibs(){
  var files = fs.readdirSync(NATIVE_LIBS_DIR);
  var libs = Object.create(null);

  files.forEach(file => {
    var dir = joinNormalize(NATIVE_LIBS_DIR, file);
    var header = joinNormalize(dir, MAIN_HEADER);

    libs[file] = header;
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