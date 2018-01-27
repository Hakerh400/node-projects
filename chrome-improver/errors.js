'use strict';

var util = require('util');

module.exports = {
  fatal
};

function fatal(err){
  var str = util.inspect(err);

  str = `FATAL ERROR: ${str}\n`;

  process.stdout.write(str, () => {
    process.exit(1);
  });
}