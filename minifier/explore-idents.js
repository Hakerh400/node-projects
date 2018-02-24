'use strict';

var fs = require('fs');
var readline = require('readline');

var rl = readline.createInterface(process.stdin, process.stdout);

var identsFile = './temp-dir/idents.txt';

setTimeout(main);

function main(){
  var idents = fs.readFileSync(identsFile).toString().split(/\r\n|\r|\n/).map(a => a.split(/\s+/));

  rl.on('line', input => {
    if(input === '.exit'){
      rl.close();
      return;
    }

    var ident = idents.find(([ident]) => ident === input);
    if(!ident) return logLine('Not found.');

    logLine(ident[1]);
  });
}

function logLine(...a){
  console.log(...a);
  console.log('');
}