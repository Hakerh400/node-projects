'use strict';

var commonDivisors = require('.');

setTimeout(main);

function main(){
  var nums = [1920, 1080];
  var divisors = commonDivisors(nums);

  var str = divisors.map(divisor => {
    return [...nums.map(num => num / divisor), divisor].map(a => {
      return `${a}`.padStart(5);
    }).join` `;
  }).join`\n`;

  console.log(str);
}