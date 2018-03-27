'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');

const CWD = process.cwd();
const NATIVE_LIBS_DIR = joinNormalize(CWD, 'native-libs');
const MAIN_HEADER = 'main.h';

const WHITE_SPACE_CHARS = ' \r\n\t'
const LETTERS_NON_CAP = O.ca(26, i => String.fromCharCode('a'.charCodeAt(0) + i)).join``;
const LETTERS_CAP = LETTERS_NON_CAP.toUpperCase();
const LETTERS = LETTERS_NON_CAP + LETTERS_CAP;
const SUPPORTED_CHARS = getSupportedChars();

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
  return compiled[0];
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

    this.funcs = [];
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

  compile(){
    var asm = this.parse();
    var compiled = new Compiled(asm);

    return compiled;
  }

  parse(){
    this.includeFiles();
    this.parser = new Parser(this);

    var parser = this.parser;
    var asm = [];

    while(!parser.eof){
      var ident = parser.letters(1);
      if(ident === null) break;
      asm.push(ident);
    }

    return asm.join`\n`;
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

  char(modify){
    if(this.eof) return null;

    if(!modify){
      if(this.eol) return '\n';
      return this.src[this.lineIndex][this.index];
    }

    var char = null;

    if(this.eol){
      if(this.lineIndex !== this.src.length - 1){
        char = '\n';

        this.lineIndex++;
        this.index = 0;
        this.eol = this.src[this.lineIndex].length === 0;
      }else{
        this.eof = true;
      }
    }else{
      char = this.src[this.lineIndex][this.index++];
      this.eol = this.index === this.src[this.lineIndex].length;
    }

    if(char !== null && !(char in SUPPORTED_CHARS))
      throw this.err('Invalid character');

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
      thris.trim();

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
    if(this.eof)
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
    str += `${'^'.padStart(this.index)}`;

    if(msg !== null)
      str += `\n\n${msg}`;

    return error(str);
  }
};

class Compiled{
  constructor(asm = null, hex = null){
    this.asm = asm;
    this.hex = hex;

    if(this.hex !== null)
      this.hex = Buffer.from(this.hex);

    if(this.asm !== null && this.hex === null){
      this.hex = Buffer.alloc(0);
    }
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