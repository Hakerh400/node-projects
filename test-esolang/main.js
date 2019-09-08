'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const esolang = require('.');

const cwd = __dirname;
const testDir = path.join(cwd, 'test');
const srcFile = path.join(testDir, 'src.txt');
const inputFile = path.join(testDir, 'input.txt');
const outputFile = path.join(testDir, 'output.txt');

setTimeout(main);

function main(){
  const src = O.rfs(srcFile);
  const input = O.rfs(inputFile);
  // const output = esolang(src, input);

  const tests = [
    '', '0', '1',
    '00', '01', '10', '11',
    '000', '001', '010', '011',
    '100', '101', '110', '111',
  ].concat(O.ca(20, () => {
    return O.ca(O.randInt(5, .7), () => O.rand(2)).join('');
  }));

  const func = test => {
    return test.replace(/[01]/g, a => a ^ 1);
  };

  for(const test of tests){
    const expected = func(test);
    const actual = esolang(src, test).toString();
    
    if(actual !== expected){
      log([
        ['Input', test],
        ['Expected', expected],
        ['Actual', actual],
      ].map(([a, b]) => {
        return `${`${a}:`.padEnd(10)} ${b}`;
      }).join('\n'))
      break;
    }
  }

  // log(output.toString());
  // O.wfs(outputFile, output);
}