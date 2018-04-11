'use strict';

var O = require('../framework');
var grid = require('.');
var Interface = require('./interface.js');

const PORT = 1037;

const TAB_SIZE = 2;
const TAB = ' '.repeat(TAB_SIZE);

setTimeout(main);

function main(){
  var server = new grid.Server(PORT);
  var intface = new Interface();

  intface.on('data', str => {
    str = str.split` `;

    switch(str[0]){
      case 'list':
        switch(str[1]){
          case 'players': logArr(server.getPlayers()); break;
          default: log(`Failed to list \`${str[1]}\`: unrecognized type`); break;
        }
        break;

      case 'exit':
        server.close();
        intface.close();
        break;

      default: log('Unknown command'); break;
    }
  });
}

function logArr(arr){
  if(arr.length === 0) log('[]');
  else log(`[\n${arr.map(a => `${TAB}${a}`).join`\n`}\n]`);
}

function log(str){
  console.log(`${str}`);
}