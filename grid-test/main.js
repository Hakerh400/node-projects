'use strict';

var fs = require('fs');
var path = require('path');
var O = require('../framework');
var browser = require('../browser');
var consoleColors = require('../console-colors');

var url = '/?project=grid-projects&sub-project=grid';

var cwd = __dirname;
var testsDir = path.join(cwd, 'tests');

setTimeout(main);

function main(){
  resetCol();

  var window = new browser.Window(1, 1, url);

  window.addEventListener('_ready', () => {
    performTests(window);
  });
}

function performTests(window){
  var tests = fs.readdirSync(testsDir);

  var passed = 0;
  var failed = 0;
  var totalTime = 0;

  O.repeat(tests.length, index => {
    var testNum = index + 1;

    log(`Processing test ${testNum}`);

    var testFileName = `${testNum}.txt`;
    var testFilePath = path.join(testsDir, testFileName);
    var testData = fs.readFileSync(testFilePath).toString();

    testData = O.sanl(testData).join('\n').split('\n\n');

    var evt = {
      type: 'test',
      data: testData,
    };

    var t = Date.now();
    window.emit('_msg', evt);
    var dt = Date.now() - t;
    var time = (dt / 1e3).toFixed(3);

    log(' ');
    totalTime += dt;

    if(evt.data === true){
      passed++;
      ok(`PASSED (${time})`);
    }else{
      failed++;
      err(`FAILED (${time})`);
    }

    log('\n');
  });

  var allPassed = passed === tests.length;

  log('\nAverage time: ');
  log('#ffff00', (totalTime / tests.length / 1e3).toFixed(3));
  log('\nTotal time: ');
  log('#ffff00', (totalTime / 1e3).toFixed(3));
  log('\n');

  log('\nPassed: ');

  if(allPassed){
    ok('100%');
  }else{
    err(`${Math.floor(passed / tests.length * 100)}%`);
  }

  log('\n');

  return allPassed;
}

function setCol(col){
  consoleColors.textCol = col;
}

function resetCol(){
  setCol('#808080');
}

function ok(msg){
  log('#00ff00', msg);
}

function err(msg){
  log('#ff0000', msg);
}

function log(...args){
  if(args.length === 1){
    fs.writeSync(process.stdout.fd, `${args[0]}`);
  }else if(args.length === 2){
    setCol(args[0]);
    fs.writeSync(process.stdout.fd, `${args[1]}`);
    resetCol();
  }else{
    throw new TypeError('Expected 1 or 2 arguments');
  }
}