'use strict';

var O = require('../framework');

module.exports = randomSum;

function randomSum(sum, num, max = null){
  var arr = O.ca(num, () => 0);
  var indices = O.ca(num, i => i);

  O.repeat(sum, () => {
    var indicesIndex = O.rand(indices.length);
    var arrIndex = indices[indicesIndex];

    arr[arrIndex]++;

    if(arr[arrIndex] === max)
      indices.splice(indicesIndex, 1);
  });

  return arr;
}