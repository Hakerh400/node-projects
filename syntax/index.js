'use strict';

var fs = require('fs');
var O = require('../framework');

class Syntax{
  constructor(src, nterms){
    this.src = src;
    this.nterms = nterms;

    if(!('main' in nterms))
      throw new TypeError('Missing main non-terminal');
  }

  async parse(){
    this.index = 0;

    return await this.nterm('main');
  }

  async nterm(nterm){
    
  }

  debug(){
    var str = JSON.stringify(this.parsed, null, 2);
    fs.writeFileSync(process.stdout.fd, `${str}\n\n`);
  }
};

class Elem{
  constructor(name=null, start=null, end=null, value=null){
    this.name = name;
    this.start = start;
    this.end = end;
    this.value = value;
  }
};

module.exports = Syntax;