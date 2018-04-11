'use strict';

var O = require('../framework');
var PerformanceTester = require('.');

setTimeout(main);

function main(){
  var tester = new PerformanceTester();

  tester.addFunc(func1);
  tester.addFunc(func2);

  var result = tester.test(100);
  console.log(result);
}

function func1(){
  var c = 0;
  var arr = O.ca(1e5, i => i);
  arr.forEach((a, b) => c = a + b);
}

function func2(){
  var c = 0;
  var len = 1e5;
  var arr = O.ca(len, i => i);
  for(var i = 0; i < len; i++)
    c = arr[i] + i;
}