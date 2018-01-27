'use strict';

setTimeout(main);

function main(){
  var arrs = findArrays(15);

  var str = arrs.map(arr => {
    return arr.join`, `;
  }).join`\n`;

  console.log(str);
}

function findArrays(len){
  var arr = createArray(len, a => a + 1);
  var pairs = getPairs(arr);
  var solutions = [];

  var queue = [[]];

  while(queue.length){
    var nums = queue.shift();

    if(nums.length == len){
      solutions.push(nums);
      continue;
    }

    if(!nums.length){
      arr.forEach(a => queue.push([a]));
      continue;
    }

    var remaining = arr.filter(a => !nums.includes(a));
    var lastNum = getLastElem(nums);
    var availNums = getAvailNums([...remaining, lastNum], lastNum);

    availNums.forEach(num => {
      queue.push([...nums, num]);
    });
  }

  return solutions;
}

function getPairs(arr){
  var pairs = [];

  arr.forEach((a, b) => {
    arr.forEach((c, d) => {
      if(b < d && isPerfectSquare(a + c)){
        pairs.push([a, c]);
      }
    });
  });

  return pairs;
}

function findPairs(pairs, num){
  return pairs.filter(pair => {
    return pair.includes(num);
  }).map(([a, b]) => [num, a != num ? a : b]);
}

function getAvailNums(arr, num){
  var pairs = getPairs(arr);
  return findPairs(pairs, num).map(a => a[1]);
}

function isPerfectSquare(a){
  return !(a ** .5 % 1);
}

function getLastElem(arr){
  return arr.length ? arr[arr.length - 1] : null;
}

function createArray(len, func){
  return [...new Array(len)].map((a, b) => func(b));
}

function log(...a){
  console.log(...a);
  return a[a.length - 1];
}