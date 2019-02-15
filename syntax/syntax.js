'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Rule = require('./rule');
const Section = require('./section');
const Pattern = require('./pattern');
const Element = require('./element');
const Range = require('./range');

class Syntax{
  constructor(str){
    this.rules = this.parseRules(str);
  }

  static fromStr(str){
    return new Syntax(str);
  }

  static fromDir(dir){
    dir = path.normalize(dir);

    const dirs = [dir];
    let str = '';

    while(dirs.length !== 0){
      const d = dirs.shift();
      const names = O.sortAsc(fs.readdirSync(d));

      for(const name of names){
        const file = path.join(d, name);

        if(fs.statSync(file).isDirectory()){
          dirs.push(file);
          continue;
        }

        const pack = path.relative(dir, file)
          .replace(/\.[a-z0-9]+$/i, '')
          .replace(/[\/\\]/g, '.')
          .replace(/\-./g, a => a[1].toUpperCase());

        const src = fs.readFileSync(file, 'utf8');
        str = `${str}\n#package{${pack}}\n${src}`;
      }
    }

    return new Syntax(str);
  }

  /**
  * Called only once during object construction
  */
  parseRules(str){
    str = str.replace(/\r\n|\r|\n/g, '\n');

    const len = str.length; // String length

    let i = 0; // Position from start of string
    let j = 0; // Line index
    let k = 0; // Position from start of line

    // Handle error
    const err = msg => {
      const line = O.sanl(str)[j];
      log(`Syntax error on line ${j + 1}:\n`);
      log(line);
      log('^'.padStart(k + 1));
      log(`\n${msg}`);
      O.proc.exit(1);
    };

    const sf = a => O.sfy(a); // JSON.stringify
    const neof = () => i !== len; // Not end of file
    const eof = () => i === len; // End of file

    // Read single char
    const c = (char=null, modify=1) => {
      if(eof()) err('Unexpected EOF');
      const c = str[i];

      if(char !== null && typeof char !== 'string'){
        modify = char;
        char = null;
      }

      if(modify){
        pc(c);
        if(char !== null && c !== char)
          err(`Expected ${sf(char)}, but got ${sf(c)}`);
      }

      return c;
    }

    // Process char
    const pc = c => {
      if(O.cc(c) > 255) err('Only characters in range [0-255] are allowed');
      i++; k++;
      if(c === '\n'){
        j++;
        k = 0;
      }
    };

    const s = () => { while(neof() && /\s/.test(c(0))) c(); }; // Read zero or more spaces
    const ss = () => { if(eof() || /\S/.test(c(0))) err('Missing space'); }; // Read one or more spaces

    // Match char and surrounding spaces
    const sc = (char, modify) => {
      s();
      const result = c(char, modify);
      s();
      return !modify && typeof char === 'string' ? result === char : result;
    }

    const is = char => sc(char, 0); // Check for the given char

    // Read char is possible
    const scm = char => {
      if(!is(char)) return 0;
      sc();
      return 1;
    }

    // Match regular expression
    const reg = (reg, spaces=1, name=reg) => {
      if(spaces) s();
      reg.lastIndex = i;

      const match = str.match(reg);
      if(match === null) err(`Unable to parse ${name}`);

      const m = match[0];
      for(const char of m) pc(char);

      if(spaces) s();
      return m;
    };

    // Several parsing functions
    const p = {
      ident: (s=1) => reg(/[a-z\$_][a-z0-9\$_]*/iy, s, 'identifier'),
      num: (s=1) => reg(/[0-9]+/y, s, 'number'),
      rdots: (s=1) => reg(/\.{2}/y, s, 'range dots'),
    };

    // Parse range of integers
    const parseRange = (r=new Range()) => {
      const v = () => scm('*') ? null : +p.num(); // Parse value

      let val1 = v()
      let val2 = val1;

      if(c(0) === '.'){
        p.rdots();
        val2 = v();
      }else if(scm('+')){
        val2 = null;
      }else if(scm('-')){
        val2 = val1;
        val1 = null;
      }

      r.start = val1;
      r.end = val2;

      if(!r.isValid()) err('Invalid range');
      return r;
    };

    // Parse Section.Include or Section.Exclude
    const parseMatchSect = (rule, ctor) => {
      sc('{');
      if(is('|')) err('Match section cannot start with delimiter');
      if(is('}')) err('Match cannot be empty');

      const sect = new ctor();

      // Parse patterns
      while(!scm('}')){
        const pat = new Pattern();

        // Parse elements
        while(!(scm('|') || sc('}', 0))){
          const char = sc(0);
          let elem;

          if(char === '"'){ // Literal string
            elem = new Element.String();
            sc();
          }else if(char === '['){ // Characters range
            elem = new Element.CharsRange();
            c();

            while(c(0) !== ']'){
              const range = new Range();

              let first = 1;
              let vals = [];

              while(1){
                const char = c();

                if(first === 0 && /[\-\]]/.test(char))
                  err(`Character ${sf(char)} must be escaped`);

                if(char === '\\'){ // Escape sequence
                  const next = c();

                  if(/[\\\-\]]/.test(next)){ // Literal backslash, hypthen or closed bracket
                    vals.push(O.cc(next));
                  }else if(/x/i.test(next)){ // Hexadecimal escape sequence
                    const hex = c() + c();
                    if(!/[0-9a-f]{2}/i.test(hex)) err('Invalid hexadecimal escape sequence');
                    vals.push(parseInt(hex, 16));
                  }else if(next === 'r'){ // Carriage return
                    vals.push(O.cc('\r'));
                  }else if(next === 'n'){ // Line feed
                    vals.push(O.cc('\n'));
                  }else if(next === 't'){ // Tab
                    vals.push(O.cc('\t'));
                  }else if(next === '\n'){ // Literal new line
                    err('New line should not be escaped like this');
                  }else{ // Any other character
                    err('Unrecognized escape sequence');
                  }
                }else if(char === '-'){ // Character separator should not appear here
                  err('Missing character');
                }else if(char === '\n'){ // Literal new line
                  err('New lines must be escaped');
                }else{ // Any other char
                  vals.push(O.cc(char));
                }

                // In case of single character break the loop
                if(!first || c(0) !== '-') break;

                // Prepare for the last character in the range
                first = 0;
                c();
              }

              if(vals.length === 1) vals.push(vals[0]);

              range.start = vals[0];
              range.end = vals[1];

              if(!range.isValid()) err('Invalid characters range');
              if(elem.overlaps(range)) err('Overlapping characters range');

              elem.add(range);
            }

            // Closed bracket
            c();

            if(elem.isEmpty()) err('Empty characters range');
          }else{
            err('Unexpected token in pattern');
          }

          pat.addElem(elem);
        }

        sect.addPat(pat);
      }

      rule.addSect(sect);
    };

    const rules = O.obj(); // Rules will be stored here after parsing
    const nterms = new Set(); // Keep track of non-terminals to add rules after parsing

    let pack = '';

    while(neof()){
      s();
      if(eof()) break;

      // Meta directive
      if(scm('#')){
        const type = p.ident();
        sc('{');

        switch(type){
          case 'package':
            const idents = [];
            while(!is('}')){
              idents.push(p.ident());
              scm('.');
            }
            pack = idents.join('.');
            break;

          default: err(`Unexpected meta directive "${type}"`);
        }

        sc('}');
        continue;
      }

      // Parse rule header

      const name = p.ident();
      let range = null;

      if(scm('[')){
        range = parseRange();
        if(!range.isSingleton())
          err('Definition range must be a singleton');
        sc(']');
      }

      const greediness = scm('?') ? 0 : scm('*') ? 2 : 1;

      const rule = new Rule(this, pack, name, greediness, range);
      if(!(name in rules)) rules[name] = O.obj();

      const obj = rules[name];
      if('*' in obj) err('Duplicate definition');
      if(!rule.isArr()){
        obj['*'] = rule;
      }else{
        const i = range.start;
        if(i in obj) err(`Index ${i} is already defined`);
        obj[i] = rule;
      }

      // Parse main section
      // Main section is of type Section.Include
      parseMatchSect(rule, Section.Include);

      // Parse other sections

      while(scm('.')){ // Other sections start with "."
        const type = p.ident();

        switch(type){
          case 'not': case 'exclude':
            parseMatchSect(rule, Section.Exclude);
            break;

          default:
            err(`Unknown section ${sf(type)}`);
            break;
        }
      }

      log(JSON.stringify(rules, null, 2));
      O.proc.exit();

      err('Unable to parse further');
    }

    // Replace rule names by real rules
    for(const nterm of nterms)
      nterm.rule = rules[nterm.rule];

    return rules;
  }
};

module.exports = Syntax;