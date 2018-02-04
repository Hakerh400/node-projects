'use strict';

var a = Object.create(null);
var b = [];

Object.setPrototypeOf(a, Array.prototype);
Object.defineProperty(a, 'length', {
  value: 0,
  writable: true,
  enumerable: false,
  configurable: false,
});

console.log(Array.isArray + '');

console.log(a);
console.log(b);