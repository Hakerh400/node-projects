'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var dataTypes = require('./data-types.json');
var keywords = require('./keywords.json');

const TAB_SIZE = 4;

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

var nativeLibs = getNativeLibs();

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

    while(!parser.eof){
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
        this.err('The variable has already been initialized');
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
        vari = new Variable(type, name);
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
          if(char !== ';') this.err('Expected `;`');
          vari = new Function(type, name);
          vari.setFormalArgs(args);
        }else{
          if(char !== '{') this.err('Expected `{`');
        }

        if(char === '{'){
          var funcDef = this.parseFuncDef(vari);
          vari.setDef(funcDef);
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

    var vari = new Variable(type);
    var val = null;

    switch(type.name){
      case 'char':
        this.err('Char not supported');
        break;

      case 'float':
        this.err('Float not supported');
        break;

      case 'int':
        val = parser.integer(1);
        if(val === null) this.err('Expected integer');
        vari.assign(val);
        break;

      case 'void':
        this.err('Void not supported');
        break;
    }

    parser.trim();
    if(parser.char(0) !== ';')
      this.err('Expected `;`');

    parser.char(1);

    return vari;
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
      var type = this.parseType(0);
      var name = parseArgName();

      var v = new Variable(type, name);
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

  parseFuncDef(vari){
    var {parser} = this;

    parser.trim();
    var char = parser.char(0);
    if(char !== '{') this.err('Expected `{`');
    parser.char(1);

    var args = vari.formalArgs;
    var funcDef = new FunctionDefinition(vari);

    while(!parser.eof){
      if(parser.char(1) === '}')
        break;
    }

    return funcDef;
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
    this.eof = this.src.length === 0;

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
      this.index = 0;
      this.eol = this.src[this.lineIndex].length === 0;
    }else{
      char = this.src[this.lineIndex][this.index++];

      this.eol = this.index === this.src[this.lineIndex].length;
      this.eof = this.lineIndex === this.src.length - 1;
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
    if(this.eof)return null;
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
    this.setSrc(srcs);

    this.asm = new Assembler();
    this.mcode = new MachineCode();
  }

  setSrc(srcs){
    this.src = [];
    var {src} = this;

    srcs.forEach(vars => {
      vars.forEach(vari => {
        if(!vari.isFunc){
          if(vari.val === null) return;

          var v = this.getVar(vari);
          if(v !== null && v.val !== null)
            this.err(`Multiple initializations for global variable "${vari.name}"`);

          src.push(vari);
        }else{
          if(vari.val === null) return;

          var v = this.getVar(vari);
          if(v !== null && v.val !== null)
            this.err(`Multiple definitions for function "${vari.name}"`);

          src.push(vari);
        }
      });
    });
  }

  getVar(name){
    if(name instanceof Variable)
      name = name.name;

    for(var i = 0; i < this.src.length; i++){
      if(this.src[i].name === name)
        return this.src[i];
    }

    return null;
  }

  link(){
    var {srcs, asm} = this;

    this.processVars();
    //this.processFuncs();

    return this.compile();
  }

  processVars(){
    var {srcs, asm} = this;

    var vars;
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
    var indent = this.indent;
    if(this.indent !== 0) this.decIndent();

    label = `${label}:`;
    this.add(label);

    this.setIndent(indent);
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

class Type{
  constructor(name, asts = 0){
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

  toString(){
    return `${this.name}${'*'.repeat(this.asts)}`;
  }
};

class Variable{
  constructor(type = null, name = null, val = null){
    this.name = name;
    this.type = type;
    this.val = val;

    this.isFunc = false;
  }

  sameType(type){
    if(this.type === null)
      throw new TypeError('Cannot compare `null` types');

    return this.type.sameType(type);
  }

  assign(val){
    if(val instanceof Variable)
      val = val.val;

    this.val = val;
  }

  toString(){
    var str = `${this.type} ${this.name}`;
    if(this.val !== null) str += ` = ${this.val}`;
    return str;
  }
};

class Function extends Variable{
  constructor(type = null, name = null, val = null){
    super(type, name, val);

    this.isFunc = true;
    this.formalArgs = null;
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

class FunctionDefinition{
  onstructor(){
    /**/
  }
};

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