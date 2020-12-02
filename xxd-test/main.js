'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const xxd = require('../xxd');

const cwd = __dirname;
const testFile = path.join(cwd, 'test.txt');

const main = () => {
  const expected = O.lf(O.rfs(testFile, 1));
  const actual = O.lf(xxd.buf2hex(Buffer.from(O.ca(256, i => i))));

  assert.strictEqual(actual, expected);
};

main();