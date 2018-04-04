'use strict';

var O = require('../framework');
var PerformanceTester = require('.');

setTimeout(main);

function main(){
  var tester = new PerformanceTester();

  tester.addFunc(pushArr);
  tester.addFunc(pushElem);

  var result = tester.test(100);
  console.log(result);
}

function pushArr(){
  var q = [];

  for(var i = 0; i < 1e6; i++){
    q.push([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    var [a0, a1, a2, a3, a4, a5, a6, a7, a8, a9] = q.shift();
  }
}

function pushElem(){
  var q = [];

  for(var i = 0; i < 1e6; i++){
    q.push([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    
    var a0 = q.shift();
    var a1 = q.shift();
    var a2 = q.shift();
    var a3 = q.shift();
    var a4 = q.shift();
    var a5 = q.shift();
    var a6 = q.shift();
    var a7 = q.shift();
    var a8 = q.shift();
    var a9 = q.shift();
  }
}