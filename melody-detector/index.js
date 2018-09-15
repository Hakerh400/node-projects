'use strict';

const O = require('../framework');

module.exports = {
  dft,
};

function dft(arr, freqMax){
  return O.ca(arr.length, omega => {
    omega *= freqMax;

    var sum = arr.reduce((sum, num, k) => {
      var arg = omega * k;

      sum[0] += num * Math.cos(arg);
      sum[1] -= num * Math.sin(arg);

      return sum;
    }, [0, 0]);

    return O.hypot(sum[0], sum[1]);
  });
}