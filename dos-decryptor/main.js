'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const decryptor = require('.');

main();

function main(){
  const decrypted = decryptor.decrypt('┬Ç');
  log(decrypted.length);
  log(O.hex(O.cc(decrypted), 1));
}