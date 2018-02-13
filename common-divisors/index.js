'use strict';

module.exports = commonDivisors;

function commonDivisors(nums, includeNumberOne = true){
  var min = includeNumberOne ? 1 : 2;
  var max = nums.reduce((a, b) => Math.max(a, b), 1);
  var divisors = [];

  for(var i = min; i < max; i++){
    if(nums.every(a => !(a % i))){
      divisors.push(i);
    }
  }

  return divisors;
}