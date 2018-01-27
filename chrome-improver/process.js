'use strict';

var CommandPrompt = require('./command-prompt.js');
var nop = require('./nop.js');

module.exports = {
  kill
};

function kill(procName, cb = nop){
  var cmd = new CommandPrompt(cb);
  var killProcCommand = [];

  cmd.execList([
    [
      `tasklist`,
      str => {
        str = str.split`\n`;
        str = str.slice(2);

        var doesProcExist = str.some(line => {
          line = line.toLowerCase();
          return line.startsWith(procName);
        });

        if(doesProcExist){
          killProcCommand.push(`taskkill /f /im "${procName}"`);
        }
      }
    ], [
      killProcCommand
    ],
    ['exit']
  ]);
}