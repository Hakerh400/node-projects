'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Rule = require('./rule');
const Section = require('./section');
const Pattern = require('./pattern');
const Element = require('./element');
const Range = require('./range');
const ruleParser = require('./rule-parser');

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
    return ruleParser.parse(this, str);
  }
};

module.exports = Syntax;