'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const cs = require('./ctors');

const cwd = __dirname;
const dir = path.join(cwd, 'test');
const csFile = path.join(dir, 'color-scheme.json');
const scFile = path.join(dir, 'scopes.txt');
const inpf = path.join(dir, 'input.txt');
const outf = path.join(dir, 'output.htm');

const main = () => {
  const scheme = parseScheme(O.rfs(csFile, 1));
  const scopes = parseScopes(O.rfs(scFile, 1));
};

const parseScheme = str => {
  const info = parseJSON(str);
  const scheme = new cs.Scheme();

  const varsObj = info.variables;
  const globsObj = info.globals;
  const rulesArr = info.rules;

  const varNames = O.keys(varsObj);
  const globNames = O.keys(globsObj);

  for(const name of varNames)
    scheme.addVar(name, scheme.parseExpr(varsObj[name]));

  for(const name of globNames)
    scheme.addGlob(name, scheme.parseExpr(globsObj[name]));

  O.logf(globsObj);
};

const parseScopes = str => {
  
};

const parseJSON = str => {
  return new Function(`return (${str})`)();
};

const normalizeCol = (str) => {
  rt
};

main();