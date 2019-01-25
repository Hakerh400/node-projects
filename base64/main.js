'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const base64 = require('.');

setTimeout(main);

function main(){
  const text = 'Example string';
  const b64 = Buffer.from(text).toString('base64');

  const encoded = base64.encode(text);
  const decoded = base64.decode(encoded).toString('utf8');

  log(text);
  log(b64);
  log(encoded);
  log(decoded);
}